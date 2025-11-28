import type { APIRoute } from 'astro';
import { TaskService } from '../../../../lib/services/task.service';
import { listTasksSchema, createTaskSchema } from '../../../../lib/validation/task.validation';
import { DEFAULT_USER_ID } from '../../../../db/supabase.client';

export const prerender = false;

/**
 * GET /api/v1/tasks
 * 
 * List tasks with advanced filtering and pagination.
 * 
 * Query Parameters:
 * - plan_id (required): UUID of the plan
 * - week_number (optional): Filter by week number (1-12)
 * - due_day (optional): Filter by day of week (1-7)
 * - task_type (optional): Filter by task type
 * - weekly_goal_id (optional): Filter by weekly goal
 * - milestone_id (optional): Filter by milestone
 * - status (optional): Filter by status
 * - priority (optional): Filter by priority (A/B/C)
 * - limit (optional): Number of results (default: 50, max: 100)
 * - offset (optional): Pagination offset (default: 0)
 * 
 * Returns:
 * - 200: { data: TaskDTO[], count: number }
 * - 400: Validation error
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const supabase = locals.supabase;
    const userId = DEFAULT_USER_ID;

    // Parse query parameters
    const params = {
      plan_id: url.searchParams.get('plan_id'),
      week_number: url.searchParams.get('week_number'),
      due_day: url.searchParams.get('due_day'),
      task_type: url.searchParams.get('task_type'),
      weekly_goal_id: url.searchParams.get('weekly_goal_id'),
      milestone_id: url.searchParams.get('milestone_id'),
      status: url.searchParams.get('status'),
      priority: url.searchParams.get('priority'),
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
    };

    // Validate query parameters
    const validation = listTasksSchema.safeParse(params);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            received: err.code === 'invalid_type' ? params[err.path[0] as keyof typeof params] : undefined,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call service
    const taskService = new TaskService(supabase);
    const result = await taskService.listTasks(validation.data);

    if ('error' in result) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in GET /api/v1/tasks:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * POST /api/v1/tasks
 * 
 * Create a new task.
 * 
 * Request Body:
 * - plan_id (required): UUID of the plan
 * - weekly_goal_id (optional): UUID of weekly goal
 * - milestone_id (optional): UUID of milestone
 * - title (required): Task title (max 255 chars)
 * - description (optional): Task description
 * - priority (optional): A/B/C (default: C)
 * - status (optional): Task status (default: todo)
 * - task_type (optional): weekly_main/weekly_sub/ad_hoc (default: weekly_sub)
 * - week_number (optional): Week number (1-12)
 * - due_day (optional): Day of week (1-7)
 * - position (optional): Position in list (default: 1)
 * 
 * Returns:
 * - 201: { data: TaskDTO }
 * - 400: Validation error or constraint violation
 * - 404: Plan/weekly goal/milestone not found
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;
    const userId = DEFAULT_USER_ID;

    // Parse request body
    const body = await request.json();

    // Validate body
    const validation = createTaskSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call service
    const taskService = new TaskService(supabase);
    const result = await taskService.createTask(validation.data);

    if ('error' in result) {
      // Determine status code based on error type
      const status =
        result.error === 'Plan not found' ||
        result.error === 'Weekly goal not found' ||
        result.error === 'Milestone not found'
          ? 404
          : result.error.includes('Cannot add more than')
          ? 400
          : 500;

      return new Response(JSON.stringify({ error: result.error }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in POST /api/v1/tasks:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};


