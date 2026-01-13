import type {
  PlanDashboardResponse,
  HierarchyTreeNode,
  NodeType,
  DashboardFilterState,
  PlanStatus,
  TaskStatus,
} from '@/types';

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
 */
export function buildHierarchyTree(
  data: PlanDashboardResponse,
  filters: DashboardFilterState
): HierarchyTreeNode[] {
  const { showCompleted, showAllWeeks } = filters;

  // Calculate current week based on plan start date
  const startDate = new Date(data.plan.start_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  let currentWeek = Math.floor(diffDays / 7) + 1;

  // Clamp to valid range
  if (currentWeek < 1) currentWeek = 1;
  if (currentWeek > 12) currentWeek = 12;

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
  const shouldInclude = (status?: string, weekNumber?: number | null): boolean => {
    // Filter by completion status
    if (!showCompleted) {
      if (status === 'completed' || status === 'cancelled') {
        return false;
      }
      if (typeof status === 'boolean' && status === true) {
        // For milestones, boolean status indicates completion
        return false;
      }
    }

    // Filter by week
    if (!showAllWeeks && weekNumber !== undefined && weekNumber !== null) {
      if (weekNumber !== currentWeek) {
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
    isCompleted: boolean = false,
    progress?: number,
    weekNumber?: number,
    priority?: string,
    date?: string,
    indent: number = 0
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
  const getTaskStatus = (task: any): string => {
    return task.status || 'todo';
  };

  // Build the tree structure
  const tree: HierarchyTreeNode[] = [];

  // 1. Add plan node (root)
  const planNode = createNode(
    data.plan.id,
    'plan',
    data.plan.name,
    `/plans/${data.plan.id}/dashboard`,
    data.plan.status,
    data.plan.status === 'completed',
    undefined,
    undefined,
    undefined,
    undefined,
    0
  );
  tree.push(planNode);

  // 2. Process goals and their children
  for (const goal of data.goals) {
    if (!shouldInclude(goal.progress_percentage === 100 ? 'completed' : 'todo')) {
      continue;
    }

    const goalNode = createNode(
      goal.id,
      'goal',
      goal.title,
      `/plans/${data.plan.id}/goals`,
      goal.progress_percentage === 100 ? 'completed' : undefined,
      goal.progress_percentage === 100,
      goal.progress_percentage,
      undefined,
      undefined,
      undefined,
      1
    );

    // Find milestones for this goal
    const goalMilestones = data.milestones.filter((m: any) => m.long_term_goal_id === goal.id);
    for (const milestone of goalMilestones) {
      if (!shouldInclude(milestone.is_completed ? 'completed' : 'todo')) {
        continue;
      }

      const milestoneNode = createNode(
        milestone.id,
        'milestone',
        milestone.title,
        `/plans/${data.plan.id}/goals`,
        milestone.is_completed ? 'completed' : undefined,
        milestone.is_completed,
        undefined,
        undefined,
        undefined,
        milestone.due_date || undefined,
        2
      );

      // Find weekly goals for this milestone
      const milestoneWeeklyGoals = sortedWeeklyGoals.filter(
        (wg: any) => wg.milestone_id === milestone.id
      );
      for (const weeklyGoal of milestoneWeeklyGoals) {
        if (!shouldInclude('todo', weeklyGoal.week_number)) {
          continue;
        }

        const weeklyGoalNode = createNode(
          weeklyGoal.id,
          'weekly_goal',
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
          (t: any) => t.weekly_goal_id === weeklyGoal.id
        );
        for (const task of weeklyGoalTasks) {
          if (!shouldInclude(getTaskStatus(task), task.week_number)) {
            continue;
          }

          const taskNode = createNode(
            task.id,
            'task',
            task.title,
            task.due_day ? `/plans/${data.plan.id}/day/${task.week_number}/${task.due_day}` : `/plans/${data.plan.id}/week/${task.week_number}`,
            getTaskStatus(task),
            getTaskStatus(task) === 'completed',
            undefined,
            task.week_number || undefined,
            task.priority,
            task.due_day ? `${data.plan.start_date} + ${(task.week_number! - 1) * 7 + task.due_day} days` : undefined,
            4
          );

          weeklyGoalNode.children.push(taskNode);
        }

        if (weeklyGoalNode.children.length > 0 || showCompleted) {
          milestoneNode.children.push(weeklyGoalNode);
        }
      }

      // Add tasks directly under milestone (without weekly goal)
      const milestoneTasks = sortedTasks.filter(
        (t: any) => t.milestone_id === milestone.id && !t.weekly_goal_id
      );
      for (const task of milestoneTasks) {
        if (!shouldInclude(getTaskStatus(task), task.week_number)) {
          continue;
        }

        const taskNode = createNode(
          task.id,
          'task',
          task.title,
          task.due_day ? `/plans/${data.plan.id}/day/${task.week_number}/${task.due_day}` : `/plans/${data.plan.id}/week/${task.week_number}`,
          getTaskStatus(task),
          getTaskStatus(task) === 'completed',
          undefined,
          task.week_number || undefined,
          task.priority,
          task.due_day ? `${data.plan.start_date} + ${(task.week_number! - 1) * 7 + task.due_day} days` : undefined,
          3
        );

        milestoneNode.children.push(taskNode);
      }

      if (milestoneNode.children.length > 0 || showCompleted) {
        goalNode.children.push(milestoneNode);
      }
    }

    // Add weekly goals directly under goal (without milestone)
    const goalWeeklyGoals = sortedWeeklyGoals.filter(
      (wg: any) => wg.long_term_goal_id === goal.id && !wg.milestone_id
    );
    for (const weeklyGoal of goalWeeklyGoals) {
      if (!shouldInclude('todo', weeklyGoal.week_number)) {
        continue;
      }

      const weeklyGoalNode = createNode(
        weeklyGoal.id,
        'weekly_goal',
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
        (t: any) => t.weekly_goal_id === weeklyGoal.id
      );
      for (const task of weeklyGoalTasks) {
        if (!shouldInclude(getTaskStatus(task), task.week_number)) {
          continue;
        }

        const taskNode = createNode(
          task.id,
          'task',
          task.title,
          task.due_day ? `/plans/${data.plan.id}/day/${task.week_number}/${task.due_day}` : `/plans/${data.plan.id}/week/${task.week_number}`,
          getTaskStatus(task),
          getTaskStatus(task) === 'completed',
          undefined,
          task.week_number || undefined,
          task.priority,
          task.due_day ? `${data.plan.start_date} + ${(task.week_number! - 1) * 7 + task.due_day} days` : undefined,
          3
        );

        weeklyGoalNode.children.push(taskNode);
      }

      if (weeklyGoalNode.children.length > 0 || showCompleted) {
        goalNode.children.push(weeklyGoalNode);
      }
    }

    // Add tasks directly under goal (without milestone or weekly goal)
    const goalTasks = sortedTasks.filter(
      (t: any) => t.long_term_goal_id === goal.id && !t.milestone_id && !t.weekly_goal_id
    );
    for (const task of goalTasks) {
      if (!shouldInclude(getTaskStatus(task), task.week_number)) {
        continue;
      }

      const taskNode = createNode(
        task.id,
        'task',
        task.title,
        task.due_day ? `/plans/${data.plan.id}/day/${task.week_number}/${task.due_day}` : `/plans/${data.plan.id}/week/${task.week_number}`,
        getTaskStatus(task),
        getTaskStatus(task) === 'completed',
        undefined,
        task.week_number || undefined,
        task.priority,
        task.due_day ? `${data.plan.start_date} + ${(task.week_number! - 1) * 7 + task.due_day} days` : undefined,
        2
      );

      goalNode.children.push(taskNode);
    }

    if (goalNode.children.length > 0 || showCompleted) {
      planNode.children.push(goalNode);
    }
  }

  // 2a. Add weekly goals directly under plan (without long-term goal)
  const planWeeklyGoals = sortedWeeklyGoals.filter(
    (wg: any) => !wg.long_term_goal_id && !wg.milestone_id
  );
  
  for (const weeklyGoal of planWeeklyGoals) {
    if (!shouldInclude('todo', weeklyGoal.week_number)) {
      continue;
    }

    const weeklyGoalNode = createNode(
      weeklyGoal.id,
      'weekly_goal',
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
      (t: any) => t.weekly_goal_id === weeklyGoal.id
    );
    
    for (const task of weeklyGoalTasks) {
      if (!shouldInclude(getTaskStatus(task), task.week_number)) {
        continue;
      }

      const taskNode = createNode(
        task.id,
        'task',
        task.title,
        task.due_day ? `/plans/${data.plan.id}/day/${task.week_number}/${task.due_day}` : `/plans/${data.plan.id}/week/${task.week_number}`,
        getTaskStatus(task),
        getTaskStatus(task) === 'completed',
        undefined,
        task.week_number || undefined,
        task.priority,
        task.due_day ? `${data.plan.start_date} + ${(task.week_number! - 1) * 7 + task.due_day} days` : undefined,
        2 // Level 2: tasks under weekly goal at level 1
      );

      weeklyGoalNode.children.push(taskNode);
    }

    if (weeklyGoalNode.children.length > 0 || showCompleted) {
      planNode.children.push(weeklyGoalNode);
    }
  }

  // 3. Add ad-hoc tasks (tasks not linked to any goal/milestone/weekly goal)
  const adHocTasks = sortedTasks.filter(
    (t: any) => !t.long_term_goal_id && !t.milestone_id && !t.weekly_goal_id
  );

  if (adHocTasks.length > 0) {
    const adHocGroupNode = createNode(
      'ad-hoc-group',
      'ad_hoc_group',
      'Other Tasks',
      `/plans/${data.plan.id}/week/${currentWeek}`,
      undefined,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      1
    );

    for (const task of adHocTasks) {
      if (!shouldInclude(getTaskStatus(task), task.week_number)) {
        continue;
      }

      const taskNode = createNode(
        task.id,
        'task',
        task.title,
        task.due_day ? `/plans/${data.plan.id}/day/${task.week_number}/${task.due_day}` : `/plans/${data.plan.id}/week/${task.week_number}`,
        getTaskStatus(task),
        getTaskStatus(task) === 'completed',
        undefined,
        task.week_number || undefined,
        task.priority,
        task.due_day ? `${data.plan.start_date} + ${(task.week_number! - 1) * 7 + task.due_day} days` : undefined,
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