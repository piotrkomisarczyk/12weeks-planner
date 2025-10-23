/**
 * API Endpoint: GET /api/v1/plans
 * 
 * Retrieves a paginated list of plans belonging to the authenticated user.
 * Supports filtering by status and pagination via query parameters.
 * 
 * Query Parameters:
 * - status: 'active' | 'completed' | 'archived' (optional)
 * - limit: number (1-100, default: 50)
 * - offset: number (min: 0, default: 0)
 * 
 * Responses:
 * - 200: Success with paginated plan list
 * - 400: Validation error
 * - 401: Unauthorized (missing or invalid token)
 * - 500: Internal server error
 */

import type { APIRoute } from 'astro';
import { PlanService } from '../../../lib/services/plan.service';
import { GetPlansQuerySchema } from '../../../lib/validation/plan.validation';
import { DEFAULT_USER_ID } from '../../../db/supabase.client';
import type { ErrorResponse, ValidationErrorResponse } from '../../../types';

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    // Step 1: Authentication - Using default user for MVP
    // TODO: Implement real authentication with JWT token verification
    const userId = DEFAULT_USER_ID;

    // Step 2: Parse and validate query parameters
    const queryParams = {
      status: url.searchParams.get('status'),
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset')
    };

    const validationResult = GetPlansQuerySchema.safeParse(queryParams);

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

    // Step 3: Call service to fetch plans
    const planService = new PlanService(locals.supabase);
    const result = await planService.getPlans(userId, validationResult.data);

    // Step 4: Return successful response
    return new Response(
      JSON.stringify(result),
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
    console.error('Error in GET /api/v1/plans:', error);
    
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

