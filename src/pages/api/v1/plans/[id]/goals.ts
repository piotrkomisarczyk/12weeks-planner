/**
 * API Endpoints: /api/v1/plans/:planId/goals
 * GET - Retrieves all goals for a specific plan
 * 
 * URL Parameters:
 * - planId: UUID (required)
 * 
 * Responses:
 * - 200: OK with goals array
 * - 400: Invalid plan ID format
 * - 404: Plan not found or doesn't belong to user
 * - 500: Internal server error
 */

import type { APIRoute } from 'astro';
import { GoalService } from '../../../../../lib/services/goal.service';
import { PlanService } from '../../../../../lib/services/plan.service';
import { PlanIdParamsSchema } from '../../../../../lib/validation/goal.validation';
import { DEFAULT_USER_ID } from '../../../../../db/supabase.client';
import type { 
  ErrorResponse, 
  ValidationErrorResponse, 
  ListResponse, 
  GoalDTO 
} from '../../../../../types';

export const prerender = false;

/**
 * GET /api/v1/plans/:planId/goals
 * Retrieves all goals for a specific plan
 */
export const GET: APIRoute = async ({ locals, params }) => {
  try {
    // Step 1: Authentication - Using default user for MVP
    const userId = DEFAULT_USER_ID;

    // Step 2: Validate URL params
    const validationResult = PlanIdParamsSchema.safeParse(params);

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

    const { planId } = validationResult.data;

    // Step 3: Verify plan exists and belongs to user
    const planService = new PlanService(locals.supabase);
    const plan = await planService.getPlanById(planId, userId);

    if (!plan) {
      return new Response(
        JSON.stringify({ error: 'Not found', message: 'Plan not found' } as ErrorResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Get goals for plan
    const goalService = new GoalService(locals.supabase);
    const goals = await goalService.getGoalsByPlanId(planId, userId);

    // Step 5: Return success
    return new Response(
      JSON.stringify({ data: goals } as ListResponse<GoalDTO>),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  } catch (error) {
    console.error('Error in GET /api/v1/plans/:planId/goals:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      } as ErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
