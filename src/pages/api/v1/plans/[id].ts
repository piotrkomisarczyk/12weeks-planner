/**
 * API Endpoint: /api/v1/plans/:id
 *
 * GET - Retrieves a single plan by ID
 * PATCH - Updates a plan's name and/or status
 * DELETE - Permanently deletes a plan (hard delete)
 *
 * Authentication required for all methods.
 */

import type { APIRoute } from "astro";
import { PlanService } from "../../../../lib/services/plan.service";
import { PlanIdParamsSchema, UpdatePlanBodySchema } from "../../../../lib/validation/plan.validation";
import { GetUnauthorizedResponse } from "../../../../lib/utils";
import type { ErrorResponse, ValidationErrorResponse, ItemResponse, SuccessResponse, PlanDTO } from "../../../../types";

export const prerender = false;

/**
 * GET /api/v1/plans/:id
 * Retrieves a single plan by ID
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

    // Step 3: Call service to fetch plan
    const planService = new PlanService(locals.supabase);
    const plan = await planService.getPlanById(paramValidation.data.id, userId);

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

    // Step 5: Return successful response
    return new Response(JSON.stringify({ data: plan } as ItemResponse<PlanDTO>), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {

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
 * PATCH /api/v1/plans/:id
 * Updates a plan's name and/or status
 */
export const PATCH: APIRoute = async ({ locals, params, request }) => {
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

    // Step 3: Parse request body
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

    // Step 4: Validate request body
    const bodyValidation = UpdatePlanBodySchema.safeParse(body);

    if (!bodyValidation.success) {
      const details = bodyValidation.error.issues.map((issue) => ({
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

    // Step 5: Call service to update plan
    const planService = new PlanService(locals.supabase);
    const plan = await planService.updatePlan(paramValidation.data.id, userId, bodyValidation.data);

    // Step 6: Handle not found
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

    // Step 7: Return successful response
    return new Response(JSON.stringify({ data: plan } as ItemResponse<PlanDTO>), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {

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
 * DELETE /api/v1/plans/:id
 * Permanently deletes a plan (hard delete)
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
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

    // Step 3: Call service to delete plan
    const planService = new PlanService(locals.supabase);
    const success = await planService.deletePlan(paramValidation.data.id, userId);

    // Step 4: Handle not found
    if (!success) {
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
    return new Response(
      JSON.stringify({
        message: "Plan deleted successfully",
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
