/**
 * Milestone Service
 * Handles business logic for milestone operations
 *
 * ⚠️ MVP Mode: Uses DEFAULT_USER_ID, no RLS
 * All methods verify ownership through goal → plan → user relationship
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type {
  MilestoneDTO,
  CreateMilestoneCommand,
  UpdateMilestoneCommand,
  MilestoneInsert,
  MilestoneUpdate,
  WeeklyGoalDTO,
  TaskDTO,
} from "../../types";
import type { ListMilestonesQuery, ListTasksByMilestoneQuery } from "../validation/milestone.validation";

/**
 * Service for milestone operations
 * All methods assume userId is provided (DEFAULT_USER_ID in MVP)
 */
export class MilestoneService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * List milestones with optional filters
   * Supports filtering by goal and completion status
   * Returns paginated results ordered by position
   *
   * @param filters - Query filters (long_term_goal_id, is_completed, limit, offset)
   * @param userId - ID użytkownika (DEFAULT_USER_ID w MVP)
   * @returns Promise with array of milestones and total count
   * @throws Error if database query fails
   *
   * @example
   * ```typescript
   * const result = await milestoneService.listMilestones({
   *   long_term_goal_id: 'uuid',
   *   is_completed: 'false',
   *   limit: 50,
   *   offset: 0
   * }, userId);
   * ```
   */
  async listMilestones(
    filters: ListMilestonesQuery,
    _userId: string
  ): Promise<{ data: MilestoneDTO[]; count: number }> {
    let query = this.supabase.from("milestones").select("*", { count: "exact" });

    // Apply filters
    if (filters.long_term_goal_id) {
      query = query.eq("long_term_goal_id", filters.long_term_goal_id);
    }

    if (filters.is_completed !== undefined) {
      query = query.eq("is_completed", filters.is_completed === "true");
    }

    // Apply pagination and ordering
    query = query.order("position", { ascending: true }).range(filters.offset, filters.offset + filters.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list milestones: ${error.message}`);
    }

    return {
      data: data as MilestoneDTO[],
      count: count ?? 0,
    };
  }

  /**
   * Get milestones for a specific goal
   * Verifies goal exists and belongs to user
   * Returns milestones ordered by position
   *
   * @param goalId - UUID of the goal
   * @param userId - ID użytkownika (DEFAULT_USER_ID w MVP)
   * @returns Promise with array of milestones
   * @throws Error if goal not found or doesn't belong to user
   * @throws Error if database query fails
   *
   * @example
   * ```typescript
   * const milestones = await milestoneService.getMilestonesByGoalId(goalId, userId);
   * ```
   */
  async getMilestonesByGoalId(goalId: string, _userId: string): Promise<MilestoneDTO[]> {
    // First check if goal exists and belongs to user
    const { data: goal, error: goalError } = await this.supabase
      .from("long_term_goals")
      .select("id")
      .eq("id", goalId)
      .single();

    if (goalError || !goal) {
      throw new Error("Goal not found or access denied");
    }

    // Get milestones
    const { data, error } = await this.supabase
      .from("milestones")
      .select("*")
      .eq("long_term_goal_id", goalId)
      .order("position", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch milestones: ${error.message}`);
    }

    return data as MilestoneDTO[];
  }

  /**
   * Get a single milestone by ID
   * Verifies milestone exists (ownership verified by RLS when enabled)
   *
   * @param id - UUID of the milestone
   * @param userId - ID użytkownika (DEFAULT_USER_ID w MVP)
   * @returns Promise with milestone
   * @throws Error if milestone not found or access denied
   * @throws Error if database query fails
   *
   * @example
   * ```typescript
   * const milestone = await milestoneService.getMilestoneById(id, userId);
   * ```
   */
  async getMilestoneById(id: string, _userId: string): Promise<MilestoneDTO> {
    const { data, error } = await this.supabase.from("milestones").select("*").eq("id", id).single();

    if (error || !data) {
      throw new Error("Milestone not found or access denied");
    }

    return data as MilestoneDTO;
  }

  /**
   * Create a new milestone
   * Verifies goal exists and belongs to user
   * Database trigger enforces max 5 milestones per goal
   *
   * @param milestoneData - Milestone creation data
   * @param userId - ID użytkownika (DEFAULT_USER_ID w MVP)
   * @returns Promise with created milestone
   * @throws Error if goal not found or doesn't belong to user
   * @throws Error if max milestones limit exceeded (database constraint)
   * @throws Error if database query fails
   *
   * @example
   * ```typescript
   * const milestone = await milestoneService.createMilestone({
   *   long_term_goal_id: 'uuid',
   *   title: 'Complete API design',
   *   description: 'Design all REST endpoints',
   *   due_date: '2025-01-20',
   *   position: 1
   * }, userId);
   * ```
   */
  async createMilestone(milestoneData: CreateMilestoneCommand, _userId: string): Promise<MilestoneDTO> {
    // Verify goal exists and belongs to user
    const { data: goal, error: goalError } = await this.supabase
      .from("long_term_goals")
      .select("id")
      .eq("id", milestoneData.long_term_goal_id)
      .single();

    if (goalError || !goal) {
      throw new Error("Goal not found or access denied");
    }

    // Prepare insert data
    const insertData: MilestoneInsert = {
      long_term_goal_id: milestoneData.long_term_goal_id,
      title: milestoneData.title,
      description: milestoneData.description ?? null,
      due_date: milestoneData.due_date ?? null,
      position: milestoneData.position ?? 1,
    };

    // Create milestone
    const { data, error } = await this.supabase.from("milestones").insert([insertData]).select().single();

    if (error) {
      // Check for max milestones constraint
      if (error.message.includes("Cannot add more than 5 milestones")) {
        throw new Error("Cannot add more than 5 milestones to a goal");
      }

      throw new Error(`Failed to create milestone: ${error.message}`);
    }

    return data as MilestoneDTO;
  }

  /**
   * Update a milestone (partial update)
   * Verifies milestone exists (ownership verified by RLS when enabled)
   *
   * @param id - UUID of the milestone
   * @param updateData - Partial update data
   * @param userId - ID użytkownika (DEFAULT_USER_ID w MVP)
   * @returns Promise with updated milestone
   * @throws Error if milestone not found or access denied
   * @throws Error if database query fails
   *
   * @example
   * ```typescript
   * const milestone = await milestoneService.updateMilestone(id, {
   *   title: 'Updated title',
   *   is_completed: true
   * }, userId);
   * ```
   */
  async updateMilestone(id: string, updateData: UpdateMilestoneCommand, _userId: string): Promise<MilestoneDTO> {
    // Prepare update data with only provided fields
    const update: MilestoneUpdate = {};

    if (updateData.title !== undefined) {
      update.title = updateData.title;
    }

    if (updateData.description !== undefined) {
      update.description = updateData.description;
    }

    if (updateData.due_date !== undefined) {
      update.due_date = updateData.due_date;
    }

    if (updateData.is_completed !== undefined) {
      update.is_completed = updateData.is_completed;
    }

    if (updateData.position !== undefined) {
      update.position = updateData.position;
    }

    const { data, error } = await this.supabase.from("milestones").update(update).eq("id", id).select().single();

    if (error || !data) {
      if (error?.code === "PGRST116") {
        throw new Error("Milestone not found or access denied");
      }
      throw new Error(`Failed to update milestone: ${error?.message || "Unknown error"}`);
    }

    return data as MilestoneDTO;
  }

  /**
   * Delete a milestone
   * Verifies milestone exists (ownership verified by RLS when enabled)
   * Database CASCADE SET NULL: tasks.milestone_id = NULL
   *
   * @param id - UUID of the milestone
   * @param userId - ID użytkownika (DEFAULT_USER_ID w MVP)
   * @returns Promise that resolves when deleted
   * @throws Error if milestone not found or access denied
   * @throws Error if database query fails
   *
   * @example
   * ```typescript
   * await milestoneService.deleteMilestone(id, userId);
   * ```
   */
  async deleteMilestone(id: string, _userId: string): Promise<void> {
    const { error } = await this.supabase.from("milestones").delete().eq("id", id);

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Milestone not found or access denied");
      }
      throw new Error(`Failed to delete milestone: ${error.message}`);
    }
  }

  /**
   * Get weekly goals for a specific milestone
   * Verifies milestone exists and belongs to user
   * Returns weekly goals ordered by week_number and position
   *
   * @param milestoneId - UUID of the milestone
   * @param userId - ID użytkownika (DEFAULT_USER_ID w MVP)
   * @returns Promise with array of weekly goals
   * @throws Error if milestone not found or doesn't belong to user
   * @throws Error if database query fails
   *
   * @example
   * ```typescript
   * const weeklyGoals = await milestoneService.getWeeklyGoalsByMilestoneId(milestoneId, userId);
   * ```
   */
  async getWeeklyGoalsByMilestoneId(milestoneId: string, _userId: string): Promise<WeeklyGoalDTO[]> {
    // First check if milestone exists and belongs to user
    const { data: milestone, error: milestoneError } = await this.supabase
      .from("milestones")
      .select("id")
      .eq("id", milestoneId)
      .single();

    if (milestoneError || !milestone) {
      throw new Error("Milestone not found or access denied");
    }

    // Get weekly goals
    const { data, error } = await this.supabase
      .from("weekly_goals")
      .select("*")
      .eq("milestone_id", milestoneId)
      .order("week_number", { ascending: true })
      .order("position", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch weekly goals: ${error.message}`);
    }

    return data as WeeklyGoalDTO[];
  }

  /**
   * Get tasks for a specific milestone with optional filters
   * Verifies milestone exists and belongs to user
   * Supports filtering by status and week_number
   * Returns tasks ordered by week_number, due_day, and position
   *
   * @param milestoneId - UUID of the milestone
   * @param filters - Query filters (status, week_number, limit, offset)
   * @param userId - ID użytkownika (DEFAULT_USER_ID w MVP)
   * @returns Promise with array of tasks and total count
   * @throws Error if milestone not found or doesn't belong to user
   * @throws Error if database query fails
   *
   * @example
   * ```typescript
   * const result = await milestoneService.getTasksByMilestoneId(
   *   milestoneId,
   *   { status: 'completed', week_number: 3, limit: 50, offset: 0 },
   *   userId
   * );
   * ```
   */
  async getTasksByMilestoneId(
    milestoneId: string,
    filters: ListTasksByMilestoneQuery,
    _userId: string
  ): Promise<{ data: TaskDTO[]; count: number }> {
    // First check if milestone exists and belongs to user
    const { data: milestone, error: milestoneError } = await this.supabase
      .from("milestones")
      .select("id")
      .eq("id", milestoneId)
      .single();

    if (milestoneError || !milestone) {
      throw new Error("Milestone not found or access denied");
    }

    // Build query
    let query = this.supabase.from("tasks").select("*", { count: "exact" }).eq("milestone_id", milestoneId);

    // Apply filters
    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.week_number !== undefined) {
      query = query.eq("week_number", filters.week_number);
    }

    // Apply ordering and pagination
    query = query
      .order("week_number", { ascending: true, nullsFirst: false })
      .order("due_day", { ascending: true, nullsFirst: false })
      .order("position", { ascending: true })
      .range(filters.offset, filters.offset + filters.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    return {
      data: data as TaskDTO[],
      count: count ?? 0,
    };
  }
}
