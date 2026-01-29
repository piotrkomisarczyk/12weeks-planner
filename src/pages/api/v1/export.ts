import type { APIRoute } from "astro";
import { ExportService } from "../../../lib/services/export.service";
import { GetUnauthorizedResponse } from "../../../lib/utils";
import type { ExportDataDTO, ErrorResponse } from "../../../types";

export const prerender = false;

/**
 * GET /api/v1/export
 *
 * Export all user data in JSON format for GDPR compliance.
 * This endpoint returns complete user data including:
 * - Plans
 * - Long-term goals
 * - Milestones
 * - Weekly goals
 * - Tasks
 * - Task history
 * - Weekly reviews
 * - User metrics
 *
 * All data is filtered by user_id through RLS policies ensuring users can only
 * export their own data.
 *
 * Response includes a Content-Disposition header suggesting a filename for download.
 *
 * Performance Note: This endpoint executes multiple queries in parallel and may take
 * several seconds for users with large datasets. Consider implementing rate limiting
 * (max 1 request per 5 minutes per user) in production.
 *
 * @returns 200 OK with complete user data export
 * @returns 401 Unauthorized if not authenticated
 * @returns 500 Internal Server Error on database errors or timeout
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Authentication check
    const userId = locals.user?.id;

    if (!userId) {
      return GetUnauthorizedResponse();
    }

    const supabase = locals.supabase;

    // 2. Export user data using service
    const exportService = new ExportService(supabase);
    const result = await exportService.exportUserData(userId);

    // 3. Check for errors from service
    if ("error" in result) {
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: result.error,
        } as ErrorResponse),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Return successful response with download headers
    const exportData: ExportDataDTO = result;
    const timestamp = Date.now();
    const filename = `user-data-export-${userId}-${timestamp}.json`;

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to export user data",
      } as ErrorResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
