# API Endpoints Implementation Plan: Other Endpoints

This document provides implementation guidance for miscellaneous API endpoints including task history, user metrics, and data export.

---

## 1. Overview

This implementation plan covers three GET endpoints:

1. **GET /api/v1/tasks/:taskId/history** - Retrieve status change history for a specific task
2. **GET /api/v1/users/metrics** - Retrieve success metrics for the authenticated user
3. **GET /api/v1/export** - Export all user data in JSON format (GDPR compliance)

These endpoints are read-only operations that provide additional data insights and compliance features. All endpoints require authentication and respect Row-Level Security (RLS) policies.

---

## 2. Endpoint Details

### 2.1 GET /api/v1/tasks/:taskId/history

#### Purpose
Retrieve the complete status change history for a task. History is automatically created by the database trigger `log_task_status_change()` whenever a task status changes.

#### Request Details
- **HTTP Method**: GET
- **URL Structure**: `/api/v1/tasks/:taskId/history`
- **Path Parameters**:
  - `taskId` (required): UUID of the task
- **Query Parameters**: None
- **Request Body**: None
- **Authentication**: Required (JWT token in Authorization header)

#### Response Structure

**Success Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "uuid",
      "task_id": "uuid",
      "status": "todo",
      "changed_at": "2025-01-20T10:00:00Z",
      "due_day": 1
    },
    {
      "id": "uuid",
      "task_id": "uuid",
      "status": "in_progress",
      "changed_at": "2025-01-20T14:00:00Z",
      "due_day": 1
    },
    {
      "id": "uuid",
      "task_id": "uuid",
      "status": "completed",
      "changed_at": "2025-01-20T16:30:00Z",
      "due_day": 1
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Task not found or doesn't belong to the user
- `500 Internal Server Error`: Database error

---

### 2.2 GET /api/v1/users/metrics

#### Purpose
Retrieve success metrics for the authenticated user. Metrics are automatically updated by database triggers when users create plans or complete goals.

#### Request Details
- **HTTP Method**: GET
- **URL Structure**: `/api/v1/users/metrics`
- **Path Parameters**: None
- **Query Parameters**: None
- **Request Body**: None
- **Authentication**: Required (JWT token in Authorization header)

#### Response Structure

**Success Response** `200 OK`:
```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "first_planner_created": true,
    "first_planner_completed": false,
    "total_plans_created": 2,
    "total_goals_completed": 1,
    "created_at": "2025-01-06T10:00:00Z",
    "updated_at": "2025-01-20T16:30:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Metrics not found (user has no activity yet)
- `500 Internal Server Error`: Database error

---

### 2.3 GET /api/v1/export

#### Purpose
Export all user data in JSON format for GDPR compliance. This endpoint returns complete user data including all plans, goals, milestones, weekly goals, tasks, task history, weekly reviews, and metrics.

#### Request Details
- **HTTP Method**: GET
- **URL Structure**: `/api/v1/export`
- **Path Parameters**: None
- **Query Parameters**: None
- **Request Body**: None
- **Authentication**: Required (JWT token in Authorization header)

#### Response Structure

**Success Response** `200 OK`:
```json
{
  "user_id": "uuid",
  "exported_at": "2025-01-27T10:00:00Z",
  "plans": [...],
  "goals": [...],
  "milestones": [...],
  "weekly_goals": [...],
  "tasks": [...],
  "task_history": [...],
  "weekly_reviews": [...],
  "metrics": {...}
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Database error or query timeout

---

## 3. Types Used

### 3.1 Existing Types from `src/types.ts`

#### For Task History Endpoint
```typescript
// Response types
type TaskHistoryDTO = TaskHistoryEntity;
interface ListResponse<T> {
  data: T[];
  count?: number;
}

// Error types
interface ErrorResponse {
  error: string;
  message?: string;
}
```

#### For User Metrics Endpoint
```typescript
// Response types
type UserMetricsDTO = UserMetricsEntity;
interface ItemResponse<T> {
  data: T;
}

// Error types
interface ErrorResponse {
  error: string;
  message?: string;
}
```

#### For Export Endpoint
```typescript
// Response types
interface ExportDataDTO {
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

// Error types
interface ErrorResponse {
  error: string;
  message?: string;
}
```

### 3.2 Database Entity Types
All DTOs map directly to database entities defined in `database.types.ts`:
- `TaskHistoryEntity` from `task_history` table
- `UserMetricsEntity` from `user_metrics` table
- Various entity types for export (PlanEntity, LongTermGoalEntity, etc.)

---

## 4. Data Flow

### 4.1 Task History Flow

```
Client Request
    ↓
Astro Middleware (authentication check)
    ↓
Route Handler: /api/v1/tasks/:taskId/history
    ↓
Extract taskId from params
    ↓
Task Service: getTaskHistory(taskId, userId)
    ↓
Supabase Query:
  - SELECT * FROM task_history WHERE task_id = taskId
  - JOIN with tasks table to verify ownership (RLS handles this)
  - ORDER BY changed_at ASC
    ↓
RLS Policy Check (Users can view own task history)
    ↓
Return ListResponse<TaskHistoryDTO>
```

### 4.2 User Metrics Flow

```
Client Request
    ↓
Astro Middleware (authentication check)
    ↓
Route Handler: /api/v1/users/metrics
    ↓
Extract userId from context.locals.supabase.auth
    ↓
User Service: getUserMetrics(userId)
    ↓
Supabase Query:
  - SELECT * FROM user_metrics WHERE user_id = userId
    ↓
RLS Policy Check (Users can view own metrics)
    ↓
Return ItemResponse<UserMetricsDTO>
```

### 4.3 Data Export Flow

```
Client Request
    ↓
Astro Middleware (authentication check)
    ↓
Route Handler: /api/v1/export
    ↓
Extract userId from context.locals.supabase.auth
    ↓
Export Service: exportUserData(userId)
    ↓
Parallel Supabase Queries (all filtered by RLS):
  - SELECT * FROM plans WHERE user_id = userId
  - SELECT * FROM long_term_goals (via plans)
  - SELECT * FROM milestones (via long_term_goals)
  - SELECT * FROM weekly_goals (via plans)
  - SELECT * FROM tasks (via plans)
  - SELECT * FROM task_history (via tasks)
  - SELECT * FROM weekly_reviews (via plans)
  - SELECT * FROM user_metrics WHERE user_id = userId
    ↓
Aggregate all data into ExportDataDTO structure
    ↓
Add exported_at timestamp
    ↓
Return ExportDataDTO
```

---

## 5. Security Considerations

### 5.1 Authentication
- **All endpoints require authentication** via JWT token in the Authorization header
- Middleware (`src/middleware/index.ts`) must verify token before allowing access
- Extract user_id from `context.locals.supabase.auth.getUser()`

### 5.2 Authorization (Row-Level Security)

#### Task History Endpoint
- RLS policy: `Users can view own task history`
- Verification chain: task_history → tasks → plans → user_id
- User can only access history for their own tasks

#### User Metrics Endpoint
- RLS policy: `Users can view own metrics`
- Direct user_id check: `user_metrics.user_id = auth.uid()`
- Simplest authorization model

#### Export Endpoint
- Multiple RLS policies apply to each table
- All queries filtered by user_id through RLS
- Most sensitive endpoint - returns all user data

### 5.3 Input Validation

#### Task History Endpoint
- Validate `taskId` is a valid UUID format
- Use Zod schema for path parameter validation
- Return 400 Bad Request for invalid UUID format

#### User Metrics & Export Endpoints
- No input validation required (no parameters)
- Only authentication verification needed

### 5.4 Data Exposure Prevention
- Never expose other users' data
- RLS policies provide defense-in-depth
- Always use authenticated Supabase client from context.locals
- Never use service role key for these endpoints

---

## 6. Error Handling

### 6.1 Task History Endpoint

| Error Scenario | Status Code | Response |
|---------------|-------------|----------|
| Missing/invalid auth token | 401 | `{ "error": "Unauthorized", "message": "Authentication required" }` |
| Invalid UUID format | 400 | `{ "error": "Validation failed", "details": [...] }` |
| Task not found or not owned by user | 404 | `{ "error": "Not found", "message": "Task not found" }` |
| Database connection error | 500 | `{ "error": "Internal server error", "message": "Database error" }` |
| Supabase query error | 500 | `{ "error": "Internal server error", "message": "Failed to fetch task history" }` |

### 6.2 User Metrics Endpoint

| Error Scenario | Status Code | Response |
|---------------|-------------|----------|
| Missing/invalid auth token | 401 | `{ "error": "Unauthorized", "message": "Authentication required" }` |
| Metrics not found (new user) | 404 | `{ "error": "Not found", "message": "User metrics not found" }` |
| Database connection error | 500 | `{ "error": "Internal server error", "message": "Database error" }` |
| Supabase query error | 500 | `{ "error": "Internal server error", "message": "Failed to fetch user metrics" }` |

### 6.3 Export Endpoint

| Error Scenario | Status Code | Response |
|---------------|-------------|----------|
| Missing/invalid auth token | 401 | `{ "error": "Unauthorized", "message": "Authentication required" }` |
| Database connection error | 500 | `{ "error": "Internal server error", "message": "Database error" }` |
| Query timeout (large dataset) | 500 | `{ "error": "Internal server error", "message": "Export timeout - please try again" }` |
| Partial query failure | 500 | `{ "error": "Internal server error", "message": "Failed to export complete data" }` |

### 6.4 Error Handling Best Practices
1. **Early returns**: Check authentication first, then validation, then business logic
2. **Consistent error format**: Use ErrorResponse type for all errors
3. **Error logging**: Log all 500 errors with full error details for debugging
4. **User-friendly messages**: Don't expose internal implementation details
5. **Guard clauses**: Use early returns to avoid nested if statements

---

## 7. Performance Considerations

### 7.1 Task History Endpoint
- **Expected load**: Low to medium (occasional history views)
- **Query optimization**: 
  - Use indexed `task_id` column in task_history table
  - ORDER BY changed_at (indexed via `idx_task_history_changed_at`)
- **Typical response time**: < 100ms
- **Pagination**: Not needed initially (history is typically small < 50 entries)

### 7.2 User Metrics Endpoint
- **Expected load**: Medium (dashboard display, frequent access)
- **Query optimization**: 
  - Direct lookup by user_id (indexed via `idx_user_metrics_user_id`)
  - Single row response (very fast)
- **Typical response time**: < 50ms
- **Caching**: Consider client-side caching (5 minutes) or CDN caching

### 7.3 Export Endpoint
- **Expected load**: Very low (GDPR requests, infrequent)
- **Query optimization**: 
  - Use parallel queries for independent tables
  - Consider query timeout (30 seconds max)
  - RLS policies add overhead but necessary for security
- **Typical response time**: 500ms - 5s (depending on data volume)
- **Rate limiting**: **CRITICAL** - Implement aggressive rate limiting
  - Max 1 request per 5 minutes per user
  - Consider implementing queue system for large exports
- **Resource usage**: Most resource-intensive endpoint
  - Monitor database connection pool usage
  - Consider separate read replica for export queries

### 7.4 Database Optimization
- All necessary indexes already exist (see db-plan.md section 3)
- RLS policies add ~10-20ms overhead per query
- Consider adding monitoring for slow queries (> 1s)

---

## 8. Implementation Steps

### 8.1 Phase 1: Service Layer Implementation

#### Step 1: Extend Task Service
**File**: `src/lib/services/task.service.ts`

Add method to fetch task history:

```typescript
/**
 * Get status change history for a task
 * @param taskId - UUID of the task
 * @param supabase - Authenticated Supabase client
 * @returns Array of task history entries
 */
export async function getTaskHistory(
  taskId: string,
  supabase: SupabaseClient
): Promise<TaskHistoryDTO[]> {
  // Query task_history table
  const { data, error } = await supabase
    .from('task_history')
    .select('*')
    .eq('task_id', taskId)
    .order('changed_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch task history: ${error.message}`);
  }

  return data || [];
}
```

#### Step 2: Create User Service
**File**: `src/lib/services/user.service.ts` (NEW FILE)

```typescript
import type { SupabaseClient } from '../db/supabase.client';
import type { UserMetricsDTO } from '../types';

