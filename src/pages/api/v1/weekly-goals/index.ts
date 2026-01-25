/**
 * API Endpoints: /api/v1/weekly-goals
 * 
 * GET - Lists weekly goals with filters (plan_id, week_number, long_term_goal_id, milestone_id)
 * POST - Creates a new weekly goal
 * 
 * GET Query Parameters:
 * - plan_id: UUID (required)
 * - week_number: integer (optional, 1-12)
 * - long_term_goal_id: UUID (optional)
 * - milestone_id: UUID (optional)
 * - limit: integer (optional, 1-100, default: 50)
 * - offset: integer (optional, >= 0, default: 0)
 * 
 * POST Request Body:
 * - plan_id: UUID (required)
 * - long_term_goal_id: UUID (optional, nullable)
 * - milestone_id: UUID (optional, nullable)
 * - week_number: integer (required, 1-12)
 * - title: string (required, 1-255 characters)
 * - description: string (optional, nullable)
 * - position: integer (optional, >= 1, default: 1)
 * 
 * Responses:
 * - 200: OK (GET)
 * - 201: Created (POST)
 * - 400: Validation error, Milestone-Plan mismatch
 * - 404: Plan not found, Long-term goal not found, or Milestone not found
 * - 500: Internal server error
 */

import type { APIRoute } from 'astro';
import { WeeklyGoalService } from '../../../../lib/services/weekly-goal.service';
import { 
  WeeklyGoalListQuerySchema,
  CreateWeeklyGoalBodySchema 
} from '../../../../lib/validation/weekly-goal.validation';
import { GetUnauthorizedResponse } from '../../../../lib/utils';
import type { 
  ErrorResponse,
  ValidationErrorResponse,
  ListResponse,
  ItemResponse,
  WeeklyGoalDTO
} from '../../../../types';

export const prerender = false;

/**
 * GET /api/v1/weekly-goals
 * Lists weekly goals with filters
 */
export const GET: APIRoute = async ({ locals, request }) => {
  try {
    // Step 1: Authentication
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // Step 2: Parse query parameters
    const url = new URL(request.url);
    const queryParams = {
      plan_id: url.searchParams.get('plan_id'),
      week_number: url.searchParams.get('week_number'),
      long_term_goal_id: url.searchParams.get('long_term_goal_id'),
      milestone_id: url.searchParams.get('milestone_id'),
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset')
    };

    // Step 3: Validate query parameters
    const validationResult = WeeklyGoalListQuerySchema.safeParse(queryParams);

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

    // Step 4: Call service to list weekly goals
    const weeklyGoalService = new WeeklyGoalService(locals.supabase);
    
    try {
      const weeklyGoals = await weeklyGoalService.listWeeklyGoals(
        validationResult.data,
        userId
      );

      // Step 5: Return successful response
      return new Response(
        JSON.stringify({ 
          data: weeklyGoals,
          count: weeklyGoals.length
        } as ListResponse<WeeklyGoalDTO>),
        {
          status: 200,
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
      
      // Re-throw for general error handler
      throw serviceError;
    }
  } catch (error) {
    // Global error handler for unexpected errors
    console.error('Error in GET /api/v1/weekly-goals:', error);
    
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
 * POST /api/v1/weekly-goals
 * Creates a new weekly goal
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Step 1: Authentication
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

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
    const validationResult = CreateWeeklyGoalBodySchema.safeParse(body);

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

    // Step 4: Call service to create weekly goal
    const weeklyGoalService = new WeeklyGoalService(locals.supabase);
    
    try {
      const weeklyGoal = await weeklyGoalService.createWeeklyGoal(
        userId,
        validationResult.data
      );

      // Step 5: Return successful response
      return new Response(
        JSON.stringify({ data: weeklyGoal } as ItemResponse<WeeklyGoalDTO>),
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
      if (errorMessage.includes('Plan not found')) {
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
      
      // Long-term goal not found or doesn't belong to user
      if (errorMessage.includes('Long-term goal not found')) {
        return new Response(
          JSON.stringify({
            error: 'Long-term goal not found',
            message: 'Long-term goal does not exist or does not belong to user'
          } as ErrorResponse),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Long-term goal doesn't belong to plan
      if (errorMessage.includes('does not belong to the specified plan')) {
        return new Response(
          JSON.stringify({
            error: 'Validation failed',
            message: 'Long-term goal does not belong to the specified plan'
          } as ErrorResponse),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Milestone not found
      if (errorMessage.includes('Milestone not found')) {
        return new Response(
          JSON.stringify({
            error: 'Milestone not found',
            message: 'Milestone does not exist or does not belong to user\'s plan'
          } as ErrorResponse),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Milestone doesn't belong to a goal in the plan
      if (errorMessage.includes('does not belong to a goal')) {
        return new Response(
          JSON.stringify({
            error: 'Validation failed',
            message: 'Milestone does not belong to a goal in the specified plan'
          } as ErrorResponse),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Maximum weekly goals per week exceeded
      if (errorMessage.includes('Cannot add more than 3 weekly goals')) {
        return new Response(
          JSON.stringify({
            error: 'Validation failed',
            message: 'Cannot add more than 3 weekly goals per week'
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
    console.error('Error in POST /api/v1/weekly-goals:', error);
    
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

