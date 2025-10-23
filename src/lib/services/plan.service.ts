/**
 * Plan Service
 * Handles business logic for plan-related operations
 */

import type { SupabaseClient } from '../../db/supabase.client';
import type { PlanDTO, PlanListParams, PaginatedResponse } from '../../types';

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
}