/**
 * Get metrics for the authenticated user
 * @param userId - UUID of the user
 * @param supabase - Authenticated Supabase client
 * @returns User metrics or null if not found
 */
export async function getUserMetrics(
  userId: string,
  supabase: SupabaseClient
): Promise<UserMetricsDTO | null> {
  const { data, error } = await supabase
    .from('user_metrics')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - user has no metrics yet
      return null;
    }
    throw new Error(`Failed to fetch user metrics: ${error.message}`);
  }

  return data;
}
```

#### Step 3: Create Export Service
**File**: `src/lib/services/export.service.ts` (NEW FILE)

```typescript
import type { SupabaseClient } from '../db/supabase.client';
import type { ExportDataDTO } from '../types';

/**
 * Export all user data (GDPR compliance)
 * @param userId - UUID of the user
 * @param supabase - Authenticated Supabase client
 * @returns Complete user data export
 */
export async function exportUserData(
  userId: string,
  supabase: SupabaseClient
): Promise<ExportDataDTO> {
  // Execute all queries in parallel for performance
  const [
    plansResult,
    goalsResult,
    milestonesResult,
    weeklyGoalsResult,
    tasksResult,
    taskHistoryResult,
    weeklyReviewsResult,
    metricsResult,
  ] = await Promise.all([
    supabase.from('plans').select('*').eq('user_id', userId),
    supabase.from('long_term_goals').select('*, plan:plans!inner(user_id)').eq('plan.user_id', userId),
    supabase.from('milestones').select('*, goal:long_term_goals!inner(plan:plans!inner(user_id))'),
    supabase.from('weekly_goals').select('*, plan:plans!inner(user_id)').eq('plan.user_id', userId),
    supabase.from('tasks').select('*, plan:plans!inner(user_id)').eq('plan.user_id', userId),
    supabase.from('task_history').select('*, task:tasks!inner(plan:plans!inner(user_id))'),
    supabase.from('weekly_reviews').select('*, plan:plans!inner(user_id)').eq('plan.user_id', userId),
    supabase.from('user_metrics').select('*').eq('user_id', userId).single(),
  ]);

  // Check for errors in any query
  const errors = [
    plansResult.error,
    goalsResult.error,
    milestonesResult.error,
    weeklyGoalsResult.error,
    tasksResult.error,
    taskHistoryResult.error,
    weeklyReviewsResult.error,
    metricsResult.error && metricsResult.error.code !== 'PGRST116', // Ignore "no rows" for metrics
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(`Failed to export user data: ${errors[0]}`);
  }

  // Assemble export data
  return {
    user_id: userId,
    exported_at: new Date().toISOString(),
    plans: plansResult.data || [],
    goals: goalsResult.data || [],
    milestones: milestonesResult.data || [],
    weekly_goals: weeklyGoalsResult.data || [],
    tasks: tasksResult.data || [],
    task_history: taskHistoryResult.data || [],
    weekly_reviews: weeklyReviewsResult.data || [],
    metrics: metricsResult.data || null,
  };
}
```

---

### 8.2 Phase 2: Validation Layer

#### Step 4: Create Validation Schema for Task History
**File**: `src/lib/validation/task.validation.ts` (add to existing file)

```typescript
import { z } from 'zod';

