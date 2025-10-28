# REST API Plan - 12 Weeks Planner

## 1. Overview

This document defines the REST API for the 12 Weeks Planner application. The API follows REST principles and is designed to work with Supabase as the backend service, leveraging Row-Level Security (RLS) for authorization and PostgreSQL triggers for business logic enforcement.

### Technology Stack
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **API Framework**: Astro API Routes (SSR endpoints)
- **Authentication**: Supabase Auth (JWT tokens)
- **Database**: PostgreSQL with RLS policies

### Base URL
```
/api/v1
```

### Authentication
All endpoints (except auth-related ones) require a valid JWT token from Supabase Auth in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 2. Resources

| Resource | Database Table | Description |
|----------|---------------|-------------|
| Plans | `plans` | 12-week planners |
| Goals | `long_term_goals` | Long-term goals (3-5 per plan) |
| Milestones | `milestones` | Goal milestones (up to 5 per goal) |
| Weekly Goals | `weekly_goals` | Main weekly tasks |
| Tasks | `tasks` | Weekly subtasks and ad-hoc tasks |
| Task History | `task_history` | Task status change log |
| Weekly Reviews | `weekly_reviews` | Weekly reflections (3 questions) |
| User Metrics | `user_metrics` | User success tracking |

---

## 3. API Endpoints

### 3.1 Authentication

Authentication is handled entirely by Supabase Auth SDK on the client side. No custom API endpoints are needed for auth operations. The following operations are available through Supabase Auth:

- **Sign Up**: `supabase.auth.signUp({ email, password })`
- **Sign In**: `supabase.auth.signInWithPassword({ email, password })`
- **Sign Out**: `supabase.auth.signOut()`
- **Password Reset**: `supabase.auth.resetPasswordForEmail(email)`
- **Session Management**: Automatic with Supabase client

---

### 3.2 Plans

#### 3.2.1 List User's Plans

**GET** `/api/v1/plans`

Get all plans for the authenticated user.

**Query Parameters:**
- `status` (optional): Filter by status (`ready`, `active`, `completed`, `archived`)
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Planner_2025-01-06",
      "start_date": "2025-01-06",
      "status": "ready",
      "created_at": "2025-01-06T10:00:00Z",
      "updated_at": "2025-01-06T10:00:00Z"
    }
  ],
  "count": 1,
  "limit": 50,
  "offset": 0
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.2.2 Get Active Plan

**GET** `/api/v1/plans/active`

Get the currently active plan for the authenticated user.

**Response** `200 OK`:
```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Planner_2025-01-06",
    "start_date": "2025-01-06",
    "status": "active",
    "created_at": "2025-01-06T10:00:00Z",
    "updated_at": "2025-01-06T10:00:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found`: No active plan exists
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.2.3 Get Plan by ID

**GET** `/api/v1/plans/:id`

Get a specific plan by ID.

**Response** `200 OK`:
```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Planner_2025-01-06",
    "start_date": "2025-01-06",
    "status": "active",
    "created_at": "2025-01-06T10:00:00Z",
    "updated_at": "2025-01-06T10:00:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found`: Plan not found or doesn't belong to user
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.2.4 Create Plan

**POST** `/api/v1/plans`

Create a new 12-week planner.

**Request Body**:
```json
{
  "name": "Planner_2025-01-06",
  "start_date": "2025-01-06"
}
```

**Validation:**
- `name`: Required, max 255 characters
- `start_date`: Required, must be a Monday (validated by database trigger)

**Response** `201 Created`:
```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Planner_2025-01-06",
    "start_date": "2025-01-06",
    "status": "ready",
    "created_at": "2025-01-06T10:00:00Z",
    "updated_at": "2025-01-06T10:00:00Z"
  }
}
```

**Notes:**
- New plans are created with status `ready` by default
- To activate a plan, use the PATCH endpoint to set status to `active`
- When a plan is set to `active`, all other active plans for the user are automatically set to `ready` (enforced by database trigger)

**Error Responses:**
- `400 Bad Request`: Invalid start_date (not Monday), missing required fields
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.2.5 Update Plan

**PATCH** `/api/v1/plans/:id`

Update plan details, including activation.

**Request Body**:
```json
{
  "name": "My Q1 2025 Plan",
  "status": "active"
}
```

**Response** `200 OK`:
```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "My Q1 2025 Plan",
    "start_date": "2025-01-06",
    "status": "active",
    "created_at": "2025-01-06T10:00:00Z",
    "updated_at": "2025-01-10T14:30:00Z"
  }
}
```

**Notes:**
- When setting `status` to `active`, all other active plans for the user are automatically set to `ready` (enforced by database trigger)
- Only one plan can be `active` at a time per user
- Valid status transitions: `ready` ↔ `active`, any status → `completed`, any status → `archived`

**Error Responses:**
- `404 Not Found`: Plan not found or doesn't belong to user
- `400 Bad Request`: Invalid data or invalid status value
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.2.6 Archive Plan

**POST** `/api/v1/plans/:id/archive`

Archive a plan (soft delete).

**Response** `200 OK`:
```json
{
  "data": {
    "id": "uuid",
    "status": "archived"
  },
  "message": "Plan archived successfully"
}
```

**Error Responses:**
- `404 Not Found`: Plan not found or doesn't belong to user
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.2.7 Get Plan Dashboard Data

**GET** `/api/v1/plans/:id/dashboard`

Get aggregated dashboard data for a plan including goals, milestones, tasks, and progress.

