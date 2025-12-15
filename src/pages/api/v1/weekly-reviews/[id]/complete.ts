/**
 * API Endpoint: /api/v1/weekly-reviews/:id/complete
 * 
 * POST - Marks a weekly review as complete
 * 
 * URL Parameters:
 * - id: UUID (required) - weekly review ID
 * 
 * Request Body: None
 * 
 * Response:
 * - 200: Success with confirmation message
 * - 400: Validation error (invalid UUID)
 * - 404: Weekly review not found
 * - 500: Internal server error
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { WeeklyReviewService } from '../../../../../lib/services/weekly-review.service';
import { WeeklyReviewIdParamsSchema } from '../../../../../lib/validation/weekly-review.validation';
import { DEFAULT_USER_ID } from '../../../../../db/supabase.client';
import type { 
  ErrorResponse, 
  ValidationErrorResponse, 
  SuccessResponse 
} from '../../../../../types';

export const prerender = false;

/**
 * POST /api/v1/weekly-reviews/:id/complete
 * Marks a weekly review as completed
 * 
 * No request body required
 * Updates is_completed flag to true
 * 
 * Response: 200 OK with success message
 * Errors:
 * - 400 Bad Request: Invalid UUID
 * - 404 Not Found: Weekly review doesn't exist or doesn't belong to user
 * - 500 Internal Server Error: Unexpected errors
 */
export const POST: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Authentication - Using default user for MVP
    // TODO: Implement real authentication with JWT token verification
    const userId = DEFAULT_USER_ID;

    // Step 2: Validate weekly review ID from URL parameter
    let weeklyReviewId: string;
    try {
      const validatedParams = WeeklyReviewIdParamsSchema.parse(params);
      weeklyReviewId = validatedParams.id;
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

    // Step 4: Mark weekly review as complete via service
    const weeklyReviewService = new WeeklyReviewService(supabase);
    const success = await weeklyReviewService.markAsComplete(weeklyReviewId, userId);

    // Step 5: Handle not found
    if (!success) {
      const errorResponse: ErrorResponse = {
        error: 'Weekly review not found',
        message: 'Weekly review does not exist or does not belong to user'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Step 6: Return success response
    const response: SuccessResponse = {
      data: {
        id: weeklyReviewId,
        is_completed: true
      },
      message: 'Weekly review marked as complete'
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
    console.error('Error in POST /api/v1/weekly-reviews/:id/complete:', error);

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

