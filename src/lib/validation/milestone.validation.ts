/**
 * Validation schemas for Milestone-related API endpoints
 * Uses Zod for runtime type validation and type inference
 */

import { z } from 'zod';

/**
 * UUID validation helper
 * Validates UUID v4 format
 */
export const uuidSchema = z.string().uuid({
  message: 'Invalid UUID format'
});

/**
 * Query parameters schema for GET /api/v1/milestones
 * Validates filtering and pagination parameters
 * 
 * Validates:
 * - long_term_goal_id: optional UUID for filtering by goal
 * - is_completed: optional boolean string ('true' or 'false')
 * - limit: integer 1-100, defaults to 50
 * - offset: integer >= 0, defaults to 0
 */
export const listMilestonesQuerySchema = z.object({
  long_term_goal_id: uuidSchema.optional(),
  is_completed: z.enum(['true', 'false'], {
    errorMap: () => ({ message: "Must be 'true' or 'false'" })
  }).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Inferred TypeScript type from listMilestonesQuerySchema
 */
export type ListMilestonesQuery = z.infer<typeof listMilestonesQuerySchema>;

/**
 * Request body schema for POST /api/v1/milestones
 * Validates milestone creation data
 * 
 * Validates:
 * - long_term_goal_id: required UUID
 * - title: required string, 1-255 characters
 * - description: optional string, nullable
 * - due_date: optional date string in YYYY-MM-DD format, nullable
 * - position: integer 1-5, defaults to 1
 */
export const createMilestoneSchema = z.object({
  long_term_goal_id: uuidSchema,
  title: z.string()
    .min(1, { message: 'Title is required' })
    .max(255, { message: 'Title must be max 255 characters' }),
  description: z.string().optional().nullable(),
  due_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Must be in YYYY-MM-DD format' })
    .optional()
    .nullable(),
  position: z.number()
    .int({ message: 'Position must be an integer' })
    .min(1, { message: 'Position must be at least 1' })
    .max(5, { message: 'Position must be at most 5' })
    .default(1),
});

/**
 * Inferred TypeScript type from createMilestoneSchema
 */
export type CreateMilestoneData = z.infer<typeof createMilestoneSchema>;

/**
 * Request body schema for PATCH /api/v1/milestones/:id
 * Validates partial milestone update data
 * 
 * All fields are optional - allows partial updates
 * At least one field must be provided (validated by refine)
 * 
 * Validates:
 * - title: optional string, 1-255 characters
 * - description: optional string, nullable
 * - due_date: optional date string in YYYY-MM-DD format, nullable
 * - is_completed: optional boolean
 * - position: optional integer 1-5
 */
export const updateMilestoneSchema = z.object({
  title: z.string()
    .min(1, { message: 'Title cannot be empty' })
    .max(255, { message: 'Title must be max 255 characters' })
    .optional(),
  description: z.string().optional().nullable(),
  due_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Must be in YYYY-MM-DD format' })
    .optional()
    .nullable(),
  is_completed: z.boolean({
    errorMap: () => ({ message: 'Must be a boolean' })
  }).optional(),
  position: z.number()
    .int({ message: 'Position must be an integer' })
    .min(1, { message: 'Position must be at least 1' })
    .max(5, { message: 'Position must be at most 5' })
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

/**
 * Inferred TypeScript type from updateMilestoneSchema
 */
export type UpdateMilestoneData = z.infer<typeof updateMilestoneSchema>;

