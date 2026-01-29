import type { APIRoute } from "astro";
import { TaskService } from "../../../../lib/services/task.service";
import { taskIdSchema, updateTaskSchema } from "../../../../lib/validation/task.validation";
import { GetUnauthorizedResponse } from "../../../../lib/utils";

export const prerender = false;

/**
 * GET /api/v1/tasks/:id
 *
 * Get task details with complete history.
 * Returns task entity with nested task_history array.
 *
 * URL Parameters:
 * - id (required): UUID of the task
 *
 * Returns:
 * - 200: { data: TaskWithHistoryDTO }
 * - 400: Invalid UUID format
 * - 404: Task not found
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const supabase = locals.supabase;
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // Validate task ID
    const validation = taskIdSchema.safeParse(params);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validation.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call service
    const taskService = new TaskService(supabase);
    const result = await taskService.getTaskById(validation.data.id);

    if ("error" in result) {
      const status = result.error === "Task not found" ? 404 : 500;
      return new Response(JSON.stringify({ error: result.error }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/v1/tasks/:id:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PATCH /api/v1/tasks/:id
 *
 * Update task with partial data (all fields optional).
 * Status changes are automatically logged to task_history by database trigger.
 *
 * URL Parameters:
 * - id (required): UUID of the task
 *
 * Request Body (all optional):
 * - weekly_goal_id: UUID | null
 * - long_term_goal_id: UUID | null
 * - milestone_id: UUID | null
 * - title: string (max 255 chars)
 * - description: string | null
 * - priority: A | B | C
 * - status: todo | in_progress | completed | cancelled | postponed
 * - task_type: weekly_main | weekly_sub | ad_hoc
 * - week_number: 1-12 | null
 * - due_day: 1-7 | null
 * - position: number
 *
 * Returns:
 * - 200: { data: TaskDTO }
 * - 400: Validation error or no fields provided
 * - 404: Task/weekly goal/long-term goal/milestone not found
 * - 500: Internal server error
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const supabase = locals.supabase;
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // Validate task ID
    const idValidation = taskIdSchema.safeParse(params);
    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: idValidation.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const bodyValidation = updateTaskSchema.safeParse(body);
    if (!bodyValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: bodyValidation.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call service
    const taskService = new TaskService(supabase);
    const result = await taskService.updateTask(idValidation.data.id, bodyValidation.data);

    if ("error" in result) {
      const status =
        result.error === "Task not found" ||
        result.error === "Weekly goal not found" ||
        result.error === "Long-term goal not found" ||
        result.error === "Milestone not found"
          ? 404
          : 500;

      return new Response(JSON.stringify({ error: result.error }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in PATCH /api/v1/tasks/:id:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/v1/tasks/:id
 *
 * Delete task permanently.
 * Task history is automatically deleted via CASCADE constraint.
 *
 * URL Parameters:
 * - id (required): UUID of the task
 *
 * Returns:
 * - 200: { message: "Task deleted successfully" }
 * - 400: Invalid UUID format
 * - 404: Task not found
 * - 500: Internal server error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const supabase = locals.supabase;
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // Validate task ID
    const validation = taskIdSchema.safeParse(params);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validation.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call service
    const taskService = new TaskService(supabase);
    const result = await taskService.deleteTask(validation.data.id);

    if ("error" in result) {
      const status = result.error === "Task not found" ? 404 : 500;
      return new Response(JSON.stringify({ error: result.error }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in DELETE /api/v1/tasks/:id:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
