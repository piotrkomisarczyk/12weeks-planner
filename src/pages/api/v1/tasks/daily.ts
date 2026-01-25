import type { APIRoute } from 'astro';
import { TaskService } from '../../../../lib/services/task.service';
import { dailyTasksParamsSchema } from '../../../../lib/validation/task.validation';
import { GetUnauthorizedResponse } from '../../../../lib/utils';

export const prerender = false;

/**
 * GET /api/v1/tasks/daily
 * 
 * Get daily tasks with A/B/C priority categorization.
 * Returns tasks organized by priority:
 * - most_important: Single priority A task (or null)
 * - secondary: Array of priority B tasks
 * - additional: Array of priority C tasks
 * 
 * Query Parameters:
 * - plan_id (required): UUID of the plan
 * - week_number (required): Week number (1-12)
 * - due_day (required): Day of week (1=Monday, 7=Sunday)
 * 
 * Returns:
 * - 200: { data: DailyTasksDTO }
 * - 400: Validation error
 * - 404: Plan not found
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const supabase = locals.supabase;
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // Parse query parameters
    const params = {
      plan_id: url.searchParams.get('plan_id'),
      week_number: url.searchParams.get('week_number'),
      due_day: url.searchParams.get('due_day'),
    };

    // Validate query parameters
    const validation = dailyTasksParamsSchema.safeParse(params);
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

    // Get plan start date (needed to calculate actual date)
    const taskService = new TaskService(supabase);
    const planStartDate = await taskService.getPlanStartDate(validation.data.plan_id);

    if (!planStartDate) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Call service to get daily tasks
    const result = await taskService.getDailyTasks(validation.data, planStartDate);

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
    console.error('Error in GET /api/v1/tasks/daily:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};


