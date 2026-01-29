import type { SupabaseClient } from "../../db/supabase.client";
import type { ExportDataDTO, ErrorResponse } from "../../types";

/**
 * Export Service
 *
 * Handles data export functionality for GDPR compliance:
 * - Complete user data export in JSON format
 *
 * All methods include proper error handling and validation.
 */
export class ExportService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Export all user data (GDPR compliance)
   * GET /api/v1/export
   *
   * @param userId - User UUID
   * @returns Complete user data export or error
   */
  async exportUserData(userId: string): Promise<ExportDataDTO | ErrorResponse> {
    try {
      // Execute all queries in parallel for performance
      const [
        plansResult,
        goalsResult,
        milestonesResult,
        weeklyGoalsResult,
        tasksResult,
        taskHistoryResult,
        weeklyReviewsResult,
        metricsResult,
      ] = await Promise.all([
        // Plans
        this.supabase.from("plans").select("*").eq("user_id", userId),

        // Long-term goals (via plans)
        this.supabase.from("long_term_goals").select("*, plan:plans!inner(user_id)").eq("plan.user_id", userId),

        // Milestones (via long_term_goals -> plans)
        this.supabase
          .from("milestones")
          .select("*, goal:long_term_goals!inner(plan:plans!inner(user_id))")
          .eq("goal.plan.user_id", userId),

        // Weekly goals (via plans)
        this.supabase.from("weekly_goals").select("*, plan:plans!inner(user_id)").eq("plan.user_id", userId),

        // Tasks (via plans)
        this.supabase.from("tasks").select("*, plan:plans!inner(user_id)").eq("plan.user_id", userId),

        // Task history (via tasks -> plans)
        this.supabase
          .from("task_history")
          .select("*, task:tasks!inner(plan:plans!inner(user_id))")
          .eq("task.plan.user_id", userId),

        // Weekly reviews (via plans)
        this.supabase.from("weekly_reviews").select("*, plan:plans!inner(user_id)").eq("plan.user_id", userId),

        // User metrics
        this.supabase.from("user_metrics").select("*").eq("user_id", userId).single(),
      ]);

      // Check for errors in any query (except metrics which might not exist)
      const errors = [
        plansResult.error,
        goalsResult.error,
        milestonesResult.error,
        weeklyGoalsResult.error,
        tasksResult.error,
        taskHistoryResult.error,
        weeklyReviewsResult.error,
        // Ignore "no rows" error for metrics (PGRST116)
        metricsResult.error && metricsResult.error.code !== "PGRST116" ? metricsResult.error : null,
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error("Error exporting user data:", errors[0]);
        return { error: "Failed to export user data" };
      }

      // Assemble export data
      const exportData: ExportDataDTO = {
        user_id: userId,
        exported_at: new Date().toISOString(),
        plans: plansResult.data || [],
        goals: goalsResult.data || [],
        milestones: milestonesResult.data || [],
        weekly_goals: weeklyGoalsResult.data || [],
        tasks: tasksResult.data || [],
        task_history: taskHistoryResult.data || [],
        weekly_reviews: weeklyReviewsResult.data || [],
        metrics: metricsResult.data || null,
      };

      return exportData;
    } catch (error) {
      console.error("Unexpected error in exportUserData:", error);
      return { error: "Internal server error" };
    }
  }
}
