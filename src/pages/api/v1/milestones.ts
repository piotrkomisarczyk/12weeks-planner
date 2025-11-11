/**
 * API Endpoints: /api/v1/milestones
 * 
 * GET - List milestones with optional filters
 * POST - Create a new milestone
 * 
 * GET Query Parameters:
 * - long_term_goal_id: UUID (optional) - filter by goal
 * - is_completed: 'true' | 'false' (optional) - filter by completion status
 * - limit: number (optional, default: 50, max: 100) - pagination limit
 * - offset: number (optional, default: 0) - pagination offset
 * 
 * POST Request Body:
 * - long_term_goal_id: UUID (required)
 * - title: string (required, 1-255 characters)
 * - description: string (optional)
 * - due_date: string (optional, YYYY-MM-DD format)
 * - position: integer (1-5, default: 1)
 * 
 * Responses:
 * - 200: Success (GET)
 * - 201: Created (POST)
 * - 400: Validation error or constraint violation
 * - 404: Goal not found
 * - 500: Internal server error
 */

import type { APIRoute } from 'astro';
import { supabaseClient, DEFAULT_USER_ID } from '../../../db/supabase.client';
import { MilestoneService } from '../../../lib/services/milestone.service';
import {
  listMilestonesQuerySchema,
  createMilestoneSchema,
} from '../../../lib/validation/milestone.validation';
import { z } from 'zod';
import type {
  ErrorResponse,
  ValidationErrorResponse,
  ListResponse,
  ItemResponse,
  MilestoneDTO
} from '../../../types';

export const prerender = false;

/**
 * GET /api/v1/milestones
 * List milestones with optional filters
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // Step 1: Authentication - Using default user for MVP
    const userId = DEFAULT_USER_ID;

    // Step 2: Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      long_term_goal_id: url.searchParams.get('long_term_goal_id') ?? undefined,
      is_completed: url.searchParams.get('is_completed') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    };

    const validatedParams = listMilestonesQuerySchema.parse(queryParams);

    // Step 3: Get milestones from service
    const milestoneService = new MilestoneService(supabaseClient);
    const result = await milestoneService.listMilestones(
      validatedParams,
      userId
    );

    // Step 4: Return success response
    const response: ListResponse<MilestoneDTO> = {
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
          field: e.path.join('.') || '_root',
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

    // Other errors
    console.error('Error in GET /api/v1/milestones:', error);
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

/**
 * POST /api/v1/milestones
 * Create a new milestone
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Step 1: Authentication - Using default user for MVP
    const userId = DEFAULT_USER_ID;

    // Step 2: Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ErrorResponse = {
        error: 'Bad Request',
        message: 'Invalid JSON in request body',
      };

      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 3: Validate request body
    const validatedData = createMilestoneSchema.parse(body);

    // Step 4: Create milestone via service
    const milestoneService = new MilestoneService(supabaseClient);
    const milestone = await milestoneService.createMilestone(
      validatedData,
      userId
    );

    // Step 5: Return success response
    const response: ItemResponse<MilestoneDTO> = {
      data: milestone,
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // Zod validation error
    if (error instanceof z.ZodError) {
      const errorResponse: ValidationErrorResponse = {
        error: 'Validation failed',
        details: error.errors.map((e) => ({
          field: e.path.join('.') || '_root',
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

    // Not found errors
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

    // Max milestones constraint
    if (error instanceof Error && error.message.includes('Cannot add more than 5')) {
      const errorResponse: ErrorResponse = {
        error: 'Bad Request',
        message: error.message,
      };

      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Other errors
    console.error('Error in POST /api/v1/milestones:', error);
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

