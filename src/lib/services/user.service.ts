import type { SupabaseClient } from "../../db/supabase.client";
import type { UserMetricsDTO, ItemResponse, ErrorResponse } from "../../types";

/**
 * User Service
 *
 * Handles user-related business logic including:
 * - User metrics retrieval
 *
 * All methods include proper error handling and validation.
 */
export class UserService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get metrics for the authenticated user
   * GET /api/v1/users/metrics
   *
   * @param userId - User UUID
   * @returns User metrics or error if not found
   */
  async getUserMetrics(userId: string): Promise<ItemResponse<UserMetricsDTO> | ErrorResponse> {
    try {
      const { data, error } = await this.supabase.from("user_metrics").select("*").eq("user_id", userId).single();

      if (error) {
        // PGRST116 = No rows returned
        if (error.code === "PGRST116") {
          return { error: "User metrics not found" };
        }
        console.error("Error fetching user metrics:", error);
        return { error: "Failed to fetch user metrics" };
      }

      return { data: data as UserMetricsDTO };
    } catch (error) {
      console.error("Unexpected error in getUserMetrics:", error);
      return { error: "Internal server error" };
    }
  }
}