// Add to existing task validation schemas
export const taskIdParamSchema = z.object({
  taskId: z.string().uuid({ message: 'Invalid task ID format' }),
});
```

No validation schemas needed for user metrics and export endpoints (no parameters).

---

### 8.3 Phase 3: API Route Implementation

#### Step 5: Implement Task History Route
**File**: `src/pages/api/v1/tasks/[taskId]/history.ts` (NEW FILE)

```typescript
import type { APIRoute } from 'astro';
import { getTaskHistory } from '../../../../../lib/services/task.service';
import { taskIdParamSchema } from '../../../../../lib/validation/task.validation';
import type { ListResponse, TaskHistoryDTO, ErrorResponse } from '../../../../../types';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Authentication check (handled by middleware)
    const supabase = locals.supabase;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ErrorResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validate path parameters
    const validationResult = taskIdParamSchema.safeParse(params);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { taskId } = validationResult.data;

    // 3. Verify task exists and belongs to user
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'Task not found',
        } as ErrorResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Fetch task history
    const history = await getTaskHistory(taskId, supabase);

    // 5. Return response
    const response: ListResponse<TaskHistoryDTO> = {
      data: history,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching task history:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to fetch task history',
      } as ErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

#### Step 6: Implement User Metrics Route
**File**: `src/pages/api/v1/users/metrics.ts` (NEW FILE)

