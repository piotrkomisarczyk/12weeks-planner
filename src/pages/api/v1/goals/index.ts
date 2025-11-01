/**
 * API Endpoints: /api/v1/goals
 * 
 * POST - Creates a new long-term goal
 * 
 * POST Request Body:
 * - plan_id: UUID (required)
 * - title: string (required, 1-255 characters)
 * - description: string (optional)
 * - category: enum (optional) - work, finance, hobby, relationships, health, development
 * - progress_percentage: integer (0-100, default: 0)
 * - position: integer (1-5, default: 1)
 * 
 * Responses:
 * - 201: Created
 * - 400: Validation error or constraint violation
 * - 404: Plan not found
 * - 500: Internal server error
 */

import type { APIRoute } from 'astro';
import { GoalService } from '../../../../lib/services/goal.service';
import { CreateGoalBodySchema } from '../../../../lib/validation/goal.validation';
import { DEFAULT_USER_ID } from '../../../../db/supabase.client';
import type { 
  ErrorResponse, 
  ValidationErrorResponse,
  ItemResponse,
  GoalDTO
} from '../../../../types';

export const prerender = false;

/**
 * POST /api/v1/goals
 * Creates a new long-term goal
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Step 1: Authentication - Using default user for MVP
    // TODO: Implement real authentication with JWT token verification
    const userId = DEFAULT_USER_ID;

    // Step 2: Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 3: Validate request body
    const validationResult = CreateGoalBodySchema.safeParse(body);

    if (!validationResult.success) {
      const details = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        received: 'input' in issue ? issue.input : undefined
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

    // Step 4: Call service to create goal
    const goalService = new GoalService(locals.supabase);
    
    try {
      const goal = await goalService.createGoal(userId, validationResult.data);

      // Step 5: Return successful response
      return new Response(
        JSON.stringify({ data: goal } as ItemResponse<GoalDTO>),
        {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff'
          }
        }
      );
    } catch (serviceError) {
      // Handle specific service errors
      const errorMessage = serviceError instanceof Error 
        ? serviceError.message 
        : 'Unknown error';
      
      // Plan not found or doesn't belong to user
      if (errorMessage.includes('not found') || errorMessage.includes('does not belong')) {
        return new Response(
          JSON.stringify({
            error: 'Plan not found',
            message: 'Plan does not exist or does not belong to user'
          } as ErrorResponse),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Maximum 5 goals exceeded
      if (errorMessage.includes('Maximum 5 goals')) {
        return new Response(
          JSON.stringify({
            error: 'Constraint violation',
            message: errorMessage
          } as ErrorResponse),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Re-throw for general error handler
      throw serviceError;
    }
  } catch (error) {
    // Global error handler for unexpected errors
    console.error('Error in POST /api/v1/goals:', error);
    
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
