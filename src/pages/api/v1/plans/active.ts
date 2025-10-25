/**
 * API Endpoint: GET /api/v1/plans/active
 * 
 * Returns the currently active plan for the authenticated user.
 * A user can have only one active plan at a time (status='active').
 * 
 * Responses:
 * - 200: Success with active plan data
 * - 401: Unauthorized (missing or invalid token)
 * - 404: No active plan found
 * - 500: Internal server error
 */

import type { APIRoute } from 'astro';
import { PlanService } from '../../../../lib/services/plan.service';
import { DEFAULT_USER_ID } from '../../../../db/supabase.client';
import type { ErrorResponse, ItemResponse, PlanDTO } from '../../../../types';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Step 1: Authentication - Using default user for MVP
    // TODO: Implement real authentication with JWT token verification
    const userId = DEFAULT_USER_ID;

    // Step 2: No validation needed (no parameters)

    // Step 3: Call service to fetch active plan
    const planService = new PlanService(locals.supabase);
    const activePlan = await planService.getActivePlan(userId);

    // Step 4: Handle not found case
    if (!activePlan) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'No active plan found'
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
        data: activePlan
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
    console.error('Error in GET /api/v1/plans/active:', error);
    
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

