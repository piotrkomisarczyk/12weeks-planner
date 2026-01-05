# API Endpoint Implementation Plan: Goals - Additional GET Endpoints

## 1. Endpoint Overview

This implementation plan covers two additional GET endpoints for accessing data related to long-term goals:

1. **GET /api/v1/goals/:goalId/weekly-goals** - Get all weekly goals associated with a specific long-term goal
2. **GET /api/v1/goals/:goalId/tasks** - Get all tasks associated with a specific long-term goal (both direct and indirect associations)

These endpoints provide hierarchical access to data structures, allowing clients to retrieve weekly goals and tasks filtered by their relationship to a specific long-term goal. This is particularly useful for displaying goal-specific views in the UI, showing all work items related to a particular goal.

---

## 2. Request Details

### 2.1. GET /api/v1/goals/:goalId/weekly-goals

**HTTP Method**: GET

**URL Structure**: `/api/v1/goals/:goalId/weekly-goals`

**URL Parameters**:
- `goalId` (required, UUID): ID of the long-term goal

**Query Parameters**: None

**Request Headers**:
- `Authorization: Bearer <token>` (required for production, MVP uses default user)

**Example Request**:
```
GET /api/v1/goals/123e4567-e89b-12d3-a456-426614174000/weekly-goals
```

### 2.2. GET /api/v1/goals/:goalId/tasks

**HTTP Method**: GET

**URL Structure**: `/api/v1/goals/:goalId/tasks`

**URL Parameters**:
- `goalId` (required, UUID): ID of the long-term goal

**Query Parameters**:
- `status` (optional, TaskStatus enum): Filter by task status ('todo', 'in_progress', 'completed', 'cancelled', 'postponed')
- `week_number` (optional, number): Filter by week number (1-12)
- `include_milestone_tasks` (optional, boolean): Include tasks linked via milestones (default: true)
- `limit` (optional, number): Number of results to return (default: 50, min: 1, max: 100)
- `offset` (optional, number): Pagination offset (default: 0, min: 0)

**Request Headers**:
- `Authorization: Bearer <token>` (required for production, MVP uses default user)

**Example Request**:
```
GET /api/v1/goals/123e4567-e89b-12d3-a456-426614174000/tasks?status=completed&week_number=3&include_milestone_tasks=true&limit=20&offset=0
```

---

## 3. Types Used

### 3.1. DTOs (Data Transfer Objects)

From `src/types.ts`:

```typescript
// Weekly Goal entity mapping
export type WeeklyGoalDTO = WeeklyGoalEntity;

// Task entity mapping
export type TaskDTO = TaskEntity;

// Response wrappers
export interface ListResponse<T> {
  data: T[];
  count?: number;
}

// Error responses
export interface ValidationErrorResponse {
  error: 'Validation failed';
  details: ValidationErrorDetail[];
}

export interface ErrorResponse {
  error: string;
  message?: string;
}
```

### 3.2. Query Parameter Types

From `src/types.ts` (already defined):

```typescript
// For GET /api/v1/goals/:goalId/tasks
export interface TasksByGoalParams extends ListQueryParams {
  status?: TaskStatus;
  week_number?: number;
  include_milestone_tasks?: boolean;
}
```

### 3.3. Entity Structures

**WeeklyGoalEntity** (from `weekly_goals` table):
```typescript
{
  id: string;                    // UUID
  plan_id: string;              // UUID
  long_term_goal_id: string | null;  // UUID - can be NULL
  milestone_id: string | null;  // UUID - can be NULL
  week_number: number;          // 1-12
  title: string;                // Weekly goal title
  description: string | null;   // Optional description
  position: number;             // Ordering (default 1)
  created_at: string;           // ISO timestamp
  updated_at: string;           // ISO timestamp
}
```

**TaskEntity** (from `tasks` table):
```typescript
{
  id: string;                    // UUID
  weekly_goal_id: string | null; // UUID - NULL for ad-hoc
  plan_id: string;              // UUID
  long_term_goal_id: string | null;  // UUID - optional
  milestone_id: string | null;  // UUID - optional
  title: string;                // Task title
  description: string | null;   // Optional description
  priority: 'A' | 'B' | 'C';   // Task priority
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  task_type: 'weekly_main' | 'weekly_sub' | 'ad_hoc';
  week_number: number | null;   // 1-12, NULL for ad-hoc
  due_day: number | null;       // 1-7 (Monday-Sunday)
  position: number;             // Ordering
  created_at: string;           // ISO timestamp
  updated_at: string;           // ISO timestamp
}
```

---

## 4. Response Details

### 4.1. GET /api/v1/goals/:goalId/weekly-goals

