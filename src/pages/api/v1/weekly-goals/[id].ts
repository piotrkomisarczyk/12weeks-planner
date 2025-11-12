/**
 * API Endpoints: /api/v1/weekly-goals/:id
 * 
 * GET - Get a single weekly goal by ID with subtasks
 * PATCH - Update a weekly goal (partial update)
 * DELETE - Delete a weekly goal (cascades to subtasks)
 * 
 * URL Parameters:
 * - id: UUID (required) - weekly goal ID
 * 
 * PATCH Request Body (all optional, at least one required):
 * - long_term_goal_id: UUID (nullable) - associated long-term goal
 * - title: string (1-255 characters)
 * - description: string (nullable)
 * - position: integer (>= 1)
 * 
 * Note: week_number is NOT editable
 * 
 * Responses:
 * - 200: Success
 * - 400: Validation error
 * - 404: Weekly goal not found, Plan not found, or Long-term goal not found
 * - 500: Internal server error
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { WeeklyGoalService } from '../../../../lib/services/weekly-goal.service';
import {
  WeeklyGoalIdParamsSchema,
  validateUpdateWeeklyGoalCommand
} from '../../../../lib/validation/weekly-goal.validation';
import { DEFAULT_USER_ID } from '../../../../db/supabase.client';
import type {
  ErrorResponse,
  ValidationErrorResponse,
  ItemResponse,
  WeeklyGoalDTO,
  WeeklyGoalWithSubtasksDTO
} from '../../../../types';

export const prerender = false;

/**
 * GET /api/v1/weekly-goals/:id
 * Get a single weekly goal by ID with its subtasks
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Authentication - Using default user for MVP
    // TODO: Implement real authentication with JWT token verification
    const userId = DEFAULT_USER_ID;

    // Step 2: Validate weekly goal ID from URL parameter
    let weeklyGoalId: string;
    try {
      const validatedParams = WeeklyGoalIdParamsSchema.parse(params);
      weeklyGoalId = validatedParams.id;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError: ValidationErrorResponse = {
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: 'id',
            message: err.message
          }))
        };
        return new Response(JSON.stringify(validationError), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw error;
    }

    // Step 3: Get Supabase client from context
    const supabase = locals.supabase;
    
    if (!supabase) {
      throw new Error('Supabase client not available in context');
    }

    // Step 4: Get weekly goal with subtasks via service
    const weeklyGoalService = new WeeklyGoalService(supabase);
    const weeklyGoal = await weeklyGoalService.getWeeklyGoalWithSubtasks(
      weeklyGoalId,
      userId
    );

    // Step 5: Handle not found
    if (!weeklyGoal) {
      const errorResponse: ErrorResponse = {
        error: 'Weekly goal not found',
        message: 'Weekly goal does not exist or does not belong to user'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Step 6: Return success response
    const response: ItemResponse<WeeklyGoalWithSubtasksDTO> = {
      data: weeklyGoal
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });

  } catch (error) {
    // Log error for debugging
    console.error('Error in GET /api/v1/weekly-goals/:id:', error);

    // Return generic error response
    const errorResponse: ErrorResponse = {
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * PATCH /api/v1/weekly-goals/:id
 * Updates an existing weekly goal (partial update)
 * 
 * Request body: UpdateWeeklyGoalCommand (all fields optional, at least one required)
 * Response: 200 OK with updated weekly goal
 * Errors:
 * - 400 Bad Request: Invalid data or UUID
 * - 404 Not Found: Weekly goal doesn't exist or doesn't belong to user
 * - 404 Not Found: Long-term goal doesn't exist (if updating long_term_goal_id)
 * - 500 Internal Server Error: Unexpected errors
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Authentication - Using default user for MVP
    // TODO: Implement real authentication with JWT token verification
    const userId = DEFAULT_USER_ID;

    // Step 2: Validate weekly goal ID from URL parameter
    let weeklyGoalId: string;
    try {
      const validatedParams = WeeklyGoalIdParamsSchema.parse(params);
      weeklyGoalId = validatedParams.id;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError: ValidationErrorResponse = {
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: 'id',
            message: err.message
          }))
        };
        return new Response(JSON.stringify(validationError), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw error;
    }

    // Step 3: Parse request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      const errorResponse: ErrorResponse = {
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Step 4: Validate update data
    let updateData;
    try {
      updateData = validateUpdateWeeklyGoalCommand(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError: ValidationErrorResponse = {
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.') || 'body',
            message: err.message,
            received: (err as any).input
          }))
        };
        return new Response(JSON.stringify(validationError), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Handle "at least one field" error
      if (error instanceof Error) {
        const validationError: ValidationErrorResponse = {
          error: 'Validation failed',
          details: [{
            field: 'body',
            message: error.message
          }]
        };
        return new Response(JSON.stringify(validationError), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      throw error;
    }

    // Step 5: Get Supabase client from context
    const supabase = locals.supabase;
    
    if (!supabase) {
      throw new Error('Supabase client not available in context');
    }

    // Step 6: Update weekly goal via service
    const weeklyGoalService = new WeeklyGoalService(supabase);
    
    try {
      const updatedWeeklyGoal = await weeklyGoalService.updateWeeklyGoal(
        weeklyGoalId,
        userId,
        updateData
      );

      // Step 7: Handle not found
      if (!updatedWeeklyGoal) {
        const errorResponse: ErrorResponse = {
          error: 'Weekly goal not found',
          message: 'Weekly goal does not exist or does not belong to user'
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Step 8: Return success response
      const response: ItemResponse<WeeklyGoalDTO> = {
        data: updatedWeeklyGoal
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    } catch (serviceError) {
      // Handle specific service errors
      const errorMessage = serviceError instanceof Error 
        ? serviceError.message 
        : 'Unknown error';
      
      // Long-term goal not found
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
      
      // Long-term goal doesn't belong to same plan
      if (errorMessage.includes('does not belong to the same plan')) {
        return new Response(
          JSON.stringify({
            error: 'Validation failed',
            message: 'Long-term goal does not belong to the same plan'
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
    // Log error for debugging
    console.error('Error in PATCH /api/v1/weekly-goals/:id:', error);

    // Return generic error response
    const errorResponse: ErrorResponse = {
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * DELETE /api/v1/weekly-goals/:id
 * Deletes a weekly goal and all related subtasks (CASCADE)
 * 
 * Response: 200 OK with success message
 * Errors:
 * - 400 Bad Request: Invalid UUID
 * - 404 Not Found: Weekly goal doesn't exist or doesn't belong to user
 * - 500 Internal Server Error: Unexpected errors
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Authentication - Using default user for MVP
    // TODO: Implement real authentication with JWT token verification
    const userId = DEFAULT_USER_ID;

    // Step 2: Validate weekly goal ID from URL parameter
    let weeklyGoalId: string;
    try {
      const validatedParams = WeeklyGoalIdParamsSchema.parse(params);
      weeklyGoalId = validatedParams.id;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError: ValidationErrorResponse = {
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: 'id',
            message: err.message
          }))
        };
        return new Response(JSON.stringify(validationError), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw error;
    }

    // Step 3: Get Supabase client from context
    const supabase = locals.supabase;
    
    if (!supabase) {
      throw new Error('Supabase client not available in context');
    }

    // Step 4: Delete weekly goal via service
    const weeklyGoalService = new WeeklyGoalService(supabase);
    const deleted = await weeklyGoalService.deleteWeeklyGoal(weeklyGoalId, userId);

    // Step 5: Handle not found
    if (!deleted) {
      const errorResponse: ErrorResponse = {
        error: 'Weekly goal not found',
        message: 'Weekly goal does not exist or does not belong to user'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Step 6: Return success response
    const response = {
      message: 'Weekly goal deleted successfully'
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });

  } catch (error) {
    // Log error for debugging
    console.error('Error in DELETE /api/v1/weekly-goals/:id:', error);

    // Return generic error response
    const errorResponse: ErrorResponse = {
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

