import type { SupabaseClient } from '../../db/supabase.client';
import type {
  TaskDTO,
  TaskWithHistoryDTO,
  TaskHistoryDTO,
  DailyTasksDTO,
  ListResponse,
  ItemResponse,
  SuccessResponse,
  ErrorResponse,
} from '../../types';
import type {
  ListTasksParams,
  DailyTasksParams,
  CreateTaskData,
  UpdateTaskData,
  CopyTaskData,
} from '../validation/task.validation';

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
      let query = this.supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .eq('plan_id', params.plan_id);

      // Apply optional filters
      if (params.week_number !== undefined && params.week_number !== null) {
        query = query.eq('week_number', params.week_number);
      }
      if (params.due_day !== undefined && params.due_day !== null) {
        query = query.eq('due_day', params.due_day);
      }
      if (params.task_type) {
        query = query.eq('task_type', params.task_type);
      }
      if (params.weekly_goal_id) {
        query = query.eq('weekly_goal_id', params.weekly_goal_id);
      }
      if (params.milestone_id) {
        query = query.eq('milestone_id', params.milestone_id);
      }
      if (params.status) {
        query = query.eq('status', params.status);
      }
      if (params.priority) {
        query = query.eq('priority', params.priority);
      }

      // Apply pagination
      const limit = params.limit ?? 50;
      const offset = params.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      // Order by position (default ordering)
      query = query.order('position', { ascending: true });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error listing tasks:', error);
        return { error: 'Failed to fetch tasks' };
      }

      return {
        data: data as TaskDTO[],
        count: count ?? undefined,
      };
    } catch (error) {
      console.error('Unexpected error in listTasks:', error);
      return { error: 'Internal server error' };
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
        .from('tasks')
        .select('id, title, priority, status, task_type')
        .eq('plan_id', params.plan_id)
        .eq('week_number', params.week_number)
        .eq('due_day', params.due_day)
        .order('priority', { ascending: true }) // A, B, C
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching daily tasks:', error);
        return { error: 'Failed to fetch daily tasks' };
      }

      // Calculate actual date
      const weekOffset = params.week_number - 1;
      const dayOffset = params.due_day - 1;
      const taskDate = new Date(planStartDate);
      taskDate.setDate(taskDate.getDate() + weekOffset * 7 + dayOffset);
      const dateString = taskDate.toISOString().split('T')[0];

      // Categorize by priority
      const mostImportant = tasks.find((t: { priority: string }) => t.priority === 'A') || null;
      const secondary = tasks.filter((t: { priority: string }) => t.priority === 'B');
      const additional = tasks.filter((t: { priority: string }) => t.priority === 'C');

      const dailyTasks: DailyTasksDTO = {
        date: dateString,
        week_number: params.week_number,
        due_day: params.due_day,
        most_important: mostImportant,
        secondary,
        additional,
      };

      return { data: dailyTasks };
    } catch (error) {
      console.error('Unexpected error in getDailyTasks:', error);
      return { error: 'Internal server error' };
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
      const { data: task, error: taskError } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError || !task) {
        return { error: 'Task not found' };
      }

      // Fetch history
      const { data: history, error: historyError } = await this.supabase
        .from('task_history')
        .select('*')
        .eq('task_id', taskId)
        .order('changed_at', { ascending: true });

      if (historyError) {
        console.error('Error fetching task history:', historyError);
        return { error: 'Failed to fetch task history' };
      }

      const taskWithHistory: TaskWithHistoryDTO = {
        ...(task as TaskDTO),
        history: history || [],
      };

      return { data: taskWithHistory };
    } catch (error) {
      console.error('Unexpected error in getTaskById:', error);
      return { error: 'Internal server error' };
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
        .from('plans')
        .select('id')
        .eq('id', taskData.plan_id)
        .single();

      if (planError || !plan) {
        return { error: 'Plan not found' };
      }

      // If weekly_goal_id provided, verify it exists
      if (taskData.weekly_goal_id) {
        const { data: weeklyGoal, error: goalError } = await this.supabase
          .from('weekly_goals')
          .select('id')
          .eq('id', taskData.weekly_goal_id)
          .single();

        if (goalError || !weeklyGoal) {
          return { error: 'Weekly goal not found' };
        }
      }

      // If milestone_id provided, verify it exists
      if (taskData.milestone_id) {
        const { data: milestone, error: milestoneError } = await this.supabase
          .from('milestones')
          .select('id')
          .eq('id', taskData.milestone_id)
          .single();

        if (milestoneError || !milestone) {
          return { error: 'Milestone not found' };
        }
      }

      // Insert task
      const { data: newTask, error: insertError } = await this.supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (insertError) {
        // Check for constraint violations (triggers)
        if (insertError.message.includes('Cannot add more than')) {
          return { error: insertError.message };
        }
        console.error('Error creating task:', insertError);
        return { error: 'Failed to create task' };
      }

      return { data: newTask as TaskDTO };
    } catch (error) {
      console.error('Unexpected error in createTask:', error);
      return { error: 'Internal server error' };
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
  async updateTask(
    taskId: string,
    updateData: UpdateTaskData
  ): Promise<ItemResponse<TaskDTO> | ErrorResponse> {
    try {
      // Check if task exists
      const { data: existingTask, error: fetchError } = await this.supabase
        .from('tasks')
        .select('id')
        .eq('id', taskId)
        .single();

      if (fetchError || !existingTask) {
        return { error: 'Task not found' };
      }

      // If weekly_goal_id provided, verify it exists
      if (updateData.weekly_goal_id) {
        const { data: weeklyGoal, error: goalError } = await this.supabase
          .from('weekly_goals')
          .select('id')
          .eq('id', updateData.weekly_goal_id)
          .single();

        if (goalError || !weeklyGoal) {
          return { error: 'Weekly goal not found' };
        }
      }

      // If milestone_id provided, verify it exists
      if (updateData.milestone_id) {
        const { data: milestone, error: milestoneError } = await this.supabase
          .from('milestones')
          .select('id')
          .eq('id', updateData.milestone_id)
          .single();

        if (milestoneError || !milestone) {
          return { error: 'Milestone not found' };
        }
      }

      // Update task
      const { data: updatedTask, error: updateError } = await this.supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating task:', updateError);
        return { error: 'Failed to update task' };
      }

      // Trigger log_task_status_change will automatically log status changes

      return { data: updatedTask as TaskDTO };
    } catch (error) {
      console.error('Unexpected error in updateTask:', error);
      return { error: 'Internal server error' };
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
  async copyTask(
    taskId: string,
    copyData: CopyTaskData
  ): Promise<SuccessResponse | ErrorResponse> {
    try {
      // Fetch original task
      const { data: originalTask, error: fetchError } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (fetchError || !originalTask) {
        return { error: 'Task not found' };
      }

      // Create new task with copied data
      const newTaskData = {
        plan_id: originalTask.plan_id,
        weekly_goal_id: originalTask.weekly_goal_id,
        milestone_id: originalTask.milestone_id,
        title: originalTask.title,
        description: originalTask.description,
        priority: originalTask.priority,
        status: 'todo' as const, // Reset status
        task_type: originalTask.task_type,
        week_number: copyData.week_number ?? originalTask.week_number,
        due_day: copyData.due_day ?? originalTask.due_day,
        position: originalTask.position,
      };

      const { data: copiedTask, error: insertError } = await this.supabase
        .from('tasks')
        .insert(newTaskData)
        .select()
        .single();

      if (insertError) {
        console.error('Error copying task:', insertError);
        return { error: 'Failed to copy task' };
      }

      return {
        data: copiedTask,
        message: 'Task copied successfully',
      };
    } catch (error) {
      console.error('Unexpected error in copyTask:', error);
      return { error: 'Internal server error' };
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
        .from('tasks')
        .select('id')
        .eq('id', taskId)
        .single();

      if (fetchError || !existingTask) {
        return { error: 'Task not found' };
      }

      // Delete task (cascades to task_history)
      const { error: deleteError } = await this.supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) {
        console.error('Error deleting task:', deleteError);
        return { error: 'Failed to delete task' };
      }

      return { message: 'Task deleted successfully' };
    } catch (error) {
      console.error('Unexpected error in deleteTask:', error);
      return { error: 'Internal server error' };
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
        .from('task_history')
        .select('*')
        .eq('task_id', taskId)
        .order('changed_at', { ascending: true });

      if (error) {
        console.error('Error fetching task history:', error);
        return { error: 'Failed to fetch task history' };
      }

      return {
        data: data as TaskHistoryDTO[],
      };
    } catch (error) {
      console.error('Unexpected error in getTaskHistory:', error);
      return { error: 'Internal server error' };
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
      const { data, error } = await this.supabase
        .from('plans')
        .select('start_date')
        .eq('id', planId)
        .single();

      if (error || !data) {
        return null;
      }

      return new Date(data.start_date);
    } catch (error) {
      console.error('Error fetching plan start date:', error);
      return null;
    }
  }
}

