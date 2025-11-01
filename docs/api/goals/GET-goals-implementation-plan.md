# API Endpoint Implementation Plan: Goals (Long-term Goals) - GET Endpoints

## 1. Endpoint Overview

This implementation plan covers three GET endpoints for managing long-term goals in the 12 Weeks Planner application:

1. **GET /api/v1/goals** - List all goals for the authenticated user with optional filtering by plan
2. **GET /api/v1/plans/:planId/goals** - Get all goals for a specific plan
3. **GET /api/v1/goals/:id** - Get a specific goal with its milestones

These endpoints provide read-only access to long-term goals, which are the foundation of the 12-week planning system. Each goal can have 3-5 milestones and is associated with a specific plan. Goals include progress tracking (0-100%), categorization, and positioning.

---

## 2. Request Details

### 2.1. GET /api/v1/goals

**HTTP Method**: GET

**URL Structure**: `/api/v1/goals`

**Query Parameters**:
- `plan_id` (optional, UUID): Filter goals by plan ID
- `limit` (optional, number): Number of results to return (default: 50, min: 1, max: 100)
- `offset` (optional, number): Pagination offset (default: 0, min: 0)

**Request Headers**:
- `Authorization: Bearer <token>` (required for production, MVP uses default user)

**Example Request**:
```
GET /api/v1/goals?plan_id=123e4567-e89b-12d3-a456-426614174000&limit=20&offset=0
```

### 2.2. GET /api/v1/plans/:planId/goals

**HTTP Method**: GET

**URL Structure**: `/api/v1/plans/:planId/goals`

**URL Parameters**:
- `planId` (required, UUID): ID of the plan

**Request Headers**:
- `Authorization: Bearer <token>` (required for production, MVP uses default user)

**Example Request**:
```
GET /api/v1/plans/123e4567-e89b-12d3-a456-426614174000/goals
```

### 2.3. GET /api/v1/goals/:id

**HTTP Method**: GET

**URL Structure**: `/api/v1/goals/:id`

**URL Parameters**:
- `id` (required, UUID): ID of the goal

**Request Headers**:
- `Authorization: Bearer <token>` (required for production, MVP uses default user)

**Example Request**:
```
GET /api/v1/goals/123e4567-e89b-12d3-a456-426614174000
```

---

## 3. Types Used

### 3.1. DTOs (Data Transfer Objects)

From `src/types.ts`:

```typescript
// Goal entity mapping
export type GoalDTO = LongTermGoalEntity;

// Goal with nested milestones (for GET /api/v1/goals/:id)
export interface GoalWithMilestonesDTO extends GoalDTO {
  milestones: MilestoneDTO[];
}

// Milestone entity mapping
export type MilestoneDTO = MilestoneEntity;

// Response wrappers
export interface ListResponse<T> {
  data: T[];
  count?: number;
}

export interface ItemResponse<T> {
  data: T;
}
```

### 3.2. Query Parameter Types

Need to define in `src/lib/validation/goal.validation.ts`:

```typescript
// Query params for GET /api/v1/goals
export interface GoalListParams {
  plan_id?: string;
  limit: number;
  offset: number;
}
```

### 3.3. Entity Structure

From database schema (`long_term_goals` table):

```typescript
{
  id: string;              // UUID
  plan_id: string;         // UUID
  title: string;           // Goal title
  description: string | null;  // Why this goal is important
  category: 'work' | 'finance' | 'hobby' | 'relationships' | 'health' | 'development' | null;
  progress_percentage: number;  // 0-100
  position: number;        // 1-5 (ordering)
  created_at: string;      // ISO timestamp
  updated_at: string;      // ISO timestamp
}
```

---

## 4. Response Details

### 4.1. GET /api/v1/goals

