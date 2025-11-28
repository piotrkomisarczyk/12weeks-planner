import { z } from 'zod';

/**
 * Task Validation Schemas
 * 
 * This file contains all Zod validation schemas for task-related API endpoints.
 * Schemas validate query parameters, request bodies, and URL parameters.
 */

// ============================================================================
// REUSABLE SCHEMAS
// ============================================================================

/**
 * UUID schema with custom error message
 */
const uuidSchema = z.string().uuid({ message: 'Invalid UUID format' });

/**
 * Task priority enum schema (A, B, C)
 */
const taskPrioritySchema = z.enum(['A', 'B', 'C'], {
  errorMap: () => ({ message: 'Priority must be A, B, or C' }),
});

/**
 * Task status enum schema
 */
const taskStatusSchema = z.enum(
  ['todo', 'in_progress', 'completed', 'cancelled', 'postponed'],
  { errorMap: () => ({ message: 'Invalid status' }) }
);

/**
 * Task type enum schema
 */
const taskTypeSchema = z.enum(['weekly_main', 'weekly_sub', 'ad_hoc'], {
  errorMap: () => ({ message: 'Invalid task type' }),
});

/**
 * Week number schema (1-12, nullable, optional)
 */
const weekNumberSchema = z
  .number()
  .int()
  .min(1, 'Week number must be at least 1')
  .max(12, 'Week number must be at most 12')
  .nullable()
  .optional();

/**
 * Due day schema (1-7, nullable, optional)
 * 1 = Monday, 7 = Sunday
 */
const dueDaySchema = z
  .number()
  .int()
  .min(1, 'Due day must be at least 1 (Monday)')
  .max(7, 'Due day must be at most 7 (Sunday)')
  .nullable()
  .optional();

// ============================================================================
// QUERY PARAMETER SCHEMAS
// ============================================================================

/**
 * List Tasks Query Parameters Schema
 * GET /api/v1/tasks
 * 
 * Validates query parameters for filtering and paginating tasks.
 */
export const listTasksSchema = z.object({
  plan_id: uuidSchema,
  week_number: z.coerce
    .number()
    .int()
    .min(1)
    .max(12)
    .nullable()
    .optional()
    .transform(val => val === null ? undefined : val),
  due_day: z.coerce
    .number()
    .int()
    .min(1)
    .max(7)
    .nullable()
    .optional()
    .transform(val => val === null ? undefined : val),
  task_type: taskTypeSchema.optional(),
  weekly_goal_id: uuidSchema.optional(),
  milestone_id: uuidSchema.optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

/**
 * Daily Tasks Query Parameters Schema
 * GET /api/v1/tasks/daily
 * 
 * Validates required parameters for fetching daily tasks.
 */
export const dailyTasksParamsSchema = z.object({
  plan_id: uuidSchema,
  week_number: z.coerce
    .number()
    .int()
    .min(1, 'Week number must be at least 1')
    .max(12, 'Week number must be at most 12'),
  due_day: z.coerce
    .number()
    .int()
    .min(1, 'Due day must be at least 1')
    .max(7, 'Due day must be at most 7'),
});

// ============================================================================
// URL PARAMETER SCHEMAS
// ============================================================================

/**
 * Task ID Parameter Schema
 * For endpoints with :id parameter
 */
export const taskIdSchema = z.object({
  id: uuidSchema,
});

// ============================================================================
// REQUEST BODY SCHEMAS
// ============================================================================

/**
 * Create Task Body Schema
 * POST /api/v1/tasks
 * 
 * Validates the request body for creating a new task.
 */
export const createTaskSchema = z.object({
  plan_id: uuidSchema,
  weekly_goal_id: uuidSchema.nullable().optional(),
  milestone_id: uuidSchema.nullable().optional(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be at most 255 characters'),
  description: z.string().nullable().optional(),
  priority: taskPrioritySchema.default('C'),
  status: taskStatusSchema.default('todo'),
  task_type: taskTypeSchema.default('weekly_sub'),
  week_number: z
    .number()
    .int()
    .min(1, 'Week number must be at least 1')
    .max(12, 'Week number must be at most 12')
    .nullable()
    .optional(),
  due_day: z
    .number()
    .int()
    .min(1, 'Due day must be at least 1')
    .max(7, 'Due day must be at most 7')
    .nullable()
    .optional(),
  position: z.number().int().positive().default(1).optional(),
});

/**
 * Update Task Body Schema
 * PATCH /api/v1/tasks/:id
 * 
 * Validates the request body for updating a task.
 * All fields are optional for partial updates.
 */
export const updateTaskSchema = z
  .object({
    weekly_goal_id: uuidSchema.nullable().optional(),
    milestone_id: uuidSchema.nullable().optional(),
    title: z
      .string()
      .min(1, 'Title cannot be empty')
      .max(255, 'Title must be at most 255 characters')
      .optional(),
    description: z.string().nullable().optional(),
    priority: taskPrioritySchema.optional(),
    status: taskStatusSchema.optional(),
    task_type: taskTypeSchema.optional(),
    week_number: z
      .number()
      .int()
      .min(1, 'Week number must be at least 1')
      .max(12, 'Week number must be at most 12')
      .nullable()
      .optional(),
    due_day: z
      .number()
      .int()
      .min(1, 'Due day must be at least 1')
      .max(7, 'Due day must be at most 7')
      .nullable()
      .optional(),
    position: z.number().int().positive().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/**
 * Copy Task Body Schema
 * POST /api/v1/tasks/:id/copy
 * 
 * Validates the request body for copying a task to a new week/day.
 */
export const copyTaskSchema = z.object({
  week_number: z
    .number()
    .int()
    .min(1, 'Week number must be at least 1')
    .max(12, 'Week number must be at most 12')
    .nullable()
    .optional(),
  due_day: z
    .number()
    .int()
    .min(1, 'Due day must be at least 1')
    .max(7, 'Due day must be at most 7')
    .nullable()
    .optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Inferred TypeScript types from Zod schemas
 * Used by service layer for type safety
 */
export type ListTasksParams = z.infer<typeof listTasksSchema>;
export type DailyTasksParams = z.infer<typeof dailyTasksParamsSchema>;
export type TaskIdParam = z.infer<typeof taskIdSchema>;
export type CreateTaskData = z.infer<typeof createTaskSchema>;
export type UpdateTaskData = z.infer<typeof updateTaskSchema>;
export type CopyTaskData = z.infer<typeof copyTaskSchema>;


