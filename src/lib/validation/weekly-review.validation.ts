/**
 * Validation schemas for Weekly Review-related API endpoints
 * Uses Zod for runtime type validation and type inference
 */

import { z } from "zod";

/**
 * Request body schema for POST /api/v1/weekly-reviews
 * Validates weekly review creation data
 *
 * Validates:
 * - plan_id: required UUID string
 * - week_number: required integer 1-12
 * - what_worked: optional string, nullable (auto-save support)
 * - what_did_not_work: optional string, nullable (auto-save support)
 * - what_to_improve: optional string, nullable (auto-save support)
 */
export const CreateWeeklyReviewBodySchema = z
  .object({
    plan_id: z.string().uuid({ message: "Invalid plan ID format" }),

    week_number: z
      .number()
      .int({ message: "Week number must be an integer" })
      .min(1, { message: "Week number must be at least 1" })
      .max(12, { message: "Week number must not exceed 12" }),

    what_worked: z.string().trim().nullable().optional(),

    what_did_not_work: z.string().trim().nullable().optional(),

    what_to_improve: z.string().trim().nullable().optional(),
  })
  .transform((data) => ({
    ...data,
    what_worked: data.what_worked ?? null,
    what_did_not_work: data.what_did_not_work ?? null,
    what_to_improve: data.what_to_improve ?? null,
  }));

/**
 * Inferred TypeScript type from CreateWeeklyReviewBodySchema
 */
export type CreateWeeklyReviewBody = z.infer<typeof CreateWeeklyReviewBodySchema>;

/**
 * Request body schema for PATCH /api/v1/weekly-reviews/:id
 * Validates partial weekly review update data
 *
 * All fields are optional - allows partial updates and auto-save
 * At least one field must be provided (validated separately)
 *
 * Validates:
 * - what_worked: optional string, nullable
 * - what_did_not_work: optional string, nullable
 * - what_to_improve: optional string, nullable
 * - is_completed: optional boolean
 *
 * Note: plan_id and week_number are NOT editable
 */
export const UpdateWeeklyReviewBodySchema = z
  .object({
    what_worked: z.string().trim().nullable().optional(),

    what_did_not_work: z.string().trim().nullable().optional(),

    what_to_improve: z.string().trim().nullable().optional(),

    is_completed: z.boolean().optional(),
  })
  .strict(); // Reject unknown fields

/**
 * Inferred TypeScript type from UpdateWeeklyReviewBodySchema
 */
export type UpdateWeeklyReviewBody = z.infer<typeof UpdateWeeklyReviewBodySchema>;

/**
 * URL parameter schema for endpoints with :id
 * Validates UUID format for weekly review ID
 */
export const WeeklyReviewIdParamsSchema = z.object({
  id: z.string().uuid({ message: "Invalid weekly review ID format" }),
});

/**
 * Inferred TypeScript type from WeeklyReviewIdParamsSchema
 */
export type WeeklyReviewIdParams = z.infer<typeof WeeklyReviewIdParamsSchema>;

/**
 * Query parameters schema for GET /api/v1/weekly-reviews
 * Validates filtering and pagination parameters
 *
 * Validates:
 * - plan_id: required UUID
 * - week_number: optional integer 1-12
 * - is_completed: optional boolean for filtering by completion status
 * - limit: integer 1-100, defaults to 50
 * - offset: integer >= 0, defaults to 0
 */
export const WeeklyReviewListQuerySchema = z.object({
  plan_id: z.string().uuid({ message: "Invalid plan ID format" }),

  week_number: z.coerce
    .number()
    .int({ message: "Week number must be an integer" })
    .min(1, { message: "Week number must be at least 1" })
    .max(12, { message: "Week number must not exceed 12" })
    .optional(),

  is_completed: z.coerce.boolean().optional(),

  limit: z.coerce
    .number()
    .int({ message: "Limit must be an integer" })
    .min(1, { message: "Limit must be at least 1" })
    .max(100, { message: "Limit must not exceed 100" })
    .default(50),

  offset: z.coerce
    .number()
    .int({ message: "Offset must be an integer" })
    .min(0, { message: "Offset must be at least 0" })
    .default(0),
});

/**
 * Inferred TypeScript type from WeeklyReviewListQuerySchema
 */
export type WeeklyReviewListQuery = z.infer<typeof WeeklyReviewListQuerySchema>;

/**
 * URL parameter schema for GET /api/v1/weekly-reviews/week/:weekNumber
 * Validates week number parameter
 */
export const WeeklyReviewByWeekParamsSchema = z.object({
  weekNumber: z.coerce
    .number()
    .int({ message: "Week number must be an integer" })
    .min(1, { message: "Week number must be at least 1" })
    .max(12, { message: "Week number must not exceed 12" }),
});

/**
 * Inferred TypeScript type from WeeklyReviewByWeekParamsSchema
 */
export type WeeklyReviewByWeekParams = z.infer<typeof WeeklyReviewByWeekParamsSchema>;

/**
 * Query parameters schema for GET /api/v1/weekly-reviews/week/:weekNumber
 * Validates plan_id query parameter
 */
export const WeeklyReviewByWeekQuerySchema = z.object({
  plan_id: z.string().uuid({ message: "Invalid plan ID format" }),
});

/**
 * Inferred TypeScript type from WeeklyReviewByWeekQuerySchema
 */
export type WeeklyReviewByWeekQuery = z.infer<typeof WeeklyReviewByWeekQuerySchema>;

/**
 * Validates update weekly review command and ensures at least one field is provided
 *
 * @param data - Unknown data to validate
 * @returns Parsed and validated UpdateWeeklyReviewBody
 * @throws ZodError if validation fails
 * @throws Error if no fields provided
 */
export const validateUpdateWeeklyReviewCommand = (data: unknown): UpdateWeeklyReviewBody => {
  const parsed = UpdateWeeklyReviewBodySchema.parse(data);

  // Check if at least one field is provided
  if (Object.keys(parsed).length === 0) {
    throw new Error("At least one field must be provided for update");
  }

  return parsed;
};
