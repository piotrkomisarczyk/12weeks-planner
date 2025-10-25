/**
 * API Endpoint: GET /api/v1/plans/:id
 * 
 * Returns a specific plan by ID.
 * Verifies that the plan belongs to the authenticated user.
 * 
 * URL Parameters:
 * - id: UUID of the plan
 * 
 * Responses:
 * - 200: Success with plan data
 * - 400: Invalid UUID format
 * - 401: Unauthorized (missing or invalid token)
 * - 404: Plan not found or doesn't belong to user
 * - 500: Internal server error
 */

import type { APIRoute } from 'astro';
import { PlanService } from '../../../../lib/services/plan.service';
import { GetPlanByIdParamsSchema } from '../../../../lib/validation/plan.validation';
import { DEFAULT_USER_ID } from '../../../../db/supabase.client';
import type { 
  ErrorResponse, 
  ItemResponse, 
  PlanDTO,
  ValidationErrorResponse 
} from '../../../../types';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Authentication - Using default user for MVP
    // TODO: Implement real authentication with JWT token verification
    const userId = DEFAULT_USER_ID;

    // Step 2: Validate UUID parameter
    const validationResult = GetPlanByIdParamsSchema.safeParse(params);

    if (!validationResult.success) {
      const details = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        received: params.id
      }));

      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details
        } as ValidationErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { id: planId } = validationResult.data;

    // Step 3: Call service to fetch plan by ID
    const planService = new PlanService(locals.supabase);
    const plan = await planService.getPlanById(planId, userId);

    // Step 4: Handle not found case
    // Note: Same response whether plan doesn't exist or belongs to another user
    if (!plan) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'Plan not found'
        } as ErrorResponse),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 5: Return successful response
    return new Response(
      JSON.stringify({
        data: plan
      } as ItemResponse<PlanDTO>),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  } catch (error) {
    // Global error handler for unexpected errors
    console.error('Error in GET /api/v1/plans/:id:', {
      planId: params.id,
      error
    });
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      } as ErrorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

