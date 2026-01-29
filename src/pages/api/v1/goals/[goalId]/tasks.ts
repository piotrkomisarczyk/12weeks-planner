/**
 * API Endpoint: /api/v1/goals/:goalId/tasks
 * GET - Retrieves all tasks associated with a specific long-term goal
 */

import type { APIRoute } from "astro";
import { GoalService } from "../../../../../lib/services/goal.service";
import { TaskService } from "../../../../../lib/services/task.service";
import { GoalIdParamsSchema, TasksByGoalQuerySchema } from "../../../../../lib/validation/goal.validation";
import { GetUnauthorizedResponse } from "../../../../../lib/utils";
import type { ErrorResponse, ValidationErrorResponse, ListResponse, TaskDTO } from "../../../../../types";

export const prerender = false;

export const GET: APIRoute = async ({ locals, params, url }) => {
  try {
    // Authentication
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // Validate URL params
    const paramsValidation = GoalIdParamsSchema.safeParse({ id: params.goalId });

    if (!paramsValidation.success) {
      const details = paramsValidation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
        received: "input" in issue ? issue.input : undefined,
      }));

      return new Response(JSON.stringify({ error: "Validation failed", details } as ValidationErrorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id: goalId } = paramsValidation.data;

    // Parse and validate query parameters
    const queryParams = {
      status: url.searchParams.get("status"),
      week_number: url.searchParams.get("week_number"),
      include_milestone_tasks: url.searchParams.get("include_milestone_tasks"),
      limit: url.searchParams.get("limit"),
      offset: url.searchParams.get("offset"),
    };

    const queryValidation = TasksByGoalQuerySchema.safeParse(queryParams);

    if (!queryValidation.success) {
      const details = queryValidation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
        received: "input" in issue ? issue.input : undefined,
      }));

      return new Response(JSON.stringify({ error: "Validation failed", details } as ValidationErrorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify goal exists and belongs to user
    const goalService = new GoalService(locals.supabase);
    const goal = await goalService.getGoalById(goalId, userId);

    if (!goal) {
      return new Response(JSON.stringify({ error: "Not found", message: "Goal not found" } as ErrorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get tasks for this goal
    const taskService = new TaskService(locals.supabase);
    const result = await taskService.getTasksByGoalId(goalId, userId, queryValidation.data);

    // Return success
    return new Response(
      JSON.stringify({
        data: result.data,
        count: result.count,
      } as ListResponse<TaskDTO>),
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
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
