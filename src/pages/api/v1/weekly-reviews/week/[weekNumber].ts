/**
 * API Endpoint: /api/v1/weekly-reviews/week/:weekNumber
 * 
 * GET - Get a weekly review for a specific week in a plan
 * 
 * URL Parameters:
 * - weekNumber: integer (required, 1-12) - week number
 * 
 * Query Parameters:
 * - plan_id: UUID (required) - plan ID
 * 
 * Response:
 * - 200: Success with weekly review
 * - 400: Validation error
 * - 404: Weekly review not found for this week or plan not found
 * - 500: Internal server error
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { WeeklyReviewService } from '../../../../../lib/services/weekly-review.service';
import {
  WeeklyReviewByWeekParamsSchema,
  WeeklyReviewByWeekQuerySchema
} from '../../../../../lib/validation/weekly-review.validation';
import { GetUnauthorizedResponse } from '../../../../../lib/utils';
import type {
  ErrorResponse,
  ValidationErrorResponse,
  ItemResponse,
  WeeklyReviewDTO
} from '../../../../../types';

export const prerender = false;

/**
 * GET /api/v1/weekly-reviews/week/:weekNumber
 * Get a weekly review for a specific week in a plan
 * 
 * Query parameters:
 * - plan_id: UUID (required)
 * 
 * URL parameters:
 * - weekNumber: integer 1-12 (required)
 * 
 * Response: 200 OK with weekly review
 * Errors:
 * - 400 Bad Request: Invalid week number or plan_id
 * - 404 Not Found: Plan doesn't exist or weekly review doesn't exist for this week
 * - 500 Internal Server Error: Unexpected errors
 */
export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Authentication
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // Step 2: Validate weekNumber from URL parameter
    let weekNumber: number;
    try {
      const validatedParams = WeeklyReviewByWeekParamsSchema.parse(params);
      weekNumber = validatedParams.weekNumber;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError: ValidationErrorResponse = {
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: 'weekNumber',
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

    // Step 3: Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      plan_id: url.searchParams.get('plan_id')
    };

    let planId: string;
    try {
      const validatedQuery = WeeklyReviewByWeekQuerySchema.parse(queryParams);
      planId = validatedQuery.plan_id;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError: ValidationErrorResponse = {
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            received: 'input' in err ? (err as any).input : undefined
          }))
        };
        return new Response(JSON.stringify(validationError), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw error;
    }

    // Step 4: Get Supabase client from context
    const supabase = locals.supabase;
    
    if (!supabase) {
      throw new Error('Supabase client not available in context');
    }

    // Step 5: Get weekly review by week via service
    const weeklyReviewService = new WeeklyReviewService(supabase);
    
    try {
      const weeklyReview = await weeklyReviewService.getWeeklyReviewByWeek(
        planId,
        weekNumber,
        userId
      );

      // Step 6: Handle not found
      if (!weeklyReview) {
        const errorResponse: ErrorResponse = {
          error: 'Weekly review not found',
          message: 'Weekly review does not exist for this week'
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Step 7: Return success response
      const response: ItemResponse<WeeklyReviewDTO> = {
        data: weeklyReview
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
    // Log error for debugging
    console.error('Error in GET /api/v1/weekly-reviews/week/:weekNumber:', error);

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

