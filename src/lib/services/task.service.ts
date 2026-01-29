import type { SupabaseClient } from "../../db/supabase.client";
import type {
  TaskDTO,
  TaskWithHistoryDTO,
  TaskHistoryDTO,
  DailyTasksDTO,
  ListResponse,
  ItemResponse,
  SuccessResponse,
  ErrorResponse,
  TasksByGoalParams,
} from "../../types";
import type {
  ListTasksParams,
  DailyTasksParams,
  CreateTaskData,
  UpdateTaskData,
  CopyTaskData,
} from "../validation/task.validation";

/**
 * Task Service
 *
 * Handles all business logic for task management including:
 * - Listing tasks with advanced filtering
 * - Getting daily tasks with A/B/C categorization
 * - CRUD operations for tasks
 * - Task copying functionality
 *
 * All methods include proper error handling and validation.
 */
export class TaskService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * List tasks with filtering and pagination
   * GET /api/v1/tasks
   *
   * @param params - Query parameters for filtering
   * @returns List of tasks with total count
   */
  async listTasks(params: ListTasksParams): Promise<ListResponse<TaskDTO> | ErrorResponse> {
    try {
      let query = this.supabase.from("tasks").select("*", { count: "exact" }).eq("plan_id", params.plan_id);

      // Apply optional filters
      if (params.week_number !== undefined && params.week_number !== null) {
        query = query.eq("week_number", params.week_number);
      }
      if (params.due_day !== undefined && params.due_day !== null) {
        query = query.eq("due_day", params.due_day);
      }
      if (params.task_type) {
        query = query.eq("task_type", params.task_type);
      }
      if (params.weekly_goal_id) {
        query = query.eq("weekly_goal_id", params.weekly_goal_id);
      }
      if (params.long_term_goal_id) {
        query = query.eq("long_term_goal_id", params.long_term_goal_id);
      }
      if (params.milestone_id) {
        query = query.eq("milestone_id", params.milestone_id);
      }
      if (params.status) {
        query = query.eq("status", params.status);
      }
      if (params.priority) {
        query = query.eq("priority", params.priority);
      }

      // Apply pagination
      const limit = params.limit ?? 50;
      const offset = params.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      // Order by position (default ordering)
      query = query.order("position", { ascending: true });

      const { data, error, count } = await query;

      if (error) {
        return { error: "Failed to fetch tasks" };
      }

      return {
        data: data as TaskDTO[],
        count: count ?? undefined,
      };
    } catch {
      return { error: "Internal server error" };
    }
  }

  /**
   * Get daily tasks with A/B/C categorization
   * GET /api/v1/tasks/daily
   *
   * @param params - Query parameters (plan_id, week_number, due_day)
   * @param planStartDate - Start date of the plan (for date calculation)
   * @returns Categorized tasks for the specified day
   */
  async getDailyTasks(
    params: DailyTasksParams,
    planStartDate: Date
  ): Promise<ItemResponse<DailyTasksDTO> | ErrorResponse> {
    try {
      const { data: tasks, error } = await this.supabase
        .from("tasks")
        .select("id, title, priority, status, task_type")
        .eq("plan_id", params.plan_id)
        .eq("week_number", params.week_number)
        .eq("due_day", params.due_day)
        .order("priority", { ascending: true }) // A, B, C
        .order("position", { ascending: true });

      if (error) {
        return { error: "Failed to fetch daily tasks" };
      }

      // Calculate actual date
      const weekOffset = params.week_number - 1;
      const dayOffset = params.due_day - 1;
      const taskDate = new Date(planStartDate);
      taskDate.setDate(taskDate.getDate() + weekOffset * 7 + dayOffset);
      const dateString = taskDate.toISOString().split("T")[0];

      // Categorize by priority
      interface TaskWithPriority {
        priority: string;
        id: string;
        title: string;
        status: string;
        task_type: string;
      }
      const mostImportant = tasks.find((t: TaskWithPriority) => t.priority === "A") || null;
      const secondary = tasks.filter((t: TaskWithPriority) => t.priority === "B");
      const additional = tasks.filter((t: TaskWithPriority) => t.priority === "C");

      const dailyTasks: DailyTasksDTO = {
        date: dateString,
        week_number: params.week_number,
        due_day: params.due_day,
        most_important: mostImportant,
        secondary,
        additional,
      };

      return { data: dailyTasks };
    } catch {
      return { error: "Internal server error" };
    }
  }

  /**
   * Get task by ID with history
   * GET /api/v1/tasks/:id
   *
   * @param taskId - Task UUID
   * @returns Task with history or error if not found
   */
  async getTaskById(taskId: string): Promise<ItemResponse<TaskWithHistoryDTO> | ErrorResponse> {
    try {
      // Fetch task
      const { data: task, error: taskError } = await this.supabase.from("tasks").select("*").eq("id", taskId).single();

      if (taskError || !task) {
        return { error: "Task not found" };
      }

      // Fetch history
      const { data: history, error: historyError } = await this.supabase
        .from("task_history")
        .select("*")
        .eq("task_id", taskId)
        .order("changed_at", { ascending: true });

      if (historyError) {
        return { error: "Failed to fetch task history" };
      }

      const taskWithHistory: TaskWithHistoryDTO = {
        ...(task as TaskDTO),
        history: history || [],
      };

      return { data: taskWithHistory };
    } catch {
      return { error: "Internal server error" };
    }
  }

  /**
   * Create a new task
   * POST /api/v1/tasks
   *
   * @param taskData - Task creation data
   * @returns Created task or error
   */
  async createTask(taskData: CreateTaskData): Promise<ItemResponse<TaskDTO> | ErrorResponse> {
    try {
      // Verify plan exists (RLS will also check ownership)
      const { data: plan, error: planError } = await this.supabase
        .from("plans")
        .select("id")
        .eq("id", taskData.plan_id)
        .single();

      if (planError || !plan) {
        return { error: "Plan not found" };
      }

      // If weekly_goal_id provided, verify it exists
      if (taskData.weekly_goal_id) {
        const { data: weeklyGoal, error: goalError } = await this.supabase
          .from("weekly_goals")
          .select("id")
          .eq("id", taskData.weekly_goal_id)
          .single();

        if (goalError || !weeklyGoal) {
          return { error: "Weekly goal not found" };
        }
      }

      // If long_term_goal_id provided, verify it exists
      if (taskData.long_term_goal_id) {
        const { data: longTermGoal, error: goalError } = await this.supabase
          .from("long_term_goals")
          .select("id")
          .eq("id", taskData.long_term_goal_id)
          .single();

        if (goalError || !longTermGoal) {
          return { error: "Long-term goal not found" };
        }
      }

      // If milestone_id provided, verify it exists
      if (taskData.milestone_id) {
        const { data: milestone, error: milestoneError } = await this.supabase
          .from("milestones")
          .select("id")
          .eq("id", taskData.milestone_id)
          .single();

        if (milestoneError || !milestone) {
          return { error: "Milestone not found" };
        }
      }

      // Insert task
      const { data: newTask, error: insertError } = await this.supabase
        .from("tasks")
        .insert(taskData)
        .select()
        .single();

      if (insertError) {
        // Check for constraint violations (triggers)
        if (insertError.message.includes("Cannot add more than")) {
          return { error: insertError.message };
        }
        return { error: "Failed to create task" };
      }

      return { data: newTask as TaskDTO };
    } catch {
      return { error: "Internal server error" };
    }
  }

  /**
   * Update task
   * PATCH /api/v1/tasks/:id
   *
   * @param taskId - Task UUID
   * @param updateData - Fields to update
   * @returns Updated task or error
   */
  async updateTask(taskId: string, updateData: UpdateTaskData): Promise<ItemResponse<TaskDTO> | ErrorResponse> {
    try {
      // Check if task exists
      const { data: existingTask, error: fetchError } = await this.supabase
        .from("tasks")
        .select("id")
        .eq("id", taskId)
        .single();

      if (fetchError || !existingTask) {
        return { error: "Task not found" };
      }

      // If weekly_goal_id provided, verify it exists
      if (updateData.weekly_goal_id) {
        const { data: weeklyGoal, error: goalError } = await this.supabase
          .from("weekly_goals")
          .select("id")
          .eq("id", updateData.weekly_goal_id)
          .single();

        if (goalError || !weeklyGoal) {
          return { error: "Weekly goal not found" };
        }
      }

      // If long_term_goal_id provided, verify it exists
      if (updateData.long_term_goal_id) {
        const { data: longTermGoal, error: goalError } = await this.supabase
          .from("long_term_goals")
          .select("id")
          .eq("id", updateData.long_term_goal_id)
          .single();

        if (goalError || !longTermGoal) {
          return { error: "Long-term goal not found" };
        }
      }

      // If milestone_id provided, verify it exists
      if (updateData.milestone_id) {
        const { data: milestone, error: milestoneError } = await this.supabase
          .from("milestones")
          .select("id")
          .eq("id", updateData.milestone_id)
          .single();

        if (milestoneError || !milestone) {
          return { error: "Milestone not found" };
        }
      }

      // Update task
      const { data: updatedTask, error: updateError } = await this.supabase
        .from("tasks")
        .update(updateData)
        .eq("id", taskId)
        .select()
        .single();

      if (updateError) {
        return { error: "Failed to update task" };
      }

      // Trigger log_task_status_change will automatically log status changes

      return { data: updatedTask as TaskDTO };
    } catch {
      return { error: "Internal server error" };
    }
  }

  /**
   * Copy task to another week/day
   * POST /api/v1/tasks/:id/copy
   *
   * @param taskId - Task UUID to copy
   * @param copyData - New week_number and/or due_day
   * @returns Copied task or error
   */
  async copyTask(taskId: string, copyData: CopyTaskData): Promise<SuccessResponse | ErrorResponse> {
    try {
      // Fetch original task
      const { data: originalTask, error: fetchError } = await this.supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      if (fetchError || !originalTask) {
        return { error: "Task not found" };
      }

      // Create new task with copied data
      const newTaskData = {
        plan_id: originalTask.plan_id,
        weekly_goal_id: originalTask.weekly_goal_id,
        long_term_goal_id: originalTask.long_term_goal_id,
        milestone_id: originalTask.milestone_id,
        title: originalTask.title,
        description: originalTask.description,
        priority: originalTask.priority,
        status: "todo" as const, // Reset status
        task_type: originalTask.task_type,
        week_number: copyData.week_number ?? originalTask.week_number,
        due_day: copyData.due_day ?? originalTask.due_day,
        position: originalTask.position,
      };

      const { data: copiedTask, error: insertError } = await this.supabase
        .from("tasks")
        .insert(newTaskData)
        .select()
        .single();

      if (insertError) {
        return { error: "Failed to copy task" };
      }

      return {
        data: copiedTask,
        message: "Task copied successfully",
      };
    } catch {
      return { error: "Internal server error" };
    }
  }

  /**
   * Delete task
   * DELETE /api/v1/tasks/:id
   *
   * @param taskId - Task UUID
   * @returns Success message or error
   */
  async deleteTask(taskId: string): Promise<SuccessResponse | ErrorResponse> {
    try {
      // Check if task exists
      const { data: existingTask, error: fetchError } = await this.supabase
        .from("tasks")
        .select("id")
        .eq("id", taskId)
        .single();

      if (fetchError || !existingTask) {
        return { error: "Task not found" };
      }

      // Delete task (cascades to task_history)
      const { error: deleteError } = await this.supabase.from("tasks").delete().eq("id", taskId);

      if (deleteError) {
        return { error: "Failed to delete task" };
      }

      return { message: "Task deleted successfully" };
    } catch {
      return { error: "Internal server error" };
    }
  }

  /**
   * Get status change history for a task
   * GET /api/v1/tasks/:taskId/history
   *
   * @param taskId - Task UUID
   * @returns Array of task history entries ordered by changed_at
   */
  async getTaskHistory(taskId: string): Promise<ListResponse<TaskHistoryDTO> | ErrorResponse> {
    try {
      // Query task_history table
      const { data, error } = await this.supabase
        .from("task_history")
        .select("*")
        .eq("task_id", taskId)
        .order("changed_at", { ascending: true });

      if (error) {
        return { error: "Failed to fetch task history" };
      }

      return {
        data: data as TaskHistoryDTO[],
      };
    } catch {
      return { error: "Internal server error" };
    }
  }

  /**
   * Helper: Get plan start date (needed for getDailyTasks)
   *
   * @param planId - Plan UUID
   * @returns Plan start date or null if not found
   */
  async getPlanStartDate(planId: string): Promise<Date | null> {
    try {
      const { data, error } = await this.supabase.from("plans").select("start_date").eq("id", planId).single();

      if (error || !data) {
        return null;
      }

      return new Date(data.start_date);
    } catch {
      return null;
    }
  }

  /**
   * Helper: Get milestone IDs for a specific goal
   * Private method used by getTasksByGoalId
   *
   * @param goalId - Long-term goal UUID
   * @returns Array of milestone IDs
   */
  private async getMilestoneIdsByGoalId(goalId: string): Promise<string[]> {
    const { data, error } = await this.supabase.from("milestones").select("id").eq("long_term_goal_id", goalId);

    if (error) {
      throw new Error("Failed to fetch milestone IDs");
    }

    return (data || []).map((m) => m.id);
  }

  /**
   * Get all tasks associated with a specific long-term goal
   * Includes both direct tasks (long_term_goal_id) and indirect tasks (via milestones)
   * GET /api/v1/goals/:goalId/tasks
   *
   * @param goalId - Long-term goal UUID
   * @param userId - User ID for security verification
   * @param params - Query parameters (status, week_number, include_milestone_tasks, limit, offset)
   * @returns Tasks with count
   *
   * @example
   * ```typescript
   * const result = await taskService.getTasksByGoalId(goalId, userId, {
   *   status: 'completed',
   *   week_number: 3,
   *   include_milestone_tasks: true,
   *   limit: 50,
   *   offset: 0
   * });
   * // Returns { data: [...tasks], count: 25 }
   * ```
   */
  async getTasksByGoalId(
    goalId: string,
    userId: string,
    params: TasksByGoalParams
  ): Promise<{ data: TaskDTO[]; count: number }> {
    try {
      // Build base query for direct tasks (long_term_goal_id = goalId)
      // Use INNER JOIN with long_term_goals to verify user ownership at database level
      let directQuery = this.supabase
        .from("tasks")
        .select(
          `
          *,
          long_term_goals!inner(user_id)
        `
        )
        .eq("long_term_goal_id", goalId)
        .eq("long_term_goals.user_id", userId);

      // Apply optional filters to direct query
      if (params.status) {
        directQuery = directQuery.eq("status", params.status);
      }
      if (params.week_number !== undefined) {
        directQuery = directQuery.eq("week_number", params.week_number);
      }

      const { data: directTasks, error: directError } = await directQuery;

      if (directError) {
        throw new Error("Failed to fetch direct tasks");
      }

      type TaskWithDirectJoinData = TaskDTO & { long_term_goals?: unknown };
      type TaskWithMilestoneJoinData = TaskDTO & { milestones?: unknown };
      
      let allTasks: TaskDTO[] = (directTasks || []).map((task) => {
        const { long_term_goals: _long_term_goals, ...cleanTask } = task as TaskWithDirectJoinData;
        return cleanTask as TaskDTO;
      });

      // Fetch milestone tasks if requested
      if (params.include_milestone_tasks) {
        const milestoneIds = await this.getMilestoneIdsByGoalId(goalId);

        if (milestoneIds.length > 0) {
          // Build query for indirect tasks (via milestones)
          // Use INNER JOIN to verify user ownership through milestone -> goal -> user chain
          let milestoneQuery = this.supabase
            .from("tasks")
            .select(
              `
              *,
              milestones!inner(
                long_term_goal_id,
                long_term_goals!inner(user_id)
              )
            `
            )
            .in("milestone_id", milestoneIds)
            .eq("milestones.long_term_goals.user_id", userId);

          // Apply same filters to milestone query
          if (params.status) {
            milestoneQuery = milestoneQuery.eq("status", params.status);
          }
          if (params.week_number !== undefined) {
            milestoneQuery = milestoneQuery.eq("week_number", params.week_number);
          }

          const { data: milestoneTasks, error: milestoneError } = await milestoneQuery;

          if (milestoneError) {
            throw new Error("Failed to fetch milestone tasks");
          }

          // Clean milestone tasks and merge with direct tasks
          const cleanedMilestoneTasks = (milestoneTasks || []).map((task) => {
            const { milestones: _milestones, ...cleanTask } = task as TaskWithMilestoneJoinData;
            return cleanTask as TaskDTO;
          });

          // Merge and deduplicate tasks (a task could have both long_term_goal_id AND milestone_id)
          const taskMap = new Map<string, TaskDTO>();
          
          [...allTasks, ...cleanedMilestoneTasks].forEach((task) => {
            taskMap.set(task.id, task);
          });

          allTasks = Array.from(taskMap.values());
        }
      }

      // Sort by week_number and position
      // Tasks with null week_number should appear at the end
      allTasks.sort((a, b) => {
        const weekA = a.week_number ?? 999;
        const weekB = b.week_number ?? 999;
        if (weekA !== weekB) return weekA - weekB;
        return a.position - b.position;
      });

      // Get total count before pagination
      const totalCount = allTasks.length;

      // Apply pagination
      const { limit = 50, offset = 0 } = params;
      const paginatedTasks = allTasks.slice(offset, offset + limit);

      return {
        data: paginatedTasks,
        count: totalCount,
      };
    } catch (error) {
      throw error;
    }
  }
}