**Success Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "plan_id": "uuid",
      "title": "Launch MVP",
      "description": "Important for career growth and financial independence",
      "category": "work",
      "progress_percentage": 45,
      "position": 1,
      "created_at": "2025-01-06T10:00:00Z",
      "updated_at": "2025-01-20T15:30:00Z"
    }
  ],
  "count": 1
}
```

**Error Responses**:
- `400 Bad Request`: Invalid query parameters (invalid UUID, invalid limit/offset)
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Database error or unexpected exception

### 4.2. GET /api/v1/plans/:planId/goals

**Success Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "plan_id": "uuid",
      "title": "Launch MVP",
      "description": "Important for career growth",
      "category": "work",
      "progress_percentage": 45,
      "position": 1,
      "created_at": "2025-01-06T10:00:00Z",
      "updated_at": "2025-01-20T15:30:00Z"
    }
  ]
}
```

**Error Responses**:
- `400 Bad Request`: Invalid plan ID format
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Plan not found or doesn't belong to user
- `500 Internal Server Error`: Database error or unexpected exception

### 4.3. GET /api/v1/goals/:id

**Success Response (200 OK)**:
```json
{
  "data": {
    "id": "uuid",
    "plan_id": "uuid",
    "title": "Launch MVP",
    "description": "Important for career growth",
    "category": "work",
    "progress_percentage": 45,
    "position": 1,
    "created_at": "2025-01-06T10:00:00Z",
    "updated_at": "2025-01-20T15:30:00Z",
    "milestones": [
      {
        "id": "uuid",
        "long_term_goal_id": "uuid",
        "title": "Complete API design",
        "description": "",
        "due_date": "2025-01-20",
        "is_completed": true,
        "position": 1,
        "created_at": "2025-01-06T10:00:00Z",
        "updated_at": "2025-01-20T15:30:00Z"
      }
    ]
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid goal ID format
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Goal not found or doesn't belong to user
- `500 Internal Server Error`: Database error or unexpected exception

---

## 5. Data Flow

### 5.1. GET /api/v1/goals

```
1. Client Request
   ↓
2. API Route (/src/pages/api/v1/goals.ts)
   - Extract query parameters from URL
   - Validate using GetGoalsQuerySchema (Zod)
   ↓
3. Authentication (Middleware)
   - Verify JWT token (MVP: use DEFAULT_USER_ID)
   - Extract user_id
   ↓
4. GoalService.getGoals(userId, params)
   - Build Supabase query
   - Filter by user_id (security)
   - Apply optional plan_id filter
   - Apply pagination (limit, offset)
   - Order by position ASC
   - Execute query with count
   ↓
5. Database (Supabase)
   - Query: SELECT * FROM long_term_goals 
           WHERE user_id = ? [AND plan_id = ?]
           ORDER BY position ASC
           LIMIT ? OFFSET ?
   ↓
6. Transform Response
   - Wrap in ListResponse<GoalDTO>
   - Return with count
   ↓
7. Return 200 OK with JSON
```

### 5.2. GET /api/v1/plans/:planId/goals

```
1. Client Request
   ↓
2. API Route (/src/pages/api/v1/plans/[planId]/goals.ts)
   - Extract planId from URL params
   - Validate using PlanIdParamsSchema (Zod)
   ↓
3. Authentication (Middleware)
   - Verify JWT token (MVP: use DEFAULT_USER_ID)
   - Extract user_id
   ↓
4. PlanService.getPlanById(planId, userId)
   - Verify plan exists and belongs to user
   - Return null if not found or unauthorized
   ↓
5. Return 404 if plan not found
   ↓
6. GoalService.getGoalsByPlanId(planId, userId)
   - Build Supabase query
   - Filter by plan_id AND user_id (security)
   - Order by position ASC
   - Execute query
   ↓
7. Database (Supabase)
   - Query: SELECT * FROM long_term_goals 
           WHERE plan_id = ? AND user_id = ?
           ORDER BY position ASC
   ↓
8. Transform Response
   - Wrap in ListResponse<GoalDTO>
   ↓
9. Return 200 OK with JSON
```

### 5.3. GET /api/v1/goals/:id

```
1. Client Request
   ↓
