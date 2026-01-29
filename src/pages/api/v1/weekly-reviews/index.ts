/**
 * API Endpoints: /api/v1/weekly-reviews
 *
 * GET - Lists weekly reviews with filters (plan_id, week_number, is_completed)
 * POST - Creates a new weekly review
 *
 * GET Query Parameters:
 * - plan_id: UUID (required)
 * - week_number: integer (optional, 1-12)
 * - is_completed: boolean (optional)
 * - limit: integer (optional, 1-100, default: 50)
 * - offset: integer (optional, >= 0, default: 0)
 *
 * POST Request Body:
 * - plan_id: UUID (required)
 * - week_number: integer (required, 1-12)
 * - what_worked: string (optional, nullable - auto-save support)
 * - what_did_not_work: string (optional, nullable - auto-save support)
 * - what_to_improve: string (optional, nullable - auto-save support)
 *
 * Responses:
 * - 200: OK (GET)
 * - 201: Created (POST)
 * - 400: Validation error
 * - 404: Plan not found
 * - 409: Conflict (duplicate week_number for plan)
 * - 500: Internal server error
 */

import type { APIRoute } from "astro";
import { WeeklyReviewService } from "../../../../lib/services/weekly-review.service";
import {
  WeeklyReviewListQuerySchema,
  CreateWeeklyReviewBodySchema,
} from "../../../../lib/validation/weekly-review.validation";
import { GetUnauthorizedResponse } from "../../../../lib/utils";
import type {
  ErrorResponse,
  ValidationErrorResponse,
  ListResponse,
  ItemResponse,
  WeeklyReviewDTO,
} from "../../../../types";

export const prerender = false;

/**
 * GET /api/v1/weekly-reviews
 * Lists weekly reviews with filters
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
      plan_id: url.searchParams.get("plan_id"),
      week_number: url.searchParams.get("week_number"),
      is_completed: url.searchParams.get("is_completed"),
      limit: url.searchParams.get("limit"),
      offset: url.searchParams.get("offset"),
    };

    // Step 3: Validate query parameters
    const validationResult = WeeklyReviewListQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const details = validationResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
        received: "input" in issue ? issue.input : undefined,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details,
        } as ValidationErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Call service to list weekly reviews
    const weeklyReviewService = new WeeklyReviewService(locals.supabase);

    try {
      const weeklyReviews = await weeklyReviewService.listWeeklyReviews(validationResult.data, userId);

      // Step 5: Return successful response
      return new Response(
        JSON.stringify({
          data: weeklyReviews,
          count: weeklyReviews.length,
        } as ListResponse<WeeklyReviewDTO>),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Content-Type-Options": "nosniff",
          },
        }
      );
    } catch (serviceError) {
      // Handle specific service errors
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";

      // Plan not found or doesn't belong to user
      if (errorMessage.includes("not found") || errorMessage.includes("does not belong")) {
        return new Response(
          JSON.stringify({
            error: "Plan not found",
            message: "Plan does not exist or does not belong to user",
          } as ErrorResponse),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Re-throw for general error handler
      throw serviceError;
    }
  } catch (error) {
    // Global error handler for unexpected errors
    console.error("Error in GET /api/v1/weekly-reviews:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred",
      } as ErrorResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * POST /api/v1/weekly-reviews
 * Creates a new weekly review
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
          error: "Invalid JSON",
          message: "Request body must be valid JSON",
        } as ErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Validate request body
    const validationResult = CreateWeeklyReviewBodySchema.safeParse(body);

    if (!validationResult.success) {
      const details = validationResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
        received: "input" in issue ? issue.input : undefined,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details,
        } as ValidationErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Call service to create weekly review
    const weeklyReviewService = new WeeklyReviewService(locals.supabase);

    try {
      const weeklyReview = await weeklyReviewService.createWeeklyReview(userId, validationResult.data);

      // Step 5: Return successful response
      return new Response(JSON.stringify({ data: weeklyReview } as ItemResponse<WeeklyReviewDTO>), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (serviceError) {
      // Handle specific service errors
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";

      // Plan not found or doesn't belong to user
      if (errorMessage.includes("Plan not found")) {
        return new Response(
          JSON.stringify({
            error: "Plan not found",
            message: "Plan does not exist or does not belong to user",
          } as ErrorResponse),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Conflict - weekly review already exists for this week
      if (errorMessage.includes("already exists")) {
        return new Response(
          JSON.stringify({
            error: "Conflict",
            message: "Weekly review already exists for this week",
          } as ErrorResponse),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Re-throw for general error handler
      throw serviceError;
    }
  } catch (error) {
    // Global error handler for unexpected errors
    console.error("Error in POST /api/v1/weekly-reviews:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred",
      } as ErrorResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