**Success Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "plan_id": "uuid",
      "long_term_goal_id": "uuid",
      "milestone_id": "uuid",
      "week_number": 3,
      "title": "Complete authentication system",
      "description": "Implement auth with Supabase",
      "position": 1,
      "created_at": "2025-01-20T10:00:00Z",
      "updated_at": "2025-01-20T10:00:00Z"
    }
  ]
}
```

**Error Responses**:
- `400 Bad Request`: Invalid goal ID format
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Goal not found or doesn't belong to user
- `500 Internal Server Error`: Database error or unexpected exception

### 4.2. GET /api/v1/goals/:goalId/tasks

**Success Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "weekly_goal_id": "uuid",
      "plan_id": "uuid",
      "long_term_goal_id": "uuid",
      "milestone_id": null,
      "title": "Setup Supabase client",
      "description": "Configure Supabase with environment variables",
      "priority": "A",
      "status": "completed",
      "task_type": "weekly_sub",
      "week_number": 3,
      "due_day": 1,
      "position": 1,
      "created_at": "2025-01-20T10:00:00Z",
      "updated_at": "2025-01-20T16:30:00Z"
    }
  ],
  "count": 1
}
```

**Error Responses**:
- `400 Bad Request`: Invalid query parameters or goal ID format
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Goal not found or doesn't belong to user
- `500 Internal Server Error`: Database error or unexpected exception

---

## 5. Data Flow

### 5.1. GET /api/v1/goals/:goalId/weekly-goals

```
1. Client Request
   ↓
2. API Route (/src/pages/api/v1/goals/[goalId]/weekly-goals.ts)
   - Extract goalId from URL params
   - Validate using GoalIdParamsSchema (Zod)
   ↓
3. Authentication (Middleware)
   - Verify JWT token (MVP: use DEFAULT_USER_ID)
   - Extract user_id
   ↓
4. GoalService.getGoalById(goalId, userId)
   - Verify goal exists and belongs to user
   - Return null if not found or unauthorized
   ↓
5. Return 404 if goal not found
   ↓
6. WeeklyGoalService.getWeeklyGoalsByGoalId(goalId, userId)
   - Build Supabase query
   - Filter by long_term_goal_id = goalId
   - Additional security: verify plan belongs to user via join
   - Order by week_number ASC, position ASC
   - Execute query
   ↓
7. Database (Supabase)
   - Query: SELECT wg.* FROM weekly_goals wg
           INNER JOIN long_term_goals ltg ON wg.long_term_goal_id = ltg.id
           WHERE wg.long_term_goal_id = ? 
           AND ltg.user_id = ?
           ORDER BY wg.week_number ASC, wg.position ASC
   ↓
8. Transform Response
   - Wrap in ListResponse<WeeklyGoalDTO>
   ↓
9. Return 200 OK with JSON
```

### 5.2. GET /api/v1/goals/:goalId/tasks

```
1. Client Request
   ↓
2. API Route (/src/pages/api/v1/goals/[goalId]/tasks.ts)
   - Extract goalId from URL params
   - Extract query parameters from URL
   - Validate using GoalIdParamsSchema and TasksByGoalQuerySchema (Zod)
   ↓
3. Authentication (Middleware)
   - Verify JWT token (MVP: use DEFAULT_USER_ID)
   - Extract user_id
   ↓
4. GoalService.getGoalById(goalId, userId)
   - Verify goal exists and belongs to user
   - Return null if not found or unauthorized
   ↓
5. Return 404 if goal not found
   ↓
6. TaskService.getTasksByGoalId(goalId, userId, params)
   - Build complex Supabase query with two parts:
   
   Part A: Direct tasks (long_term_goal_id = goalId)
   - Filter by long_term_goal_id = goalId
   
   Part B: Indirect tasks (if include_milestone_tasks = true)
   - Get milestone IDs for this goal
   - Filter tasks by milestone_id IN (milestone_ids)
   
   - Combine results (UNION or programmatic merge)
   - Apply optional filters: status, week_number
   - Apply pagination: limit, offset
   - Order by week_number ASC, position ASC
   - Count total results
   ↓
7. Database (Supabase)
   - Query milestones: SELECT id FROM milestones 
                       WHERE long_term_goal_id = ?
   
   - Query tasks (direct): SELECT t.* FROM tasks t
                          INNER JOIN long_term_goals ltg ON t.long_term_goal_id = ltg.id
                          WHERE t.long_term_goal_id = ?
                          AND ltg.user_id = ?
                          [AND status = ?]
                          [AND week_number = ?]
   
   - Query tasks (indirect, if enabled): 
                          SELECT t.* FROM tasks t
                          INNER JOIN milestones m ON t.milestone_id = m.id
                          WHERE t.milestone_id IN (?)
                          AND m.long_term_goal_id = ?
                          [AND status = ?]
                          [AND week_number = ?]
   
   - Merge and deduplicate results
   - Apply pagination and ordering
   ↓
8. Transform Response
   - Wrap in ListResponse<TaskDTO> with count
   ↓
9. Return 200 OK with JSON
```

---

## 6. Security Considerations

### 6.1. Authentication

- **Current (MVP)**: Using `DEFAULT_USER_ID` constant for development
- **Production**: Must implement JWT token verification from Authorization header
- **Implementation**: Extract token, verify with Supabase auth, get user_id

### 6.2. Authorization

- **Goal Ownership Verification**: Both endpoints MUST verify the goal belongs to the user before returning associated data
- **User Isolation**: All queries must filter by user_id to prevent cross-user data access
- **Indirect Access Control**: When accessing weekly goals or tasks via goalId, verify goal ownership first
- **Join-based Security**: Use INNER JOIN with long_term_goals table to ensure user_id check at database level

