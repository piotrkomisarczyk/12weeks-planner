/**
 * Weekly Goal Service
 * Handles business logic for weekly goal operations
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type {
  WeeklyGoalDTO,
  WeeklyGoalWithSubtasksDTO,
  CreateWeeklyGoalCommand,
  UpdateWeeklyGoalCommand,
  WeeklyGoalListParams,
  WeeklyGoalInsert,
  WeeklyGoalUpdate,
} from "../../types";
import { PlanService } from "./plan.service";
import { GoalService } from "./goal.service";

export class WeeklyGoalService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Waliduje, że milestone należy do goala w podanym planie
   * Jest to krytyczny check bezpieczeństwa zapobiegający cross-plan milestone associations
   *
   * @param milestoneId - UUID milestone do walidacji
   * @param planId - UUID planu, który powinien zawierać goal milestone'a
   * @throws Error jeśli milestone nie istnieje
   * @throws Error jeśli goal milestone'a nie należy do podanego planu
   *
   * @example
   * ```typescript
   * await validateMilestoneInPlan(milestoneId, planId);
   * // Jeśli nie rzuci błędu, milestone jest poprawny dla tego planu
   * ```
   */
  private async validateMilestoneInPlan(milestoneId: string, planId: string): Promise<void> {
    // Query milestone with its goal's plan_id using JOIN
    const { data, error } = await this.supabase
      .from("milestones")
      .select(
        `
        id,
        long_term_goal_id,
        long_term_goals!inner(id, plan_id)
      `
      )
      .eq("id", milestoneId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error while validating milestone: ${error.message}`);
    }

    if (!data) {
      throw new Error("Milestone not found");
    }

    // Type assertion for nested structure
    const milestone = data as unknown as {
      id: string;
      long_term_goal_id: string;
      long_term_goals: { id: string; plan_id: string };
    };

    // Check if milestone's goal belongs to the specified plan
    if (milestone.long_term_goals.plan_id !== planId) {
      throw new Error("Milestone does not belong to a goal in the specified plan");
    }
  }

  /**
   * Tworzy nowy cel tygodniowy
   *
   * @param userId - ID użytkownika (z tokenu JWT)
   * @param data - Dane celu tygodniowego (plan_id, week_number, title, milestone_id, etc.)
   * @returns Promise z utworzonym celem tygodniowym
   * @throws Error jeśli plan nie istnieje lub nie należy do użytkownika
   * @throws Error jeśli long_term_goal_id nie istnieje lub nie należy do tego samego planu
   * @throws Error jeśli milestone_id nie istnieje lub nie należy do goala w tym samym planie
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   *
   * @example
   * ```typescript
   * const weeklyGoal = await weeklyGoalService.createWeeklyGoal(userId, {
   *   plan_id: 'uuid',
   *   long_term_goal_id: 'uuid',
   *   milestone_id: 'uuid',
   *   week_number: 3,
   *   title: 'Complete authentication system',
   *   description: 'Implement auth with Supabase',
   *   position: 1
   * });
   * ```
   */
  async createWeeklyGoal(userId: string, data: CreateWeeklyGoalCommand): Promise<WeeklyGoalDTO> {
    // Step 1: Verify plan exists and belongs to user
    const planService = new PlanService(this.supabase);
    const plan = await planService.getPlanById(data.plan_id, userId);

    if (!plan) {
      throw new Error("Plan not found or does not belong to user");
    }

    // Step 2: If long_term_goal_id provided, verify it exists and belongs to same plan
    if (data.long_term_goal_id) {
      const goalService = new GoalService(this.supabase);
      const goal = await goalService.getGoalById(data.long_term_goal_id, userId);

      if (!goal) {
        throw new Error("Long-term goal not found or does not belong to user");
      }

      // Verify goal belongs to same plan
      if (goal.plan_id !== data.plan_id) {
        throw new Error("Long-term goal does not belong to the specified plan");
      }
    }

    // Step 3: If milestone_id provided, verify it exists and belongs to goal in same plan
    if (data.milestone_id) {
      await this.validateMilestoneInPlan(data.milestone_id, data.plan_id);
    }

    // Step 4: Prepare insert data
    const insertData: WeeklyGoalInsert = {
      plan_id: data.plan_id,
      long_term_goal_id: data.long_term_goal_id ?? null,
      milestone_id: data.milestone_id ?? null,
      week_number: data.week_number,
      title: data.title,
      description: data.description ?? null,
      position: data.position ?? 1,
    };

    // Step 5: Execute insert
    const { data: weeklyGoal, error } = await this.supabase.from("weekly_goals").insert(insertData).select().single();

    // Step 6: Handle database errors
    if (error) {
      // Check for constraint violations (max 3 weekly goals per week)
      if (error.message.includes("cannot add more than 3 weekly goals")) {
        throw new Error("Cannot add more than 3 weekly goals per week");
      }

      throw new Error(`Failed to create weekly goal: ${error.message}`);
    }

    return weeklyGoal;
  }

  /**
   * Pobiera cel tygodniowy po ID
   * Weryfikuje, że cel należy do użytkownika (przez plan_id)
   *
   * @param id - UUID celu tygodniowego
   * @param userId - ID użytkownika
   * @returns Promise z celem tygodniowym lub null jeśli nie istnieje/nie należy do użytkownika
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   *
   * @example
   * ```typescript
   * const weeklyGoal = await weeklyGoalService.getWeeklyGoalById(id, userId);
   * if (!weeklyGoal) {
   *   // Weekly goal not found or doesn't belong to user
   * }
   * ```
   */
  async getWeeklyGoalById(id: string, userId: string): Promise<WeeklyGoalDTO | null> {
    // Join with plans to verify user ownership
    const { data, error } = await this.supabase
      .from("weekly_goals")
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
      throw new Error(`Failed to fetch weekly goal: ${error.message}`);
    }

    // Remove nested plans data before returning
    if (data) {
      const { plans: _plans, ...weeklyGoal } = data as { plans?: unknown };
      return weeklyGoal as WeeklyGoalDTO;
    }

    return null;
  }

  /**
   * Pobiera cel tygodniowy z podzadaniami
   * Weryfikuje, że cel należy do użytkownika (przez plan_id)
   *
   * @param id - UUID celu tygodniowego
   * @param userId - ID użytkownika
   * @returns Promise z celem tygodniowym i podzadaniami lub null jeśli nie istnieje
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   *
   * @example
   * ```typescript
   * const weeklyGoal = await weeklyGoalService.getWeeklyGoalWithSubtasks(id, userId);
   * if (!weeklyGoal) {
   *   // Weekly goal not found
   * }
   * // weeklyGoal.subtasks contains array of subtasks
   * ```
   */
  async getWeeklyGoalWithSubtasks(id: string, userId: string): Promise<WeeklyGoalWithSubtasksDTO | null> {
    // Step 1: Get weekly goal
    const weeklyGoal = await this.getWeeklyGoalById(id, userId);

    if (!weeklyGoal) {
      return null;
    }

    // Step 2: Query tasks table for subtasks
    const { data: tasks, error } = await this.supabase
      .from("tasks")
      .select("id, title, priority, status")
      .eq("weekly_goal_id", id)
      .eq("task_type", "weekly_sub")
      .order("position", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch subtasks: ${error.message}`);
    }

    // Step 3: Combine weekly goal + subtasks
    return {
      ...weeklyGoal,
      subtasks: tasks || [],
    };
  }

  /**
   * Pobiera listę celów tygodniowych z filtrami
   * Weryfikuje, że plan należy do użytkownika
   *
   * @param params - Parametry zapytania (plan_id, week_number, long_term_goal_id, milestone_id, limit, offset)
   * @param userId - ID użytkownika
   * @returns Promise z tablicą celów tygodniowych
   * @throws Error jeśli plan nie istnieje lub nie należy do użytkownika
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   *
   * @example
   * ```typescript
   * const weeklyGoals = await weeklyGoalService.listWeeklyGoals({
   *   plan_id: 'uuid',
   *   week_number: 3,
   *   milestone_id: 'uuid',
   *   limit: 50,
   *   offset: 0
   * }, userId);
   * // Returns weekly goals sorted by position
   * ```
   */
  async listWeeklyGoals(params: WeeklyGoalListParams, userId: string): Promise<WeeklyGoalDTO[]> {
    // Step 1: Verify plan exists and belongs to user
    const planService = new PlanService(this.supabase);
    const plan = await planService.getPlanById(params.plan_id, userId);

    if (!plan) {
      throw new Error("Plan not found or does not belong to user");
    }

    // Step 2: Build query with filters
    let query = this.supabase.from("weekly_goals").select("*").eq("plan_id", params.plan_id);

    // Apply optional filters
    if (params.week_number !== undefined) {
      query = query.eq("week_number", params.week_number);
    }

    if (params.long_term_goal_id !== undefined) {
      query = query.eq("long_term_goal_id", params.long_term_goal_id);
    }

    if (params.milestone_id !== undefined) {
      query = query.eq("milestone_id", params.milestone_id);
    }

    // Apply pagination
    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    // Order by position
    query = query.order("position", { ascending: true });

    // Step 3: Execute query
    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch weekly goals: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Aktualizuje cel tygodniowy (partial update)
   * Weryfikuje, że cel należy do użytkownika przez relację weekly_goal → plan → user
   *
   * @param id - UUID celu tygodniowego
   * @param userId - ID użytkownika (z DEFAULT_USER_ID)
   * @param data - Dane do aktualizacji (wszystkie pola opcjonalne, włącznie z milestone_id)
   * @returns Promise z zaktualizowanym celem lub null jeśli nie istnieje
   * @throws Error jeśli long_term_goal_id nie istnieje lub nie należy do tego samego planu
   * @throws Error jeśli milestone_id nie istnieje lub nie należy do goala w tym samym planie
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   *
   * @example
   * ```typescript
   * const weeklyGoal = await weeklyGoalService.updateWeeklyGoal(id, userId, {
   *   title: 'Updated Title',
   *   milestone_id: 'uuid',
   *   position: 2
   * });
   * if (!weeklyGoal) {
   *   // Weekly goal not found or doesn't belong to user
   * }
   * ```
   */
  async updateWeeklyGoal(id: string, userId: string, data: UpdateWeeklyGoalCommand): Promise<WeeklyGoalDTO | null> {
    // Step 1: Verify weekly goal exists and belongs to user
    const existingWeeklyGoal = await this.getWeeklyGoalById(id, userId);

    if (!existingWeeklyGoal) {
      return null;
    }

    // Step 2: If long_term_goal_id changed and not null, verify it
    if (data.long_term_goal_id !== undefined && data.long_term_goal_id !== null) {
      const goalService = new GoalService(this.supabase);
      const goal = await goalService.getGoalById(data.long_term_goal_id, userId);

      if (!goal) {
        throw new Error("Long-term goal not found or does not belong to user");
      }

      // Verify goal belongs to same plan
      if (goal.plan_id !== existingWeeklyGoal.plan_id) {
        throw new Error("Long-term goal does not belong to the same plan");
      }
    }

    // Step 3: If milestone_id changed and not null, verify it
    if (data.milestone_id !== undefined && data.milestone_id !== null) {
      await this.validateMilestoneInPlan(data.milestone_id, existingWeeklyGoal.plan_id);
    }

    // Step 4: Prepare partial update data
    const updateData: WeeklyGoalUpdate = {};

    if (data.long_term_goal_id !== undefined) {
      updateData.long_term_goal_id = data.long_term_goal_id;
    }

    if (data.milestone_id !== undefined) {
      updateData.milestone_id = data.milestone_id;
    }

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.position !== undefined) {
      updateData.position = data.position;
    }

    // updated_at is automatically set by database trigger

    // Step 5: Execute update
    const { data: weeklyGoal, error } = await this.supabase
      .from("weekly_goals")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    // Step 6: Handle database errors
    if (error) {
      throw new Error(`Failed to update weekly goal: ${error.message}`);
    }

    return weeklyGoal;
  }

  /**
   * Usuwa cel tygodniowy
   * Weryfikuje, że cel należy do użytkownika przez relację weekly_goal → plan → user
   * Automatycznie usuwa powiązane subtasks (CASCADE)
   *
   * @param id - UUID celu tygodniowego
   * @param userId - ID użytkownika (z DEFAULT_USER_ID)
   * @returns Promise z true jeśli usunięto lub false jeśli cel nie istnieje
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   *
   * @example
   * ```typescript
   * const deleted = await weeklyGoalService.deleteWeeklyGoal(id, userId);
   * if (!deleted) {
   *   // Weekly goal not found or doesn't belong to user
   * }
   * ```
   */
  async deleteWeeklyGoal(id: string, userId: string): Promise<boolean> {
    // Step 1: Verify weekly goal exists and belongs to user
    const existingWeeklyGoal = await this.getWeeklyGoalById(id, userId);

    if (!existingWeeklyGoal) {
      return false;
    }

    // Step 2: Execute delete - cascade will remove all related subtasks
    const { error } = await this.supabase.from("weekly_goals").delete().eq("id", id);

    // Step 3: Handle database errors
    if (error) {
      throw new Error(`Failed to delete weekly goal: ${error.message}`);
    }

    // Note: Database CASCADE DELETE automatically removes:
    // - tasks with task_type = 'weekly_sub' (ON DELETE CASCADE)

    return true;
  }

  /**
   * Pobiera wszystkie cele tygodniowe powiązane z konkretnym celem długoterminowym
   * Weryfikuje, że cel długoterminowy należy do użytkownika przez INNER JOIN
   * GET /api/v1/goals/:goalId/weekly-goals
   *
   * @param goalId - UUID celu długoterminowego
   * @param userId - ID użytkownika
   * @returns Promise z tablicą celów tygodniowych posortowanych po week_number i position
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   *
   * @example
   * ```typescript
   * const weeklyGoals = await weeklyGoalService.getWeeklyGoalsByGoalId(goalId, userId);
   * // Returns weekly goals sorted by week_number ASC, position ASC
   * ```
   */
  async getWeeklyGoalsByGoalId(goalId: string, userId: string): Promise<WeeklyGoalDTO[]> {
    try {
      // Query with security check via join with long_term_goals table
      // This ensures user_id verification at database level
      const { data, error } = await this.supabase
        .from("weekly_goals")
        .select(
          `
          *,
          long_term_goals!inner(user_id)
        `
        )
        .eq("long_term_goal_id", goalId)
        .eq("long_term_goals.user_id", userId)
        .order("week_number", { ascending: true })
        .order("position", { ascending: true });

      if (error) {
        throw new Error("Failed to fetch weekly goals");
      }

      // Remove the joined data from response
      return (data || []).map(({ long_term_goals: _long_term_goals, ...weeklyGoal }) => weeklyGoal) as WeeklyGoalDTO[];
    } catch (error) {
      throw error;
    }
  }
}