2. API Route (/src/pages/api/v1/goals/[id].ts)
   - Extract id from URL params
   - Validate using GoalIdParamsSchema (Zod)
   ↓
3. Authentication (Middleware)
   - Verify JWT token (MVP: use DEFAULT_USER_ID)
   - Extract user_id
   ↓
4. GoalService.getGoalById(goalId, userId)
   - Query goal by id and user_id
   - Return null if not found or unauthorized
   ↓
5. Return 404 if goal not found
   ↓
6. GoalService (continued)
   - Query milestones for goal
   - Order milestones by position ASC
   ↓
7. Database (Supabase)
   - Query 1: SELECT * FROM long_term_goals 
              WHERE id = ? AND user_id = ?
   - Query 2: SELECT * FROM milestones 
              WHERE long_term_goal_id = ?
              ORDER BY position ASC
   ↓
8. Transform Response
   - Combine goal with milestones array
   - Return GoalWithMilestonesDTO
   - Wrap in ItemResponse<GoalWithMilestonesDTO>
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

- **User Isolation**: ALL queries MUST filter by `user_id` to prevent cross-user data access
- **Plan Ownership**: When accessing goals by planId, verify plan belongs to user first
- **Goal Ownership**: When accessing specific goal, verify it belongs to user via user_id check

### 6.3. Input Validation

- **UUID Validation**: All IDs must be validated as proper UUIDs before querying
- **Pagination Limits**: Enforce maximum limit of 100 to prevent resource exhaustion
- **Query Parameter Sanitization**: Use Zod schemas to sanitize and validate all inputs

### 6.4. Data Exposure

- **No Sensitive Data**: Goals don't contain sensitive auth data, but still filter by user_id
- **Error Messages**: Don't expose database structure or internal errors to client
- **404 vs 403**: Return 404 for both "not found" and "unauthorized" to prevent data leakage

### 6.5. SQL Injection Prevention

- **Parameterized Queries**: Supabase client uses parameterized queries automatically
- **No Raw SQL**: Never concatenate user input into SQL strings

### 6.6. Rate Limiting

- **Recommendation**: Implement rate limiting at API gateway level
- **Per-User Limits**: Consider limits like 100 requests/minute per user
- **Not in Scope**: Rate limiting not implemented in this endpoint

---

## 7. Error Handling

### 7.1. Validation Errors (400 Bad Request)

**Scenario**: Invalid query parameters or URL parameters

**Example Causes**:
- Invalid UUID format for plan_id, planId, or goal id
- Limit exceeds maximum (100) or is negative
- Offset is negative
- Invalid JSON in request body (not applicable for GET)

**Response Format**:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "plan_id",
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

**Scenario**: Resource doesn't exist or doesn't belong to user

**Example Causes**:
- Plan not found (GET /api/v1/plans/:planId/goals)
- Goal not found (GET /api/v1/goals/:id)
- Plan/Goal exists but belongs to different user

**Response Format**:
```json
{
  "error": "Not found",
  "message": "Plan not found"
}
```

or

```json
{
  "error": "Not found",
  "message": "Goal not found"
}
```

