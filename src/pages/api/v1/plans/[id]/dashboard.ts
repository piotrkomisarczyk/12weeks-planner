/**
 * API Endpoint: /api/v1/plans/:id/dashboard
 *
 * GET - Retrieves aggregated dashboard data for a plan
 * Returns flat structure with plan, goals, milestones, weekly goals, tasks, and metrics
 * Always returns ALL data (all weeks, all statuses) - filtering is done on the client side
 *
 * Authentication required.
 */

import type { APIRoute } from "astro";
import { PlanService } from "../../../../../lib/services/plan.service";
import { PlanIdParamsSchema } from "../../../../../lib/validation/plan.validation";
import { GetUnauthorizedResponse } from "../../../../../lib/utils";
import type { ErrorResponse, ValidationErrorResponse } from "../../../../../types";

export const prerender = false;

/**
 * GET /api/v1/plans/:id/dashboard
 * Retrieves aggregated dashboard data for a plan
 * No query parameters - always returns all data
 */
export const GET: APIRoute = async ({ locals, params }) => {
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

    // Step 3: Call service to fetch dashboard data (all data, no filtering)
    const planService = new PlanService(locals.supabase);
    const dashboardData = await planService.getDashboardData(paramValidation.data.id, userId);

    // Step 4: Handle not found
    if (!dashboardData) {
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

    // Step 5: Return successful response
    return new Response(JSON.stringify({ data: dashboardData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=10",
      },
    });
  } catch {
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
