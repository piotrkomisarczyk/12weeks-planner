/**
 * API Endpoints: /api/v1/goals/:goalId/milestones
 *
 * GET - Get all milestones for a specific goal
 *
 * URL Parameters:
 * - goalId: UUID (required) - goal ID
 *
 * Responses:
 * - 200: Success
 * - 400: Validation error (invalid UUID)
 * - 404: Goal not found
 * - 500: Internal server error
 */

import type { APIRoute } from "astro";
import { MilestoneService } from "../../../../../lib/services/milestone.service";
import { uuidSchema } from "../../../../../lib/validation/milestone.validation";
import { z } from "zod";
import { GetUnauthorizedResponse } from "../../../../../lib/utils";
import type { ErrorResponse, ValidationErrorResponse, ListResponse, MilestoneDTO } from "../../../../../types";

export const prerender = false;

/**
 * GET /api/v1/goals/:goalId/milestones
 * Get all milestones for a specific goal
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Authentication
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // Step 2: Validate goal ID
    const goalId = uuidSchema.parse(params.goalId);

    // Step 3: Get milestones from service
    const milestoneService = new MilestoneService(locals.supabase);
    const milestones = await milestoneService.getMilestonesByGoalId(goalId, userId);

    // Step 4: Return success response
    const response: ListResponse<MilestoneDTO> = {
      data: milestones,
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
          field: "goalId",
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
    console.error("Error in GET /api/v1/goals/:goalId/milestones:", error);
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
