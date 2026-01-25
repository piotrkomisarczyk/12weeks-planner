/**
 * API Endpoint: /api/v1/goals/:goalId/weekly-goals
 * GET - Retrieves all weekly goals associated with a specific long-term goal
 */

import type { APIRoute } from 'astro';
import { GoalService } from '../../../../../lib/services/goal.service';
import { WeeklyGoalService } from '../../../../../lib/services/weekly-goal.service';
import { GoalIdParamsSchema } from '../../../../../lib/validation/goal.validation';
import { GetUnauthorizedResponse } from '../../../../../lib/utils';
import type { 
  ErrorResponse,
  ValidationErrorResponse, 
  ListResponse, 
  WeeklyGoalDTO 
} from '../../../../../types';

export const prerender = false;

export const GET: APIRoute = async ({ locals, params }) => {
  try {
    // Authentication
    const userId = locals.user?.id;
    
    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // Validate URL params
    const validationResult = GoalIdParamsSchema.safeParse({ id: params.goalId });

    if (!validationResult.success) {
      const details = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        received: 'input' in issue ? issue.input : undefined
      }));

      return new Response(
        JSON.stringify({ error: 'Validation failed', details } as ValidationErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id: goalId } = validationResult.data;

    // Verify goal exists and belongs to user
    const goalService = new GoalService(locals.supabase);
    const goal = await goalService.getGoalById(goalId, userId);

    if (!goal) {
      return new Response(
        JSON.stringify({ error: 'Not found', message: 'Goal not found' } as ErrorResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get weekly goals for this goal
    const weeklyGoalService = new WeeklyGoalService(locals.supabase);
    const weeklyGoals = await weeklyGoalService.getWeeklyGoalsByGoalId(goalId, userId);

    // Return success
    return new Response(
      JSON.stringify({ data: weeklyGoals } as ListResponse<WeeklyGoalDTO>),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  } catch (error) {
    console.error('Error in GET /api/v1/goals/:goalId/weekly-goals:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      goalId: params.goalId,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      } as ErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

