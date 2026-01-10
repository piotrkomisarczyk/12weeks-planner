# API Endpoint Implementation Plan: Tasks Management

## 1. Przegląd punktów końcowych

Ten dokument opisuje implementację 7 endpointów REST API dla zarządzania zadaniami (tasks) w aplikacji 12 Weeks Planner:

1. **GET /api/v1/tasks** - Lista zadań z zaawansowanym filtrowaniem
2. **GET /api/v1/tasks/daily** - Zadania na dzień z kategoryzacją (A/B/C)
3. **GET /api/v1/tasks/:id** - Szczegóły zadania z historią
4. **POST /api/v1/tasks** - Tworzenie zadania
5. **PATCH /api/v1/tasks/:id** - Aktualizacja zadania
6. **POST /api/v1/tasks/:id/copy** - Kopiowanie zadania
7. **DELETE /api/v1/tasks/:id** - Usunięcie zadania

Zadania mogą być:
- Związane z weekly goals (task_type: weekly_main, weekly_sub)
- Zadaniami ad-hoc niezwiązanymi z weekly goals
- Opcjonalnie powiązane bezpośrednio z long-term goals
- Opcjonalnie powiązane bezpośrednio z milestones

**Elastyczna hierarchia relacji:**
```
plans (1) ---> (N) tasks (zadania ad-hoc)
weekly_goals (1) ---> (N) tasks (zadania tygodniowe)
long_term_goals (1) ---> (N) tasks (opcjonalne powiązanie bezpośrednie)
milestones (1) ---> (N) tasks (opcjonalne powiązanie bezpośrednie)
```

---

## 2. Szczegóły żądań

### 2.1. GET /api/v1/tasks

**Metoda HTTP**: GET  
**Struktura URL**: `/api/v1/tasks`

**Query Parameters**:
- **Wymagane**:
  - `plan_id` (UUID) - ID planera
- **Opcjonalne**:
  - `week_number` (number, 1-12) - filtr tygodnia
  - `due_day` (number, 1-7) - filtr dnia tygodnia
  - `task_type` (enum) - filtr typu: weekly_main, weekly_sub, ad_hoc
  - `weekly_goal_id` (UUID) - filtr celu tygodniowego
  - `long_term_goal_id` (UUID) - filtr celu długoterminowego
  - `milestone_id` (UUID) - filtr kamienia milowego
  - `status` (enum) - filtr statusu: todo, in_progress, completed, cancelled, postponed
  - `priority` (enum) - filtr priorytetu: A, B, C
  - `limit` (number, default: 50) - limit wyników
  - `offset` (number, default: 0) - offset paginacji