**Response** `200 OK`:
```json
{
  "data": {
    "plan": {
      "id": "uuid",
      "name": "Planner_2025-01-06",
      "start_date": "2025-01-06",
      "status": "active",
      "current_week": 3
    },
    "goals": [
      {
        "id": "uuid",
        "title": "Launch MVP",
        "description": "Important for career growth",
        "category": "work",
        "progress_percentage": 45,
        "position": 1,
        "milestones": [
          {
            "id": "uuid",
            "title": "Complete API design",
            "description": "",
            "due_date": "2025-01-20",
            "is_completed": true,
            "position": 1
          }
        ]
      }
    ],
    "progress_summary": {
      "total_goals": 3,
      "completed_goals": 0,
      "average_progress": 28.33
    }
  }
}
```

**Error Responses:**
- `404 Not Found`: Plan not found
- `401 Unauthorized`: Missing or invalid auth token

---

### 3.3 Goals (Long-term Goals)

#### 3.3.1 List Goals

**GET** `/api/v1/goals`

Get goals, optionally filtered by plan.

**Query Parameters:**
- `plan_id` (optional): Filter by plan ID
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response** `200 OK`:
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

**Error Responses:**
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.3.2 Get Goals by Plan

**GET** `/api/v1/plans/:planId/goals`

Get all goals for a specific plan.

**Response** `200 OK`:
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

**Error Responses:**
- `404 Not Found`: Plan not found
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.3.3 Get Goal by ID

**GET** `/api/v1/goals/:id`

Get a specific goal with its milestones.

**Response** `200 OK`:
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
        "title": "Complete API design",
        "description": "",
        "due_date": "2025-01-20",
        "is_completed": true,
        "position": 1
      }
    ]
  }
}
```

**Error Responses:**
- `404 Not Found`: Goal not found
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.3.4 Create Goal

**POST** `/api/v1/goals`

Create a new long-term goal.

**Request Body**:
```json
{
  "plan_id": "uuid",
  "title": "Launch MVP",
  "description": "Important for career growth and financial independence",
  "category": "work",
  "progress_percentage": 0,
  "position": 1
}
```

**Validation:**
- `plan_id`: Required, must be valid UUID
- `title`: Required, max 255 characters
- `description`: Optional
- `category`: Optional, one of: `work`, `finance`, `hobby`, `relationships`, `health`, `development`
- `progress_percentage`: Default 0, range 0-100
- `position`: Default 1, range 1-5
- Maximum 5 goals per plan (enforced by database trigger)

**Response** `201 Created`:
```json
{
  "data": {
    "id": "uuid",
    "plan_id": "uuid",
    "title": "Launch MVP",
    "description": "Important for career growth",
    "category": "work",
    "progress_percentage": 0,
    "position": 1,
    "created_at": "2025-01-06T10:00:00Z",
    "updated_at": "2025-01-06T10:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data, category not in enum, progress out of range, or maximum goals exceeded
- `404 Not Found`: Plan not found
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.3.5 Update Goal

**PATCH** `/api/v1/goals/:id`

Update goal details.

**Request Body**:
```json
{
  "title": "Launch MVP v1.0",
  "progress_percentage": 55
}
```

**Validation:**
- Same as create, all fields optional

**Response** `200 OK`:
```json
{
  "data": {
    "id": "uuid",
    "plan_id": "uuid",
    "title": "Launch MVP v1.0",
    "description": "Important for career growth",
    "category": "work",
    "progress_percentage": 55,
    "position": 1,
    "created_at": "2025-01-06T10:00:00Z",
    "updated_at": "2025-01-25T16:20:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found`: Goal not found
- `400 Bad Request`: Invalid data
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.3.6 Delete Goal

**DELETE** `/api/v1/goals/:id`

Delete a goal (cascades to milestones).

**Response** `200 OK`:
```json
{
  "message": "Goal deleted successfully"
}
```

**Error Responses:**
- `404 Not Found`: Goal not found
- `401 Unauthorized`: Missing or invalid auth token

---

### 3.4 Milestones

#### 3.4.1 List Milestones

**GET** `/api/v1/milestones`

Get milestones, optionally filtered by goal.

**Query Parameters:**
- `long_term_goal_id` (optional): Filter by goal ID
- `is_completed` (optional): Filter by completion status (true/false)
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "uuid",
      "long_term_goal_id": "uuid",
      "title": "Complete API design",
      "description": "Design all REST endpoints",
      "due_date": "2025-01-20",
      "is_completed": true,
      "position": 1,
      "created_at": "2025-01-06T10:00:00Z",
      "updated_at": "2025-01-20T12:00:00Z"
    }
  ],
  "count": 1
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.4.2 Get Milestones by Goal

**GET** `/api/v1/goals/:goalId/milestones`

Get all milestones for a specific goal.

**Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "uuid",
      "long_term_goal_id": "uuid",
      "title": "Complete API design",
      "description": "Design all REST endpoints",
      "due_date": "2025-01-20",
      "is_completed": true,
      "position": 1,
      "created_at": "2025-01-06T10:00:00Z",
      "updated_at": "2025-01-20T12:00:00Z"
    }
  ]
}
```

**Error Responses:**
- `404 Not Found`: Goal not found
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.4.3 Get Milestone by ID

**GET** `/api/v1/milestones/:id`

Get a specific milestone.

**Response** `200 OK`:
```json
{
  "data": {
    "id": "uuid",
    "long_term_goal_id": "uuid",
    "title": "Complete API design",
    "description": "Design all REST endpoints",
    "due_date": "2025-01-20",
    "is_completed": true,
    "position": 1,
    "created_at": "2025-01-06T10:00:00Z",
    "updated_at": "2025-01-20T12:00:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found`: Milestone not found
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.4.4 Create Milestone

**POST** `/api/v1/milestones`

Create a new milestone for a goal.

**Request Body**:
```json
{
  "long_term_goal_id": "uuid",
  "title": "Complete API design",
  "description": "Design all REST endpoints",
  "due_date": "2025-01-20",
  "position": 1
}
```

**Validation:**
- `long_term_goal_id`: Required, must be valid UUID
- `title`: Required, max 255 characters
- `description`: Optional
- `due_date`: Optional, ISO 8601 date format
- `is_completed`: Default false
- `position`: Default 1, range 1-5
- Maximum 5 milestones per goal (enforced by database trigger)

**Response** `201 Created`:
```json
{
  "data": {
    "id": "uuid",
    "long_term_goal_id": "uuid",
    "title": "Complete API design",
    "description": "Design all REST endpoints",
    "due_date": "2025-01-20",
    "is_completed": false,
    "position": 1,
    "created_at": "2025-01-06T10:00:00Z",
    "updated_at": "2025-01-06T10:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data or maximum milestones exceeded
- `404 Not Found`: Goal not found
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.4.5 Update Milestone

**PATCH** `/api/v1/milestones/:id`

Update milestone details.

**Request Body**:
```json
{
  "is_completed": true
}
```

**Validation:**
- Same as create, all fields optional

**Response** `200 OK`:
```json
{
  "data": {
    "id": "uuid",
    "long_term_goal_id": "uuid",
    "title": "Complete API design",
    "description": "Design all REST endpoints",
    "due_date": "2025-01-20",
    "is_completed": true,
    "position": 1,
    "created_at": "2025-01-06T10:00:00Z",
    "updated_at": "2025-01-20T12:00:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found`: Milestone not found
- `400 Bad Request`: Invalid data
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.4.6 Delete Milestone

**DELETE** `/api/v1/milestones/:id`

Delete a milestone.

**Response** `200 OK`:
```json
{
  "message": "Milestone deleted successfully"
}
```

**Error Responses:**
- `404 Not Found`: Milestone not found
- `401 Unauthorized`: Missing or invalid auth token

---

### 3.5 Weekly Goals

#### 3.5.1 List Weekly Goals

**GET** `/api/v1/weekly-goals`

Get weekly goals with optional filters.

**Query Parameters:**
- `plan_id` (required): Plan ID
- `week_number` (optional): Filter by week (1-12)
- `long_term_goal_id` (optional): Filter by associated goal
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "uuid",
      "plan_id": "uuid",
      "long_term_goal_id": "uuid",
      "week_number": 3,
      "title": "Complete authentication system",
      "description": "Implement auth with Supabase",
      "position": 1,
      "created_at": "2025-01-20T10:00:00Z",
      "updated_at": "2025-01-20T10:00:00Z"
    }
  ],
  "count": 1
}
```

**Error Responses:**
- `400 Bad Request`: Missing required plan_id
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.5.2 Get Weekly Goal by ID

**GET** `/api/v1/weekly-goals/:id`

Get a specific weekly goal with its subtasks.

**Response** `200 OK`:
```json
{
  "data": {
    "id": "uuid",
    "plan_id": "uuid",
    "long_term_goal_id": "uuid",
    "week_number": 3,
    "title": "Complete authentication system",
    "description": "Implement auth with Supabase",
    "position": 1,
    "created_at": "2025-01-20T10:00:00Z",
    "updated_at": "2025-01-20T10:00:00Z",
    "subtasks": [
      {
        "id": "uuid",
        "title": "Setup Supabase client",
        "priority": "A",
        "status": "completed"
      }
    ]
  }
}
```

**Error Responses:**
- `404 Not Found`: Weekly goal not found
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.5.3 Create Weekly Goal

**POST** `/api/v1/weekly-goals`

Create a new weekly goal.

**Request Body**:
```json
{
  "plan_id": "uuid",
  "long_term_goal_id": "uuid",
  "week_number": 3,
  "title": "Complete authentication system",
  "description": "Implement auth with Supabase",
  "position": 1
}
```

**Validation:**
- `plan_id`: Required, must be valid UUID
- `long_term_goal_id`: Optional (can be null for unlinked weekly goals)
- `week_number`: Required, range 1-12
- `title`: Required, max 255 characters
- `description`: Optional
- `position`: Default 1

**Response** `201 Created`:
```json
{
  "data": {
    "id": "uuid",
    "plan_id": "uuid",
    "long_term_goal_id": "uuid",
    "week_number": 3,
    "title": "Complete authentication system",
    "description": "Implement auth with Supabase",
    "position": 1,
    "created_at": "2025-01-20T10:00:00Z",
    "updated_at": "2025-01-20T10:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data, week_number out of range
- `404 Not Found`: Plan or goal not found
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.5.4 Update Weekly Goal

**PATCH** `/api/v1/weekly-goals/:id`

Update weekly goal details.

**Request Body**:
```json
{
  "title": "Complete authentication and authorization"
}
```

**Validation:**
- Same as create, all fields optional

**Response** `200 OK`:
```json
{
  "data": {
    "id": "uuid",
    "plan_id": "uuid",
    "long_term_goal_id": "uuid",
    "week_number": 3,
    "title": "Complete authentication and authorization",
    "description": "Implement auth with Supabase",
    "position": 1,
    "created_at": "2025-01-20T10:00:00Z",
    "updated_at": "2025-01-22T14:15:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found`: Weekly goal not found
- `400 Bad Request`: Invalid data
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.5.5 Delete Weekly Goal

**DELETE** `/api/v1/weekly-goals/:id`

Delete a weekly goal (cascades to subtasks).

**Response** `200 OK`:
```json
{
  "message": "Weekly goal deleted successfully"
}
```

**Error Responses:**
- `404 Not Found`: Weekly goal not found
- `401 Unauthorized`: Missing or invalid auth token

---

### 3.6 Tasks

#### 3.6.1 List Tasks

**GET** `/api/v1/tasks`

Get tasks with rich filtering options.

**Query Parameters:**
- `plan_id` (required): Plan ID
- `week_number` (optional): Filter by week (1-12)
- `due_day` (optional): Filter by day (1-7, Monday=1)
- `task_type` (optional): Filter by type (`weekly_main`, `weekly_sub`, `ad_hoc`)
- `weekly_goal_id` (optional): Filter by weekly goal
- `milestone_id` (optional): Filter by milestone
- `status` (optional): Filter by status (`todo`, `in_progress`, `completed`, `cancelled`, `postponed`)
- `priority` (optional): Filter by priority (`A`, `B`, `C`)
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "uuid",
      "weekly_goal_id": "uuid",
      "plan_id": "uuid",
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

**Error Responses:**
- `400 Bad Request`: Missing required plan_id
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.6.2 Get Daily Tasks

**GET** `/api/v1/tasks/daily`

Get tasks for a specific day with categorization (most important (A), secondary (B), additional (C)).

**Query Parameters:**
- `plan_id` (required): Plan ID
- `week_number` (required): Week number (1-12)
- `due_day` (required): Day of week (1-7, Monday=1)

**Response** `200 OK`:
```json
{
  "data": {
    "date": "2025-01-20",
    "week_number": 3,
    "due_day": 1,
    "most_important": {
      "id": "uuid",
      "title": "Complete API design",
      "priority": "A",
      "status": "in_progress",
      "task_type": "weekly_main"
    },
    "secondary": [
      {
        "id": "uuid",
        "title": "Setup Supabase client",
        "priority": "B",
        "status": "completed",
        "task_type": "weekly_sub"
      }
    ],
    "additional": [
      {
        "id": "uuid",
        "title": "Review documentation",
        "priority": "C",
        "status": "todo",
        "task_type": "ad_hoc"
      }
    ]
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required parameters
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.6.3 Get Task by ID

**GET** `/api/v1/tasks/:id`

Get a specific task with its history.

**Response** `200 OK`:
```json
{
  "data": {
    "id": "uuid",
    "weekly_goal_id": "uuid",
    "plan_id": "uuid",
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
    "updated_at": "2025-01-20T16:30:00Z",
    "history": [
      {
        "id": "uuid",
        "status": "todo",
        "changed_at": "2025-01-20T10:00:00Z",
        "due_day": 1
      },
      {
        "id": "uuid",
        "status": "in_progress",
        "changed_at": "2025-01-20T14:00:00Z",
        "due_day": 1
      },
      {
        "id": "uuid",
        "status": "completed",
        "changed_at": "2025-01-20T16:30:00Z",
        "due_day": 1
      }
    ]
  }
}
```

**Error Responses:**
- `404 Not Found`: Task not found
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.6.4 Create Task

**POST** `/api/v1/tasks`

Create a new task.

**Request Body**:
```json
{
  "plan_id": "uuid",
  "weekly_goal_id": "uuid",
  "milestone_id": null,
  "title": "Setup Supabase client",
  "description": "Configure Supabase with environment variables",
  "priority": "A",
  "status": "todo",
  "task_type": "weekly_sub",
  "week_number": 3,
  "due_day": 1,
  "position": 1
}
```

**Validation:**
- `plan_id`: Required, must be valid UUID
- `weekly_goal_id`: Optional (null for ad-hoc tasks)
- `milestone_id`: Optional
- `title`: Required, max 255 characters
- `description`: Optional
- `priority`: Default 'C', one of: `A`, `B`, `C`
- `status`: Default 'todo', one of: `todo`, `in_progress`, `completed`, `cancelled`, `postponed`
- `task_type`: Default 'weekly', one of: `weekly_main`, `weekly_sub`, `ad_hoc`
- `week_number`: Optional (null for tasks not assigned to specific week), range 1-12
- `due_day`: Optional (null for tasks not assigned to specific day), range 1-7
- `position`: Default 1
- Maximum 10 weekly subtasks per weekly_goal (enforced by database trigger)
- Maximum 10 ad-hoc tasks per week (enforced by database trigger)

**Response** `201 Created`:
```json
{
  "data": {
    "id": "uuid",
    "weekly_goal_id": "uuid",
    "plan_id": "uuid",
    "milestone_id": null,
    "title": "Setup Supabase client",
    "description": "Configure Supabase with environment variables",
    "priority": "A",
    "status": "todo",
    "task_type": "weekly_sub",
    "week_number": 3,
    "due_day": 1,
    "position": 1,
    "created_at": "2025-01-20T10:00:00Z",
    "updated_at": "2025-01-20T10:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data, enum values, ranges, or maximum tasks exceeded
- `404 Not Found`: Plan, weekly goal, or milestone not found
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.6.5 Update Task

**PATCH** `/api/v1/tasks/:id`

Update task details. Status changes are automatically logged to task_history by database trigger.

**Request Body**:
```json
{
  "status": "completed"
}
```

**Validation:**
- Same as create, all fields optional

**Response** `200 OK`:
```json
{
  "data": {
    "id": "uuid",
    "weekly_goal_id": "uuid",
    "plan_id": "uuid",
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
}
```

**Error Responses:**
- `404 Not Found`: Task not found
- `400 Bad Request`: Invalid data
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.6.6 Copy Task

**POST** `/api/v1/tasks/:id/copy`

Copy a task to another day/week with history preservation.

**Request Body**:
```json
{
  "week_number": 4,
  "due_day": 2
}
```

**Validation:**
- `week_number`: Optional, range 1-12 (if null, copies to unassigned)
- `due_day`: Optional, range 1-7 (if null, copies without specific day)

**Response** `201 Created`:
```json
{
  "data": {
    "id": "uuid",
    "weekly_goal_id": "uuid",
    "plan_id": "uuid",
    "milestone_id": null,
    "title": "Setup Supabase client",
    "description": "Configure Supabase with environment variables",
    "priority": "A",
    "status": "todo",
    "task_type": "weekly_sub",
    "week_number": 4,
    "due_day": 2,
    "position": 1,
    "created_at": "2025-01-27T10:00:00Z",
    "updated_at": "2025-01-27T10:00:00Z"
  },
  "message": "Task copied successfully"
}
```

**Error Responses:**
- `404 Not Found`: Task not found
- `400 Bad Request`: Invalid week_number or due_day
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.6.7 Delete Task

**DELETE** `/api/v1/tasks/:id`

Delete a task (cascades to task_history).

**Response** `200 OK`:
```json
{
  "message": "Task deleted successfully"
}
```

**Error Responses:**
- `404 Not Found`: Task not found
- `401 Unauthorized`: Missing or invalid auth token

---

### 3.7 Task History

#### 3.7.1 Get Task History

**GET** `/api/v1/tasks/:taskId/history`

Get status change history for a task. History is automatically created by database trigger.

**Response** `200 OK`:
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

**Error Responses:**
- `404 Not Found`: Task not found
- `401 Unauthorized`: Missing or invalid auth token

---

### 3.8 Weekly Reviews

#### 3.8.1 List Weekly Reviews

**GET** `/api/v1/weekly-reviews`

Get weekly reviews for a plan.

**Query Parameters:**
- `plan_id` (required): Plan ID
- `week_number` (optional): Filter by week (1-12)
- `is_completed` (optional): Filter by completion status
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "uuid",
      "plan_id": "uuid",
      "week_number": 3,
      "what_worked": "Early morning work sessions were very productive",
      "what_did_not_work": "Too many meetings disrupted focus time",
      "what_to_improve": "Block calendar for deep work in the morning",
      "is_completed": true,
      "created_at": "2025-01-26T20:00:00Z",
      "updated_at": "2025-01-26T20:45:00Z"
    }
  ],
  "count": 1
}
```

**Error Responses:**
- `400 Bad Request`: Missing required plan_id
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.8.2 Get Weekly Review by Week

**GET** `/api/v1/weekly-reviews/week/:weekNumber`

Get review for a specific week in a plan.

**Query Parameters:**
- `plan_id` (required): Plan ID

**Response** `200 OK`:
```json
{
  "data": {
    "id": "uuid",
    "plan_id": "uuid",
    "week_number": 3,
    "what_worked": "Early morning work sessions were very productive",
    "what_did_not_work": "Too many meetings disrupted focus time",
    "what_to_improve": "Block calendar for deep work in the morning",
    "is_completed": true,
    "created_at": "2025-01-26T20:00:00Z",
    "updated_at": "2025-01-26T20:45:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found`: Review not found for this week
- `400 Bad Request`: Missing required plan_id
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.8.3 Get Weekly Review by ID

**GET** `/api/v1/weekly-reviews/:id`

Get a specific weekly review.

**Response** `200 OK`:
```json
{
  "data": {
    "id": "uuid",
    "plan_id": "uuid",
    "week_number": 3,
    "what_worked": "Early morning work sessions were very productive",
    "what_did_not_work": "Too many meetings disrupted focus time",
    "what_to_improve": "Block calendar for deep work in the morning",
    "is_completed": true,
    "created_at": "2025-01-26T20:00:00Z",
    "updated_at": "2025-01-26T20:45:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found`: Review not found
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.8.4 Create Weekly Review

**POST** `/api/v1/weekly-reviews`

Create a new weekly review.

**Request Body**:
```json
{
  "plan_id": "uuid",
  "week_number": 3,
  "what_worked": "",
  "what_did_not_work": "",
  "what_to_improve": ""
}
```

**Validation:**
- `plan_id`: Required, must be valid UUID
- `week_number`: Required, range 1-12
- `what_worked`: Optional (for auto-save)
- `what_did_not_work`: Optional (for auto-save)
- `what_to_improve`: Optional (for auto-save)
- `is_completed`: Default false

**Response** `201 Created`:
```json
{
  "data": {
    "id": "uuid",
    "plan_id": "uuid",
    "week_number": 3,
    "what_worked": "",
    "what_did_not_work": "",
    "what_to_improve": "",
    "is_completed": false,
    "created_at": "2025-01-26T20:00:00Z",
    "updated_at": "2025-01-26T20:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data, week_number out of range
- `404 Not Found`: Plan not found
- `409 Conflict`: Review already exists for this week
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.8.5 Update Weekly Review

**PATCH** `/api/v1/weekly-reviews/:id`

Update weekly review. Supports auto-save with partial updates.

**Request Body**:
```json
{
  "what_worked": "Early morning work sessions were very productive"
}
```

**Validation:**
- Same as create, all fields optional

**Response** `200 OK`:
```json
{
  "data": {
    "id": "uuid",
    "plan_id": "uuid",
    "week_number": 3,
    "what_worked": "Early morning work sessions were very productive",
    "what_did_not_work": "",
    "what_to_improve": "",
    "is_completed": false,
    "created_at": "2025-01-26T20:00:00Z",
    "updated_at": "2025-01-26T20:15:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found`: Review not found
- `400 Bad Request`: Invalid data
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.8.6 Mark Review as Complete

**POST** `/api/v1/weekly-reviews/:id/complete`

Mark a weekly review as completed.

**Response** `200 OK`:
```json
{
  "data": {
    "id": "uuid",
    "is_completed": true
  },
  "message": "Weekly review marked as complete"
}
```

**Error Responses:**
- `404 Not Found`: Review not found
- `401 Unauthorized`: Missing or invalid auth token

---

#### 3.8.7 Delete Weekly Review

**DELETE** `/api/v1/weekly-reviews/:id`

Delete a weekly review.

**Response** `200 OK`:
```json
{
  "message": "Weekly review deleted successfully"
}
```

**Error Responses:**
- `404 Not Found`: Review not found
- `401 Unauthorized`: Missing or invalid auth token

---

### 3.9 User Metrics

#### 3.9.1 Get User Metrics

**GET** `/api/v1/users/metrics`

Get success metrics for the authenticated user. Metrics are automatically updated by database triggers.

**Response** `200 OK`:
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

**Error Responses:**
- `404 Not Found`: Metrics not found (user has no activity yet)
- `401 Unauthorized`: Missing or invalid auth token

---

### 3.10 Data Export

#### 3.10.1 Export User Data

**GET** `/api/v1/export`

Export all user data in JSON format (GDPR compliance).

**Response** `200 OK`:
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

**Error Responses:**
- `401 Unauthorized`: Missing or invalid auth token

---

## 4. Authentication and Authorization

### 4.1 Authentication Mechanism

**Supabase Auth with JWT Tokens**

The application uses Supabase Auth for user authentication. All authentication operations are handled client-side using the Supabase JavaScript client:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Sign up
await supabase.auth.signUp({ email, password })

// Sign in
await supabase.auth.signInWithPassword({ email, password })

// Get session
const { data: { session } } = await supabase.auth.getSession()

// Sign out
await supabase.auth.signOut()
```

### 4.2 API Authentication

All API endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The token is validated using Supabase's server-side libraries:

```typescript
// In Astro API route
const authHeader = request.headers.get('Authorization')
const token = authHeader?.replace('Bearer ', '')

const { data: { user }, error } = await supabase.auth.getUser(token)

if (error || !user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401
  })
}
```

### 4.3 Row-Level Security (RLS)

Database-level authorization is enforced through PostgreSQL Row-Level Security policies. Each table has RLS policies that ensure users can only access their own data:

**Example RLS Policy (plans table):**
```sql
-- Users can only view their own plans
CREATE POLICY "Users can view own plans"
ON plans FOR SELECT
USING (auth.uid() = user_id);

-- Users can only create plans for themselves
CREATE POLICY "Users can create own plans"
ON plans FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

RLS policies are automatically enforced by the database when using the Supabase client with a user's JWT token.

### 4.4 Session Management

- **Session Duration**: 1 hour of inactivity
- **Token Refresh**: Automatic refresh handled by Supabase client
- **Storage**: Session stored in localStorage (client-side)
- **Logout**: Clears session from localStorage and invalidates token

### 4.5 Password Security

- **Minimum Length**: 8 characters
- **Hashing**: bcrypt (handled by Supabase)
- **Reset**: Email-based reset flow with time-limited tokens (1 hour)

---

## 5. Validation and Business Logic

### 5.1 Request Validation

All API endpoints validate incoming data before processing:

#### Data Type Validation
- UUIDs: Valid UUID v4 format
- Dates: ISO 8601 format (YYYY-MM-DD)
- Timestamps: ISO 8601 format with timezone
- Integers: Within specified ranges
- Strings: Maximum length constraints

#### Required Field Validation
- Return `400 Bad Request` with descriptive error message
- Include field name in error response

**Example Error Response:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    },
    {
      "field": "start_date",
      "message": "Start date must be a Monday"
    }
  ]
}
```

### 5.2 Business Logic Rules

#### Plans
- **Validation**:
  - `start_date` must be a Monday (enforced by database trigger)
  - Status must be one of: `ready`, `active`, `completed`, `archived`
  - User can have multiple plans, but only one `active` at a time (enforced by database trigger)
  
- **Business Logic**:
  - New plans are created with status `ready` by default
  - When a plan is set to `active`, all other active plans for the user are automatically set to `ready` (enforced by database trigger `ensure_single_active_plan`)
  - Creating a plan automatically updates user_metrics (via trigger)
  - Archiving a plan sets status to `archived` (soft delete)
  - Plan requires minimum 1 goal before creation (enforced at application level)

#### Long-term Goals
- **Validation**:
  - Minimum 1, maximum 5 goals per plan (enforced by database trigger)
  - `progress_percentage` range: 0-100
  - `position` range: 1-5
  - `category` must be one of: `work`, `finance`, `hobby`, `relationships`, `health`, `development`

- **Business Logic**:
  - When goal reaches 100% progress, user_metrics is updated (via trigger)
  - First goal at 100% in first plan sets `first_planner_completed` flag
  - Deleting a goal cascades to milestones

#### Milestones
- **Validation**:
  - Maximum 5 milestones per goal (enforced by database trigger)
  - `position` range: 1-5
  - `due_date` must be valid date

- **Business Logic**:
  - Deleting a goal cascades to all its milestones
  - Deleting a milestone sets `milestone_id = NULL` in associated tasks

#### Weekly Goals
- **Validation**:
  - `week_number` range: 1-12
  - Must belong to a valid plan

- **Business Logic**:
  - Can be optionally linked to a long-term goal
  - Deleting a weekly goal cascades to all subtasks

#### Tasks
- **Validation**:
  - `priority` must be one of: `A`, `B`, `C`
  - `status` must be one of: `todo`, `in_progress`, `completed`, `cancelled`, `postponed`
  - `task_type` must be one of: `weekly_main`, `weekly_sub`, `ad_hoc`
  - `week_number` range: 1-12 (if specified)
  - `due_day` range: 1-7 (if specified, where 1=Monday)
  - Maximum 10 weekly subtasks per weekly_goal (enforced by database trigger)
  - Maximum 10 ad-hoc tasks per week (enforced by database trigger)

- **Business Logic**:
  - Changing task status automatically creates task_history entry (via trigger)
  - Multi-day tasks: If status is not `completed` or `cancelled`, task can be copied to next day
  - Task history tracks all status changes with timestamps
  - Deleting a weekly goal cascades to all its subtasks
  - Task priority determines daily task categorization:
    - Most important: 1 task (typically priority A, weekly_main)
    - Secondary: 2 tasks (typically priority A or B)
    - Additional: 7 tasks (any priority)

#### Weekly Reviews
- **Validation**:
  - `week_number` range: 1-12
  - Only one review per week per plan
  - Three text fields: `what_worked`, `what_did_not_work`, `what_to_improve`

- **Business Logic**:
  - Auto-save: PATCH endpoint supports partial updates
  - `is_completed` flag tracks completion status
  - Available every day, but suggested on Sunday
  - Can be edited after completion
  - Past week reviews remain editable

#### User Metrics
- **Validation**:
  - One record per user (enforced by unique constraint)
  - Boolean and integer fields only

- **Business Logic**:
  - `first_planner_created`: Set to true when first plan is created (via trigger)
  - `first_planner_completed`: Set to true when first goal reaches 100% in first plan (via trigger)
  - `total_plans_created`: Incremented when plan is created (via trigger)
  - `total_goals_completed`: Incremented when goal reaches 100% progress (via trigger)
  - Metrics are read-only from API perspective (updated by triggers only)

### 5.3 Error Handling

#### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH, DELETE, POST (non-creation) |
| 201 | Created | Successful resource creation |
| 400 | Bad Request | Validation error, invalid data format |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | User doesn't have permission (rarely used, RLS handles this) |
| 404 | Not Found | Resource doesn't exist or doesn't belong to user |
| 409 | Conflict | Resource already exists (e.g., review for week already created) |
| 500 | Internal Server Error | Server error, database error |

#### Error Response Format

All error responses follow a consistent format:

**Simple Error:**
```json
{
  "error": "Resource not found",
  "message": "Plan with ID 'abc-123' does not exist or you don't have access"
}
```

**Validation Error:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "priority",
      "message": "Priority must be one of: A, B, C",
      "received": "D"
    }
  ]
}
```

**Database Constraint Error:**
```json
{
  "error": "Constraint violation",
  "message": "Cannot add more than 5 goals to a plan",
  "constraint": "check_goal_count"
}
```

### 5.4 Rate Limiting

Rate limiting is implemented to prevent abuse and ensure fair usage:

- **Limit**: 100 requests per minute per user
- **Headers**: Rate limit information in response headers
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1643097600
  ```
- **Error Response** `429 Too Many Requests`:
  ```json
  {
    "error": "Rate limit exceeded",
    "message": "Too many requests. Please try again in 42 seconds.",
    "retry_after": 42
  }
  ```

### 5.5 Pagination

List endpoints support pagination using limit/offset:

**Query Parameters:**
- `limit`: Number of results per page (default: 50, max: 100)
- `offset`: Number of results to skip (default: 0)

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 127,
    "has_more": true
  }
}
```

### 5.6 Filtering and Sorting

#### Filtering
Most list endpoints support filtering via query parameters:
- Exact match: `?status=active`
- Multiple values: `?status=active,completed`
- Range: `?week_number_gte=3&week_number_lte=6`

#### Sorting
List endpoints support sorting:
- `?sort=created_at` (ascending)
- `?sort=-created_at` (descending, note the minus)
- `?sort=position,created_at` (multiple fields)

**Example:**
```
GET /api/v1/tasks?plan_id=abc-123&status=todo,in_progress&sort=-priority,position
```

### 5.7 Data Integrity

#### Cascade Deletes
- Deleting a **plan** cascades to: goals, milestones, weekly_goals, tasks, task_history, weekly_reviews
- Deleting a **goal** cascades to: milestones, sets `long_term_goal_id = NULL` in weekly_goals
- Deleting a **milestone** sets `milestone_id = NULL` in tasks
- Deleting a **weekly_goal** cascades to: tasks (subtasks only)
- Deleting a **task** cascades to: task_history
- Deleting a **user** (from auth.users) cascades to all user data

#### Orphan Prevention
- All foreign keys have `ON DELETE CASCADE` or `ON DELETE SET NULL`
- RLS policies ensure users can only access their own data
- Database constraints prevent invalid references

---

## 6. Implementation Notes

### 6.1 Astro API Routes

API endpoints are implemented as Astro server endpoints:

```typescript
// src/pages/api/v1/plans/index.ts
import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'

export const GET: APIRoute = async ({ request }) => {
  // Get auth token
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  
  // Initialize Supabase client with user token
  const supabase = createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_ANON_KEY,
    {
      global: { headers: { Authorization: `Bearer ${token}` } }
    }
  )
  
  // Validate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  // Query data (RLS automatically filters by user)
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

### 6.2 Database Views Usage

The API can leverage database views for optimized queries:

```typescript
// Get plan progress using view
const { data } = await supabase
  .from('plan_progress')
  .select('*')
  .eq('plan_id', planId)
  .single()

// Get weekly task summary using view
const { data } = await supabase
  .from('weekly_task_summary')
  .select('*')
  .eq('plan_id', planId)
  .eq('week_number', weekNumber)
  .single()
```

### 6.3 Error Handling Pattern

Consistent error handling across all endpoints:

```typescript
try {
  // Validate input
  if (!planId) {
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        details: [{ field: 'plan_id', message: 'Plan ID is required' }]
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
  
  // Query database
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return new Response(
        JSON.stringify({ error: 'Not found', message: 'Plan not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }
    throw error
  }
  
  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
  
} catch (error) {
  console.error('API Error:', error)
  return new Response(
    JSON.stringify({ error: 'Internal server error' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  )
}
```

### 6.4 TypeScript Types

Use generated types from Supabase for type safety:

```typescript
import type { Database } from '../db/database.types'

type Plan = Database['public']['Tables']['plans']['Row']
type PlanInsert = Database['public']['Tables']['plans']['Insert']
type PlanUpdate = Database['public']['Tables']['plans']['Update']
```

### 6.5 Response Helpers

Create utility functions for consistent responses:

```typescript
// src/lib/api-helpers.ts
export function successResponse<T>(data: T, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function errorResponse(error: string, message: string, status = 400) {
  return new Response(JSON.stringify({ error, message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function validationErrorResponse(details: Array<{ field: string; message: string }>) {
  return new Response(
    JSON.stringify({ error: 'Validation failed', details }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  )
}
```

---

## 7. Future Enhancements

The following features are out of scope for MVP but may be considered for future iterations:

### 7.1 Webhooks
- Event notifications for plan completion, goal achievement
- Integration with external services

### 7.2 Bulk Operations
- Batch create/update/delete endpoints
- Bulk task status updates

### 7.3 Advanced Filtering
- Full-text search across tasks and goals
- Complex query operators (contains, starts_with, etc.)

### 7.4 Real-time Updates
- WebSocket connections for live collaboration
- Push notifications for task reminders

### 7.5 Analytics Endpoints
- Detailed progress analytics
- Historical trend analysis
- Completion rate statistics

### 7.6 File Attachments
- Upload files to tasks/goals
- Image attachments for visual progress tracking

### 7.7 Sharing and Collaboration
- Share plans with other users
- Collaborative planning features
- Team workspaces

---

## 8. Appendix

### 8.1 HTTP Methods Summary

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Retrieve resources | Yes | Yes |
| POST | Create resource | No | No |
| PATCH | Partial update | No | No |
| PUT | Full replace | Yes | No |
| DELETE | Remove resource | Yes | No |

### 8.2 Common Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Number of results (max 100) |
| `offset` | integer | Pagination offset |
| `sort` | string | Sort field(s), prefix with `-` for desc |
| `plan_id` | uuid | Filter by plan |
| `week_number` | integer | Filter by week (1-12) |
| `due_day` | integer | Filter by day (1-7) |
| `status` | enum | Filter by status |
| `priority` | enum | Filter by priority |

### 8.3 Database Enum Values

**Plan Status:**
- `ready` (default status when plan is created)
- `active` (only one plan can be active at a time per user)
- `completed`
- `archived`

**Goal Category:**
- `work`
- `finance`
- `hobby`
- `relationships`
- `health`
- `development`

**Task Priority:**
- `A` (highest)
- `B`
- `C` (lowest)

**Task Status:**
- `todo`
- `in_progress`
- `completed`
- `cancelled`
- `postponed`

**Task Type:**
- `weekly_main` (main weekly task)
- `weekly_sub` (subtask of weekly goal)
- `ad_hoc` (unlinked task)

### 8.4 Date Formats

- **Date**: `YYYY-MM-DD` (ISO 8601)
- **Timestamp**: `YYYY-MM-DDTHH:mm:ssZ` (ISO 8601 with UTC timezone)
- **Week Start**: Always Monday
- **Day of Week**: 1=Monday, 2=Tuesday, ..., 7=Sunday

### 8.5 UUID Format

All IDs use UUID v4 format:
```
550e8400-e29b-41d4-a716-446655440000
```

### 8.6 Content Type

All requests and responses use:
```
Content-Type: application/json
```

---

## 9. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-27 | Initial API plan |


