import type { APIRoute } from 'astro';
import { UserService } from '../../../../lib/services/user.service';
import { DEFAULT_USER_ID } from '../../../../db/supabase.client';
import type { ItemResponse, UserMetricsDTO, ErrorResponse } from '../../../../types';

export const prerender = false;

/**
 * GET /api/v1/users/metrics
 * 
 * Retrieve success metrics for the authenticated user.
 * Metrics are automatically updated by database triggers when users create plans
 * or complete goals.
 * 
 * Metrics include:
 * - first_planner_created: Whether user created their first plan
 * - first_planner_completed: Whether user completed their first plan
 * - total_plans_created: Total number of plans created
 * - total_goals_completed: Total number of goals completed
 * 
 * @returns 200 OK with user metrics object
 * @returns 401 Unauthorized if not authenticated
 * @returns 404 Not Found if user has no metrics yet (new user)
 * @returns 500 Internal Server Error on database errors
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Authentication check
    // Note: Using DEFAULT_USER_ID for development/testing
    // In production, this should be replaced with proper auth from locals.supabase
    const supabase = locals.supabase;
    const userId = DEFAULT_USER_ID;

    // Uncomment for production authentication:
    // const { data: { user }, error: authError } = await supabase.auth.getUser();
    // if (authError || !user) {
    //   return new Response(
    //     JSON.stringify({
    //       error: 'Unauthorized',
    //       message: 'Authentication required',
    //     } as ErrorResponse),
    //     { status: 401, headers: { 'Content-Type': 'application/json' } }
    //   );
    // }
    // const userId = user.id;

    // 2. Fetch user metrics using service
    const userService = new UserService(supabase);
    const result = await userService.getUserMetrics(userId);

    // 3. Check for errors from service
    if ('error' in result) {
      // Check if it's a "not found" error
      if (result.error === 'User metrics not found') {
        return new Response(
          JSON.stringify({
            error: 'Not found',
            message: 'User metrics not found',
          } as ErrorResponse),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Other errors are internal server errors
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: result.error,
        } as ErrorResponse),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Return successful response
    const response: ItemResponse<UserMetricsDTO> = {
      data: result.data,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching user metrics:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to fetch user metrics',
      } as ErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

