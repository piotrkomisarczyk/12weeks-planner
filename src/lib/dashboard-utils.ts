import type { PlanDashboardResponse, HierarchyTreeNode, NodeType, DashboardFilterState } from "@/types";
import { getDayName } from "@/lib/utils";

/**
 * Builds a hierarchical tree structure from flat dashboard data
 * Applies filtering based on the provided filter state
 *
 * Hierarchy structure (indent levels):
 * Level 0: Plan (root)
 * Level 1:
 *   - Long-term Goals
 *   - Weekly Goals (no long-term goal)
 *   - Other Tasks group (ad-hoc)
 * Level 2:
 *   - Milestones (under goal)
 *   - Weekly Goals (under goal, no milestone)
 *   - Tasks (directly under goal, no milestone/weekly goal)
 *   - Tasks (under weekly goals from level 1)
 *   - Tasks (ad-hoc, under Other Tasks group)
 * Level 3:
 *   - Weekly Goals (under milestone)
 *   - Tasks (under milestone, no weekly goal)
 *   - Tasks (under weekly goals from level 2)
 * Level 4:
 *   - Tasks (under weekly goals from level 3)
 *
 * @param data - Dashboard data from API
 * @param filters - Filter state (showCompleted, showAllWeeks)
 * @param selectedWeek - Currently selected week number for filtering (when showAllWeeks is false)
 */
