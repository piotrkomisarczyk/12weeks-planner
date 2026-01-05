/**
 * API Endpoints: /api/v1/milestones/:milestoneId/tasks
 * 
 * GET - Get all tasks for a specific milestone with optional filters
 * 
 * URL Parameters:
 * - milestoneId: UUID (required) - milestone ID
 * 
 * Query Parameters:
 * - status: 'todo' | 'in_progress' | 'completed' | 'cancelled' | 'postponed' (optional)
 * - week_number: number (optional, 1-12) - filter by week
 * - limit: number (optional, default: 50, max: 100) - pagination limit
 * - offset: number (optional, default: 0) - pagination offset
 * 
 * Responses:
 * - 200: Success
 * - 400: Validation error
 * - 404: Milestone not found
 * - 500: Internal server error
 */

import type { APIRoute } from 'astro';
import { supabaseClient, DEFAULT_USER_ID } from '../../../../../db/supabase.client';
import { MilestoneService } from '../../../../../lib/services/milestone.service';
import {
  uuidSchema,
  listTasksByMilestoneQuerySchema,
} from '../../../../../lib/validation/milestone.validation';
import { z } from 'zod';
import type {
  ErrorResponse,
  ValidationErrorResponse,
  ListResponse,
  TaskDTO
} from '../../../../../types';

export const prerender = false;

/**
 * GET /api/v1/milestones/:milestoneId/tasks
 * Get all tasks for a specific milestone with optional filters
 */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    // Step 1: Authentication - Using default user for MVP
    const userId = DEFAULT_USER_ID;

    // Step 2: Validate milestone ID
    const milestoneId = uuidSchema.parse(params.milestoneId);

    // Step 3: Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      status: url.searchParams.get('status') ?? undefined,
      week_number: url.searchParams.get('week_number') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    };

    const validatedParams = listTasksByMilestoneQuerySchema.parse(queryParams);

    // Step 4: Get tasks from service
    const milestoneService = new MilestoneService(supabaseClient);
    const result = await milestoneService.getTasksByMilestoneId(
      milestoneId,
      validatedParams,
      userId
    );

    // Step 5: Return success response
    const response: ListResponse<TaskDTO> = {
      data: result.data,
      count: result.count,
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // Zod validation error
    if (error instanceof z.ZodError) {
      const errorResponse: ValidationErrorResponse = {
        error: 'Validation failed',
        details: error.errors.map((e) => ({
          field: e.path.join('.') || 'milestoneId',
          message: e.message,
          received: 'input' in e ? e.input : undefined,
        })),
      };

      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Not found error
    if (error instanceof Error && error.message.includes('not found')) {
      const errorResponse: ErrorResponse = {
        error: 'Not Found',
        message: error.message,
      };

      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Other errors
    console.error('Error in GET /api/v1/milestones/:milestoneId/tasks:', error);
    const errorResponse: ErrorResponse = {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

