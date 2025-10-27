/**
 * Plan Service
 * Handles business logic for plan-related operations
 */

import type { SupabaseClient } from '../../db/supabase.client';
import type { 
  PlanDTO, 
  PlanListParams, 
  PaginatedResponse,
  CreatePlanCommand,
  UpdatePlanCommand,
  PlanInsert,
  PlanUpdate
} from '../../types';

export class PlanService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Pobiera listę planerów dla danego użytkownika
   * 
   * @param userId - ID użytkownika (z tokenu JWT)
   * @param params - Parametry zapytania (status, limit, offset)
   * @returns Promise z listą planerów i metadanymi paginacji
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   * 
   * @example
   * ```typescript
   * const plans = await planService.getPlans(userId, {
   *   status: 'active',
   *   limit: 10,
   *   offset: 0
   * });
   * ```
   */
  async getPlans(
    userId: string,
    params: PlanListParams
  ): Promise<PaginatedResponse<PlanDTO>> {
    const { status, limit = 50, offset = 0 } = params;

    // Build base query with count
    let query = this.supabase
      .from('plans')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    // Handle database errors
    if (error) {
      throw new Error(`Failed to fetch plans: ${error.message}`);
    }

    // Return paginated response
    return {
      data: data || [],
      count: count || 0,
      limit,
      offset
    };
  }

  /**
   * Pobiera aktywny planer dla danego użytkownika
   * 
   * @param userId - ID użytkownika (z tokenu JWT)
   * @returns Promise z aktywnym planerem lub null jeśli nie istnieje
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   * 
   * @example
   * ```typescript
   * const activePlan = await planService.getActivePlan(userId);
   * if (!activePlan) {
   *   // No active plan found
   * }
   * ```
   */
  async getActivePlan(userId: string): Promise<PlanDTO | null> {
    // Query for active plan
    const { data, error } = await this.supabase
      .from('plans')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .single();

    // Handle not found (expected case)
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - this is not an error, just no active plan
        return null;
      }
      // Actual database error
      throw new Error(`Failed to fetch active plan: ${error.message}`);
    }

    return data;
  }

  /**
   * Pobiera konkretny planer po ID
   * Weryfikuje, że planer należy do danego użytkownika
   * 
   * @param planId - UUID planera
   * @param userId - ID użytkownika (z tokenu JWT)
   * @returns Promise z planerem lub null jeśli nie istnieje/nie należy do użytkownika
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   * 
   * @example
   * ```typescript
   * const plan = await planService.getPlanById(planId, userId);
   * if (!plan) {
   *   // Plan not found or doesn't belong to user
   * }
   * ```
   */
  async getPlanById(planId: string, userId: string): Promise<PlanDTO | null> {
    // Query for plan by ID, filtered by user_id for security
    const { data, error } = await this.supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', userId)
      .limit(1)
      .single();

    // Handle not found (expected case)
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - either doesn't exist or belongs to another user
        return null;
      }
      // Actual database error
      throw new Error(`Failed to fetch plan: ${error.message}`);
    }

    return data;
  }

  /**
   * Tworzy nowy 12-tygodniowy planer
   * 
   * @param userId - ID użytkownika (z tokenu JWT)
   * @param data - Dane planera (name, start_date)
   * @returns Promise z utworzonym planerem
   * @throws Error jeśli start_date nie jest poniedziałkiem (constraint violation)
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   * 
   * @example
   * ```typescript
   * const plan = await planService.createPlan(userId, {
   *   name: 'Q1 2025 Goals',
   *   start_date: '2025-01-06'
   * });
   * ```
   */
  async createPlan(
    userId: string,
    data: CreatePlanCommand
  ): Promise<PlanDTO> {
    // Prepare insert data with user_id
    const insertData: PlanInsert = {
      user_id: userId,
      name: data.name,
      start_date: data.start_date,
      status: 'active' // Default status
    };

    // Execute insert
    const { data: plan, error } = await this.supabase
      .from('plans')
      .insert(insertData)
      .select()
      .single();

    // Handle database errors
    if (error) {
      // Check for constraint violations
      if (error.code === '23514') {  // CHECK constraint
        throw new Error('Start date must be a Monday');
      }
      // Other database errors
      throw new Error(`Failed to create plan: ${error.message}`);
    }

    return plan;
  }

  /**
   * Aktualizuje istniejący planer (tylko nazwę)
   * Weryfikuje, że planer należy do użytkownika
   * 
   * @param planId - UUID planera
   * @param userId - ID użytkownika (z tokenu JWT)
   * @param data - Dane do aktualizacji (name)
   * @returns Promise z zaktualizowanym planerem lub null jeśli nie istnieje
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   * 
   * @example
   * ```typescript
   * const plan = await planService.updatePlan(planId, userId, {
   *   name: 'Updated Q1 2025 Goals'
   * });
   * if (!plan) {
   *   // Plan not found or doesn't belong to user
   * }
   * ```
   */
  async updatePlan(
    planId: string,
    userId: string,
    data: UpdatePlanCommand
  ): Promise<PlanDTO | null> {
    // First verify plan exists and belongs to user
    const existingPlan = await this.getPlanById(planId, userId);
    
    if (!existingPlan) {
      return null;
    }

    // Prepare update data
    const updateData: PlanUpdate = {
      name: data.name,
      // updated_at is automatically set by database trigger
    };

    // Execute update
    const { data: plan, error } = await this.supabase
      .from('plans')
      .update(updateData)
      .eq('id', planId)
      .eq('user_id', userId)  // Security: ensure user owns the plan
      .select()
      .single();

    // Handle database errors
    if (error) {
      throw new Error(`Failed to update plan: ${error.message}`);
    }

    return plan;
  }

  /**
   * Archiwizuje planer (zmiana statusu na 'archived')
   * Weryfikuje, że planer należy do użytkownika
   * 
   * @param planId - UUID planera
   * @param userId - ID użytkownika (z tokenu JWT)
   * @returns Promise z zarchiwizowanym planerem lub null jeśli nie istnieje
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   * 
   * @example
   * ```typescript
   * const plan = await planService.archivePlan(planId, userId);
   * if (!plan) {
   *   // Plan not found or doesn't belong to user
   * }
   * ```
   */
  async archivePlan(
    planId: string,
    userId: string
  ): Promise<PlanDTO | null> {
    // First verify plan exists and belongs to user
    const existingPlan = await this.getPlanById(planId, userId);
    
    if (!existingPlan) {
      return null;
    }

    // Update status to archived
    const { data: plan, error } = await this.supabase
      .from('plans')
      .update({ status: 'archived' })
      .eq('id', planId)
      .eq('user_id', userId)  // Security: ensure user owns the plan
      .select()
      .single();

    // Handle database errors
    if (error) {
      throw new Error(`Failed to archive plan: ${error.message}`);
    }

    return plan;
  }
}

