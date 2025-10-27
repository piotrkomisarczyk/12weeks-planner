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
  status: z.enum(['active', 'completed', 'archived']).nullish(),
  limit: z.coerce.number().int().positive().max(100).catch(50),
  offset: z.coerce.number().int().min(0).catch(0)
}).transform((data) => ({
  ...data,
  status: data.status ?? undefined
}));

/**
 * Inferred TypeScript type from GetPlansQuerySchema
 */
export type GetPlansQuery = z.infer<typeof GetPlansQuerySchema>;

/**
 * Validation schema for GET /api/v1/plans/:id
 * Validates UUID format for plan ID parameter
 */
export const GetPlanByIdParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid plan ID format' })
});

/**
 * Inferred TypeScript type from GetPlanByIdParamsSchema
 */
export type GetPlanByIdParams = z.infer<typeof GetPlanByIdParamsSchema>;

/**
 * Request body schema for POST /api/v1/plans
 * Validates plan creation data
 * 
 * Validates:
 * - name: required string, 1-255 characters, trimmed
 * - start_date: required string in YYYY-MM-DD format, must be a valid date
 * 
 * Note: Monday validation is handled by database trigger
 */
export const CreatePlanBodySchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: 'Name is required' })
    .max(255, { message: 'Name must not exceed 255 characters' }),
  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Start date must be in YYYY-MM-DD format' })
    .refine((dateStr) => {
      // Check if date string can be parsed
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) {
        return false;
      }
      
      // Verify that parsing the date back to ISO string matches input
      // This catches invalid dates like "2025-02-30" which JavaScript silently converts
      const [year, month, day] = dateStr.split('-').map(Number);
      return (
        parsed.getFullYear() === year &&
        parsed.getMonth() === month - 1 && // getMonth() is 0-indexed
        parsed.getDate() === day
      );
    }, { message: 'Invalid date' })
    // Note: Monday validation is handled by database trigger
});

/**
 * Inferred TypeScript type from CreatePlanBodySchema
 */
export type CreatePlanBody = z.infer<typeof CreatePlanBodySchema>;

/**
 * Request body schema for PATCH /api/v1/plans/:id
 * Validates plan update data
 * 
 * Validates:
 * - name: required string, 1-255 characters, trimmed
 */
export const UpdatePlanBodySchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: 'Name is required' })
    .max(255, { message: 'Name must not exceed 255 characters' })
});

/**
 * Inferred TypeScript type from UpdatePlanBodySchema
 */
export type UpdatePlanBody = z.infer<typeof UpdatePlanBodySchema>;

/**
 * URL parameter schema for endpoints with :id
 * Validates UUID format for plan ID
 */
export const PlanIdParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid plan ID format' })
});

/**
 * Inferred TypeScript type from PlanIdParamsSchema
 */
export type PlanIdParams = z.infer<typeof PlanIdParamsSchema>;

