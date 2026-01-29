/**
 * API Endpoints: /api/v1/milestones/:milestoneId/weekly-goals
 *
 * GET - Get all weekly goals for a specific milestone
 *
 * URL Parameters:
 * - milestoneId: UUID (required) - milestone ID
 *
 * Responses:
 * - 200: Success
 * - 400: Validation error (invalid UUID)
 * - 404: Milestone not found
 * - 500: Internal server error
 */

import type { APIRoute } from "astro";
import { MilestoneService } from "../../../../../lib/services/milestone.service";
import { uuidSchema } from "../../../../../lib/validation/milestone.validation";
import { z } from "zod";
import { GetUnauthorizedResponse } from "../../../../../lib/utils";
import type { ErrorResponse, ValidationErrorResponse, ListResponse, WeeklyGoalDTO } from "../../../../../types";

export const prerender = false;

/**
 * GET /api/v1/milestones/:milestoneId/weekly-goals
 * Get all weekly goals for a specific milestone
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Authentication
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // Step 2: Validate milestone ID
    const milestoneId = uuidSchema.parse(params.milestoneId);

    // Step 3: Get weekly goals from service
    const milestoneService = new MilestoneService(locals.supabase);
    const weeklyGoals = await milestoneService.getWeeklyGoalsByMilestoneId(milestoneId, userId);

    // Step 4: Return success response
    const response: ListResponse<WeeklyGoalDTO> = {
      data: weeklyGoals,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Zod validation error
    if (error instanceof z.ZodError) {
      const errorResponse: ValidationErrorResponse = {
        error: "Validation failed",
        details: error.errors.map((e) => ({
          field: "milestoneId",
          message: e.message,
          received: "input" in e ? e.input : undefined,
        })),
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Not found error
    if (error instanceof Error && error.message.includes("not found")) {
      const errorResponse: ErrorResponse = {
        error: "Not Found",
        message: error.message,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Other errors
    const errorResponse: ErrorResponse = {
      error: "Internal Server Error",
      message: "An unexpected error occurred",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