```typescript
import type { APIRoute } from 'astro';
import { getUserMetrics } from '../../../../lib/services/user.service';
import type { ItemResponse, UserMetricsDTO, ErrorResponse } from '../../../../types';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Authentication check
    const supabase = locals.supabase;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ErrorResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Fetch user metrics
    const metrics = await getUserMetrics(user.id, supabase);

    if (!metrics) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'User metrics not found',
        } as ErrorResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Return response
    const response: ItemResponse<UserMetricsDTO> = {
      data: metrics,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching user metrics:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to fetch user metrics',
      } as ErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

#### Step 7: Implement Export Route
**File**: `src/pages/api/v1/export.ts` (NEW FILE)

```typescript
import type { APIRoute } from 'astro';
import { exportUserData } from '../../../lib/services/export.service';
import type { ExportDataDTO, ErrorResponse } from '../../../types';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Authentication check
    const supabase = locals.supabase;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ErrorResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Export user data
    const exportData = await exportUserData(user.id, supabase);

    // 3. Return response
    return new Response(JSON.stringify(exportData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-export-${user.id}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to export user data',
      } as ErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

---

### 8.4 Phase 4: Testing

#### Step 8: Create API Tests
**File**: `api-tests/others-tests.http` (NEW FILE)

```http
### Variables
@baseUrl = http://localhost:4321/api/v1
@authToken = YOUR_AUTH_TOKEN_HERE
@taskId = YOUR_TASK_ID_HERE

### ============================================================================
### TASK HISTORY TESTS
### ============================================================================

### Test 1: Get task history - Success
GET {{baseUrl}}/tasks/{{taskId}}/history
Authorization: Bearer {{authToken}}

### Test 2: Get task history - Invalid UUID
GET {{baseUrl}}/tasks/invalid-uuid/history
Authorization: Bearer {{authToken}}

### Test 3: Get task history - Task not found
GET {{baseUrl}}/tasks/00000000-0000-0000-0000-000000000000/history
Authorization: Bearer {{authToken}}

### Test 4: Get task history - Unauthorized
GET {{baseUrl}}/tasks/{{taskId}}/history

### ============================================================================
### USER METRICS TESTS
### ============================================================================

### Test 5: Get user metrics - Success
GET {{baseUrl}}/users/metrics
Authorization: Bearer {{authToken}}

### Test 6: Get user metrics - Unauthorized
GET {{baseUrl}}/users/metrics

### ============================================================================
### EXPORT TESTS
### ============================================================================

### Test 7: Export user data - Success
GET {{baseUrl}}/export
Authorization: Bearer {{authToken}}

### Test 8: Export user data - Unauthorized
GET {{baseUrl}}/export
```

#### Step 9: Manual Testing Checklist
- [ ] Test task history for task with multiple status changes
- [ ] Test task history for task with no status changes (only initial creation)
- [ ] Test task history for non-existent task (should return 404)
- [ ] Test task history for task belonging to different user (should return 404)
- [ ] Test user metrics for new user (might return 404)
- [ ] Test user metrics for user with completed plans
- [ ] Test data export with small dataset
- [ ] Test data export with large dataset (performance check)
- [ ] Test all endpoints without authentication token
- [ ] Test all endpoints with expired token
- [ ] Verify RLS policies prevent cross-user data access

---

### 8.5 Phase 5: Documentation and Deployment

#### Step 10: Update API Documentation
- Verify all response examples match actual implementation
- Add any additional error cases discovered during testing
- Update main API documentation index if needed

#### Step 11: Monitor and Optimize
- Add application logging for all endpoints
- Monitor response times in production
- Implement rate limiting for export endpoint
- Consider adding caching for user metrics endpoint
- Set up alerts for slow queries (> 1s)

---

## 9. Testing Scenarios

### 9.1 Task History Endpoint

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| Valid task with history | Valid taskId, authenticated user | 200 OK with history array |
| Valid task, no history | Valid taskId, new task | 200 OK with empty array |
| Invalid UUID format | Invalid taskId | 400 Bad Request |
| Non-existent task | Valid UUID, task doesn't exist | 404 Not Found |
| Task belongs to other user | Valid taskId, different user | 404 Not Found (RLS) |
| No authentication | No auth token | 401 Unauthorized |
| Database error | Valid request, DB down | 500 Internal Server Error |

### 9.2 User Metrics Endpoint

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| User with metrics | Authenticated user with activity | 200 OK with metrics object |
| New user, no metrics | Authenticated new user | 404 Not Found |
| No authentication | No auth token | 401 Unauthorized |
| Database error | Valid request, DB down | 500 Internal Server Error |

### 9.3 Export Endpoint

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| User with data | Authenticated user with plans | 200 OK with complete export |
| New user, no data | Authenticated new user | 200 OK with empty arrays |
| Large dataset | User with many plans/tasks | 200 OK (might be slow) |
| No authentication | No auth token | 401 Unauthorized |
| Database error | Valid request, DB down | 500 Internal Server Error |
| Query timeout | Very large dataset | 500 Internal Server Error |

---

## 10. Deployment Checklist

- [ ] All service layer functions implemented and tested
- [ ] All API routes created with proper error handling
- [ ] Validation schemas implemented (where applicable)
- [ ] Authentication checks in all endpoints
- [ ] RLS policies verified in database
- [ ] API tests written and passing
- [ ] Manual testing completed
- [ ] Error logging implemented
- [ ] Rate limiting configured (especially for export)
- [ ] Documentation updated
- [ ] Code review completed
- [ ] Performance testing done for export endpoint
- [ ] Monitoring and alerting configured

---

## 11. Future Enhancements

### Task History
- Add filtering by status type
- Add date range filtering
- Add pagination for very long histories
- Consider adding analytics (average time in each status)

### User Metrics
- Add weekly/monthly engagement metrics
- Add streak tracking (consecutive weeks of activity)
- Add goal completion rate calculations
- Consider adding charts/visualizations endpoint

### Export
- Add CSV export format option
- Add export scheduling (weekly/monthly automated exports)
- Add selective export (choose which data to include)
- Implement async export with email notification for large datasets
- Add data import functionality (restore from export)

---

## 12. Related Documentation

- Main API Documentation: `docs/api/api-plan.md`
- Database Schema: `docs/db-plan.md`
- Type Definitions: `src/types.ts`
- RLS Policies: `supabase/migrations/20251016120300_create_rls_policies.sql`
- Database Triggers: `supabase/migrations/20251016120500_create_triggers.sql`

