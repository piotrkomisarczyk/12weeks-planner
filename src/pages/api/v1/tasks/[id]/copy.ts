import type { APIRoute } from "astro";
import { TaskService } from "../../../../../lib/services/task.service";
import { taskIdSchema, copyTaskSchema } from "../../../../../lib/validation/task.validation";
import { GetUnauthorizedResponse } from "../../../../../lib/utils";

export const prerender = false;

/**
 * POST /api/v1/tasks/:id/copy
 *
 * Copy an existing task to a new week and/or day.
 * The copied task will have:
 * - Same: plan_id, weekly_goal_id, long_term_goal_id, milestone_id, title, description, priority, task_type, position
 * - Reset: status (set to 'todo')
 * - Modified: week_number and/or due_day (based on request body)
 *
 * This is useful for:
 * - Repeating tasks across multiple weeks
 * - Moving tasks to different days
 * - Creating task templates
 *
 * URL Parameters:
 * - id (required): UUID of the task to copy
 *
 * Request Body (all optional):
 * - week_number: 1-12 | null (defaults to original task's week_number)
 * - due_day: 1-7 | null (defaults to original task's due_day)
 *
 * Returns:
 * - 201: { data: TaskDTO, message: "Task copied successfully" }
 * - 400: Validation error
 * - 404: Original task not found
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
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
    const bodyValidation = copyTaskSchema.safeParse(body);
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
    const result = await taskService.copyTask(idValidation.data.id, bodyValidation.data);

    if ("error" in result) {
      const status = result.error === "Task not found" ? 404 : 500;
      return new Response(JSON.stringify({ error: result.error }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
