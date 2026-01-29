/**
 * API Endpoints for individual goal operations
 *
 * GET /api/v1/goals/:id - Retrieve a specific goal with its milestones
 * PATCH /api/v1/goals/:id - Update an existing long-term goal
 * DELETE /api/v1/goals/:id - Delete a long-term goal
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { GoalService } from "../../../../lib/services/goal.service";
import { GoalIdParamsSchema, validateUpdateGoalCommand } from "../../../../lib/validation/goal.validation";
import { GetUnauthorizedResponse } from "../../../../lib/utils";
import type {
  ErrorResponse,
  GoalDTO,
  GoalWithMilestonesDTO,
  ItemResponse,
  ValidationErrorResponse,
} from "../../../../types";

export const prerender = false;

/**
 * GET /api/v1/goals/:id
 * Retrieves a specific goal with its milestones
 *
 * Response: 200 OK with goal and milestones
 * Errors:
 * - 400 Bad Request: Invalid UUID
 * - 404 Not Found: Goal doesn't exist or doesn't belong to user
 * - 500 Internal Server Error: Unexpected errors
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Authentication
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // 2. Validate goal ID from URL parameter
    let goalId: string;
    try {
      const validatedParams = GoalIdParamsSchema.parse(params);
      goalId = validatedParams.id;
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

    // 3. Get Supabase client from context
    const supabase = locals.supabase;

    if (!supabase) {
      throw new Error("Supabase client not available in context");
    }

    // 4. Get goal with milestones via service
    const goalService = new GoalService(supabase);
    const goal = await goalService.getGoalWithMilestones(goalId, userId);

    // 5. Handle not found
    if (!goal) {
      const errorResponse: ErrorResponse = {
        error: "Not found",
        message: "Goal not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 6. Return success response
    const response: ItemResponse<GoalWithMilestonesDTO> = {
      data: goal,
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
 * PATCH /api/v1/goals/:id
 * Updates an existing long-term goal (partial update)
 *
 * Request body: UpdateGoalCommand (all fields optional, at least one required)
 * Response: 200 OK with updated goal
 * Errors:
 * - 400 Bad Request: Invalid data or UUID
 * - 404 Not Found: Goal doesn't exist or doesn't belong to user
 * - 500 Internal Server Error: Unexpected errors
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Authentication
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // 2. Validate goal ID from URL parameter
    let goalId: string;
    try {
      const validatedParams = GoalIdParamsSchema.parse(params);
      goalId = validatedParams.id;
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

    // 3. Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      const errorResponse: ErrorResponse = {
        error: "Invalid JSON in request body",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Validate update data
    let updateData;
    try {
      updateData = validateUpdateGoalCommand(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError: ValidationErrorResponse = {
          error: "Validation failed",
          details: error.errors.map((err) => ({
            field: err.path.join(".") || "body",
            message: err.message,
            received: (err as any).input,
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

    // 5. Get Supabase client from context
    const supabase = locals.supabase;

    if (!supabase) {
      throw new Error("Supabase client not available in context");
    }

    // 6. Update goal via service
    const goalService = new GoalService(supabase);
    const updatedGoal = await goalService.updateGoal(goalId, userId, updateData);

    // 7. Handle not found
    if (!updatedGoal) {
      const errorResponse: ErrorResponse = {
        error: "Goal not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 8. Return success response
    const response: ItemResponse<GoalDTO> = {
      data: updatedGoal,
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
 * DELETE /api/v1/goals/:id
 * Deletes a long-term goal and all related milestones (CASCADE)
 * Sets long_term_goal_id to NULL in related weekly_goals (SET NULL)
 *
 * Response: 200 OK with success message
 * Errors:
 * - 400 Bad Request: Invalid UUID
 * - 404 Not Found: Goal doesn't exist or doesn't belong to user
 * - 500 Internal Server Error: Unexpected errors
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Authentication
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // 2. Validate goal ID from URL parameter
    let goalId: string;
    try {
      const validatedParams = GoalIdParamsSchema.parse(params);
      goalId = validatedParams.id;
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

    // 3. Get Supabase client from context
    const supabase = locals.supabase;

    if (!supabase) {
      throw new Error("Supabase client not available in context");
    }

    // 4. Delete goal via service
    const goalService = new GoalService(supabase);
    const deleted = await goalService.deleteGoal(goalId, userId);

    // 5. Handle not found
    if (!deleted) {
      const errorResponse: ErrorResponse = {
        error: "Goal not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 6. Return success response
    const response = {
      message: "Goal deleted successfully",
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
