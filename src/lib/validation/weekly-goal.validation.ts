/**
 * Validation schemas for Weekly Goal-related API endpoints
 * Uses Zod for runtime type validation and type inference
 */

import { z } from 'zod';

/**
 * Request body schema for POST /api/v1/weekly-goals
 * Validates weekly goal creation data
 * 
 * Validates:
 * - plan_id: required UUID string
 * - long_term_goal_id: optional UUID, nullable
 * - week_number: required integer 1-12
 * - title: required string, 1-255 characters, trimmed
 * - description: optional string, nullable
 * - position: integer >= 1, defaults to 1
 */
export const CreateWeeklyGoalBodySchema = z.object({
  plan_id: z.string().uuid({ message: 'Invalid plan ID format' }),
  
  long_term_goal_id: z.string()
    .uuid({ message: 'Invalid long-term goal ID format' })
    .nullable()
    .optional(),
  
  week_number: z.number()
    .int({ message: 'Week number must be an integer' })
    .min(1, { message: 'Week number must be at least 1' })
    .max(12, { message: 'Week number must not exceed 12' }),
  
  title: z.string()
    .trim()
    .min(1, { message: 'Title is required' })
    .max(255, { message: 'Title must not exceed 255 characters' }),
  
  description: z.string()
    .trim()
    .nullable()
    .optional(),
  
  position: z.number()
    .int({ message: 'Position must be an integer' })
    .min(1, { message: 'Position must be at least 1' })
    .default(1)
}).transform((data) => ({
  ...data,
  long_term_goal_id: data.long_term_goal_id ?? null,
  description: data.description ?? null
}));

/**
 * Inferred TypeScript type from CreateWeeklyGoalBodySchema
 */
export type CreateWeeklyGoalBody = z.infer<typeof CreateWeeklyGoalBodySchema>;

/**
 * Request body schema for PATCH /api/v1/weekly-goals/:id
 * Validates partial weekly goal update data
 * 
 * All fields are optional - allows partial updates
 * At least one field must be provided (validated separately)
 * 
 * Validates:
 * - long_term_goal_id: optional UUID, nullable
 * - title: optional string, 1-255 characters, trimmed
 * - description: optional string, nullable
 * - position: optional integer >= 1
 * 
 * Note: week_number is NOT editable according to UpdateWeeklyGoalCommand
 */
export const UpdateWeeklyGoalBodySchema = z.object({
  long_term_goal_id: z.string()
    .uuid({ message: 'Invalid long-term goal ID format' })
    .nullable()
    .optional(),
  
  title: z.string()
    .trim()
    .min(1, { message: 'Title must be at least 1 character long' })
    .max(255, { message: 'Title must not exceed 255 characters' })
    .optional(),
  
  description: z.string()
    .nullable()
    .optional(),
  
  position: z.number()
    .int({ message: 'Position must be an integer' })
    .min(1, { message: 'Position must be at least 1' })
    .optional()
}).strict(); // Reject unknown fields

/**
 * Inferred TypeScript type from UpdateWeeklyGoalBodySchema
 */
export type UpdateWeeklyGoalBody = z.infer<typeof UpdateWeeklyGoalBodySchema>;

/**
 * URL parameter schema for endpoints with :id
 * Validates UUID format for weekly goal ID
 */
export const WeeklyGoalIdParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid weekly goal ID format' })
});

/**
 * Inferred TypeScript type from WeeklyGoalIdParamsSchema
 */
export type WeeklyGoalIdParams = z.infer<typeof WeeklyGoalIdParamsSchema>;

/**
 * Query parameters schema for GET /api/v1/weekly-goals
 * Validates filtering and pagination parameters
 * 
 * Validates:
 * - plan_id: required UUID
 * - week_number: optional integer 1-12
 * - long_term_goal_id: optional UUID for filtering by goal
 * - limit: integer 1-100, defaults to 50
 * - offset: integer >= 0, defaults to 0
 */
export const WeeklyGoalListQuerySchema = z.object({
  plan_id: z.string().uuid({ message: 'Invalid plan ID format' }),
  
  week_number: z.coerce.number()
    .int({ message: 'Week number must be an integer' })
    .min(1, { message: 'Week number must be at least 1' })
    .max(12, { message: 'Week number must not exceed 12' })
    .optional(),
  
  long_term_goal_id: z.string()
    .uuid({ message: 'Invalid long-term goal ID format' })
    .optional(),
  
  limit: z.coerce.number()
    .int({ message: 'Limit must be an integer' })
    .min(1, { message: 'Limit must be at least 1' })
    .max(100, { message: 'Limit must not exceed 100' })
    .default(50),
  
  offset: z.coerce.number()
    .int({ message: 'Offset must be an integer' })
    .min(0, { message: 'Offset must be at least 0' })
    .default(0)
});

/**
 * Inferred TypeScript type from WeeklyGoalListQuerySchema
 */
export type WeeklyGoalListQuery = z.infer<typeof WeeklyGoalListQuerySchema>;

/**
 * Validates update weekly goal command and ensures at least one field is provided
 * 
 * @param data - Unknown data to validate
 * @returns Parsed and validated UpdateWeeklyGoalBody
 * @throws ZodError if validation fails
 * @throws Error if no fields provided
 */
export const validateUpdateWeeklyGoalCommand = (data: unknown): UpdateWeeklyGoalBody => {
  const parsed = UpdateWeeklyGoalBodySchema.parse(data);
  
  // Check if at least one field is provided
  if (Object.keys(parsed).length === 0) {
    throw new Error('At least one field must be provided for update');
  }
  
  return parsed;
};

