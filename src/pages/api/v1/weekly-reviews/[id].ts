/**
 * API Endpoints: /api/v1/weekly-reviews/:id
 *
 * GET - Get a single weekly review by ID
 * PATCH - Update a weekly review (partial update with auto-save support)
 * DELETE - Delete a weekly review
 *
 * URL Parameters:
 * - id: UUID (required) - weekly review ID
 *
 * PATCH Request Body (all optional, at least one required):
 * - what_worked: string (nullable)
 * - what_did_not_work: string (nullable)
 * - what_to_improve: string (nullable)
 * - is_completed: boolean
 *
 * Note: plan_id and week_number are NOT editable
 *
 * Responses:
 * - 200: Success
 * - 400: Validation error
 * - 404: Weekly review not found
 * - 500: Internal server error
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { WeeklyReviewService } from "../../../../lib/services/weekly-review.service";
import {
  WeeklyReviewIdParamsSchema,
  validateUpdateWeeklyReviewCommand,
} from "../../../../lib/validation/weekly-review.validation";
import { GetUnauthorizedResponse } from "../../../../lib/utils";
import type { ErrorResponse, ValidationErrorResponse, ItemResponse, WeeklyReviewDTO } from "../../../../types";

export const prerender = false;

/**
 * GET /api/v1/weekly-reviews/:id
 * Get a single weekly review by ID
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Authentication
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // Step 2: Validate weekly review ID from URL parameter
    let weeklyReviewId: string;
    try {
      const validatedParams = WeeklyReviewIdParamsSchema.parse(params);
      weeklyReviewId = validatedParams.id;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError: ValidationErrorResponse = {
          error: "Validation failed",
          details: error.errors.map((err) => ({
            field: "id",
            message: err.message,
          })),
        };
        return new Response(JSON.stringify(validationError), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }

    // Step 3: Get Supabase client from context
    const supabase = locals.supabase;

    if (!supabase) {
      throw new Error("Supabase client not available in context");
    }

    // Step 4: Get weekly review via service
    const weeklyReviewService = new WeeklyReviewService(supabase);
    const weeklyReview = await weeklyReviewService.getWeeklyReviewById(weeklyReviewId, userId);

    // Step 5: Handle not found
    if (!weeklyReview) {
      const errorResponse: ErrorResponse = {
        error: "Weekly review not found",
        message: "Weekly review does not exist or does not belong to user",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 6: Return success response
    const response: ItemResponse<WeeklyReviewDTO> = {
      data: weeklyReview,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    // Log error for debugging

    // Return generic error response
    const errorResponse: ErrorResponse = {
      error: "Internal server error",
      message: "An unexpected error occurred",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PATCH /api/v1/weekly-reviews/:id
 * Updates an existing weekly review (partial update with auto-save support)
 *
 * Request body: UpdateWeeklyReviewCommand (all fields optional, at least one required)
 * Response: 200 OK with updated weekly review
 * Errors:
 * - 400 Bad Request: Invalid data or UUID
 * - 404 Not Found: Weekly review doesn't exist or doesn't belong to user
 * - 500 Internal Server Error: Unexpected errors
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Authentication
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // Step 2: Validate weekly review ID from URL parameter
    let weeklyReviewId: string;
    try {
      const validatedParams = WeeklyReviewIdParamsSchema.parse(params);
      weeklyReviewId = validatedParams.id;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError: ValidationErrorResponse = {
          error: "Validation failed",
          details: error.errors.map((err) => ({
            field: "id",
            message: err.message,
          })),
        };
        return new Response(JSON.stringify(validationError), {
          status: 400,
          headers: { "Content-Type": "application/json" },
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
        error: "Invalid JSON",
        message: "Request body must be valid JSON",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Validate update data
    let updateData;
    try {
      updateData = validateUpdateWeeklyReviewCommand(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError: ValidationErrorResponse = {
          error: "Validation failed",
          details: error.errors.map((err) => ({
            field: err.path.join(".") || "body",
            message: err.message,
            received: "input" in err ? (err as { input: unknown }).input : undefined,
          })),
        };
        return new Response(JSON.stringify(validationError), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle "at least one field" error
      if (error instanceof Error) {
        const validationError: ValidationErrorResponse = {
          error: "Validation failed",
          details: [
            {
              field: "body",
              message: error.message,
            },
          ],
        };
        return new Response(JSON.stringify(validationError), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw error;
    }

    // Step 5: Get Supabase client from context
    const supabase = locals.supabase;

    if (!supabase) {
      throw new Error("Supabase client not available in context");
    }

    // Step 6: Update weekly review via service
    const weeklyReviewService = new WeeklyReviewService(supabase);
    const updatedWeeklyReview = await weeklyReviewService.updateWeeklyReview(weeklyReviewId, userId, updateData);

    // Step 7: Handle not found
    if (!updatedWeeklyReview) {
      const errorResponse: ErrorResponse = {
        error: "Weekly review not found",
        message: "Weekly review does not exist or does not belong to user",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 8: Return success response
    const response: ItemResponse<WeeklyReviewDTO> = {
      data: updatedWeeklyReview,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    // Log error for debugging

    // Return generic error response
    const errorResponse: ErrorResponse = {
      error: "Internal server error",
      message: "An unexpected error occurred",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/v1/weekly-reviews/:id
 * Deletes a weekly review
 *
 * Response: 200 OK with success message
 * Errors:
 * - 400 Bad Request: Invalid UUID
 * - 404 Not Found: Weekly review doesn't exist or doesn't belong to user
 * - 500 Internal Server Error: Unexpected errors
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Authentication
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // Step 2: Validate weekly review ID from URL parameter
    let weeklyReviewId: string;
    try {
      const validatedParams = WeeklyReviewIdParamsSchema.parse(params);
      weeklyReviewId = validatedParams.id;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError: ValidationErrorResponse = {
          error: "Validation failed",
          details: error.errors.map((err) => ({
            field: "id",
            message: err.message,
          })),
        };
        return new Response(JSON.stringify(validationError), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }

    // Step 3: Get Supabase client from context
    const supabase = locals.supabase;

    if (!supabase) {
      throw new Error("Supabase client not available in context");
    }

    // Step 4: Delete weekly review via service
    const weeklyReviewService = new WeeklyReviewService(supabase);
    const deleted = await weeklyReviewService.deleteWeeklyReview(weeklyReviewId, userId);

    // Step 5: Handle not found
    if (!deleted) {
      const errorResponse: ErrorResponse = {
        error: "Weekly review not found",
        message: "Weekly review does not exist or does not belong to user",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 6: Return success response
    const response = {
      message: "Weekly review deleted successfully",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    // Log error for debugging

    // Return generic error response
    const errorResponse: ErrorResponse = {
      error: "Internal server error",
      message: "An unexpected error occurred",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