### 6.3. Input Validation

- **UUID Validation**: goalId must be validated as proper UUID before querying
- **Enum Validation**: status parameter must match TaskStatus enum values
- **Range Validation**: 
  - week_number must be 1-12
  - limit must be 1-100
  - offset must be >= 0
- **Boolean Validation**: include_milestone_tasks must be valid boolean or coercible to boolean
- **Query Parameter Sanitization**: Use Zod schemas to sanitize and validate all inputs

### 6.4. Data Exposure

- **No Sensitive Data**: Weekly goals and tasks don't contain sensitive auth data, but still require user_id filtering
- **Error Messages**: Don't expose database structure or internal errors to client
- **404 vs 403**: Return 404 for both "not found" and "unauthorized" to prevent data leakage
- **Minimal Data**: Return only necessary fields, avoid exposing internal IDs unless needed

### 6.5. SQL Injection Prevention

- **Parameterized Queries**: Supabase client uses parameterized queries automatically
- **No Raw SQL**: Never concatenate user input into SQL strings
- **Enum Validation**: Validate enums before using in queries to prevent injection via invalid enum values

### 6.6. Rate Limiting

- **Recommendation**: Implement rate limiting at API gateway level
- **Per-User Limits**: Consider limits like 100 requests/minute per user
- **Not in Scope**: Rate limiting not implemented in this endpoint

---

## 7. Error Handling

### 7.1. Validation Errors (400 Bad Request)

**Scenario**: Invalid URL parameters or query parameters

**Example Causes**:
- Invalid UUID format for goalId
- Invalid status value (not in TaskStatus enum)
- week_number outside range 1-12
- limit exceeds maximum (100) or is negative/zero
- offset is negative
- include_milestone_tasks is not a valid boolean

