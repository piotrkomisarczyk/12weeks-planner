/**
 * API Endpoints: /api/v1/plans/:id/goals
 * GET - Retrieves all goals for a specific plan
 */

import type { APIRoute } from 'astro';
import { GoalService } from '../../../../../lib/services/goal.service';
import { PlanService } from '../../../../../lib/services/plan.service';
import { PlanIdParamsSchema } from '../../../../../lib/validation/plan.validation';
import { DEFAULT_USER_ID } from '../../../../../db/supabase.client';
import type { ErrorResponse, ValidationErrorResponse, ListResponse, GoalDTO } from '../../../../../types';

export const prerender = false;

export const GET: APIRoute = async ({ locals, params }) => {
  try {
    // Authentication (MVP: using default user)
    const userId = DEFAULT_USER_ID;

    // Validate URL params
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

    const  planId  = validationResult.data.id;

    // Verify plan exists and belongs to user
    const planService = new PlanService(locals.supabase);
    const plan = await planService.getPlanById(planId, userId);

    if (!plan) {
      return new Response(
        JSON.stringify({ error: 'Not found', message: 'Plan not found' } as ErrorResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get goals for plan
    const goalService = new GoalService(locals.supabase);
    const goals = await goalService.getGoalsByPlanId(planId, userId);

    // Return success
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
    console.error('Error in GET /api/v1/plans/:id/goals:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      } as ErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