**Implementation**:
```typescript
const resource = await service.getById(id, userId);
if (!resource) {
  return new Response(
    JSON.stringify({ 
      error: 'Not found', 
      message: 'Resource not found' 
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
  console.error('Error in GET /api/v1/goals:', error);
  
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
- Request parameters (sanitized)
- Timestamp

**What NOT to Log**:
- Sensitive user data
- Authentication tokens
- Full request bodies with potential PII

**Implementation Pattern**:
```typescript
console.error('Error in GET /api/v1/goals:', {
  error: error.message,
  userId: userId,
  params: { plan_id, limit, offset },
  timestamp: new Date().toISOString()
});
```

---

## 8. Performance Considerations

### 8.1. Database Query Optimization

**Indexes Required** (already defined in migration):
- `idx_long_term_goals_plan_id` ON `long_term_goals(plan_id)` - speeds up filtering by plan
- `idx_long_term_goals_position` ON `long_term_goals(plan_id, position)` - speeds up ordering

**Query Optimization**:
- Use `select('*')` only when needed; consider selecting specific columns
- Apply filters before ordering
- Use pagination to limit result set size
- For GET /api/v1/goals/:id, consider using a single query with JOIN instead of two queries

### 8.2. Pagination Strategy

**Implementation**:
- Default limit: 50 (reasonable for UI display)
- Maximum limit: 100 (prevents excessive data transfer)
- Use offset-based pagination (simple, works well for small datasets)
- Consider cursor-based pagination for future optimization

**Trade-offs**:
- Offset-based pagination can be slow for large offsets
- For MVP, offset pagination is sufficient (users typically have < 100 goals total)

### 8.3. Caching Considerations

**Not Implemented in MVP**:
- Goals change frequently (progress updates)
- Real-time updates needed for multi-device sync
- Caching adds complexity

**Future Optimization**:
- Client-side caching with cache invalidation
- Redis cache for frequently accessed goals
- ETags for conditional requests

### 8.4. N+1 Query Prevention

**GET /api/v1/goals/:id**:
- Current approach: 2 queries (goal + milestones)
- Alternative: Single query with JOIN
- Trade-off: Simpler code vs. marginally faster execution

**Recommendation**: Keep 2-query approach for MVP (clearer code, minimal performance impact)

### 8.5. Response Size Optimization

**Strategies**:
- Pagination limits response size for list endpoints
- Goals typically have small data payloads
- Milestones array limited to max 5 per goal
- No need for field filtering in MVP

**Estimated Response Sizes**:
- Single goal: ~200-500 bytes
- Goal with 5 milestones: ~1-2 KB
- List of 50 goals: ~10-25 KB (acceptable)

---

## 9. Implementation Steps

### Step 1: Create Goal Service

**File**: `/src/lib/services/goal.service.ts`

**Tasks**:
1. Create `GoalService` class with constructor accepting `SupabaseClient`
2. Implement `getGoals(userId, params)` method:
   - Accept `userId` and `GoalListParams` (plan_id, limit, offset)
   - Build Supabase query filtering by `user_id`
   - Apply optional `plan_id` filter if provided
   - Order by `position ASC`
   - Apply pagination with `range(offset, offset + limit - 1)`
   - Execute query with count
   - Return `PaginatedResponse<GoalDTO>`
   - Handle errors with descriptive messages

3. Implement `getGoalsByPlanId(planId, userId)` method:
   - Accept `planId` and `userId`
   - Build Supabase query filtering by `plan_id` AND `user_id`
   - Order by `position ASC`
   - Execute query
   - Return `GoalDTO[]`
   - Handle errors with descriptive messages

4. Implement `getGoalById(goalId, userId)` method:
   - Accept `goalId` and `userId`
   - Query goal by `id` AND `user_id` using `maybeSingle()`
   - Return `null` if not found
   - If found, query milestones for this goal
   - Order milestones by `position ASC`
   - Combine goal with milestones array
   - Return `GoalWithMilestonesDTO`
   - Handle errors with descriptive messages

**Example Implementation**:
```typescript
import type { SupabaseClient } from '../../db/supabase.client';
import type { 
  GoalDTO, 
  GoalWithMilestonesDTO,
  MilestoneDTO,
  PaginatedResponse 
} from '../../types';

export interface GoalListParams {
  plan_id?: string;
  limit: number;
  offset: number;
}

export class GoalService {
  constructor(private supabase: SupabaseClient) {}

  async getGoals(
    userId: string,
    params: GoalListParams
  ): Promise<PaginatedResponse<GoalDTO>> {
    // Implementation here
  }

  async getGoalsByPlanId(
    planId: string,
    userId: string
  ): Promise<GoalDTO[]> {
    // Implementation here
  }

