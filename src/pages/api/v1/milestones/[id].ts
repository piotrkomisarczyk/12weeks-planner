/**
 * API Endpoints: /api/v1/milestones/:id
 *
 * GET - Get a single milestone by ID
 * PATCH - Update a milestone (partial update)
 * DELETE - Delete a milestone
 *
 * URL Parameters:
 * - id: UUID (required) - milestone ID
 *
 * PATCH Request Body (all optional, at least one required):
 * - title: string (1-255 characters)
 * - description: string (nullable)
 * - due_date: string (YYYY-MM-DD format, nullable)
 * - is_completed: boolean
 * - position: integer (1-5)
 *
 * Responses:
 * - 200: Success
 * - 400: Validation error
 * - 404: Milestone not found
 * - 500: Internal server error
 */

import type { APIRoute } from "astro";
import { MilestoneService } from "../../../../lib/services/milestone.service";
import { uuidSchema, updateMilestoneSchema } from "../../../../lib/validation/milestone.validation";
import { z } from "zod";
import { GetUnauthorizedResponse } from "../../../../lib/utils";
import type {
  ErrorResponse,
  ValidationErrorResponse,
  ItemResponse,
  SuccessResponse,
  MilestoneDTO,
} from "../../../../types";

export const prerender = false;

/**
 * GET /api/v1/milestones/:id
 * Get a single milestone by ID
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Authentication
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // Step 2: Validate milestone ID
    const milestoneId = uuidSchema.parse(params.id);

    // Step 3: Get milestone from service
    const milestoneService = new MilestoneService(locals.supabase);
    const milestone = await milestoneService.getMilestoneById(milestoneId, userId);

    // Step 4: Return success response
    const response: ItemResponse<MilestoneDTO> = {
      data: milestone,
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
          field: "id",
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

/**
 * PATCH /api/v1/milestones/:id
 * Update a milestone (partial update)
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Authentication
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // Step 2: Validate milestone ID
    const milestoneId = uuidSchema.parse(params.id);

    // Step 3: Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ErrorResponse = {
        error: "Bad Request",
        message: "Invalid JSON in request body",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Validate request body
    const validatedData = updateMilestoneSchema.parse(body);

    // Step 5: Update milestone via service
    const milestoneService = new MilestoneService(locals.supabase);
    const milestone = await milestoneService.updateMilestone(milestoneId, validatedData, userId);

    // Step 6: Return success response
    const response: ItemResponse<MilestoneDTO> = {
      data: milestone,
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
          field: e.path.join(".") || "id",
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

/**
 * DELETE /api/v1/milestones/:id
 * Delete a milestone
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Authentication
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // Step 2: Validate milestone ID
    const milestoneId = uuidSchema.parse(params.id);

    // Step 3: Delete milestone via service
    const milestoneService = new MilestoneService(locals.supabase);
    await milestoneService.deleteMilestone(milestoneId, userId);

    // Step 4: Return success response
    const response: SuccessResponse = {
      message: "Milestone deleted successfully",
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
          field: "id",
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
