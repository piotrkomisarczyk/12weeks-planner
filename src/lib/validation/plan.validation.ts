/**
 * Validation schemas for Plan-related API endpoints
 * Uses Zod for runtime type validation and type inference
 */

import { z } from 'zod';

/**
 * Query parameters schema for GET /api/v1/plans
 * 
 * Validates:
 * - status: must be one of 'active', 'completed', 'archived' (optional)
 * - limit: positive integer, max 100, defaults to 50
 * - offset: non-negative integer, defaults to 0
 */
export const GetPlansQuerySchema = z.object({
  status: z.enum(['active', 'completed', 'archived']).nullable().optional(),
  limit: z.coerce.number().int().positive().max(100).catch(50),
  offset: z.coerce.number().int().min(0).catch(0)
});

/**
 * Inferred TypeScript type from GetPlansQuerySchema
 */
export type GetPlansQuery = z.infer<typeof GetPlansQuerySchema>;


