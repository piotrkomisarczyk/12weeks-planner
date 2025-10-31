/**
 * API Endpoints: /api/v1/plans
 * 
 * GET - Retrieves a paginated list of plans belonging to the authenticated user
 * POST - Creates a new 12-week planner
 * 
 * GET Query Parameters:
 * - status: 'ready' | 'active' | 'completed' | 'archived' (optional)
 * - limit: number (1-100, default: 50)
 * - offset: number (min: 0, default: 0)
 * 
 * POST Request Body:
 * - name: string (required, 1-255 characters)
 * - start_date: string (required, YYYY-MM-DD format, must be Monday)
 * 
 * Responses:
 * - 200: Success (GET)
 * - 201: Created (POST)
 * - 400: Validation error or constraint violation
 * - 401: Unauthorized (missing or invalid token)
 * - 500: Internal server error
 */

import type { APIRoute } from 'astro';
import { PlanService } from '../../../lib/services/plan.service';
import { 
  GetPlansQuerySchema,
  CreatePlanBodySchema 
} from '../../../lib/validation/plan.validation';
import { DEFAULT_USER_ID } from '../../../db/supabase.client';
import type { 
  ErrorResponse, 
  ValidationErrorResponse,
  ItemResponse,
  PlanDTO
} from '../../../types';

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

/**
 * POST /api/v1/plans
 * Creates a new 12-week planner
 * 
 * Request Body:
 * - name: string (required, 1-255 characters)
 * - start_date: string (required, YYYY-MM-DD format, must be Monday)
 * 
 * Responses:
 * - 201: Created with plan data
 * - 400: Validation error or constraint violation
 * - 401: Unauthorized (missing or invalid token)
 * - 500: Internal server error
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
    const validationResult = CreatePlanBodySchema.safeParse(body);

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

    // Step 4: Call service to create plan
    const planService = new PlanService(locals.supabase);
    
    try {
      const plan = await planService.createPlan(userId, validationResult.data);

      // Step 5: Return successful response
      return new Response(
        JSON.stringify({ data: plan } as ItemResponse<PlanDTO>),
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
      const errorMessage = serviceError instanceof Error ? serviceError.message : 'Unknown error';
      
      // Check for constraint violations (e.g., start_date not Monday)
      if (errorMessage.includes('Monday')) {
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
    console.error('Error in POST /api/v1/plans:', error);
    
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

