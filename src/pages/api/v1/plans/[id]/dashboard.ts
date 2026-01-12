/**
 * API Endpoint: /api/v1/plans/:id/dashboard
 *
 * GET - Retrieves aggregated dashboard data for a plan
 * Returns flat structure with plan, goals, milestones, weekly goals, tasks, and metrics
 *
 * Authentication required.
 */

import type { APIRoute } from 'astro';
import { PlanService } from '../../../../../lib/services/plan.service';
import {
  PlanIdParamsSchema,
  GetDashboardQuerySchema
} from '../../../../../lib/validation/plan.validation';
import { DEFAULT_USER_ID } from '../../../../../db/supabase.client';
import type {
  ErrorResponse,
  ValidationErrorResponse,
  PlanDashboardResponse
} from '../../../../../types';

export const prerender = false;

/**
 * GET /api/v1/plans/:id/dashboard
 * Retrieves aggregated dashboard data for a plan
 */
export const GET: APIRoute = async ({ locals, params, url }) => {
  try {
    // Step 1: Authentication
    const userId = DEFAULT_USER_ID;

    // Step 2: Validate URL parameter
    const paramValidation = PlanIdParamsSchema.safeParse(params);

    if (!paramValidation.success) {
      const details = paramValidation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        received: 'input' in issue ? issue.input : undefined
      }));

      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details
        } as ValidationErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 3: Parse and validate query parameters
    const urlSearchParams = new URL(url).searchParams;
    const queryParams = {
      week_view: urlSearchParams.get('week_view'),
      status_view: urlSearchParams.get('status_view'),
      week_number: urlSearchParams.get('week_number')
    };

    const queryValidation = GetDashboardQuerySchema.safeParse(queryParams);

    if (!queryValidation.success) {
      const details = queryValidation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        received: 'input' in issue ? issue.input : undefined
      }));

      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details
        } as ValidationErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 4: Call service to fetch dashboard data
    const planService = new PlanService(locals.supabase);
    const dashboardData = await planService.getDashboardData(
      paramValidation.data.id,
      userId,
      {
        weekView: queryValidation.data.week_view,
        statusView: queryValidation.data.status_view,
        weekNumber: queryValidation.data.week_number
      }
    );

    // Step 5: Handle not found
    if (!dashboardData) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'Plan not found'
        } as ErrorResponse),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 6: Return successful response
    return new Response(
      JSON.stringify({ data: dashboardData }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'private, max-age=60'
        }
      }
    );
  } catch (error) {
    console.error('Error in GET /api/v1/plans/:id/dashboard:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      } as ErrorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};