  async getGoalById(
    goalId: string,
    userId: string
  ): Promise<GoalWithMilestonesDTO | null> {
    // Implementation here
  }
}
```

### Step 2: Create Validation Schemas

**File**: `/src/lib/validation/goal.validation.ts`

**Tasks**:
1. Import Zod: `import { z } from 'zod';`

2. Create `GetGoalsQuerySchema`:
   - Validate `plan_id` as optional UUID
   - Validate `limit` as string, transform to number, default 50, max 100
   - Validate `offset` as string, transform to number, default 0, min 0
   - Export inferred type `GetGoalsQuery`

3. Create `PlanIdParamsSchema`:
   - Validate `planId` as required UUID
   - Export inferred type `PlanIdParams`

4. Create `GoalIdParamsSchema`:
   - Validate `id` as required UUID
   - Export inferred type `GoalIdParams`

**Example Implementation**:
```typescript
import { z } from 'zod';

export const GetGoalsQuerySchema = z.object({
  plan_id: z.string().uuid().nullish(),
  limit: z.string().nullish()
    .transform((val) => val === null || val === undefined ? '50' : val)
    .pipe(z.coerce.number().int().positive().max(100)),
  offset: z.string().nullish()
    .transform((val) => val === null || val === undefined ? '0' : val)
    .pipe(z.coerce.number().int().min(0))
}).transform((data) => ({
  ...data,
  plan_id: data.plan_id ?? undefined
}));

export type GetGoalsQuery = z.infer<typeof GetGoalsQuerySchema>;

export const PlanIdParamsSchema = z.object({
  planId: z.string().uuid({ message: 'Invalid plan ID format' })
});

export type PlanIdParams = z.infer<typeof PlanIdParamsSchema>;

export const GoalIdParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid goal ID format' })
});

export type GoalIdParams = z.infer<typeof GoalIdParamsSchema>;
```

### Step 3: Implement GET /api/v1/goals

**File**: `/src/pages/api/v1/goals.ts`

**Tasks**:
1. Add file header with JSDoc comments describing endpoint
2. Import required types and services
3. Add `export const prerender = false;`
4. Implement GET handler:
   - Extract query parameters from `url.searchParams`
   - Validate using `GetGoalsQuerySchema.safeParse()`
   - Return 400 if validation fails with structured error
   - Get userId (MVP: use DEFAULT_USER_ID)
   - Create `GoalService` instance with `locals.supabase`
   - Call `goalService.getGoals(userId, validatedParams)`
   - Return 200 with paginated response
   - Catch errors and return 500 with generic error message
   - Log errors to console

**Example Implementation**:
```typescript
/**
 * API Endpoints: /api/v1/goals
 * GET - Retrieves goals for authenticated user with optional filtering
 */