**Response Format**:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "goalId",
      "message": "Invalid UUID format",
      "received": "not-a-uuid"
    }
  ]
}
```

**Implementation**:
```typescript
const validationResult = schema.safeParse(input);
if (!validationResult.success) {
  const details = validationResult.error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
    received: 'input' in issue ? issue.input : undefined
  }));
  
  return new Response(
    JSON.stringify({ error: 'Validation failed', details }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### 7.2. Authentication Errors (401 Unauthorized)

**Scenario**: Missing or invalid authentication token

**Example Causes**:
- Authorization header missing
- Token expired
- Token invalid or malformed
- User not found in database

**Response Format**:
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Implementation**:
```typescript
// In middleware or endpoint
const token = request.headers.get('Authorization')?.replace('Bearer ', '');
if (!token) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### 7.3. Not Found Errors (404 Not Found)

**Scenario**: Goal doesn't exist or doesn't belong to user

**Example Causes**:
- Goal not found
- Goal exists but belongs to different user
- Invalid UUID that doesn't match any records

**Response Format**:
```json
{
  "error": "Not found",
  "message": "Goal not found"
}
```

**Implementation**:
```typescript
const goal = await goalService.getGoalById(goalId, userId);
if (!goal) {
  return new Response(
    JSON.stringify({ 
      error: 'Not found', 
      message: 'Goal not found' 
    }),
    { status: 404, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### 7.4. Server Errors (500 Internal Server Error)

**Scenario**: Unexpected errors or database failures

**Example Causes**:
- Database connection failure
- Supabase query error
- Unexpected exception in service layer
- Complex query failures (e.g., milestone fetching for tasks endpoint)

**Response Format**:
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

**Implementation**:
```typescript
try {
  // ... endpoint logic
} catch (error) {
  console.error('Error in GET /api/v1/goals/:goalId/[endpoint]:', {
    error: error.message,
    userId: userId,
    goalId: goalId,
    timestamp: new Date().toISOString()
  });
  
  return new Response(
    JSON.stringify({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### 7.5. Error Logging Strategy

**What to Log**:
- Endpoint path and method
- Error message and stack trace
- User ID (if available)
- Goal ID
- Request parameters (sanitized)
- Timestamp

**What NOT to Log**:
- Sensitive user data
- Authentication tokens
- Full request bodies with potential PII
- Database credentials or connection strings

**Implementation Pattern**:
```typescript
console.error('Error in GET /api/v1/goals/:goalId/tasks:', {
  error: error.message,
  stack: error.stack,
  userId: userId,
  goalId: goalId,
  params: { status, week_number, limit, offset },
  timestamp: new Date().toISOString()
});
```

---

## 8. Performance Considerations

### 8.1. Database Query Optimization

**Indexes Required** (already defined in migrations):
- `idx_weekly_goals_long_term_goal_id` ON `weekly_goals(long_term_goal_id)` - speeds up weekly goals filtering
- `idx_weekly_goals_week_number` ON `weekly_goals(plan_id, week_number)` - speeds up ordering
- `idx_tasks_long_term_goal_id` ON `tasks(long_term_goal_id)` - speeds up direct task filtering
- `idx_tasks_milestone_id` ON `tasks(milestone_id)` - speeds up indirect task filtering
- `idx_tasks_week_number` ON `tasks(plan_id, week_number)` - speeds up week filtering
- `idx_tasks_status` ON `tasks(status)` - speeds up status filtering

**Query Optimization**:
- Use INNER JOIN to enforce user_id security at database level
- Apply filters before ordering
- Use pagination to limit result set size
- For tasks endpoint, consider query strategy: separate queries vs. UNION vs. programmatic merge
- Select only necessary columns if response size becomes an issue

### 8.2. Complex Query Strategy for Tasks Endpoint

**Challenge**: Need to fetch tasks both directly linked to goal AND tasks linked via milestones

**Approach Options**:

1. **Two Separate Queries + Merge (Recommended for MVP)**:
   - Query 1: Direct tasks (long_term_goal_id = goalId)
   - Query 2: Milestone IDs for goal, then tasks with milestone_id IN (ids)
   - Merge in application layer
   - Deduplicate (a task could have both long_term_goal_id AND milestone_id)
   - Apply pagination after merge
   - **Pros**: Clear logic, easier to debug
   - **Cons**: Multiple database round trips, pagination complexity

2. **Database UNION Query**:
   - Use Supabase raw query with UNION
   - Apply pagination in database
   - **Pros**: Single database query, efficient pagination
   - **Cons**: More complex, harder to maintain, requires raw SQL

3. **Database View**:
   - Create a view that handles the logic
   - Query the view with filters
   - **Pros**: Encapsulates logic, reusable
   - **Cons**: Requires migration, less flexible

**Recommendation**: Start with Approach 1 for MVP. Optimize to Approach 2 or 3 if performance issues arise.

### 8.3. Pagination Strategy

**Implementation**:
- Default limit: 50 (reasonable for UI display)
- Maximum limit: 100 (prevents excessive data transfer)
- Use offset-based pagination (simple, works well for small datasets)
- For tasks endpoint, apply pagination AFTER merging results for consistency

**Trade-offs**:
- Offset-based pagination can be slow for large offsets
- For MVP, offset pagination is sufficient (users typically have < 100 tasks per goal)
- Consider cursor-based pagination for future optimization

### 8.4. Caching Considerations

**Not Implemented in MVP**:
- Data changes frequently (task status updates, progress updates)
- Real-time updates needed for multi-device sync
- Caching adds complexity

**Future Optimization**:
- Client-side caching with cache invalidation
- Redis cache for frequently accessed goal hierarchies
- ETags for conditional requests

### 8.5. N+1 Query Prevention

**GET /api/v1/goals/:goalId/tasks with include_milestone_tasks=true**:
- Risk: Query milestones, then query tasks for each milestone (N+1)
- Solution: Batch fetch milestone IDs, then single query with IN clause
- Implementation: Use `milestoneIds = await getMilestoneIds(goalId)`, then `tasks = await getTasksByMilestoneIds(milestoneIds)`

### 8.6. Response Size Optimization

**Strategies**:
- Pagination limits response size
- Weekly goals typically have small payloads
- Tasks have moderate payloads
- No need for field filtering in MVP

**Estimated Response Sizes**:
- Single weekly goal: ~150-300 bytes
- List of 20 weekly goals: ~3-6 KB
- Single task: ~200-400 bytes
- List of 50 tasks: ~10-20 KB (acceptable)

---

## 9. Implementation Steps

### Step 1: Update Validation Schemas

**File**: `/src/lib/validation/goal.validation.ts`

**Tasks**:
1. Check if `GoalIdParamsSchema` already exists (it should from previous implementation)
2. Create `TasksByGoalQuerySchema`:
   - Validate `status` as optional TaskStatus enum
   - Validate `week_number` as optional number, transform from string, range 1-12
   - Validate `include_milestone_tasks` as optional boolean, default true
   - Validate `limit` as optional number, transform from string, default 50, min 1, max 100
   - Validate `offset` as optional number, transform from string, default 0, min 0
   - Export inferred type `TasksByGoalQuery`

**Example Implementation**:
```typescript
import { z } from 'zod';

// Should already exist from previous implementation
export const GoalIdParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid goal ID format' })
});

// New schema for tasks by goal endpoint
export const TasksByGoalQuerySchema = z.object({
  status: z.enum(['todo', 'in_progress', 'completed', 'cancelled', 'postponed']).optional(),
  week_number: z.string().optional()
    .transform((val) => val ? parseInt(val, 10) : undefined)
    .pipe(z.number().int().min(1).max(12).optional()),
  include_milestone_tasks: z.string().optional()
    .transform((val) => {
      if (val === undefined || val === null) return true;
      return val === 'true' || val === '1';
    })
    .pipe(z.boolean()),
  limit: z.string().optional()
    .transform((val) => val ? val : '50')
    .pipe(z.coerce.number().int().min(1).max(100)),
  offset: z.string().optional()
    .transform((val) => val ? val : '0')
    .pipe(z.coerce.number().int().min(0))
});

export type TasksByGoalQuery = z.infer<typeof TasksByGoalQuerySchema>;
```

### Step 2: Update Weekly Goal Service

**File**: `/src/lib/services/weekly-goal.service.ts`

**Tasks**:
1. Check if `WeeklyGoalService` exists, create if it doesn't
2. Implement `getWeeklyGoalsByGoalId(goalId, userId)` method:
   - Accept `goalId` and `userId`
   - Build Supabase query with INNER JOIN to long_term_goals for security
   - Filter by `long_term_goal_id = goalId` AND `user_id = userId` (via join)
   - Order by `week_number ASC, position ASC`
   - Execute query
   - Return `WeeklyGoalDTO[]`
   - Handle errors with descriptive messages

**Example Implementation**:
```typescript
import type { SupabaseClient } from '../../db/supabase.client';
import type { WeeklyGoalDTO } from '../../types';

export class WeeklyGoalService {
  constructor(private supabase: SupabaseClient) {}

  async getWeeklyGoalsByGoalId(
    goalId: string,
    userId: string
  ): Promise<WeeklyGoalDTO[]> {
    try {
      // Query with security check via join
      const { data, error } = await this.supabase
        .from('weekly_goals')
        .select(`
          *,
          long_term_goals!inner(user_id)
        `)
        .eq('long_term_goal_id', goalId)
        .eq('long_term_goals.user_id', userId)
        .order('week_number', { ascending: true })
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching weekly goals by goal ID:', error);
        throw new Error('Failed to fetch weekly goals');
      }

      // Remove the joined data from response
      return (data || []).map(({ long_term_goals, ...weeklyGoal }) => weeklyGoal) as WeeklyGoalDTO[];
    } catch (error) {
      console.error('Error in getWeeklyGoalsByGoalId:', error);
      throw error;
    }
  }
}
```

### Step 3: Update Task Service

**File**: `/src/lib/services/task.service.ts`

**Tasks**:
1. Check if `TaskService` exists, create if it doesn't
2. Implement helper method `getMilestoneIdsByGoalId(goalId)`:
   - Query milestones table for milestone IDs where long_term_goal_id = goalId
   - Return array of milestone IDs
3. Implement `getTasksByGoalId(goalId, userId, params)` method:
   - Accept `goalId`, `userId`, and `TasksByGoalQuery` params
   - Query direct tasks (long_term_goal_id = goalId) with user_id check via join
   - If `include_milestone_tasks` is true:
     - Get milestone IDs for this goal
     - Query tasks with milestone_id IN (milestone_ids)
     - Verify user ownership via join with milestones and long_term_goals
   - Merge results and deduplicate by task ID
   - Apply optional filters: status, week_number
   - Sort merged results by week_number ASC, position ASC
   - Apply pagination: slice(offset, offset + limit)
   - Return `{ data: TaskDTO[], count: number }`
   - Handle errors with descriptive messages

**Example Implementation**:
```typescript
import type { SupabaseClient } from '../../db/supabase.client';
import type { TaskDTO, TasksByGoalParams } from '../../types';

export class TaskService {
  constructor(private supabase: SupabaseClient) {}

  private async getMilestoneIdsByGoalId(goalId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('milestones')
      .select('id')
      .eq('long_term_goal_id', goalId);

    if (error) {
      console.error('Error fetching milestone IDs:', error);
      throw new Error('Failed to fetch milestone IDs');
    }

    return (data || []).map(m => m.id);
  }

  async getTasksByGoalId(
    goalId: string,
    userId: string,
    params: TasksByGoalParams
  ): Promise<{ data: TaskDTO[]; count: number }> {
    try {
      // Build base query for direct tasks
      let directQuery = this.supabase
        .from('tasks')
        .select(`
          *,
          long_term_goals!inner(user_id)
        `)
        .eq('long_term_goal_id', goalId)
        .eq('long_term_goals.user_id', userId);

      // Apply optional filters
      if (params.status) {
        directQuery = directQuery.eq('status', params.status);
      }
      if (params.week_number !== undefined) {
        directQuery = directQuery.eq('week_number', params.week_number);
      }

      const { data: directTasks, error: directError } = await directQuery;

      if (directError) {
        console.error('Error fetching direct tasks:', directError);
        throw new Error('Failed to fetch direct tasks');
      }

      let allTasks = directTasks || [];

      // Fetch milestone tasks if requested
      if (params.include_milestone_tasks) {
        const milestoneIds = await this.getMilestoneIdsByGoalId(goalId);

        if (milestoneIds.length > 0) {
          let milestoneQuery = this.supabase
            .from('tasks')
            .select(`
              *,
              milestones!inner(long_term_goal_id, long_term_goals!inner(user_id))
            `)
            .in('milestone_id', milestoneIds)
            .eq('milestones.long_term_goals.user_id', userId);

          // Apply same filters
          if (params.status) {
            milestoneQuery = milestoneQuery.eq('status', params.status);
          }
          if (params.week_number !== undefined) {
            milestoneQuery = milestoneQuery.eq('week_number', params.week_number);
          }

          const { data: milestoneTasks, error: milestoneError } = await milestoneQuery;

          if (milestoneError) {
            console.error('Error fetching milestone tasks:', milestoneError);
            throw new Error('Failed to fetch milestone tasks');
          }

          // Merge and deduplicate
          const taskMap = new Map<string, TaskDTO>();
          
          [...allTasks, ...(milestoneTasks || [])].forEach(task => {
            // Remove joined data
            const { milestones, long_term_goals, ...cleanTask } = task as any;
            taskMap.set(cleanTask.id, cleanTask as TaskDTO);
          });

          allTasks = Array.from(taskMap.values());
        }
      } else {
        // Remove joined data from direct tasks
        allTasks = allTasks.map(({ long_term_goals, ...task }) => task) as TaskDTO[];
      }

      // Sort by week_number and position
      allTasks.sort((a, b) => {
        const weekA = a.week_number ?? 999;
        const weekB = b.week_number ?? 999;
        if (weekA !== weekB) return weekA - weekB;
        return a.position - b.position;
      });

      // Get total count before pagination
      const totalCount = allTasks.length;

      // Apply pagination
      const { limit = 50, offset = 0 } = params;
      const paginatedTasks = allTasks.slice(offset, offset + limit);

      return {
        data: paginatedTasks,
        count: totalCount
      };
    } catch (error) {
      console.error('Error in getTasksByGoalId:', error);
      throw error;
    }
  }
}
```

### Step 4: Implement GET /api/v1/goals/:goalId/weekly-goals

**File**: `/src/pages/api/v1/goals/[goalId]/weekly-goals.ts`

**Tasks**:
1. Create directory structure: `/src/pages/api/v1/goals/[goalId]/`
2. Add file header with JSDoc comments
3. Import required types and services
4. Add `export const prerender = false;`
5. Implement GET handler:
   - Extract goalId from `params`
   - Validate using `GoalIdParamsSchema.safeParse({ id: goalId })`
   - Return 400 if validation fails
   - Get userId (MVP: use DEFAULT_USER_ID)
   - Create `GoalService` instance and verify goal exists and belongs to user
   - Return 404 if goal not found
   - Create `WeeklyGoalService` instance
   - Call `weeklyGoalService.getWeeklyGoalsByGoalId(goalId, userId)`
   - Wrap result in `ListResponse<WeeklyGoalDTO>`
   - Return 200 with weekly goals array
   - Catch errors and return 500
   - Log errors to console

**Example Implementation**:
```typescript
/**
 * API Endpoint: /api/v1/goals/:goalId/weekly-goals
 * GET - Retrieves all weekly goals associated with a specific long-term goal
 */

import type { APIRoute } from 'astro';
import { GoalService } from '../../../../lib/services/goal.service';
import { WeeklyGoalService } from '../../../../lib/services/weekly-goal.service';
import { GoalIdParamsSchema } from '../../../../lib/validation/goal.validation';
import { DEFAULT_USER_ID } from '../../../../db/supabase.client';
import type { 
  ErrorResponse, 
  ValidationErrorResponse, 
  ListResponse, 
  WeeklyGoalDTO 
} from '../../../../types';

export const prerender = false;

export const GET: APIRoute = async ({ locals, params }) => {
  try {
    // Authentication
    const userId = DEFAULT_USER_ID;

    // Validate URL params
    const validationResult = GoalIdParamsSchema.safeParse({ id: params.goalId });

    if (!validationResult.success) {
      const details = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        received: 'input' in issue ? issue.input : undefined
      }));

      return new Response(
        JSON.stringify({ error: 'Validation failed', details } as ValidationErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id: goalId } = validationResult.data;

    // Verify goal exists and belongs to user
    const goalService = new GoalService(locals.supabase);
    const goal = await goalService.getGoalById(goalId, userId);

    if (!goal) {
      return new Response(
        JSON.stringify({ error: 'Not found', message: 'Goal not found' } as ErrorResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get weekly goals for this goal
    const weeklyGoalService = new WeeklyGoalService(locals.supabase);
    const weeklyGoals = await weeklyGoalService.getWeeklyGoalsByGoalId(goalId, userId);

    // Return success
    return new Response(
      JSON.stringify({ data: weeklyGoals } as ListResponse<WeeklyGoalDTO>),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  } catch (error) {
    console.error('Error in GET /api/v1/goals/:goalId/weekly-goals:', {
      error: error.message,
      goalId: params.goalId,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      } as ErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### Step 5: Implement GET /api/v1/goals/:goalId/tasks

**File**: `/src/pages/api/v1/goals/[goalId]/tasks.ts`

**Tasks**:
1. Same directory as previous endpoint: `/src/pages/api/v1/goals/[goalId]/`
2. Add file header with JSDoc comments
3. Import required types and services
4. Add `export const prerender = false;`
5. Implement GET handler:
   - Extract goalId from `params`
   - Extract query parameters from `url.searchParams`
   - Validate URL params using `GoalIdParamsSchema.safeParse({ id: goalId })`
   - Validate query params using `TasksByGoalQuerySchema.safeParse()`
   - Return 400 if either validation fails
   - Get userId (MVP: use DEFAULT_USER_ID)
   - Create `GoalService` instance and verify goal exists and belongs to user
   - Return 404 if goal not found
   - Create `TaskService` instance
   - Call `taskService.getTasksByGoalId(goalId, userId, validatedQuery)`
   - Return 200 with tasks array and count
   - Catch errors and return 500
   - Log errors to console with full context

**Example Implementation**:
```typescript
/**
 * API Endpoint: /api/v1/goals/:goalId/tasks
 * GET - Retrieves all tasks associated with a specific long-term goal
 */

import type { APIRoute } from 'astro';
import { GoalService } from '../../../../lib/services/goal.service';
import { TaskService } from '../../../../lib/services/task.service';
import { GoalIdParamsSchema, TasksByGoalQuerySchema } from '../../../../lib/validation/goal.validation';
import { DEFAULT_USER_ID } from '../../../../db/supabase.client';
import type { 
  ErrorResponse, 
  ValidationErrorResponse, 
  ListResponse, 
  TaskDTO 
} from '../../../../types';

export const prerender = false;

export const GET: APIRoute = async ({ locals, params, url }) => {
  try {
    // Authentication
    const userId = DEFAULT_USER_ID;

    // Validate URL params
    const paramsValidation = GoalIdParamsSchema.safeParse({ id: params.goalId });

    if (!paramsValidation.success) {
      const details = paramsValidation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        received: 'input' in issue ? issue.input : undefined
      }));

      return new Response(
        JSON.stringify({ error: 'Validation failed', details } as ValidationErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id: goalId } = paramsValidation.data;

    // Parse and validate query parameters
    const queryParams = {
      status: url.searchParams.get('status'),
      week_number: url.searchParams.get('week_number'),
      include_milestone_tasks: url.searchParams.get('include_milestone_tasks'),
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset')
    };

    const queryValidation = TasksByGoalQuerySchema.safeParse(queryParams);

    if (!queryValidation.success) {
      const details = queryValidation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        received: 'input' in issue ? issue.input : undefined
      }));

      return new Response(
        JSON.stringify({ error: 'Validation failed', details } as ValidationErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify goal exists and belongs to user
    const goalService = new GoalService(locals.supabase);
    const goal = await goalService.getGoalById(goalId, userId);

    if (!goal) {
      return new Response(
        JSON.stringify({ error: 'Not found', message: 'Goal not found' } as ErrorResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get tasks for this goal
    const taskService = new TaskService(locals.supabase);
    const result = await taskService.getTasksByGoalId(goalId, userId, queryValidation.data);

    // Return success
    return new Response(
      JSON.stringify({ 
        data: result.data, 
        count: result.count 
      } as ListResponse<TaskDTO>),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  } catch (error) {
    console.error('Error in GET /api/v1/goals/:goalId/tasks:', {
      error: error.message,
      stack: error.stack,
      goalId: params.goalId,
      queryParams: {
        status: url.searchParams.get('status'),
        week_number: url.searchParams.get('week_number'),
        include_milestone_tasks: url.searchParams.get('include_milestone_tasks')
      },
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      } as ErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### Step 6: Create Directory Structure

**Tasks**:
1. Create `/src/pages/api/v1/goals/[goalId]/` directory if it doesn't exist
2. Place both endpoint files in this directory
3. Ensure proper file naming according to Astro routing conventions:
   - `weekly-goals.ts`
   - `tasks.ts`

### Step 7: Testing

**Manual Testing Tasks**:

1. **Test GET /api/v1/goals/:goalId/weekly-goals**:
   - Test with valid goal ID that has weekly goals
   - Test with valid goal ID that has no weekly goals (empty array)
   - Test with invalid UUID format (expect 400)
   - Test with valid UUID that doesn't exist (expect 404)
   - Test with goal belonging to different user (expect 404)
   - Verify weekly goals are ordered by week_number and position
   - Verify all weekly goal fields are present and correct

2. **Test GET /api/v1/goals/:goalId/tasks**:
   - Test without query params (defaults: include_milestone_tasks=true, limit=50, offset=0)
   - Test with status filter (each status value)
   - Test with week_number filter (values 1-12)
   - Test with include_milestone_tasks=false (only direct tasks)
   - Test with include_milestone_tasks=true (direct + milestone tasks)
   - Test with custom limit and offset
   - Test with combined filters (status + week_number)
   - Test with invalid UUID format for goalId (expect 400)
   - Test with invalid status value (expect 400)
   - Test with week_number out of range (expect 400)
   - Test with limit > 100 (expect 400)
   - Test with negative offset (expect 400)
   - Test with valid UUID that doesn't exist (expect 404)
   - Test with goal belonging to different user (expect 404)
   - Verify tasks are ordered correctly
   - Verify count matches actual results
   - Verify deduplication works (task with both long_term_goal_id and milestone_id)
   - Verify pagination works correctly

**Create HTTP Test File**:

Create `/api-tests/get-goals-others-tests.http` with test cases for both endpoints:

```http
### GET Weekly Goals by Goal - Valid goal with weekly goals
GET http://localhost:4321/api/v1/goals/{{goalId}}/weekly-goals

### GET Weekly Goals by Goal - Invalid UUID
GET http://localhost:4321/api/v1/goals/not-a-uuid/weekly-goals

### GET Weekly Goals by Goal - Non-existent goal
GET http://localhost:4321/api/v1/goals/123e4567-e89b-12d3-a456-426614174999/weekly-goals

### GET Tasks by Goal - All tasks (default)
GET http://localhost:4321/api/v1/goals/{{goalId}}/tasks

### GET Tasks by Goal - Only completed tasks
GET http://localhost:4321/api/v1/goals/{{goalId}}/tasks?status=completed

### GET Tasks by Goal - Week 3 tasks
GET http://localhost:4321/api/v1/goals/{{goalId}}/tasks?week_number=3

### GET Tasks by Goal - Exclude milestone tasks
GET http://localhost:4321/api/v1/goals/{{goalId}}/tasks?include_milestone_tasks=false

### GET Tasks by Goal - With pagination
GET http://localhost:4321/api/v1/goals/{{goalId}}/tasks?limit=10&offset=0

### GET Tasks by Goal - Combined filters
GET http://localhost:4321/api/v1/goals/{{goalId}}/tasks?status=completed&week_number=3&limit=20

### GET Tasks by Goal - Invalid status
GET http://localhost:4321/api/v1/goals/{{goalId}}/tasks?status=invalid_status

### GET Tasks by Goal - Invalid week number
GET http://localhost:4321/api/v1/goals/{{goalId}}/tasks?week_number=13

### GET Tasks by Goal - Invalid limit
GET http://localhost:4321/api/v1/goals/{{goalId}}/tasks?limit=150
```

### Step 8: Documentation

**Tasks**:
1. This implementation plan serves as primary documentation
2. Update main API documentation (`docs/api/api-plan.md`) if needed
3. Add JSDoc comments to service methods
4. Document query parameters clearly in code comments
5. Add usage examples in comments

### Step 9: Code Review Checklist

**Before marking complete, verify**:
- [ ] Both endpoints implemented and working
- [ ] Validation schemas cover all edge cases
- [ ] Service methods use INNER JOIN for security (user_id filtering)
- [ ] Error handling follows established patterns
- [ ] Error messages are user-friendly but not exposing internals
- [ ] All queries are optimized with proper indexing
- [ ] Response formats match specification exactly
- [ ] HTTP status codes are correct for each scenario
- [ ] Tasks endpoint correctly merges direct and milestone tasks
- [ ] Tasks endpoint properly deduplicates results
- [ ] Pagination works correctly on merged results
- [ ] Code follows project structure and naming conventions
- [ ] TypeScript types are properly used throughout
- [ ] No linter errors or warnings
- [ ] Console logging for errors is in place with full context
- [ ] Security headers are set (X-Content-Type-Options)
- [ ] Manual testing completed for all scenarios
- [ ] Goal ownership verification happens before data retrieval

---

## 10. Future Enhancements

### 10.1. Authentication

- Replace `DEFAULT_USER_ID` with real JWT token verification
- Implement token refresh logic
- Add role-based access control if needed

### 10.2. Performance Optimization

- Implement cursor-based pagination for better performance at large offsets
- Optimize tasks endpoint to use database UNION query instead of application-level merge
- Create database view for tasks-by-goal query
- Add response caching with ETags
- Consider materialized view for frequently accessed goal hierarchies

### 10.3. Features

- Add sorting options for tasks (by priority, due_day, status, etc.)
- Add filtering by priority for tasks endpoint
- Add filtering by task_type for tasks endpoint
- Return computed statistics (e.g., completion percentage)
- Add field selection parameter to return only needed fields
- Support batch fetching (multiple goal IDs in one request)

### 10.4. Query Optimization

- Create specialized database view for tasks-by-goal query
- Implement query result caching at service layer
- Add database function for complex task fetching logic
- Consider denormalization for read-heavy access patterns

### 10.5. Monitoring

- Add request duration tracking
- Add error rate monitoring
- Add usage analytics (most queried goals, filter usage, etc.)
- Implement structured logging for production
- Track merge operation performance for tasks endpoint

---

## Summary

This implementation plan provides a comprehensive guide for implementing two GET endpoints that provide hierarchical access to weekly goals and tasks filtered by long-term goal.

**Key implementation principles**:
1. **Security First**: Verify goal ownership before returning associated data, use INNER JOIN for database-level security
2. **Validation**: Use Zod schemas for all input validation with descriptive errors
3. **Service Layer**: Business logic isolated in services for testability and reusability
4. **Complex Queries**: Handle merge/deduplication logic carefully for tasks endpoint
5. **Error Handling**: Comprehensive error handling with appropriate status codes
6. **Performance**: Leverage database indexes and pagination, optimize merge operations
7. **Consistency**: Follow existing patterns from other goal endpoints

**Special attention points**:
- Tasks endpoint requires complex logic to merge direct and indirect (via milestones) associations
- Proper deduplication needed when task has both long_term_goal_id AND milestone_id
- Pagination must be applied after merging for consistent results
- Security verification must happen at goal level before returning child resources