**Response 200 OK**:
```json
{
  "data": [
    {
      "id": "uuid",
      "weekly_goal_id": "uuid",
      "plan_id": "uuid",
      "long_term_goal_id": "uuid",
      "milestone_id": "uuid",
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

**Uwagi**:
- Zadania mogą być powiązane z weekly goals, long-term goals, milestones lub dowolną ich kombinacją
- Filtrowanie po long_term_goal_id zwraca wszystkie zadania bezpośrednio powiązane z tym celem długoterminowym
- Filtrowanie po milestone_id zwraca wszystkie zadania bezpośrednio powiązane z tym kamieniem milowym
- Filtrowanie po weekly_goal_id zwraca wszystkie zadania bezpośrednio powiązane z tym celem tygodniowym


---

### 2.2. GET /api/v1/tasks/daily

**Metoda HTTP**: GET  
**Struktura URL**: `/api/v1/tasks/daily`

**Query Parameters**:
- **Wymagane**:
  - `plan_id` (UUID) - ID planera
  - `week_number` (number, 1-12) - numer tygodnia
  - `due_day` (number, 1-7) - dzień tygodnia (1=poniedziałek)

**Response 200 OK**:
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

**Uwagi**:
- Zwraca zadania pogrupowane według priorytetu dla lepszego planowania dziennego
- `most_important` to pierwsze zadanie z priorytetem A (lub null jeśli brak)
- `secondary` to wszystkie zadania z priorytetem B
- `additional` to wszystkie zadania z priorytetem C

---

### 2.3. GET /api/v1/tasks/:id

**Metoda HTTP**: GET  
**Struktura URL**: `/api/v1/tasks/:id`

**URL Parameters**:
- `id` (UUID) - ID zadania

**Response 200 OK**:
```json
{
  "data": {
    "id": "uuid",
    "weekly_goal_id": "uuid",
    "plan_id": "uuid",
    "long_term_goal_id": "uuid",
    "milestone_id": "uuid",
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
}
```

---

### 2.4. POST /api/v1/tasks

**Metoda HTTP**: POST  
**Struktura URL**: `/api/v1/tasks`

**Request Body**:
```json
{
  "plan_id": "uuid",
  "weekly_goal_id": "uuid" | null,
  "long_term_goal_id": "uuid" | null,
  "milestone_id": "uuid" | null,
  "title": "Setup Supabase client",
  "description": "Configure Supabase with environment variables" | null,
  "priority": "A" | "B" | "C",
  "status": "todo" | "in_progress" | "completed" | "cancelled" | "postponed",
  "task_type": "weekly_main" | "weekly_sub" | "ad_hoc",
  "week_number": 1-12 | null,
  "due_day": 1-7 | null,
  "position": 1
}
```

**Walidacja**:
- `plan_id`: Wymagane, musi być valid UUID
- `weekly_goal_id`: Opcjonalne (null dla ad-hoc tasks)
- `long_term_goal_id`: Opcjonalne (null dla zadań nie powiązanych bezpośrednio z celem)
- `milestone_id`: Opcjonalne (null dla zadań nie powiązanych z kamieniem milowym)
- `title`: Wymagane, max 255 znaków
- `description`: Opcjonalne
- `priority`: Domyślnie 'A', jeden z: A, B, C
- `status`: Domyślnie 'todo', jeden z: todo, in_progress, completed, cancelled, postponed
- `task_type`: Domyślnie 'weekly_sub', jeden z: weekly_main, weekly_sub, ad_hoc
- `week_number`: Opcjonalne (null dla zadań nie przypisanych do tygodnia), zakres 1-12
- `due_day`: Opcjonalne (null dla zadań nie przypisanych do dnia), zakres 1-7
- `position`: Domyślnie 1
- Maksymalnie 15 weekly subtasks per weekly_goal (egzekwowane przez trigger bazy danych)
- Maksymalnie 100 ad-hoc tasks per week (egzekwowane przez trigger bazy danych)
- Maksymalnie 10 tasks per day (egzekwowane przez trigger bazy danych)
- Maksymalnie 3 weekly goals per week (egzekwowane przez trigger bazy danych)
- Maksymalnie 6 long-term goals per plan (egzekwowane przez trigger bazy danych)

**Response 201 Created**:
```json
{
  "data": {
    "id": "uuid",
    "weekly_goal_id": "uuid",
    "plan_id": "uuid",
    "long_term_goal_id": "uuid",
    "milestone_id": "uuid",
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

**Uwagi**:
- Zadania wspierają elastyczne hierarchie: mogą być powiązane z weekly goals, long-term goals, milestones lub dowolną kombinacją
- Dla organizacji hierarchicznej: goal → milestone → task LUB goal → task LUB goal → milestone → weekly_goal → task LUB goal → weekly_goal → task
- Zadania ad-hoc NIE mają powiązania z weekly_goal (weekly_goal_id = null). Mogą mieć powiązania bezpośrednio z goal lub też z milestone lub z oboma goal i milestone (wtedy milestone musi być powiązany z goal). Zadania ad-hoc mogą także w ogóle nie mieć powiązań (wszystkie foreign keys null).

---

### 2.5. PATCH /api/v1/tasks/:id

**Metoda HTTP**: PATCH  
**Struktura URL**: `/api/v1/tasks/:id`

**URL Parameters**:
- `id` (UUID) - ID zadania

**Request Body**: Partial update - wszystkie pola opcjonalne
```json
{
  "status": "completed",
  "long_term_goal_id": "uuid",
  "milestone_id": "uuid"
}
```

**Walidacja**: Taka sama jak przy tworzeniu, wszystkie pola opcjonalne

**Response 200 OK**:
```json
{
  "data": {
    "id": "uuid",
    "weekly_goal_id": "uuid",
    "plan_id": "uuid",
    "long_term_goal_id": "uuid",
    "milestone_id": "uuid",
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

**Uwagi**:
- Można aktualizować long_term_goal_id i milestone_id aby zmienić powiązania zadania
- Ustawienie na null usuwa powiązania
- Zmiany statusu są automatycznie logowane do task_history przez trigger bazy danych

---

### 2.6. POST /api/v1/tasks/:id/copy

**Metoda HTTP**: POST  
**Struktura URL**: `/api/v1/tasks/:id/copy`

**URL Parameters**:
- `id` (UUID) - ID zadania do skopiowania

**Request Body**:
```json
{
  "week_number": 4,
  "due_day": 2
}
```

**Walidacja**:
- `week_number`: Opcjonalne, zakres 1-12 (jeśli null, kopiuje do nieprzypisanych)
- `due_day`: Opcjonalne, zakres 1-7 (jeśli null, kopiuje bez konkretnego dnia)

**Response 201 Created**:
```json
{
  "data": {
    "id": "uuid",
    "weekly_goal_id": "uuid",
    "plan_id": "uuid",
    "long_term_goal_id": "uuid",
    "milestone_id": "uuid",
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

**Uwagi**:
- Skopiowane zadanie zachowuje wszystkie powiązania (weekly_goal_id, long_term_goal_id, milestone_id)
- Status jest resetowany do 'todo' dla nowej kopii
- Oryginalne zadanie pozostaje niezmienione

---

### 2.7. DELETE /api/v1/tasks/:id

**Metoda HTTP**: DELETE  
**Struktura URL**: `/api/v1/tasks/:id`

**URL Parameters**:
- `id` (UUID) - ID zadania

**Response 200 OK**:
```json
{
  "message": "Task deleted successfully"
}
```

**Uwagi**:
- Usunięcie kaskadowe do task_history

---

## 3. Wykorzystywane typy

### 3.1. DTOs (Data Transfer Objects)

```typescript
// src/types.ts - już zdefiniowane

// Podstawowe DTO zadania
export type TaskDTO = TaskEntity;

// Zadanie z historią
export interface TaskWithHistoryDTO extends TaskDTO {
  history: TaskHistoryDTO[];
}

// Zadania na dzień z kategoryzacją
export interface DailyTasksDTO {
  date: string;
  week_number: number;
  due_day: number;
  most_important: Pick<TaskDTO, 'id' | 'title' | 'priority' | 'status' | 'task_type'> | null;
  secondary: Pick<TaskDTO, 'id' | 'title' | 'priority' | 'status' | 'task_type'>[];
  additional: Pick<TaskDTO, 'id' | 'title' | 'priority' | 'status' | 'task_type'>[];
}

// Historia zadania
export type TaskHistoryDTO = TaskHistoryEntity;
```

### 3.2. Command Models

```typescript
// src/types.ts - już zdefiniowane

// Tworzenie zadania
export type CreateTaskCommand = Pick<
  TaskInsert,
  | 'plan_id'
  | 'weekly_goal_id'
  | 'long_term_goal_id'
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

// Aktualizacja zadania
export type UpdateTaskCommand = Partial<
  Pick<
    TaskUpdate,
    | 'weekly_goal_id'
    | 'long_term_goal_id'
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

// Kopiowanie zadania
export interface CopyTaskCommand {
  week_number?: number | null;
  due_day?: number | null;
}
```

### 3.3. Response Types

```typescript
// src/types.ts - już zdefiniowane

export interface ListResponse<T> {
  data: T[];
  count?: number;
}

export interface ItemResponse<T> {
  data: T;
}

export interface SuccessResponse {
  data?: {
    id: string;
    [key: string]: unknown;
  };
  message: string;
}

export interface ErrorResponse {
  error: string;
  message?: string;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  received?: unknown;
}

export interface ValidationErrorResponse {
  error: 'Validation failed';
  details: ValidationErrorDetail[];
}
```

---

## 4. Przepływ danych

### 4.1. GET /api/v1/tasks - Lista zadań

```
Client Request
  ↓
Astro Endpoint: /src/pages/api/v1/tasks/index.ts
  ↓ (walidacja query params)
Zod Schema: listTasksSchema
  ↓ (extract supabase from context.locals)
Service: task.service.ts → listTasks()
  ↓ (query z filtrami)
Supabase Client → Table: tasks
  ↓ (RLS policy check)
Database → Return filtered tasks
  ↓
Service → Transform to TaskDTO[]
  ↓
Endpoint → Return ListResponse<TaskDTO>
  ↓
Client Response (200 OK)
```

### 4.2. GET /api/v1/tasks/daily - Daily Tasks

```
Client Request
  ↓
Astro Endpoint: /src/pages/api/v1/tasks/daily.ts
  ↓ (walidacja query params)
Zod Schema: dailyTasksParamsSchema
  ↓
Service: task.service.ts → getPlanStartDate()
  ↓ (verify plan exists)
Service: task.service.ts → getDailyTasks()
  ↓ (query tasks dla dnia)
Supabase Client → Table: tasks WHERE due_day & week_number
  ↓ (kategoryzacja po priority)
Service → Group by priority (A=most_important, B=secondary, C=additional)
  ↓ (calculate date from week_number)
Service → Transform to DailyTasksDTO
  ↓
Endpoint → Return ItemResponse<DailyTasksDTO>
  ↓
Client Response (200 OK)
```

### 4.3. GET /api/v1/tasks/:id - Task Details

```
Client Request
  ↓
Astro Endpoint: /src/pages/api/v1/tasks/[id].ts
  ↓ (walidacja UUID)
Zod Schema: taskIdSchema
  ↓
Service: task.service.ts → getTaskById()
  ↓ (query task + history)
Supabase Client → Table: tasks (single)
Supabase Client → Table: task_history (where task_id)
  ↓
Service → Combine task + history → TaskWithHistoryDTO
  ↓
Endpoint → Return ItemResponse<TaskWithHistoryDTO>
  ↓
Client Response (200 OK) or 404 Not Found
```

### 4.4. POST /api/v1/tasks - Create Task

```
Client Request (JSON body)
  ↓
Astro Endpoint: /src/pages/api/v1/tasks/index.ts
  ↓ (parse JSON)
Request Body → JSON.parse()
  ↓ (walidacja)
Zod Schema: createTaskSchema
  ↓ (verify plan exists)
Service: task.service.ts → createTask()
  ↓ (verify weekly_goal_id if provided)
Service → Verify weekly goal exists
  ↓ (verify long_term_goal_id if provided)
Service → Verify long-term goal exists
  ↓ (verify milestone_id if provided)
Service → Verify milestone exists
  ↓ (insert to database)
Supabase Client → INSERT INTO tasks
  ↓ (trigger: log_task_status_change fires)
Database Trigger → INSERT INTO task_history (initial status)
  ↓ (trigger: validate_weekly_subtask_count checks)
Database Trigger → Check max 15 subtasks per weekly_goal
  ↓ (trigger: validate_ad_hoc_task_count checks)
Database Trigger → Check max 100 ad-hoc tasks per week
  ↓ (trigger: validate_daily_task_count checks)
Database Trigger → Check max 10 tasks per day
  ↓
Service → Return TaskDTO
  ↓
Endpoint → Return ItemResponse<TaskDTO> (201)
  ↓
Client Response (201 Created)
```

**Database Triggers:**
- `log_task_status_change` - automatycznie loguje początkowy status do task_history
- `validate_weekly_subtask_count` - sprawdza max 15 subtasków per weekly_goal
- `validate_ad_hoc_task_count` - sprawdza max 100 ad-hoc tasks per week
- `validate_daily_task_count` - sprawdza max 10 tasks per day
- `update_updated_at_timestamp` - aktualizuje updated_at

### 4.5. PATCH /api/v1/tasks/:id - Update Task

```
Client Request (JSON body)
  ↓
Astro Endpoint: /src/pages/api/v1/tasks/[id].ts
  ↓ (walidacja UUID + body)
Zod Schema: taskIdSchema + updateTaskSchema
  ↓
Service: task.service.ts → updateTask()
  ↓ (check if exists)
Supabase Client → SELECT task by id
  ↓ (verify weekly_goal_id if provided)
Service → Verify weekly goal exists (if updating)
  ↓ (verify long_term_goal_id if provided)
Service → Verify long-term goal exists (if updating)
  ↓ (verify milestone_id if provided)
Service → Verify milestone exists (if updating)
  ↓ (update fields)
Supabase Client → UPDATE tasks SET ...
  ↓ (if status changed, trigger fires)
Database Trigger → log_task_status_change → INSERT INTO task_history
  ↓
Service → Return updated TaskDTO
  ↓
Endpoint → Return ItemResponse<TaskDTO>
  ↓
Client Response (200 OK) or 404 Not Found
```

### 4.6. POST /api/v1/tasks/:id/copy - Copy Task

```
Client Request
  ↓
Astro Endpoint: /src/pages/api/v1/tasks/[id]/copy.ts
  ↓ (walidacja)
Zod Schema: taskIdSchema + copyTaskSchema
  ↓
Service: task.service.ts → copyTask()
  ↓ (get original task)
Supabase Client → SELECT task by id
  ↓ (create new task with modified week/day)
Supabase Client → INSERT INTO tasks (copy fields, reset status to 'todo')
  ↓ (trigger fires for new task)
Database Trigger → log_task_status_change (for new task)
  ↓
Service → Return new TaskDTO
  ↓
Endpoint → Return SuccessResponse with data + message
  ↓
Client Response (201 Created)
```

### 4.7. DELETE /api/v1/tasks/:id - Delete Task

```
Client Request
  ↓
Astro Endpoint: /src/pages/api/v1/tasks/[id].ts
  ↓ (walidacja UUID)
Zod Schema: taskIdSchema
  ↓
Service: task.service.ts → deleteTask()
  ↓ (delete task)
Supabase Client → DELETE FROM tasks WHERE id
  ↓ (cascade delete)
Database → ON DELETE CASCADE → task_history deleted automatically
  ↓
Service → Return success
  ↓
Endpoint → Return SuccessResponse (message only)
  ↓
Client Response (200 OK) or 404 Not Found
```

---

## 5. Względy bezpieczeństwa

### 5.1. Autentykacja (MVP)

W fazie MVP używamy uproszczonej autentykacji:

```typescript
import { DEFAULT_USER_ID } from '../../../../db/supabase.client';

const userId = DEFAULT_USER_ID;
```

**Uwaga**: Pełna autentykacja zostanie dodana w późniejszej fazie.

### 5.2. Autoryzacja - Row-Level Security (RLS)

Wszystkie operacje chronione przez polityki RLS w bazie danych:

**Polityka dla tasks**:
```sql
-- Users can view own tasks
CREATE POLICY "Users can view own tasks"
ON tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = tasks.plan_id
    AND plans.user_id = auth.uid()
  )
);
```

Polityki obejmują: SELECT, INSERT, UPDATE, DELETE.

**Weryfikacja dostępu**: RLS automatycznie sprawdza czy użytkownik ma dostęp do planu, a przez to do zadań tego planu.

### 5.3. Walidacja danych wejściowych

**Obrona przed atakami**:
- SQL Injection → chronione przez Supabase parametryzowane zapytania
- XSS → walidacja długości i typu pól tekstowych
- Invalid UUIDs → walidacja przez Zod UUID schema
- Invalid Enums → walidacja przez Zod enum schema
- Range violations → walidacja zakresów (week_number: 1-12, due_day: 1-7)

**Zod Schemas** (szczegóły w sekcji 8):
- Wszystkie UUID muszą być walidowane jako `z.string().uuid()`
- Enums walidowane jako `z.enum(['option1', 'option2'])`
- Liczby z zakresem: `z.number().int().min(1).max(12)`

### 5.4. Walidacja relacji Foreign Key

**Foreign Key Checks**:
- `plan_id` must exist in plans table
- `weekly_goal_id` (if provided) must exist in weekly_goals table
- `long_term_goal_id` (if provided) must exist in long_term_goals table
- `milestone_id` (if provided) must exist in milestones table

**Service powinien sprawdzić**:
```typescript
// Verify plan exists and belongs to user
const { data: plan } = await supabase
  .from('plans')
  .select('id')
  .eq('id', plan_id)
  .single();

if (!plan) {
  return { error: 'Plan not found' };
}

// Verify long-term goal if provided
if (long_term_goal_id) {
  const { data: goal } = await supabase
    .from('long_term_goals')
    .select('id')
    .eq('id', long_term_goal_id)
    .single();

  if (!goal) {
    return { error: 'Long-term goal not found' };
  }
}

// Verify milestone if provided
if (milestone_id) {
  const { data: milestone } = await supabase
    .from('milestones')
    .select('id')
    .eq('id', milestone_id)
    .single();

  if (!milestone) {
    return { error: 'Milestone not found' };
  }
}
```

### 5.5. Rate Limiting

**Rekomendacja**: Implementacja rate limiting na poziomie middleware lub reverse proxy (np. Nginx) w produkcji.

**Przykładowe limity**:
- GET endpoints: 100 requests/minute
- POST/PATCH/DELETE: 50 requests/minute

### 5.6. CORS

**Konfiguracja**: Astro middleware powinien konfigurować odpowiednie CORS headers dla API endpoints.

---

## 6. Obsługa błędów

### 6.1. Standardowe kody błędów

| Kod | Scenariusz | Response Body |
|-----|------------|---------------|
| 400 | Brak wymaganego parametru | `{"error": "Validation failed", "details": [...]}` |
| 400 | Nieprawidłowy format UUID | `{"error": "Validation failed", "details": [...]}` |
| 400 | Nieprawidłowa wartość enum | `{"error": "Validation failed", "details": [...]}` |
| 400 | Zakres poza limitem | `{"error": "Validation failed", "details": [...]}` |
| 400 | Przekroczenie limitu zadań | `{"error": "Constraint violation", "message": "..."}` |
| 401 | Brak autoryzacji | `{"error": "Unauthorized"}` |
| 404 | Zadanie nie znalezione | `{"error": "Task not found"}` |
| 404 | Plan nie znaleziony | `{"error": "Plan not found"}` |
| 404 | Weekly goal nie znaleziony | `{"error": "Weekly goal not found"}` |
| 404 | Long-term goal nie znaleziony | `{"error": "Long-term goal not found"}` |
| 404 | Milestone nie znaleziony | `{"error": "Milestone not found"}` |
| 500 | Błąd bazy danych | `{"error": "Internal server error"}` |

### 6.2. Walidacja biznesowa

**Database Triggers** automatycznie sprawdzają:

1. **validate_weekly_subtask_count**: Max 15 subtasków per weekly_goal
   - Error: `"Cannot add more than 15 subtasks to a weekly goal"`

2. **validate_ad_hoc_task_count**: Max 100 ad-hoc tasks per week
   - Error: `"Cannot add more than 100 ad-hoc tasks per week"`

3. **validate_daily_task_count**: Max 10 tasks per day
   - Error: `"Cannot add more than 10 tasks per day"`

**Obsługa w service**:
```typescript
try {
  const result = await supabase.from('tasks').insert(data);
  if (result.error) {
    if (result.error.message.includes('Cannot add more than')) {
      return { error: result.error.message };
    }
    throw result.error;
  }
} catch (error) {

  return { error: 'Internal server error' };
}
```

### 6.3. Error Response Format

**Validation Error**:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "week_number",
      "message": "Must be between 1 and 12",
      "received": 15
    }
  ]
}
```

**Simple Error**:
```json
{
  "error": "Task not found"
}
```

**Constraint Error**:
```json
{
  "error": "Cannot add more than 15 subtasks to a weekly goal"
}
```

---

## 7. Rozważania dotyczące wydajności

### 7.1. Indeksy bazodanowe

**Istniejące indeksy** (z db-plan.md):
```sql
CREATE INDEX idx_tasks_weekly_goal_id ON tasks(weekly_goal_id);
CREATE INDEX idx_tasks_plan_id ON tasks(plan_id);
CREATE INDEX idx_tasks_long_term_goal_id ON tasks(long_term_goal_id);
CREATE INDEX idx_tasks_milestone_id ON tasks(milestone_id);
CREATE INDEX idx_tasks_week_number ON tasks(plan_id, week_number);
CREATE INDEX idx_tasks_due_day ON tasks(plan_id, week_number, due_day);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_task_type ON tasks(task_type);
```

**Composite Index dla często używanych zapytań**:
```sql
CREATE INDEX idx_tasks_plan_week_day ON tasks(plan_id, week_number, due_day);
CREATE INDEX idx_tasks_week_status ON tasks(plan_id, week_number, status);
```

### 7.2. Query Optimization

**GET /api/v1/tasks - Lista zadań**:
- Używaj `.select()` z konkretnymi polami zamiast `SELECT *`
- Limit defaultowo 50 (zapobiega nadmiernym transferom)
- Offset pagination (prostsze niż cursor dla MVP)

**GET /api/v1/tasks/daily**:
- Query ograniczony do konkretnego dnia (plan_id + week_number + due_day)
- Indeks `idx_tasks_plan_week_day` znacznie przyspiesza
- Select tylko niezbędne pola dla UI (id, title, priority, status, task_type)

**GET /api/v1/tasks/:id**:
- Pojedynczy query dla task (index na PK)
- Drugi query dla history (index na task_id)
- Można rozważyć LEFT JOIN w przyszłości

### 7.3. N+1 Problem

**Uwaga**: Przy pobieraniu listy zadań z powiązanymi danymi:

**Nieprawidłowe** (N+1):
```typescript
for (const task of tasks) {
  const weeklyGoal = await getWeeklyGoal(task.weekly_goal_id); // N queries
  const longTermGoal = await getLongTermGoal(task.long_term_goal_id); // N queries
}
```

**Prawidłowe** (JOIN lub batch):
```typescript
const { data: tasks } = await supabase
  .from('tasks')
  .select('*, weekly_goals(*), long_term_goals(*), milestones(*)')
  .eq('plan_id', planId);
```

### 7.4. Caching Strategy

**Rekomendacje dla przyszłości**:
- Cache dla częstych query (np. daily tasks dla current week)
- Invalidation przy UPDATE/DELETE/CREATE
- Redis lub Astro built-in caching

**MVP**: Bez cachingu (prostota > optymalizacja przedwczesna)

### 7.5. Database Connection Pooling

**Supabase**: Automatycznie zarządza connection pooling.

**Best Practices**:
- Używaj pojedynczego Supabase client instance
- Nie twórz nowych połączeń dla każdego requesta
- Supabase SDK automatycznie pooluje połączenia

---

## 8. Etapy wdrożenia

### Krok 1: Utworzenie schematów walidacji Zod

**Plik**: `/src/lib/validation/task.validation.ts`

```typescript
import { z } from 'zod';

// UUID schema (reusable)
const uuidSchema = z.string().uuid({ message: 'Invalid UUID format' });

// Enum schemas
const taskPrioritySchema = z.enum(['A', 'B', 'C'], {
  errorMap: () => ({ message: 'Priority must be A, B, or C' }),
});

const taskStatusSchema = z.enum(
  ['todo', 'in_progress', 'completed', 'cancelled', 'postponed'],
  { errorMap: () => ({ message: 'Invalid status' }) }
);

const taskTypeSchema = z.enum(['weekly_main', 'weekly_sub', 'ad_hoc'], {
  errorMap: () => ({ message: 'Invalid task type' }),
});

// Week and day schemas
const weekNumberSchema = z
  .number()
  .int()
  .min(1, 'Week number must be at least 1')
  .max(12, 'Week number must be at most 12')
  .nullable()
  .optional();

const dueDaySchema = z
  .number()
  .int()
  .min(1, 'Due day must be at least 1 (Monday)')
  .max(7, 'Due day must be at most 7 (Sunday)')
  .nullable()
  .optional();

// 1. List Tasks Query Params Schema
export const listTasksSchema = z.object({
  plan_id: uuidSchema,
  week_number: weekNumberSchema,
  due_day: dueDaySchema,
  task_type: taskTypeSchema.optional(),
  weekly_goal_id: uuidSchema.optional(),
  long_term_goal_id: uuidSchema.optional(),
  milestone_id: uuidSchema.optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

// 2. Daily Tasks Query Params Schema
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

// 3. Task ID Param Schema (for :id endpoints)
export const taskIdSchema = z.object({
  id: uuidSchema,
});

// 4. Create Task Body Schema
export const createTaskSchema = z.object({
  plan_id: uuidSchema,
  weekly_goal_id: uuidSchema.nullable().optional(),
  long_term_goal_id: uuidSchema.nullable().optional(),
  milestone_id: uuidSchema.nullable().optional(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be at most 255 characters'),
  description: z.string().nullable().optional(),
  priority: taskPrioritySchema.default('C'),
  status: taskStatusSchema.default('todo'),
  task_type: taskTypeSchema.default('weekly_sub'),
  week_number: weekNumberSchema,
  due_day: dueDaySchema,
  position: z.number().int().positive().default(1).optional(),
});

// 5. Update Task Body Schema (all fields optional for partial update)
export const updateTaskSchema = z
  .object({
    weekly_goal_id: uuidSchema.nullable().optional(),
    long_term_goal_id: uuidSchema.nullable().optional(),
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
    week_number: weekNumberSchema,
    due_day: dueDaySchema,
    position: z.number().int().positive().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

// 6. Copy Task Body Schema
export const copyTaskSchema = z.object({
  week_number: weekNumberSchema,
  due_day: dueDaySchema,
});

// Export types for use in services
export type ListTasksParams = z.infer<typeof listTasksSchema>;
export type DailyTasksParams = z.infer<typeof dailyTasksParamsSchema>;
export type TaskIdParam = z.infer<typeof taskIdSchema>;
export type CreateTaskData = z.infer<typeof createTaskSchema>;
export type UpdateTaskData = z.infer<typeof updateTaskSchema>;
export type CopyTaskData = z.infer<typeof copyTaskSchema>;
```

**Testy walidacji** - powinny być pokryte:
- ✅ Valid UUID vs invalid UUID
- ✅ Enum values (valid vs invalid)
- ✅ Number ranges (week: 1-12, day: 1-7)
- ✅ String length (title max 255)
- ✅ Required vs optional fields

---

### Krok 2: Utworzenie serwisu zadań

**Plik**: `/src/lib/services/task.service.ts`

```typescript
import type { SupabaseClient } from '../../db/supabase.client';
import type {
  TaskDTO,
  TaskWithHistoryDTO,
  DailyTasksDTO,
  CreateTaskCommand,
  UpdateTaskCommand,
  CopyTaskCommand,
  ListResponse,
  ItemResponse,
  SuccessResponse,
  ErrorResponse,
} from '../../types';
import type {
  ListTasksParams,
  DailyTasksParams,
  CreateTaskData,
  UpdateTaskData,
  CopyTaskData,
} from '../validation/task.validation';

/**
 * Task Service
 * Handles all business logic for task management
 */
export class TaskService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * List tasks with filtering
   * GET /api/v1/tasks
   */
  async listTasks(params: ListTasksParams): Promise<ListResponse<TaskDTO> | ErrorResponse> {
    try {
      let query = this.supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .eq('plan_id', params.plan_id);

      // Apply optional filters
      if (params.week_number !== undefined && params.week_number !== null) {
        query = query.eq('week_number', params.week_number);
      }
      if (params.due_day !== undefined && params.due_day !== null) {
        query = query.eq('due_day', params.due_day);
      }
      if (params.task_type) {
        query = query.eq('task_type', params.task_type);
      }
      if (params.weekly_goal_id) {
        query = query.eq('weekly_goal_id', params.weekly_goal_id);
      }
      if (params.long_term_goal_id) {
        query = query.eq('long_term_goal_id', params.long_term_goal_id);
      }
      if (params.milestone_id) {
        query = query.eq('milestone_id', params.milestone_id);
      }
      if (params.status) {
        query = query.eq('status', params.status);
      }
      if (params.priority) {
        query = query.eq('priority', params.priority);
      }

      // Apply pagination
      const limit = params.limit ?? 50;
      const offset = params.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      // Order by position (default ordering)
      query = query.order('position', { ascending: true });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error listing tasks:', error);
        return { error: 'Failed to fetch tasks' };
      }

      return {
        data: data as TaskDTO[],
        count: count ?? undefined,
      };
    } catch (error) {
      console.error('Unexpected error in listTasks:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Get daily tasks with A/B/C categorization
   * GET /api/v1/tasks/daily
   */
  async getDailyTasks(
    params: DailyTasksParams,
    planStartDate: Date
  ): Promise<ItemResponse<DailyTasksDTO> | ErrorResponse> {
    try {
      const { data: tasks, error } = await this.supabase
        .from('tasks')
        .select('id, title, priority, status, task_type')
        .eq('plan_id', params.plan_id)
        .eq('week_number', params.week_number)
        .eq('due_day', params.due_day)
        .order('priority', { ascending: true }) // A, B, C
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching daily tasks:', error);
        return { error: 'Failed to fetch daily tasks' };
      }

      // Calculate actual date
      const weekOffset = params.week_number - 1;
      const dayOffset = params.due_day - 1;
      const taskDate = new Date(planStartDate);
      taskDate.setDate(taskDate.getDate() + weekOffset * 7 + dayOffset);
      const dateString = taskDate.toISOString().split('T')[0];

      // Categorize by priority
      const mostImportant = tasks.find((t) => t.priority === 'A') || null;
      const secondary = tasks.filter((t) => t.priority === 'B');
      const additional = tasks.filter((t) => t.priority === 'C');

      const dailyTasks: DailyTasksDTO = {
        date: dateString,
        week_number: params.week_number,
        due_day: params.due_day,
        most_important: mostImportant,
        secondary,
        additional,
      };

      return { data: dailyTasks };
    } catch (error) {
      console.error('Unexpected error in getDailyTasks:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Get task by ID with history
   * GET /api/v1/tasks/:id
   */
  async getTaskById(taskId: string): Promise<ItemResponse<TaskWithHistoryDTO> | ErrorResponse> {
    try {
      // Fetch task
      const { data: task, error: taskError } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError || !task) {
        return { error: 'Task not found' };
      }

      // Fetch history
      const { data: history, error: historyError } = await this.supabase
        .from('task_history')
        .select('*')
        .eq('task_id', taskId)
        .order('changed_at', { ascending: true });

      if (historyError) {
        console.error('Error fetching task history:', historyError);
        return { error: 'Failed to fetch task history' };
      }

      const taskWithHistory: TaskWithHistoryDTO = {
        ...(task as TaskDTO),
        history: history || [],
      };

      return { data: taskWithHistory };
    } catch (error) {
      console.error('Unexpected error in getTaskById:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Create a new task
   * POST /api/v1/tasks
   */
  async createTask(taskData: CreateTaskData): Promise<ItemResponse<TaskDTO> | ErrorResponse> {
    try {
      // Verify plan exists (RLS will also check ownership)
      const { data: plan, error: planError } = await this.supabase
        .from('plans')
        .select('id')
        .eq('id', taskData.plan_id)
        .single();

      if (planError || !plan) {
        return { error: 'Plan not found' };
      }

      // If weekly_goal_id provided, verify it exists
      if (taskData.weekly_goal_id) {
        const { data: weeklyGoal, error: goalError } = await this.supabase
          .from('weekly_goals')
          .select('id')
          .eq('id', taskData.weekly_goal_id)
          .single();

        if (goalError || !weeklyGoal) {
          return { error: 'Weekly goal not found' };
        }
      }

      // If long_term_goal_id provided, verify it exists
      if (taskData.long_term_goal_id) {
        const { data: longTermGoal, error: goalError } = await this.supabase
          .from('long_term_goals')
          .select('id')
          .eq('id', taskData.long_term_goal_id)
          .single();

        if (goalError || !longTermGoal) {
          return { error: 'Long-term goal not found' };
        }
      }

      // If milestone_id provided, verify it exists
      if (taskData.milestone_id) {
        const { data: milestone, error: milestoneError } = await this.supabase
          .from('milestones')
          .select('id')
          .eq('id', taskData.milestone_id)
          .single();

        if (milestoneError || !milestone) {
          return { error: 'Milestone not found' };
        }
      }

      // Insert task
      const { data: newTask, error: insertError } = await this.supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (insertError) {
        // Check for constraint violations (triggers)
        if (insertError.message.includes('Cannot add more than')) {
          return { error: insertError.message };
        }
        console.error('Error creating task:', insertError);
        return { error: 'Failed to create task' };
      }

      return { data: newTask as TaskDTO };
    } catch (error) {
      console.error('Unexpected error in createTask:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Update task
   * PATCH /api/v1/tasks/:id
   */
  async updateTask(
    taskId: string,
    updateData: UpdateTaskData
  ): Promise<ItemResponse<TaskDTO> | ErrorResponse> {
    try {
      // Check if task exists
      const { data: existingTask, error: fetchError } = await this.supabase
        .from('tasks')
        .select('id')
        .eq('id', taskId)
        .single();

      if (fetchError || !existingTask) {
        return { error: 'Task not found' };
      }

      // If weekly_goal_id provided, verify it exists
      if (updateData.weekly_goal_id) {
        const { data: weeklyGoal, error: goalError } = await this.supabase
          .from('weekly_goals')
          .select('id')
          .eq('id', updateData.weekly_goal_id)
          .single();

        if (goalError || !weeklyGoal) {
          return { error: 'Weekly goal not found' };
        }
      }

      // If long_term_goal_id provided, verify it exists
      if (updateData.long_term_goal_id) {
        const { data: longTermGoal, error: goalError } = await this.supabase
          .from('long_term_goals')
          .select('id')
          .eq('id', updateData.long_term_goal_id)
          .single();

        if (goalError || !longTermGoal) {
          return { error: 'Long-term goal not found' };
        }
      }

      // If milestone_id provided, verify it exists
      if (updateData.milestone_id) {
        const { data: milestone, error: milestoneError } = await this.supabase
          .from('milestones')
          .select('id')
          .eq('id', updateData.milestone_id)
          .single();

        if (milestoneError || !milestone) {
          return { error: 'Milestone not found' };
        }
      }

      // Update task
      const { data: updatedTask, error: updateError } = await this.supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single();

      if (updateError) {
        // Check for constraint violations (triggers)
        if (updateError.message.includes('Cannot add more than')) {
          return { error: updateError.message };
        }
        console.error('Error updating task:', updateError);
        return { error: 'Failed to update task' };
      }

      // Trigger log_task_status_change will automatically log status changes

      return { data: updatedTask as TaskDTO };
    } catch (error) {
      console.error('Unexpected error in updateTask:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Copy task to another week/day
   * POST /api/v1/tasks/:id/copy
   */
  async copyTask(
    taskId: string,
    copyData: CopyTaskData
  ): Promise<SuccessResponse | ErrorResponse> {
    try {
      // Fetch original task
      const { data: originalTask, error: fetchError } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (fetchError || !originalTask) {
        return { error: 'Task not found' };
      }

      // Create new task with copied data
      const newTaskData = {
        plan_id: originalTask.plan_id,
        weekly_goal_id: originalTask.weekly_goal_id,
        long_term_goal_id: originalTask.long_term_goal_id,
        milestone_id: originalTask.milestone_id,
        title: originalTask.title,
        description: originalTask.description,
        priority: originalTask.priority,
        status: 'todo' as const, // Reset status
        task_type: originalTask.task_type,
        week_number: copyData.week_number ?? originalTask.week_number,
        due_day: copyData.due_day ?? originalTask.due_day,
        position: originalTask.position,
      };

      const { data: copiedTask, error: insertError } = await this.supabase
        .from('tasks')
        .insert(newTaskData)
        .select()
        .single();

      if (insertError) {
        console.error('Error copying task:', insertError);
        return { error: 'Failed to copy task' };
      }

      return {
        data: { id: copiedTask.id, ...copiedTask },
        message: 'Task copied successfully',
      };
    } catch (error) {
      console.error('Unexpected error in copyTask:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Delete task
   * DELETE /api/v1/tasks/:id
   */
  async deleteTask(taskId: string): Promise<SuccessResponse | ErrorResponse> {
    try {
      // Check if task exists
      const { data: existingTask, error: fetchError } = await this.supabase
        .from('tasks')
        .select('id')
        .eq('id', taskId)
        .single();

      if (fetchError || !existingTask) {
        return { error: 'Task not found' };
      }

      // Delete task (cascades to task_history)
      const { error: deleteError } = await this.supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) {
        console.error('Error deleting task:', deleteError);
        return { error: 'Failed to delete task' };
      }

      return { message: 'Task deleted successfully' };
    } catch (error) {
      console.error('Unexpected error in deleteTask:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Helper: Get plan start date (needed for getDailyTasks)
   */
  async getPlanStartDate(planId: string): Promise<Date | null> {
    try {
      const { data, error } = await this.supabase
        .from('plans')
        .select('start_date')
        .eq('id', planId)
        .single();

      if (error || !data) {
        return null;
      }

      return new Date(data.start_date);
    } catch (error) {
      console.error('Error fetching plan start date:', error);
      return null;
    }
  }
}
```

---

### Krok 3: Implementacja endpointów Astro

#### 3.1. GET /api/v1/tasks - Lista zadań

**Plik**: `/src/pages/api/v1/tasks/index.ts`

```typescript
import type { APIRoute } from 'astro';
import { TaskService } from '../../../../lib/services/task.service';
import { listTasksSchema, createTaskSchema } from '../../../../lib/validation/task.validation';
import { DEFAULT_USER_ID } from '../../../../db/supabase.client';

export const prerender = false;

// GET /api/v1/tasks
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const supabase = locals.supabase;
    const userId = DEFAULT_USER_ID;

    // Parse query parameters
    const params = {
      plan_id: url.searchParams.get('plan_id'),
      week_number: url.searchParams.get('week_number'),
      due_day: url.searchParams.get('due_day'),
      task_type: url.searchParams.get('task_type'),
      weekly_goal_id: url.searchParams.get('weekly_goal_id'),
      long_term_goal_id: url.searchParams.get('long_term_goal_id'),
      milestone_id: url.searchParams.get('milestone_id'),
      status: url.searchParams.get('status'),
      priority: url.searchParams.get('priority'),
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
    };

    // Validate query parameters
    const validation = listTasksSchema.safeParse(params);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            received: err.code === 'invalid_type' ? params[err.path[0] as keyof typeof params] : undefined,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call service
    const taskService = new TaskService(supabase);
    const result = await taskService.listTasks(validation.data);

    if ('error' in result) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in GET /api/v1/tasks:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/v1/tasks
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;
    const userId = DEFAULT_USER_ID;

    // Parse request body
    const body = await request.json();

    // Validate body
    const validation = createTaskSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call service
    const taskService = new TaskService(supabase);
    const result = await taskService.createTask(validation.data);

    if ('error' in result) {
      // Determine status code
      const status =
        result.error === 'Plan not found' ||
        result.error === 'Weekly goal not found' ||
        result.error === 'Long-term goal not found' ||
        result.error === 'Milestone not found'
          ? 404
          : result.error.includes('Cannot add more than')
          ? 400
          : 500;

      return new Response(JSON.stringify({ error: result.error }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in POST /api/v1/tasks:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

#### 3.2. GET /api/v1/tasks/daily - Daily Tasks

**Plik**: `/src/pages/api/v1/tasks/daily.ts`

```typescript
import type { APIRoute } from 'astro';
import { TaskService } from '../../../../lib/services/task.service';
import { dailyTasksParamsSchema } from '../../../../lib/validation/task.validation';
import { DEFAULT_USER_ID } from '../../../../db/supabase.client';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const supabase = locals.supabase;
    const userId = DEFAULT_USER_ID;

    // Parse query parameters
    const params = {
      plan_id: url.searchParams.get('plan_id'),
      week_number: url.searchParams.get('week_number'),
      due_day: url.searchParams.get('due_day'),
    };

    // Validate
    const validation = dailyTasksParamsSchema.safeParse(params);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get plan start date
    const taskService = new TaskService(supabase);
    const planStartDate = await taskService.getPlanStartDate(validation.data.plan_id);

    if (!planStartDate) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Call service
    const result = await taskService.getDailyTasks(validation.data, planStartDate);

    if ('error' in result) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in GET /api/v1/tasks/daily:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

#### 3.3. GET /api/v1/tasks/:id - Task Details

**Plik**: `/src/pages/api/v1/tasks/[id].ts`

```typescript
import type { APIRoute } from 'astro';
import { TaskService } from '../../../../lib/services/task.service';
import {
  taskIdSchema,
  updateTaskSchema,
} from '../../../../lib/validation/task.validation';
import { DEFAULT_USER_ID } from '../../../../db/supabase.client';

export const prerender = false;

// GET /api/v1/tasks/:id
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const supabase = locals.supabase;
    const userId = DEFAULT_USER_ID;

    // Validate ID
    const validation = taskIdSchema.safeParse(params);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call service
    const taskService = new TaskService(supabase);
    const result = await taskService.getTaskById(validation.data.id);

    if ('error' in result) {
      const status = result.error === 'Task not found' ? 404 : 500;
      return new Response(JSON.stringify({ error: result.error }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in GET /api/v1/tasks/:id:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PATCH /api/v1/tasks/:id
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const supabase = locals.supabase;
    const userId = DEFAULT_USER_ID;

    // Validate ID
    const idValidation = taskIdSchema.safeParse(params);
    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: idValidation.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const bodyValidation = updateTaskSchema.safeParse(body);
    if (!bodyValidation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: bodyValidation.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call service
    const taskService = new TaskService(supabase);
    const result = await taskService.updateTask(idValidation.data.id, bodyValidation.data);

    if ('error' in result) {
      const status =
        result.error === 'Task not found' ||
        result.error === 'Weekly goal not found' ||
        result.error === 'Long-term goal not found' ||
        result.error === 'Milestone not found'
          ? 404
          : 500;

      return new Response(JSON.stringify({ error: result.error }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in PATCH /api/v1/tasks/:id:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE /api/v1/tasks/:id
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const supabase = locals.supabase;
    const userId = DEFAULT_USER_ID;

    // Validate ID
    const validation = taskIdSchema.safeParse(params);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call service
    const taskService = new TaskService(supabase);
    const result = await taskService.deleteTask(validation.data.id);

    if ('error' in result) {
      const status = result.error === 'Task not found' ? 404 : 500;
      return new Response(JSON.stringify({ error: result.error }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in DELETE /api/v1/tasks/:id:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

#### 3.4. POST /api/v1/tasks/:id/copy - Copy Task

**Plik**: `/src/pages/api/v1/tasks/[id]/copy.ts`

```typescript
import type { APIRoute } from 'astro';
import { TaskService } from '../../../../../lib/services/task.service';
import {
  taskIdSchema,
  copyTaskSchema,
} from '../../../../../lib/validation/task.validation';
import { DEFAULT_USER_ID } from '../../../../../db/supabase.client';

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const supabase = locals.supabase;
    const userId = DEFAULT_USER_ID;

    // Validate ID
    const idValidation = taskIdSchema.safeParse(params);
    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: idValidation.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const bodyValidation = copyTaskSchema.safeParse(body);
    if (!bodyValidation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: bodyValidation.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call service
    const taskService = new TaskService(supabase);
    const result = await taskService.copyTask(idValidation.data.id, bodyValidation.data);

    if ('error' in result) {
      const status = result.error === 'Task not found' ? 404 : 500;
      return new Response(JSON.stringify({ error: result.error }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in POST /api/v1/tasks/:id/copy:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

---

### Krok 4: Testowanie implementacji

#### 4.1. Testy jednostkowe dla validation schemas

**Plik**: `/src/lib/validation/task.validation.test.ts` (przykład)

```typescript
import { describe, it, expect } from 'vitest';
import {
  listTasksSchema,
  dailyTasksParamsSchema,
  createTaskSchema,
  updateTaskSchema,
  copyTaskSchema,
} from './task.validation';

describe('Task Validation Schemas', () => {
  describe('listTasksSchema', () => {
    it('should validate valid query params', () => {
      const valid = {
        plan_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        week_number: 5,
        due_day: 3,
        priority: 'A',
        limit: 20,
        offset: 0,
      };
      expect(listTasksSchema.parse(valid)).toEqual(expect.objectContaining(valid));
    });

    it('should reject invalid UUID', () => {
      const invalid = { plan_id: 'not-a-uuid' };
      expect(() => listTasksSchema.parse(invalid)).toThrow();
    });

    it('should reject week_number out of range', () => {
      const invalid = { plan_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', week_number: 13 };
      expect(() => listTasksSchema.parse(invalid)).toThrow();
    });
  });

  describe('createTaskSchema', () => {
    it('should validate valid create data', () => {
      const valid = {
        plan_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        title: 'Test task',
        priority: 'B',
        status: 'todo',
        task_type: 'weekly_sub',
      };
      expect(createTaskSchema.parse(valid)).toEqual(expect.objectContaining(valid));
    });

    it('should reject title exceeding max length', () => {
      const invalid = {
        plan_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        title: 'a'.repeat(256),
      };
      expect(() => createTaskSchema.parse(invalid)).toThrow();
    });
  });
});
```

#### 4.2. Testy integracyjne dla service

```typescript
// Example integration tests using Supabase test client
import { describe, it, expect, beforeEach } from 'vitest';
import { TaskService } from './task.service';
// ... test setup with test database
```

#### 4.3. Testy API z HTTP klientem

**Plik**: `/api-tests/tasks-tests.http`

```http
### Variables
@baseUrl = http://localhost:3000/api/v1
@planId = <your-test-plan-id>
@taskId = <your-test-task-id>
@goalId = <your-test-goal-id>
@milestoneId = <your-test-milestone-id>

### 1. List Tasks - Basic
GET {{baseUrl}}/tasks?plan_id={{planId}}

### 2. List Tasks - With Filters
GET {{baseUrl}}/tasks?plan_id={{planId}}&week_number=3&priority=A

### 3. List Tasks - Filter by Long-term Goal
GET {{baseUrl}}/tasks?plan_id={{planId}}&long_term_goal_id={{goalId}}

### 4. List Tasks - Filter by Milestone
GET {{baseUrl}}/tasks?plan_id={{planId}}&milestone_id={{milestoneId}}

### 5. Get Daily Tasks
GET {{baseUrl}}/tasks/daily?plan_id={{planId}}&week_number=1&due_day=1

### 6. Get Task by ID
GET {{baseUrl}}/tasks/{{taskId}}

### 7. Create Task - Weekly Sub with Long-term Goal
POST {{baseUrl}}/tasks
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "long_term_goal_id": "{{goalId}}",
  "title": "Test task linked to goal",
  "description": "Test description",
  "priority": "A",
  "status": "todo",
  "task_type": "weekly_sub",
  "week_number": 1,
  "due_day": 1,
  "position": 1
}

### 8. Create Task - with Milestone
POST {{baseUrl}}/tasks
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "long_term_goal_id": "{{goalId}}",
  "milestone_id": "{{milestoneId}}",
  "title": "Task linked to milestone",
  "description": "Test description",
  "priority": "B",
  "status": "todo",
  "task_type": "weekly_sub",
  "week_number": 1,
  "due_day": 2,
  "position": 1
}

### 9. Update Task - Change Status and Milestone
PATCH {{baseUrl}}/tasks/{{taskId}}
Content-Type: application/json

{
  "status": "completed",
  "milestone_id": "{{milestoneId}}"
}

### 10. Copy Task
POST {{baseUrl}}/tasks/{{taskId}}/copy
Content-Type: application/json

{
  "week_number": 2,
  "due_day": 3
}

### 11. Delete Task
DELETE {{baseUrl}}/tasks/{{taskId}}

### Error Cases

### 12. Invalid UUID
GET {{baseUrl}}/tasks?plan_id=invalid-uuid

### 13. Missing Required Param
GET {{baseUrl}}/tasks

### 14. Week Number Out of Range
GET {{baseUrl}}/tasks?plan_id={{planId}}&week_number=15

### 15. Task Not Found
GET {{baseUrl}}/tasks/00000000-0000-0000-0000-000000000000
```

---

### Krok 5: Dokumentacja i komentarze

- ✅ Wszystkie funkcje service mają JSDoc comments
- ✅ Validation schemas mają opisowe error messages
- ✅ Endpoint handlers mają komentarze wyjaśniające flow
- ✅ Error responses są jednolite i opisowe

---

### Krok 6: Checklist przed deploymentem

- [ ] Wszystkie validation schemas przetestowane
- [ ] Service methods przetestowane z mock database
- [ ] Wszystkie endpointy przetestowane z REST client
- [ ] Error handling pokryty dla wszystkich scenariuszy
- [ ] Database triggers działają poprawnie (max counts)
- [ ] RLS policies weryfikują dostęp użytkownika
- [ ] Foreign key validation dla long_term_goal_id i milestone_id działa poprawnie
- [ ] Linter errors resolved
- [ ] TypeScript typechecking passes
- [ ] Performance testing (duże listy zadań)
- [ ] Documentation updated in api-plan.md

---

## 9. Podsumowanie

Ten plan implementacji dostarcza:

1. ✅ **7 endpointów REST API** dla pełnego zarządzania zadaniami
2. ✅ **Validation schemas** z Zod dla wszystkich inputów
3. ✅ **Service layer** z wydzieloną logiką biznesową
4. ✅ **Error handling** na poziomie endpoint/service/database
5. ✅ **Security** przez RLS policies i input validation
6. ✅ **Performance** przez database indexes i query optimization
7. ✅ **Testing strategy** dla unit, integration, API tests
8. ✅ **Type safety** przez TypeScript i generated database types
9. ✅ **Flexible hierarchies** - zadania mogą być powiązane z weekly goals, long-term goals, milestones lub dowolną kombinacją

**Kluczowe zmiany w stosunku do poprzedniej wersji**:
- Dodano pełną obsługę `long_term_goal_id` w zadaniach
- Dodano pełną obsługę `milestone_id` w zadaniach
- Zaktualizowano walidację dla nowych pól relacyjnych
- Zaktualizowano service layer dla weryfikacji foreign keys
- Zaktualizowano dokumentację API responses
- **Zaktualizowano limity systemowe zgodnie z api-plan.md i db-plan.md**:
  - Max 15 weekly subtasks (było 10)
  - Max 100 ad-hoc tasks per week (było 10)
  - Nowy limit: Max 10 tasks per day
  - Zaktualizowano limity dla planów (6 goals) i celów tygodniowych (3 weekly goals) w walidacji wejściowej

**Kolejność implementacji**:
1. task.validation.ts (walidacje)
2. task.service.ts (logika biznesowa)
3. API endpoints (4 pliki: index.ts, daily.ts, [id].ts, [id]/copy.ts)
4. Testy (validation → service → API)
5. Dokumentacja i deployment

**Szacowany czas implementacji**: 2-3 dni dla doświadczonego developera.
