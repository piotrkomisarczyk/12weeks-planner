/**
 * Type definitions for 12 Weeks Planner API
 * 
 * This file contains:
 * - DTOs (Data Transfer Objects) for API responses
 * - Command Models for API requests (CREATE, UPDATE)
 * - Utility types for pagination, errors, etc.
 * 
 * All types are derived from database models defined in database.types.ts
 */

import type { Database } from './db/database.types';

// ============================================================================
// DATABASE TYPE ALIASES
// ============================================================================

// Table Row types (entities from database)
export type PlanEntity = Database['public']['Tables']['plans']['Row'];
export type LongTermGoalEntity = Database['public']['Tables']['long_term_goals']['Row'];
export type MilestoneEntity = Database['public']['Tables']['milestones']['Row'];
export type WeeklyGoalEntity = Database['public']['Tables']['weekly_goals']['Row'];
export type TaskEntity = Database['public']['Tables']['tasks']['Row'];
export type TaskHistoryEntity = Database['public']['Tables']['task_history']['Row'];
export type WeeklyReviewEntity = Database['public']['Tables']['weekly_reviews']['Row'];
export type UserMetricsEntity = Database['public']['Tables']['user_metrics']['Row'];

// Table Insert types (for database inserts)
export type PlanInsert = Database['public']['Tables']['plans']['Insert'];
export type LongTermGoalInsert = Database['public']['Tables']['long_term_goals']['Insert'];
export type MilestoneInsert = Database['public']['Tables']['milestones']['Insert'];
export type WeeklyGoalInsert = Database['public']['Tables']['weekly_goals']['Insert'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type TaskHistoryInsert = Database['public']['Tables']['task_history']['Insert'];
export type WeeklyReviewInsert = Database['public']['Tables']['weekly_reviews']['Insert'];
export type UserMetricsInsert = Database['public']['Tables']['user_metrics']['Insert'];

// Table Update types (for database updates)
export type PlanUpdate = Database['public']['Tables']['plans']['Update'];
export type LongTermGoalUpdate = Database['public']['Tables']['long_term_goals']['Update'];
export type MilestoneUpdate = Database['public']['Tables']['milestones']['Update'];
export type WeeklyGoalUpdate = Database['public']['Tables']['weekly_goals']['Update'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];
export type TaskHistoryUpdate = Database['public']['Tables']['task_history']['Update'];
export type WeeklyReviewUpdate = Database['public']['Tables']['weekly_reviews']['Update'];
export type UserMetricsUpdate = Database['public']['Tables']['user_metrics']['Update'];

// View types
export type PlanProgressView = Database['public']['Views']['plan_progress']['Row'];
export type MilestoneProgressView = Database['public']['Views']['milestone_progress']['Row'];
export type WeeklyTaskSummaryView = Database['public']['Views']['weekly_task_summary']['Row'];
export type DailyTaskSummaryView = Database['public']['Views']['daily_task_summary']['Row'];
export type WeeklyReviewCompletionView = Database['public']['Views']['weekly_review_completion']['Row'];

// ============================================================================
// ENUM TYPES
// ============================================================================

export type PlanStatus = 'active' | 'completed' | 'archived';

export type GoalCategory = 'work' | 'finance' | 'hobby' | 'relationships' | 'health' | 'development';

export type TaskPriority = 'A' | 'B' | 'C';

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';

export type TaskType = 'weekly_main' | 'weekly_sub' | 'ad_hoc';

// ============================================================================
// PLAN DTOs
// ============================================================================

/**
 * Plan DTO - returned from all plan GET endpoints
 * Maps directly to plans table row
 */
export type PlanDTO = PlanEntity;

/**
 * Create Plan Command - POST /api/v1/plans
 * Only name and start_date are required from client
 */
export type CreatePlanCommand = Pick<PlanInsert, 'name' | 'start_date'>;

/**
 * Update Plan Command - PATCH /api/v1/plans/:id
 * Only name can be updated by user
 */
export type UpdatePlanCommand = Pick<PlanUpdate, 'name'>;

/**
 * Plan Dashboard DTO - GET /api/v1/plans/:id/dashboard
 * Aggregated view with plan, goals, milestones, and progress
 */
export interface PlanDashboardDTO {
  plan: {
    id: string;
    name: string;
    start_date: string;
    status: PlanStatus;
    current_week: number;
  };
  goals: GoalWithMilestonesDTO[];
  progress_summary: {
    total_goals: number;
    completed_goals: number;
    average_progress: number;
  };
}

// ============================================================================
// GOAL (LONG-TERM GOAL) DTOs
// ============================================================================

/**
 * Goal DTO - returned from goal list endpoints
 * Maps directly to long_term_goals table row
 */
export type GoalDTO = LongTermGoalEntity;

/**
 * Goal with Milestones DTO - GET /api/v1/goals/:id
 * Goal entity with nested milestones array
 */
export interface GoalWithMilestonesDTO extends GoalDTO {
  milestones: MilestoneDTO[];
}

/**
 * Create Goal Command - POST /api/v1/goals
 * All fields from insert except auto-generated ones
 */
export type CreateGoalCommand = Pick<
  LongTermGoalInsert,
  'plan_id' | 'title' | 'description' | 'category' | 'progress_percentage' | 'position'
>;

/**
 * Update Goal Command - PATCH /api/v1/goals/:id
 * All fields are optional for partial updates
 */
export type UpdateGoalCommand = Partial<
  Pick<LongTermGoalUpdate, 'title' | 'description' | 'category' | 'progress_percentage' | 'position'>
>;

// ============================================================================
// MILESTONE DTOs
// ============================================================================

/**
 * Milestone DTO - returned from milestone endpoints
 * Maps directly to milestones table row
 */
export type MilestoneDTO = MilestoneEntity;

/**
 * Create Milestone Command - POST /api/v1/milestones
 * Required fields for milestone creation
 */
export type CreateMilestoneCommand = Pick<
  MilestoneInsert,
  'long_term_goal_id' | 'title' | 'description' | 'due_date' | 'position'
>;

/**
 * Update Milestone Command - PATCH /api/v1/milestones/:id
 * All fields optional for partial updates
 */
export type UpdateMilestoneCommand = Partial<
  Pick<MilestoneUpdate, 'title' | 'description' | 'due_date' | 'is_completed' | 'position'>
>;

// ============================================================================
// WEEKLY GOAL DTOs
// ============================================================================

/**
 * Weekly Goal DTO - returned from weekly goal list endpoints
 * Maps directly to weekly_goals table row
 */
export type WeeklyGoalDTO = WeeklyGoalEntity;

/**
 * Weekly Goal with Subtasks DTO - GET /api/v1/weekly-goals/:id
 * Weekly goal with nested array of subtasks
 */
export interface WeeklyGoalWithSubtasksDTO extends WeeklyGoalDTO {
  subtasks: Pick<TaskDTO, 'id' | 'title' | 'priority' | 'status'>[];
}

/**
 * Create Weekly Goal Command - POST /api/v1/weekly-goals
 * Required fields for weekly goal creation
 */
export type CreateWeeklyGoalCommand = Pick<
  WeeklyGoalInsert,
  'plan_id' | 'long_term_goal_id' | 'week_number' | 'title' | 'description' | 'position'
>;

/**
 * Update Weekly Goal Command - PATCH /api/v1/weekly-goals/:id
 * All fields optional for partial updates
 */
export type UpdateWeeklyGoalCommand = Partial<
  Pick<WeeklyGoalUpdate, 'long_term_goal_id' | 'title' | 'description' | 'position'>
>;

// ============================================================================
// TASK DTOs
// ============================================================================

/**
 * Task DTO - returned from task list endpoints
 * Maps directly to tasks table row
 */
export type TaskDTO = TaskEntity;

/**
 * Task with History DTO - GET /api/v1/tasks/:id
 * Task entity with nested history array
 */
export interface TaskWithHistoryDTO extends TaskDTO {
  history: TaskHistoryDTO[];
}

/**
 * Daily Tasks DTO - GET /api/v1/tasks/daily
 * Categorized tasks for a specific day (A/B/C priority structure)
 */
export interface DailyTasksDTO {
  date: string;
  week_number: number;
  due_day: number;
  most_important: Pick<TaskDTO, 'id' | 'title' | 'priority' | 'status' | 'task_type'> | null;
  secondary: Pick<TaskDTO, 'id' | 'title' | 'priority' | 'status' | 'task_type'>[];
  additional: Pick<TaskDTO, 'id' | 'title' | 'priority' | 'status' | 'task_type'>[];
}

/**
 * Create Task Command - POST /api/v1/tasks
 * Required fields for task creation
 */
export type CreateTaskCommand = Pick<
  TaskInsert,
  | 'plan_id'
  | 'weekly_goal_id'
  | 'milestone_id'
  | 'title'
  | 'description'
  | 'priority'
  | 'status'
  | 'task_type'
  | 'week_number'
  | 'due_day'
  | 'position'
>;

/**
 * Update Task Command - PATCH /api/v1/tasks/:id
 * All fields optional for partial updates
 */
export type UpdateTaskCommand = Partial<
  Pick<
    TaskUpdate,
    | 'weekly_goal_id'
    | 'milestone_id'
    | 'title'
    | 'description'
    | 'priority'
    | 'status'
    | 'task_type'
    | 'week_number'
    | 'due_day'
    | 'position'
  >
>;

/**
 * Copy Task Command - POST /api/v1/tasks/:id/copy
 * Specify new week and day for copied task
 */
export interface CopyTaskCommand {
  week_number?: number | null;
  due_day?: number | null;
}

// ============================================================================
// TASK HISTORY DTOs
// ============================================================================

/**
 * Task History DTO - returned from task history endpoints
 * Maps directly to task_history table row
 */
export type TaskHistoryDTO = TaskHistoryEntity;

// ============================================================================
// WEEKLY REVIEW DTOs
// ============================================================================

/**
 * Weekly Review DTO - returned from weekly review endpoints
 * Maps directly to weekly_reviews table row
 */
export type WeeklyReviewDTO = WeeklyReviewEntity;

/**
 * Create Weekly Review Command - POST /api/v1/weekly-reviews
 * Required fields for review creation (text fields optional for auto-save)
 */
export type CreateWeeklyReviewCommand = Pick<
  WeeklyReviewInsert,
  'plan_id' | 'week_number' | 'what_worked' | 'what_did_not_work' | 'what_to_improve'
>;

/**
 * Update Weekly Review Command - PATCH /api/v1/weekly-reviews/:id
 * All fields optional for partial updates (auto-save support)
 */
export type UpdateWeeklyReviewCommand = Partial<
  Pick<WeeklyReviewUpdate, 'what_worked' | 'what_did_not_work' | 'what_to_improve' | 'is_completed'>
>;

// ============================================================================
// USER METRICS DTOs
// ============================================================================

/**
 * User Metrics DTO - GET /api/v1/users/metrics
 * Maps directly to user_metrics table row
 * Read-only from API perspective (updated by database triggers)
 */
export type UserMetricsDTO = UserMetricsEntity;

// ============================================================================
// VIEW DTOs (for optimized queries)
// ============================================================================

/**
 * Plan Progress DTO - from plan_progress view
 * Aggregated progress information for a plan
 */
export type PlanProgressDTO = PlanProgressView;

/**
 * Milestone Progress DTO - from milestone_progress view
 * Progress summary for milestones within a goal
 */
export type MilestoneProgressDTO = MilestoneProgressView;

/**
 * Weekly Task Summary DTO - from weekly_task_summary view
 * Task completion statistics for a week
 */
export type WeeklyTaskSummaryDTO = WeeklyTaskSummaryView;

/**
 * Daily Task Summary DTO - from daily_task_summary view
 * Task breakdown by priority for a specific day
 */
export type DailyTaskSummaryDTO = DailyTaskSummaryView;

/**
 * Weekly Review Completion DTO - from weekly_review_completion view
 * Review completion status for a week
 */
export type WeeklyReviewCompletionDTO = WeeklyReviewCompletionView;

// ============================================================================
// EXPORT DTO
// ============================================================================

/**
 * Export Data DTO - GET /api/v1/export
 * Complete user data export for GDPR compliance
 */
export interface ExportDataDTO {
  user_id: string;
  exported_at: string;
  plans: PlanDTO[];
  goals: GoalDTO[];
  milestones: MilestoneDTO[];
  weekly_goals: WeeklyGoalDTO[];
  tasks: TaskDTO[];
  task_history: TaskHistoryDTO[];
  weekly_reviews: WeeklyReviewDTO[];
  metrics: UserMetricsDTO | null;
}

// ============================================================================
// PAGINATION & LIST RESPONSE TYPES
// ============================================================================

/**
 * Pagination metadata for list endpoints
 */
export interface PaginationMeta {
  limit: number;
  offset: number;
  total?: number;
  has_more?: boolean;
}

/**
 * Generic paginated list response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination?: PaginationMeta;
  count?: number;
  limit?: number;
  offset?: number;
}

/**
 * Simple list response without pagination metadata
 */
export interface ListResponse<T> {
  data: T[];
  count?: number;
}

/**
 * Single item response wrapper
 */
export interface ItemResponse<T> {
  data: T;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Validation error detail for a specific field
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  received?: unknown;
}

/**
 * Validation error response - 400 Bad Request
 */
export interface ValidationErrorResponse {
  error: 'Validation failed';
  details: ValidationErrorDetail[];
}

/**
 * Simple error response for non-validation errors
 */
export interface ErrorResponse {
  error: string;
  message?: string;
}

/**
 * Database constraint error response
 */
export interface ConstraintErrorResponse {
  error: 'Constraint violation';
  message: string;
  constraint?: string;
}

/**
 * Rate limit error response - 429 Too Many Requests
 */
export interface RateLimitErrorResponse {
  error: 'Rate limit exceeded';
  message: string;
  retry_after: number;
}

/**
 * Union type of all possible error responses
 */
export type APIErrorResponse =
  | ValidationErrorResponse
  | ErrorResponse
  | ConstraintErrorResponse
  | RateLimitErrorResponse;

// ============================================================================
// QUERY PARAMETER TYPES
// ============================================================================

/**
 * Common query parameters for list endpoints
 */
export interface ListQueryParams {
  limit?: number;
  offset?: number;
  sort?: string;
}

/**
 * Plan list query parameters
 */
export interface PlanListParams extends ListQueryParams {
  status?: PlanStatus;
}

/**
 * Goal list query parameters
 */
export interface GoalListParams extends ListQueryParams {
  plan_id?: string;
}

/**
 * Milestone list query parameters
 */
export interface MilestoneListParams extends ListQueryParams {
  long_term_goal_id?: string;
  is_completed?: boolean;
}

/**
 * Weekly goal list query parameters
 */
export interface WeeklyGoalListParams extends ListQueryParams {
  plan_id: string;
  week_number?: number;
  long_term_goal_id?: string;
}

/**
 * Task list query parameters
 */
export interface TaskListParams extends ListQueryParams {
  plan_id: string;
  week_number?: number;
  due_day?: number;
  task_type?: TaskType;
  weekly_goal_id?: string;
  milestone_id?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

/**
 * Daily tasks query parameters
 */
export interface DailyTasksParams {
  plan_id: string;
  week_number: number;
  due_day: number;
}

/**
 * Weekly review list query parameters
 */
export interface WeeklyReviewListParams extends ListQueryParams {
  plan_id: string;
  week_number?: number;
  is_completed?: boolean;
}

/**
 * Weekly review by week query parameters
 */
export interface WeeklyReviewByWeekParams {
  plan_id: string;
}

// ============================================================================
// SUCCESS MESSAGE TYPES
// ============================================================================

/**
 * Success response with message (for POST operations like archive)
 */
export interface SuccessResponse {
  data?: {
    id: string;
    [key: string]: unknown;
  };
  message: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Date string in ISO 8601 format (YYYY-MM-DD)
 */
export type DateString = string;

/**
 * Timestamp string in ISO 8601 format with timezone (YYYY-MM-DDTHH:mm:ssZ)
 */
export type TimestampString = string;

/**
 * UUID v4 string
 */
export type UUID = string;

/**
 * Week number (1-12)
 */
export type WeekNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * Day of week (1=Monday, 7=Sunday)
 */
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Progress percentage (0-100)
 */
export type ProgressPercentage = number;

/**
 * Position in ordered list (1-5 for goals/milestones, 1-10 for tasks)
 */
export type Position = number;

