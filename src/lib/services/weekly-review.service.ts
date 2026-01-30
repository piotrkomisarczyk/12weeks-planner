/**
 * Weekly Review Service
 * Handles business logic for weekly review operations
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type {
  WeeklyReviewDTO,
  CreateWeeklyReviewCommand,
  UpdateWeeklyReviewCommand,
  WeeklyReviewListParams,
  WeeklyReviewInsert,
  WeeklyReviewUpdate,
} from "../../types";
import { PlanService } from "./plan.service";

export class WeeklyReviewService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Tworzy nowy weekly review
   *
   * @param userId - ID użytkownika (z DEFAULT_USER_ID dla MVP)
   * @param data - Dane weekly review (plan_id, week_number, text fields)
   * @returns Promise z utworzonym weekly review
   * @throws Error jeśli plan nie istnieje lub nie należy do użytkownika
   * @throws Error jeśli review już istnieje dla plan_id + week_number (409 Conflict)
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   *
   * @example
   * ```typescript
   * const review = await weeklyReviewService.createWeeklyReview(userId, {
   *   plan_id: 'uuid',
   *   week_number: 3,
   *   what_worked: 'Early morning sessions were productive',
   *   what_did_not_work: 'Too many meetings',
   *   what_to_improve: 'Block calendar for deep work'
   * });
   * ```
   */
  async createWeeklyReview(userId: string, data: CreateWeeklyReviewCommand): Promise<WeeklyReviewDTO> {
    // Step 1: Verify plan exists and belongs to user
    const planService = new PlanService(this.supabase);
    const plan = await planService.getPlanById(data.plan_id, userId);

    if (!plan) {
      throw new Error("Plan not found or does not belong to user");
    }

    // Step 2: Prepare insert data
    const insertData: WeeklyReviewInsert = {
      plan_id: data.plan_id,
      week_number: data.week_number,
      what_worked: data.what_worked ?? null,
      what_did_not_work: data.what_did_not_work ?? null,
      what_to_improve: data.what_to_improve ?? null,
    };

    // Step 3: Execute insert (unique constraint will be checked by DB)
    const { data: weeklyReview, error } = await this.supabase
      .from("weekly_reviews")
      .insert(insertData)
      .select()
      .single();

    // Step 4: Handle database errors
    if (error) {
      // Check for unique constraint violation
      if (error.code === "23505") {
        throw new Error("Weekly review already exists for this week");
      }
      throw new Error(`Failed to create weekly review: ${error.message}`);
    }

    return weeklyReview;
  }

  /**
   * Pobiera weekly review po ID
   * Weryfikuje, że review należy do użytkownika (przez plan_id)
   *
   * @param id - UUID weekly review
   * @param userId - ID użytkownika
   * @returns Promise z weekly review lub null jeśli nie istnieje/nie należy do użytkownika
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   *
   * @example
   * ```typescript
   * const review = await weeklyReviewService.getWeeklyReviewById(id, userId);
   * if (!review) {
   *   // Weekly review not found or doesn't belong to user
   * }
   * ```
   */
  async getWeeklyReviewById(id: string, userId: string): Promise<WeeklyReviewDTO | null> {
    // Join with plans to verify user ownership
    const { data, error } = await this.supabase
      .from("weekly_reviews")
      .select(
        `
        *,
        plans!inner(user_id)
      `
      )
      .eq("id", id)
      .eq("plans.user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch weekly review: ${error.message}`);
    }

    // Remove nested plans data before returning
    if (data) {
      const { plans: _plans, ...weeklyReview } = data as { plans?: unknown };
      return weeklyReview as WeeklyReviewDTO;
    }

    return null;
  }

  /**
   * Pobiera weekly review dla konkretnego tygodnia w planie
   * Weryfikuje, że plan należy do użytkownika
   *
   * @param planId - UUID planu
   * @param weekNumber - Numer tygodnia (1-12)
   * @param userId - ID użytkownika
   * @returns Promise z weekly review lub null jeśli nie istnieje
   * @throws Error jeśli plan nie istnieje lub nie należy do użytkownika
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   *
   * @example
   * ```typescript
   * const review = await weeklyReviewService.getWeeklyReviewByWeek(planId, 3, userId);
   * if (!review) {
   *   // Review not found for this week
   * }
   * ```
   */
  async getWeeklyReviewByWeek(planId: string, weekNumber: number, userId: string): Promise<WeeklyReviewDTO | null> {
    // Step 1: Verify plan exists and belongs to user
    const planService = new PlanService(this.supabase);
    const plan = await planService.getPlanById(planId, userId);

    if (!plan) {
      throw new Error("Plan not found or does not belong to user");
    }

    // Step 2: Query by plan_id + week_number
    const { data, error } = await this.supabase
      .from("weekly_reviews")
      .select("*")
      .eq("plan_id", planId)
      .eq("week_number", weekNumber)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch weekly review: ${error.message}`);
    }

    return data;
  }

  /**
   * Pobiera listę weekly reviews z filtrami
   * Weryfikuje, że plan należy do użytkownika
   *
   * @param params - Parametry zapytania (plan_id, week_number, is_completed, limit, offset)
   * @param userId - ID użytkownika
   * @returns Promise z tablicą weekly reviews
   * @throws Error jeśli plan nie istnieje lub nie należy do użytkownika
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   *
   * @example
   * ```typescript
   * const reviews = await weeklyReviewService.listWeeklyReviews({
   *   plan_id: 'uuid',
   *   week_number: 3,
   *   is_completed: true,
   *   limit: 50,
   *   offset: 0
   * }, userId);
   * // Returns weekly reviews sorted by week_number
   * ```
   */
  async listWeeklyReviews(params: WeeklyReviewListParams, userId: string): Promise<WeeklyReviewDTO[]> {
    // Step 1: Verify plan exists and belongs to user
    const planService = new PlanService(this.supabase);
    const plan = await planService.getPlanById(params.plan_id, userId);

    if (!plan) {
      throw new Error("Plan not found or does not belong to user");
    }

    // Step 2: Build query with filters
    let query = this.supabase.from("weekly_reviews").select("*").eq("plan_id", params.plan_id);

    // Apply optional filters
    if (params.week_number !== undefined) {
      query = query.eq("week_number", params.week_number);
    }

    if (params.is_completed !== undefined) {
      query = query.eq("is_completed", params.is_completed);
    }

    // Apply pagination
    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    // Order by week_number ascending
    query = query.order("week_number", { ascending: true });

    // Step 3: Execute query
    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch weekly reviews: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Aktualizuje weekly review (partial update)
   * Weryfikuje, że review należy do użytkownika przez relację weekly_review → plan → user
   *
   * @param id - UUID weekly review
   * @param userId - ID użytkownika (z DEFAULT_USER_ID)
   * @param data - Dane do aktualizacji (wszystkie pola opcjonalne - auto-save support)
   * @returns Promise z zaktualizowanym review lub null jeśli nie istnieje
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   *
   * @example
   * ```typescript
   * const review = await weeklyReviewService.updateWeeklyReview(id, userId, {
   *   what_worked: 'Early morning sessions were productive'
   * });
   * if (!review) {
   *   // Weekly review not found or doesn't belong to user
   * }
   * ```
   */
  async updateWeeklyReview(
    id: string,
    userId: string,
    data: UpdateWeeklyReviewCommand
  ): Promise<WeeklyReviewDTO | null> {
    // Step 1: Verify weekly review exists and belongs to user
    const existingReview = await this.getWeeklyReviewById(id, userId);

    if (!existingReview) {
      return null;
    }

    // Step 2: Prepare partial update data
    const updateData: WeeklyReviewUpdate = {};

    if (data.what_worked !== undefined) {
      updateData.what_worked = data.what_worked;
    }

    if (data.what_did_not_work !== undefined) {
      updateData.what_did_not_work = data.what_did_not_work;
    }

    if (data.what_to_improve !== undefined) {
      updateData.what_to_improve = data.what_to_improve;
    }

    if (data.is_completed !== undefined) {
      updateData.is_completed = data.is_completed;
    }

    // updated_at is automatically set by database trigger

    // Step 3: Execute update
    const { data: weeklyReview, error } = await this.supabase
      .from("weekly_reviews")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    // Step 4: Handle database errors
    if (error) {
      throw new Error(`Failed to update weekly review: ${error.message}`);
    }

    return weeklyReview;
  }

  /**
   * Oznacza weekly review jako ukończony
   * Weryfikuje, że review należy do użytkownika
   *
   * @param id - UUID weekly review
   * @param userId - ID użytkownika (z DEFAULT_USER_ID)
   * @returns Promise z true jeśli oznaczono jako ukończone lub false jeśli review nie istnieje
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   *
   * @example
   * ```typescript
   * const success = await weeklyReviewService.markAsComplete(id, userId);
   * if (!success) {
   *   // Weekly review not found or doesn't belong to user
   * }
   * ```
   */
  async markAsComplete(id: string, userId: string): Promise<boolean> {
    // Step 1: Verify weekly review exists and belongs to user
    const existingReview = await this.getWeeklyReviewById(id, userId);

    if (!existingReview) {
      return false;
    }

    // Step 2: Update is_completed = true
    const { error } = await this.supabase.from("weekly_reviews").update({ is_completed: true }).eq("id", id);

    // Step 3: Handle database errors
    if (error) {
      throw new Error(`Failed to mark weekly review as complete: ${error.message}`);
    }

    return true;
  }

  /**
   * Usuwa weekly review
   * Weryfikuje, że review należy do użytkownika przez relację weekly_review → plan → user
   *
   * @param id - UUID weekly review
   * @param userId - ID użytkownika (z DEFAULT_USER_ID)
   * @returns Promise z true jeśli usunięto lub false jeśli review nie istnieje
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   *
   * @example
   * ```typescript
   * const deleted = await weeklyReviewService.deleteWeeklyReview(id, userId);
   * if (!deleted) {
   *   // Weekly review not found or doesn't belong to user
   * }
   * ```
   */
  async deleteWeeklyReview(id: string, userId: string): Promise<boolean> {
    // Step 1: Verify weekly review exists and belongs to user
    const existingReview = await this.getWeeklyReviewById(id, userId);

    if (!existingReview) {
      return false;
    }

    // Step 2: Execute delete
    const { error } = await this.supabase.from("weekly_reviews").delete().eq("id", id);

    // Step 3: Handle database errors
    if (error) {
      throw new Error(`Failed to delete weekly review: ${error.message}`);
    }

    return true;
  }
}
