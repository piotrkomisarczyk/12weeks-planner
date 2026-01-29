/**
 * API Endpoint: POST /api/v1/plans/:id/archive
 *
 * Archives a plan (sets status to 'archived').
 * This is a soft delete - all related data remains in the database.
 *
 * Authentication required.
 */

import type { APIRoute } from "astro";
import { PlanService } from "../../../../../lib/services/plan.service";
import { PlanIdParamsSchema } from "../../../../../lib/validation/plan.validation";
import { GetUnauthorizedResponse } from "../../../../../lib/utils";
import type { ErrorResponse, ValidationErrorResponse, SuccessResponse } from "../../../../../types";

export const prerender = false;

/**
 * POST /api/v1/plans/:id/archive
 * Archives a plan
 */
export const POST: APIRoute = async ({ locals, params }) => {
  try {
    // Step 1: Authentication
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // Step 2: Validate URL parameter
    const paramValidation = PlanIdParamsSchema.safeParse(params);

    if (!paramValidation.success) {
      const details = paramValidation.error.issues.map((issue) => ({
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

    // Step 3: Call service to archive plan
    const planService = new PlanService(locals.supabase);
    const plan = await planService.archivePlan(paramValidation.data.id, userId);

    // Step 4: Handle not found
    if (!plan) {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Plan not found",
        } as ErrorResponse),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 5: Return successful response with minimal data
    return new Response(
      JSON.stringify({
        data: {
          id: plan.id,
          status: plan.status,
        },
        message: "Plan archived successfully",
      } as SuccessResponse),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error) {
    console.error("Error in POST /api/v1/plans/:id/archive:", error);

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
