/**
 * Goal Service
 * Handles business logic for long-term goal operations
 */

import type { SupabaseClient } from '../../db/supabase.client';
import type { 
  GoalDTO, 
  CreateGoalCommand,
  UpdateGoalCommand,
  LongTermGoalInsert,
  LongTermGoalUpdate
} from '../../types';
import { PlanService } from './plan.service';

export class GoalService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Tworzy nowy długoterminowy cel
   * 
   * @param userId - ID użytkownika (z tokenu JWT)
   * @param data - Dane celu (plan_id, title, description, category, progress_percentage, position)
   * @returns Promise z utworzonym celem
   * @throws Error jeśli plan nie istnieje lub nie należy do użytkownika
   * @throws Error jeśli przekroczono limit 5 celów (constraint violation)
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   * 
   * @example
   * ```typescript
   * const goal = await goalService.createGoal(userId, {
   *   plan_id: 'uuid',
   *   title: 'Launch MVP',
   *   description: 'Important for career growth',
   *   category: 'work',
   *   progress_percentage: 0,
   *   position: 1
   * });
   * ```
   */
  async createGoal(
    userId: string,
    data: CreateGoalCommand
  ): Promise<GoalDTO> {
    // Step 1: Verify plan exists and belongs to user
    const planService = new PlanService(this.supabase);
    const plan = await planService.getPlanById(data.plan_id, userId);
    
    if (!plan) {
      throw new Error('Plan not found or does not belong to user');
    }

    // Step 2: Prepare insert data
    const insertData: LongTermGoalInsert = {
      plan_id: data.plan_id,
      title: data.title,
      description: data.description ?? null,
      category: data.category ?? null,
      progress_percentage: data.progress_percentage ?? 0,
      position: data.position ?? 1
    };

    // Step 3: Execute insert
    const { data: goal, error } = await this.supabase
      .from('long_term_goals')
      .insert(insertData)
      .select()
      .single();

    // Step 4: Handle database errors
    if (error) {
      // Check for constraint violations (max 5 goals per plan)
      if (error.code === '23514' || error.message.includes('max_goals')) {
        throw new Error('Maximum 5 goals per plan exceeded');
      }
      
      // Other database errors
      throw new Error(`Failed to create goal: ${error.message}`);
    }

    return goal;
  }

  /**
   * Pobiera cel po ID
   * Weryfikuje, że cel należy do użytkownika (przez plan_id)
   * 
   * @param goalId - UUID celu
   * @param userId - ID użytkownika
   * @returns Promise z celem lub null jeśli nie istnieje/nie należy do użytkownika
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   * 
   * @example
   * ```typescript
   * const goal = await goalService.getGoalById(goalId, userId);
   * if (!goal) {
   *   // Goal not found or doesn't belong to user
   * }
   * ```
   */
  async getGoalById(goalId: string, userId: string): Promise<GoalDTO | null> {
    // Join with plans to verify user ownership
    const { data, error } = await this.supabase
      .from('long_term_goals')
      .select(`
        *,
        plans!inner(user_id)
      `)
      .eq('id', goalId)
      .eq('plans.user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch goal: ${error.message}`);
    }

    // Remove nested plans data before returning
    if (data) {
      const { plans, ...goal } = data as any;
      return goal as GoalDTO;
    }

    return null;
  }

  /**
   * Pobiera listę celów dla konkretnego planera
   * Weryfikuje, że plan należy do użytkownika
   * 
   * @param planId - UUID planera
   * @param userId - ID użytkownika
   * @returns Promise z tablicą celów
   * @throws Error jeśli plan nie istnieje lub nie należy do użytkownika
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   * 
   * @example
   * ```typescript
   * const goals = await goalService.getGoalsByPlanId(planId, userId);
   * // Returns goals sorted by position
   * ```
   */
  async getGoalsByPlanId(planId: string, userId: string): Promise<GoalDTO[]> {
    // First verify plan exists and belongs to user
    const planService = new PlanService(this.supabase);
    const plan = await planService.getPlanById(planId, userId);
    
    if (!plan) {
      throw new Error('Plan not found or does not belong to user');
    }

    // Query for goals
    const { data, error } = await this.supabase
      .from('long_term_goals')
      .select('*')
      .eq('plan_id', planId)
      .order('position', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch goals: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Aktualizuje cel długoterminowy (partial update)
   * Weryfikuje, że cel należy do użytkownika przez relację goal → plan → user
   * 
   * @param goalId - UUID celu
   * @param userId - ID użytkownika (z DEFAULT_USER_ID)
   * @param data - Dane do aktualizacji (wszystkie pola opcjonalne)
   * @returns Promise z zaktualizowanym celem lub null jeśli nie istnieje
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   * 
   * @example
   * ```typescript
   * const goal = await goalService.updateGoal(goalId, userId, {
   *   title: 'Updated Title',
   *   progress_percentage: 75
   * });
   * if (!goal) {
   *   // Goal not found or doesn't belong to user
   * }
   * ```
   */
  async updateGoal(
    goalId: string,
    userId: string,
    data: UpdateGoalCommand
  ): Promise<GoalDTO | null> {
    // First verify goal exists and belongs to user
    const existingGoal = await this.getGoalById(goalId, userId);
    
    if (!existingGoal) {
      return null;
    }

    // Prepare update data with only provided fields
    const updateData: LongTermGoalUpdate = {};
    
    if (data.title !== undefined) {
      updateData.title = data.title;
    }
    
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    
    if (data.category !== undefined) {
      updateData.category = data.category;
    }
    
    if (data.progress_percentage !== undefined) {
      updateData.progress_percentage = data.progress_percentage;
    }
    
    if (data.position !== undefined) {
      updateData.position = data.position;
    }
    
    // updated_at is automatically set by database trigger

    // Execute update
    const { data: goal, error } = await this.supabase
      .from('long_term_goals')
      .update(updateData)
      .eq('id', goalId)
      .select()
      .single();

    // Handle database errors
    if (error) {
      throw new Error(`Failed to update goal: ${error.message}`);
    }

    return goal;
  }

  /**
   * Usuwa cel długoterminowy
   * Weryfikuje, że cel należy do użytkownika przez relację goal → plan → user
   * Automatycznie usuwa powiązane milestones (CASCADE)
   * Automatycznie ustawia long_term_goal_id = NULL w weekly_goals (SET NULL)
   * 
   * @param goalId - UUID celu
   * @param userId - ID użytkownika (z DEFAULT_USER_ID)
   * @returns Promise z true jeśli usunięto lub false jeśli cel nie istnieje
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   * 
   * @example
   * ```typescript
   * const deleted = await goalService.deleteGoal(goalId, userId);
   * if (!deleted) {
   *   // Goal not found or doesn't belong to user
   * }
   * ```
   */
  async deleteGoal(
    goalId: string,
    userId: string
  ): Promise<boolean> {
    // First verify goal exists and belongs to user
    const existingGoal = await this.getGoalById(goalId, userId);
    
    if (!existingGoal) {
      return false;
    }

    // Execute delete - cascade will remove all related milestones
    const { error } = await this.supabase
      .from('long_term_goals')
      .delete()
      .eq('id', goalId);

    // Handle database errors
    if (error) {
      throw new Error(`Failed to delete goal: ${error.message}`);
    }

    // Note: Database CASCADE DELETE automatically removes:
    // - milestones (ON DELETE CASCADE)
    // Note: Database SET NULL automatically updates:
    // - weekly_goals.long_term_goal_id = NULL (ON DELETE SET NULL)

    return true;
  }
}