export function buildHierarchyTree(
  data: PlanDashboardResponse,
  filters: DashboardFilterState,
  selectedWeek: number
): HierarchyTreeNode[] {
  const { showCompleted, showAllWeeks } = filters;

  // Sort weekly_goals by week_number (ascending)
  const sortedWeeklyGoals = [...data.weekly_goals].sort((a, b) => {
    return (a.week_number || 0) - (b.week_number || 0);
  });

  // Sort tasks by week_number and then by due_day (ascending)
  const sortedTasks = [...data.tasks].sort((a, b) => {
    const weekA = a.week_number || 0;
    const weekB = b.week_number || 0;

    // First sort by week_number
    if (weekA !== weekB) {
      return weekA - weekB;
    }

    // Then sort by due_day (null values come last)
    const dayA = a.due_day || 8; // Default to 8 (after day 7) if null
    const dayB = b.due_day || 8;

    return dayA - dayB;
  });

  // Helper function to determine if an item should be included based on filters
  const shouldInclude = (
    status?: string | boolean,
    weekNumber?: number | null,
    itemType?: "goal" | "milestone" | "task" | "weekly_goal"
  ): boolean => {
    // Filter by completion status
    if (!showCompleted) {
      // For goals: only hide if progress is 100% (checked by caller)
      // For milestones: only hide if is_completed is true (boolean)
      // For tasks: only hide if status is 'completed' or 'cancelled'
      // For weekly_goals: never hide based on completion (they don't have completion status)

      if (itemType === "milestone") {
        // For milestones, status is a boolean (is_completed)
        if (typeof status === "boolean" && status === true) {
          return false;
        }
      } else if (itemType === "task") {
        // For tasks, check task status
        if (status === "completed" || status === "cancelled") {
          return false;
        }
      } else if (itemType === "goal") {
        // For goals, status will be 'completed' only if progress is 100%
        if (status === "completed") {
          return false;
        }
      }
      // weekly_goal items are never filtered by completion
    }

    // Filter by week
    if (!showAllWeeks && weekNumber !== undefined && weekNumber !== null) {
      if (weekNumber !== selectedWeek) {
        return false;
      }
    }

    return true;
  };

  // Helper function to create a tree node
  const createNode = (
    id: string,
    type: NodeType,
    title: string,
    linkUrl: string,
    status?: string,
    isCompleted = false,
    progress?: number,
    weekNumber?: number,
    priority?: string,
    date?: string,
    indent = 0
  ): HierarchyTreeNode => ({
    id,
    type,
    title,
    status,
    isCompleted,
    progress,
    weekNumber,
    children: [],
    indent,
    metadata: {
      originalId: id,
      linkUrl,
      priority,
      date,
    },
  });

  // Helper function to get task status display
  const getTaskStatus = (task: { status?: string }): string => {
    return task.status || "todo";
  };

  // Build the tree structure
  const tree: HierarchyTreeNode[] = [];

  // 1. Add plan node (root)
  const planNode = createNode(
    data.plan.id,
    "plan",
    data.plan.name,
    `/plans/${data.plan.id}/dashboard`,
    data.plan.status,
    data.plan.status === "completed",
    undefined,
    undefined,
    undefined,
    undefined,
    0
  );
  tree.push(planNode);

  // 2. Process goals and their children
  for (const goal of data.goals) {
    if (!shouldInclude(goal.progress_percentage === 100 ? "completed" : "in_progress", undefined, "goal")) {
      continue;
    }

    const goalNode = createNode(
      goal.id,
      "goal",
      goal.title,
      `/plans/${data.plan.id}/goals`,
      goal.progress_percentage === 100 ? "completed" : undefined,
      goal.progress_percentage === 100,
      goal.progress_percentage,
      undefined,
      undefined,
      undefined,
      1
    );

    // Find milestones for this goal
    const goalMilestones = data.milestones.filter(
      (m: { long_term_goal_id: string }) => m.long_term_goal_id === goal.id
    );
    for (const milestone of goalMilestones) {
      if (!shouldInclude(milestone.is_completed, undefined, "milestone")) {
        continue;
      }

      const milestoneNode = createNode(
        milestone.id,
        "milestone",
        milestone.title,
        `/plans/${data.plan.id}/goals`,
        milestone.is_completed ? "completed" : undefined,
        milestone.is_completed,
        undefined,
        undefined,
        undefined,
        milestone.due_date || undefined,
        2
      );

      // Find weekly goals for this milestone
      const milestoneWeeklyGoals = sortedWeeklyGoals.filter(
        (wg: { milestone_id: string | null }) => wg.milestone_id === milestone.id
      );
      for (const weeklyGoal of milestoneWeeklyGoals) {
        if (!shouldInclude(undefined, weeklyGoal.week_number, "weekly_goal")) {
          continue;
        }

        const weeklyGoalNode = createNode(
          weeklyGoal.id,
          "weekly_goal",
          weeklyGoal.title,
          `/plans/${data.plan.id}/week/${weeklyGoal.week_number}`,
          undefined,
          false,
          undefined,
          weeklyGoal.week_number,
          undefined,
          undefined,
          3
        );

        // Find tasks for this weekly goal
        const weeklyGoalTasks = sortedTasks.filter(
          (t: { weekly_goal_id: string | null }) => t.weekly_goal_id === weeklyGoal.id
        );
        for (const task of weeklyGoalTasks) {
          if (!shouldInclude(getTaskStatus(task), task.week_number, "task")) {
            continue;
          }

          const taskNode = createNode(
            task.id,
            "task",
            task.title,
            task.due_day
              ? `/plans/${data.plan.id}/week/${task.week_number}/day/${task.due_day}`
              : `/plans/${data.plan.id}/week/${task.week_number}`,
            getTaskStatus(task),
            getTaskStatus(task) === "completed",
            undefined,
            task.week_number || undefined,
            task.priority,
            task.due_day ? (getDayName(task.due_day) ?? undefined) : undefined,
            4
          );

          weeklyGoalNode.children.push(taskNode);
        }

        // Always add weekly goals if they pass the week filter, regardless of children
        milestoneNode.children.push(weeklyGoalNode);
      }

      // Add tasks directly under milestone (without weekly goal)
      const milestoneTasks = sortedTasks.filter(
        (t: { milestone_id: string | null; weekly_goal_id: string | null }) =>
          t.milestone_id === milestone.id && !t.weekly_goal_id
      );
      for (const task of milestoneTasks) {
        if (!shouldInclude(getTaskStatus(task), task.week_number, "task")) {
          continue;
        }

        const taskNode = createNode(
          task.id,
          "task",
          task.title,
          task.due_day
            ? `/plans/${data.plan.id}/week/${task.week_number}/day/${task.due_day}`
            : `/plans/${data.plan.id}/week/${task.week_number}`,
          getTaskStatus(task),
          getTaskStatus(task) === "completed",
          undefined,
          task.week_number || undefined,
          task.priority,
          task.due_day ? (getDayName(task.due_day) ?? undefined) : undefined,
          3
        );

        milestoneNode.children.push(taskNode);
      }

      // Always add milestones if they pass the filter, regardless of children
      goalNode.children.push(milestoneNode);
    }

    // Add weekly goals directly under goal (without milestone)
    const goalWeeklyGoals = sortedWeeklyGoals.filter(
      (wg: { long_term_goal_id: string | null; milestone_id: string | null }) =>
        wg.long_term_goal_id === goal.id && !wg.milestone_id
    );
    for (const weeklyGoal of goalWeeklyGoals) {
      if (!shouldInclude(undefined, weeklyGoal.week_number, "weekly_goal")) {
        continue;
      }

      const weeklyGoalNode = createNode(
        weeklyGoal.id,
        "weekly_goal",
        weeklyGoal.title,
        `/plans/${data.plan.id}/week/${weeklyGoal.week_number}`,
        undefined,
        false,
        undefined,
        weeklyGoal.week_number,
        undefined,
        undefined,
        2
      );

      // Find tasks for this weekly goal
      const weeklyGoalTasks = data.tasks.filter(
        (t: { weekly_goal_id: string | null }) => t.weekly_goal_id === weeklyGoal.id
      );
      for (const task of weeklyGoalTasks) {
        if (!shouldInclude(getTaskStatus(task), task.week_number, "task")) {
          continue;
        }

        const taskNode = createNode(
          task.id,
          "task",
          task.title,
          task.due_day
            ? `/plans/${data.plan.id}/week/${task.week_number}/day/${task.due_day}`
            : `/plans/${data.plan.id}/week/${task.week_number}`,
          getTaskStatus(task),
          getTaskStatus(task) === "completed",
          undefined,
          task.week_number || undefined,
          task.priority,
          task.due_day ? (getDayName(task.due_day) ?? undefined) : undefined,
          3
        );

        weeklyGoalNode.children.push(taskNode);
      }

      // Always add weekly goals if they pass the week filter, regardless of children
      goalNode.children.push(weeklyGoalNode);
    }

    // Add tasks directly under goal (without milestone or weekly goal)
    const goalTasks = sortedTasks.filter(
      (t: { long_term_goal_id: string | null; milestone_id: string | null; weekly_goal_id: string | null }) =>
        t.long_term_goal_id === goal.id && !t.milestone_id && !t.weekly_goal_id
    );
    for (const task of goalTasks) {
      if (!shouldInclude(getTaskStatus(task), task.week_number, "task")) {
        continue;
      }

      const taskNode = createNode(
        task.id,
        "task",
        task.title,
        task.due_day
          ? `/plans/${data.plan.id}/week/${task.week_number}/day/${task.due_day}`
          : `/plans/${data.plan.id}/week/${task.week_number}`,
        getTaskStatus(task),
        getTaskStatus(task) === "completed",
        undefined,
        task.week_number || undefined,
        task.priority,
        task.due_day ? (getDayName(task.due_day) ?? undefined) : undefined,
        2
      );

      goalNode.children.push(taskNode);
    }

    // Always add goals if they pass the filter, regardless of children
    planNode.children.push(goalNode);
  }

  // 2a. Add weekly goals directly under plan (without long-term goal)
  const planWeeklyGoals = sortedWeeklyGoals.filter(
    (wg: { long_term_goal_id: string | null; milestone_id: string | null }) => !wg.long_term_goal_id && !wg.milestone_id
  );

  for (const weeklyGoal of planWeeklyGoals) {
    if (!shouldInclude(undefined, weeklyGoal.week_number, "weekly_goal")) {
      continue;
    }

    const weeklyGoalNode = createNode(
      weeklyGoal.id,
      "weekly_goal",
      weeklyGoal.title,
      `/plans/${data.plan.id}/week/${weeklyGoal.week_number}`,
      undefined,
      false,
      undefined,
      weeklyGoal.week_number,
      undefined,
      undefined,
      1 // Level 1: directly under plan
    );

    // Find tasks for this weekly goal
    const weeklyGoalTasks = data.tasks.filter(
      (t: { weekly_goal_id: string | null }) => t.weekly_goal_id === weeklyGoal.id
    );

    for (const task of weeklyGoalTasks) {
      if (!shouldInclude(getTaskStatus(task), task.week_number, "task")) {
        continue;
      }

      const taskNode = createNode(
        task.id,
        "task",
        task.title,
        task.due_day
          ? `/plans/${data.plan.id}/week/${task.week_number}/day/${task.due_day}`
          : `/plans/${data.plan.id}/week/${task.week_number}`,
        getTaskStatus(task),
        getTaskStatus(task) === "completed",
        undefined,
        task.week_number || undefined,
        task.priority,
        task.due_day ? (getDayName(task.due_day) ?? undefined) : undefined,
        2 // Level 2: tasks under weekly goal at level 1
      );

      weeklyGoalNode.children.push(taskNode);
    }

    // Always add weekly goals if they pass the week filter, regardless of children
    planNode.children.push(weeklyGoalNode);
  }

  // 3. Add ad-hoc tasks (tasks not linked to any goal/milestone/weekly goal)
  const adHocTasks = sortedTasks.filter(
    (t: { long_term_goal_id: string | null; milestone_id: string | null; weekly_goal_id: string | null }) =>
      !t.long_term_goal_id && !t.milestone_id && !t.weekly_goal_id
  );

  if (adHocTasks.length > 0) {
    const adHocGroupNode = createNode(
      "ad-hoc-group",
      "ad_hoc_group",
      "Other Tasks",
      `/plans/${data.plan.id}/week/${selectedWeek}`,
      undefined,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      1
    );

    for (const task of adHocTasks) {
      if (!shouldInclude(getTaskStatus(task), task.week_number, "task")) {
        continue;
      }

      const taskNode = createNode(
        task.id,
        "task",
        task.title,
        task.due_day
          ? `/plans/${data.plan.id}/week/${task.week_number}/day/${task.due_day}`
          : `/plans/${data.plan.id}/week/${task.week_number}`,
        getTaskStatus(task),
        getTaskStatus(task) === "completed",
        undefined,
        task.week_number || undefined,
        task.priority,
        task.due_day ? (getDayName(task.due_day) ?? undefined) : undefined,
        2
      );

      adHocGroupNode.children.push(taskNode);
    }

    if (adHocGroupNode.children.length > 0) {
      planNode.children.push(adHocGroupNode);
    }
  }

  return tree;
}