import type { APIRoute } from 'astro';
import { GoalService } from '../../../lib/services/goal.service';
import { GetGoalsQuerySchema } from '../../../lib/validation/goal.validation';
import { DEFAULT_USER_ID } from '../../../db/supabase.client';
import type { ErrorResponse, ValidationErrorResponse } from '../../../types';

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    // Authentication
    const userId = DEFAULT_USER_ID;

    // Parse and validate query parameters
    const queryParams = {
      plan_id: url.searchParams.get('plan_id'),
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset')
    };

    const validationResult = GetGoalsQuerySchema.safeParse(queryParams);

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

    // Call service
    const goalService = new GoalService(locals.supabase);
    const result = await goalService.getGoals(userId, validationResult.data);

    // Return success
    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  } catch (error) {
    console.error('Error in GET /api/v1/goals:', error);
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

### Step 4: Implement GET /api/v1/plans/:planId/goals

**File**: `/src/pages/api/v1/plans/[planId]/goals.ts`

**Tasks**:
1. Create directory structure: `/src/pages/api/v1/plans/[planId]/`
2. Add file header with JSDoc comments
3. Import required types and services (GoalService and PlanService)
4. Add `export const prerender = false;`
5. Implement GET handler:
   - Extract planId from `context.params`
   - Validate using `PlanIdParamsSchema.safeParse()`
   - Return 400 if validation fails
   - Get userId (MVP: use DEFAULT_USER_ID)
   - Create `PlanService` instance and verify plan exists and belongs to user
   - Return 404 if plan not found
   - Create `GoalService` instance
   - Call `goalService.getGoalsByPlanId(planId, userId)`
   - Wrap result in `ListResponse<GoalDTO>`
   - Return 200 with goals array
   - Catch errors and return 500
   - Log errors to console

**Example Implementation**:
```typescript
/**
 * API Endpoints: /api/v1/plans/:planId/goals
 * GET - Retrieves all goals for a specific plan
 */

import type { APIRoute } from 'astro';
import { GoalService } from '../../../../lib/services/goal.service';
import { PlanService } from '../../../../lib/services/plan.service';
import { PlanIdParamsSchema } from '../../../../lib/validation/goal.validation';
import { DEFAULT_USER_ID } from '../../../../db/supabase.client';
import type { ErrorResponse, ValidationErrorResponse, ListResponse, GoalDTO } from '../../../../types';

export const prerender = false;

export const GET: APIRoute = async ({ locals, params }) => {
  try {
    // Authentication
    const userId = DEFAULT_USER_ID;

    // Validate URL params
    const validationResult = PlanIdParamsSchema.safeParse(params);

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

    const { planId } = validationResult.data;

    // Verify plan exists and belongs to user
    const planService = new PlanService(locals.supabase);
    const plan = await planService.getPlanById(planId, userId);

    if (!plan) {
      return new Response(
        JSON.stringify({ error: 'Not found', message: 'Plan not found' } as ErrorResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get goals for plan
    const goalService = new GoalService(locals.supabase);
    const goals = await goalService.getGoalsByPlanId(planId, userId);

    // Return success
    return new Response(
      JSON.stringify({ data: goals } as ListResponse<GoalDTO>),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  } catch (error) {
    console.error('Error in GET /api/v1/plans/:planId/goals:', error);
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

### Step 5: Implement GET /api/v1/goals/:id

**File**: `/src/pages/api/v1/goals/[id].ts`

**Tasks**:
1. Create directory structure: `/src/pages/api/v1/goals/`
2. Add file header with JSDoc comments
3. Import required types and services
4. Add `export const prerender = false;`
5. Implement GET handler:
   - Extract id from `context.params`
   - Validate using `GoalIdParamsSchema.safeParse()`
   - Return 400 if validation fails
   - Get userId (MVP: use DEFAULT_USER_ID)
   - Create `GoalService` instance
   - Call `goalService.getGoalById(goalId, userId)`
   - Return 404 if goal not found
   - Wrap result in `ItemResponse<GoalWithMilestonesDTO>`
   - Return 200 with goal and milestones
   - Catch errors and return 500
   - Log errors to console

**Example Implementation**:
```typescript
/**
 * API Endpoints: /api/v1/goals/:id
 * GET - Retrieves a specific goal with its milestones
 */

import type { APIRoute } from 'astro';
import { GoalService } from '../../../../lib/services/goal.service';
import { GoalIdParamsSchema } from '../../../../lib/validation/goal.validation';
import { DEFAULT_USER_ID } from '../../../../db/supabase.client';
import type { 
  ErrorResponse, 
  ValidationErrorResponse, 
  ItemResponse, 
  GoalWithMilestonesDTO 
} from '../../../../types';

export const prerender = false;

export const GET: APIRoute = async ({ locals, params }) => {
  try {
    // Authentication
    const userId = DEFAULT_USER_ID;

    // Validate URL params
    const validationResult = GoalIdParamsSchema.safeParse(params);

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

    const { id } = validationResult.data;

    // Get goal with milestones
    const goalService = new GoalService(locals.supabase);
    const goal = await goalService.getGoalById(id, userId);

    if (!goal) {
      return new Response(
        JSON.stringify({ error: 'Not found', message: 'Goal not found' } as ErrorResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return success
    return new Response(
      JSON.stringify({ data: goal } as ItemResponse<GoalWithMilestonesDTO>),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  } catch (error) {
    console.error('Error in GET /api/v1/goals/:id:', error);
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
1. Create `/src/pages/api/v1/goals/` directory
2. Create `/src/pages/api/v1/plans/[planId]/` directory (if doesn't exist)
3. Ensure proper file placement according to Astro routing conventions

### Step 7: Testing

**Manual Testing Tasks**:

1. **Test GET /api/v1/goals**:
   - Test without query params (should use defaults)
   - Test with plan_id filter
   - Test with custom limit and offset
   - Test with invalid UUID for plan_id (expect 400)
   - Test with limit > 100 (expect 400)
   - Test with negative offset (expect 400)
   - Verify pagination works correctly
   - Verify goals are ordered by position

2. **Test GET /api/v1/plans/:planId/goals**:
   - Test with valid plan ID that has goals
   - Test with valid plan ID that has no goals (empty array)
   - Test with invalid UUID format (expect 400)
   - Test with valid UUID that doesn't exist (expect 404)
   - Test with plan belonging to different user (expect 404)
   - Verify goals are ordered by position

3. **Test GET /api/v1/goals/:id**:
   - Test with valid goal ID that has milestones
   - Test with valid goal ID that has no milestones (empty array)
   - Test with invalid UUID format (expect 400)
   - Test with valid UUID that doesn't exist (expect 404)
   - Test with goal belonging to different user (expect 404)
   - Verify milestones are ordered by position
   - Verify milestone fields are complete

**Create HTTP Test File**:

Create `/api-tests/get-goals-tests.http` with test cases for all three endpoints.

### Step 8: Documentation

**Tasks**:
1. Update API documentation with endpoint details
2. Document query parameters and response formats
3. Add example requests and responses
4. Document error codes and messages

### Step 9: Code Review Checklist

**Before marking complete, verify**:
- [ ] All three endpoints implemented and working
- [ ] Validation schemas cover all edge cases
- [ ] Service methods filter by user_id for security
- [ ] Error handling follows established patterns
- [ ] Error messages are user-friendly but not exposing internals
- [ ] All queries are optimized with proper indexing
- [ ] Response formats match specification exactly
- [ ] HTTP status codes are correct for each scenario
- [ ] Code follows project structure and naming conventions
- [ ] TypeScript types are properly used throughout
- [ ] No linter errors or warnings
- [ ] Console logging for errors is in place
- [ ] Security headers are set (X-Content-Type-Options)
- [ ] Manual testing completed for all scenarios

---

## 10. Future Enhancements

### 10.1. Authentication

- Replace `DEFAULT_USER_ID` with real JWT token verification
- Implement token refresh logic
- Add role-based access control if needed

### 10.2. Performance Optimization

- Implement cursor-based pagination for better performance at large offsets
- Add response caching with ETags
- Consider GraphQL for flexible field selection
- Optimize getGoalById to use single JOIN query instead of two queries

### 10.3. Features

- Add sorting options (by title, category, progress, created_at)
- Add filtering by category
- Add filtering by progress range
- Add full-text search on title and description
- Return computed fields like "days until milestone due"

### 10.4. Monitoring

- Add request duration tracking
- Add error rate monitoring
- Add usage analytics (most queried goals, etc.)
- Implement structured logging for production

---

## Summary

This implementation plan provides a comprehensive guide for implementing three GET endpoints for the Goals resource. The plan follows established patterns from the existing Plan endpoints, ensures proper security through user-based filtering, and maintains consistency with the project's architecture.

Key implementation principles:
1. **Security First**: All queries filter by user_id to prevent unauthorized access
2. **Validation**: Use Zod schemas for all input validation with descriptive errors
3. **Service Layer**: Business logic isolated in GoalService for testability and reusability
4. **Error Handling**: Comprehensive error handling with appropriate status codes
5. **Performance**: Leverage database indexes and pagination for scalability
6. **Consistency**: Follow existing patterns from PlanService and Plan endpoints

