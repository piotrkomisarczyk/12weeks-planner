import type { APIRoute } from "astro";
import { TaskService } from "../../../../../lib/services/task.service";
import { taskIdParamSchema } from "../../../../../lib/validation/task.validation";
import { GetUnauthorizedResponse } from "../../../../../lib/utils";
import type { ListResponse, TaskHistoryDTO, ErrorResponse } from "../../../../../types";

export const prerender = false;

/**
 * GET /api/v1/tasks/:taskId/history
 *
 * Retrieve the complete status change history for a specific task.
 * History is automatically created by the database trigger `log_task_status_change()`
 * whenever a task status changes.
 *
 * @param taskId - UUID of the task
 * @returns 200 OK with array of history entries
 * @returns 400 Bad Request if taskId is invalid UUID
 * @returns 401 Unauthorized if not authenticated
 * @returns 404 Not Found if task doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error on database errors
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Authentication check
    const supabase = locals.supabase;
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    // 2. Validate path parameters
    const validationResult = taskIdParamSchema.safeParse(params);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { taskId } = validationResult.data;

    // 3. Verify task exists and belongs to user (RLS will also enforce this)
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, plan_id")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Task not found",
        } as ErrorResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Additional check: Verify plan belongs to user
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id")
      .eq("id", task.plan_id)
      .eq("user_id", userId)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Task not found",
        } as ErrorResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Fetch task history using service
    const taskService = new TaskService(supabase);
    const result = await taskService.getTaskHistory(taskId);

    // 5. Check for errors from service
    if ("error" in result) {
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: result.error,
        } as ErrorResponse),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 6. Return successful response
    const response: ListResponse<TaskHistoryDTO> = {
      data: result.data,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching task history:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to fetch task history",
      } as ErrorResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
