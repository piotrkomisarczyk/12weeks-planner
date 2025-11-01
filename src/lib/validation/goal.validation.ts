/**
 * Validation schemas for Goal-related API endpoints
 * Uses Zod for runtime type validation and type inference
 */

import { z } from 'zod';

/**
 * Request body schema for POST /api/v1/goals
 * Validates goal creation data
 * 
 * Validates:
 * - plan_id: required UUID string
 * - title: required string, 1-255 characters, trimmed
 * - description: optional string, nullable
 * - category: optional enum, nullable - work, finance, hobby, relationships, health, development
 * - progress_percentage: integer 0-100, defaults to 0
 * - position: integer 1-5, defaults to 1
 */
export const CreateGoalBodySchema = z.object({
  plan_id: z.string().uuid({ message: 'Invalid plan ID format' }),
  
  title: z.string()
    .trim()
    .min(1, { message: 'Title is required' })
    .max(255, { message: 'Title must not exceed 255 characters' }),
  
  description: z.string().trim().nullish(),
  
  category: z.enum(
    ['work', 'finance', 'hobby', 'relationships', 'health', 'development'],
    {
      errorMap: () => ({ 
        message: 'Category must be one of: work, finance, hobby, relationships, health, development' 
      })
    }
  ).nullish(),
  
  progress_percentage: z.number()
    .int({ message: 'Progress must be an integer' })
    .min(0, { message: 'Progress must be at least 0' })
    .max(100, { message: 'Progress must not exceed 100' })
    .default(0),
  
  position: z.number()
    .int({ message: 'Position must be an integer' })
    .min(1, { message: 'Position must be at least 1' })
    .max(5, { message: 'Position must not exceed 5' })
    .default(1)
}).transform((data) => ({
  ...data,
  description: data.description ?? null,
  category: data.category ?? null
}));

/**
 * Inferred TypeScript type from CreateGoalBodySchema
 */
export type CreateGoalBody = z.infer<typeof CreateGoalBodySchema>;

/**
 * URL parameter schema for endpoints with :id
 * Validates UUID format for goal ID
 */
export const GoalIdParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid goal ID format' })
});

/**
 * Inferred TypeScript type from GoalIdParamsSchema
 */
export type GoalIdParams = z.infer<typeof GoalIdParamsSchema>;

/**
 * Request body schema for PATCH /api/v1/goals/:id
 * Validates partial goal update data
 * 
 * All fields are optional - allows partial updates
 * At least one field must be provided (validated separately)
 * 
 * Validates:
 * - title: optional string, 1-255 characters, trimmed
 * - description: optional string, nullable
 * - category: optional enum, nullable - work, finance, hobby, relationships, health, development
 * - progress_percentage: optional integer 0-100
 * - position: optional integer 1-5
 */
export const UpdateGoalBodySchema = z.object({
  title: z.string()
    .trim()
    .min(1, { message: 'Title must be at least 1 character long' })
    .max(255, { message: 'Title must not exceed 255 characters' })
    .optional(),
  
  description: z.string()
    .nullable()
    .optional(),
  
  category: z.enum(
    ['work', 'finance', 'hobby', 'relationships', 'health', 'development'],
    {
      errorMap: () => ({ 
        message: 'Category must be one of: work, finance, hobby, relationships, health, development' 
      })
    }
  )
    .nullable()
    .optional(),
  
  progress_percentage: z.number()
    .int({ message: 'Progress must be an integer' })
    .min(0, { message: 'Progress must be at least 0' })
    .max(100, { message: 'Progress must not exceed 100' })
    .optional(),
  
  position: z.number()
    .int({ message: 'Position must be an integer' })
    .min(1, { message: 'Position must be at least 1' })
    .max(5, { message: 'Position must not exceed 5' })
    .optional()
}).strict(); // Reject unknown fields

/**
 * Inferred TypeScript type from UpdateGoalBodySchema
 */
export type UpdateGoalBody = z.infer<typeof UpdateGoalBodySchema>;

/**
 * Validates update goal command and ensures at least one field is provided
 * 
 * @param data - Unknown data to validate
 * @returns Parsed and validated UpdateGoalBody
 * @throws ZodError if validation fails
 * @throws Error if no fields provided
 */
export const validateUpdateGoalCommand = (data: unknown): UpdateGoalBody => {
  const parsed = UpdateGoalBodySchema.parse(data);
  
  // Check if at least one field is provided
  if (Object.keys(parsed).length === 0) {
    throw new Error('At least one field must be provided for update');
  }
  
  return parsed;
};
