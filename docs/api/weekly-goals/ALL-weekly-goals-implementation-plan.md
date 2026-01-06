# API Endpoint Implementation Plan: Weekly Goals

## 1. Przegląd punktów końcowych

Ten dokument opisuje implementację pięciu endpointów REST API dla zarządzania celami tygodniowymi (weekly goals) w aplikacji 12 Weeks Planner.

### Funkcjonalności:
- **Lista celów tygodniowych** - Pobieranie celów z filtrami (plan, tydzień, cel długoterminowy, kamień milowy)
- **Szczegóły celu tygodniowego** - Pobieranie pojedynczego celu z podzadaniami
- **Tworzenie celu tygodniowego** - Dodawanie nowych celów do planera
- **Aktualizacja celu tygodniowego** - Modyfikacja istniejących celów (partial update)
- **Usuwanie celu tygodniowego** - Usuwanie celów z kaskadowym usunięciem podzadań

### Powiązania z bazą danych:
- Cele tygodniowe należą do `plans` (wymagana relacja)
- Opcjonalnie powiązane z `long_term_goals` (nullable)
- Opcjonalnie powiązane z `milestones` (nullable)
- Posiadają podzadania w `tasks` (weekly_sub type) - usuwane kaskadowo
- Ograniczenia: week_number musi być w zakresie 1-12

### Hierarchia powiązań:
Weekly goal może być powiązany z:
1. Tylko planem (podstawowa konfiguracja)
2. Planem + celem długoterminowym
3. Planem + celem długoterminowym + kamieniem milowym (z wybranego celu długoterminowego) (pełna hierarchia)

**Walidacja hierarchii:**
- Jeśli podano `milestone_id`, milestone musi należeć do goala w tym samym planie
- Jeśli podano `long_term_goal_id`, goal musi należeć do tego samego planu
- Milestone musi być zdefiniowany w ramach wybranego celu długoterminowego w tym samym planie

---

## 2. Szczegóły żądań

### 2.1. GET /api/v1/weekly-goals

**Metoda HTTP:** GET

**Struktura URL:** `/api/v1/weekly-goals?plan_id={uuid}&week_number={1-12}&long_term_goal_id={uuid}&milestone_id={uuid}&limit={50}&offset={0}`

**Parametry Query:**
- **Wymagane:**
  - `plan_id` (string, UUID) - Identyfikator planera

- **Opcjonalne:**
  - `week_number` (integer, 1-12) - Filtrowanie po numerze tygodnia
  - `long_term_goal_id` (string, UUID) - Filtrowanie po powiązanym celu długoterminowym
  - `milestone_id` (string, UUID) - Filtrowanie po powiązanym kamieniu milowym
  - `limit` (integer, 1-100, default: 50) - Liczba wyników na stronę
  - `offset` (integer, ≥0, default: 0) - Przesunięcie dla paginacji

**Request Body:** Brak

---

### 2.2. GET /api/v1/weekly-goals/:id

**Metoda HTTP:** GET

**Struktura URL:** `/api/v1/weekly-goals/{uuid}`

**Parametry URL:**
- **Wymagane:**
  - `id` (string, UUID) - Identyfikator celu tygodniowego

**Request Body:** Brak

---

### 2.3. POST /api/v1/weekly-goals

**Metoda HTTP:** POST

**Struktura URL:** `/api/v1/weekly-goals`

**Request Body (JSON):**
```json
{
  "plan_id": "uuid",
  "long_term_goal_id": "uuid | null",
  "milestone_id": "uuid | null",
  "week_number": 3,
  "title": "Complete authentication system",
  "description": "Implement auth with Supabase",
  "position": 1
}
```

**Pola:**
- **Wymagane:**
  - `plan_id` (string, UUID) - ID planera
  - `week_number` (integer, 1-12) - Numer tygodnia
  - `title` (string, 1-255 chars) - Tytuł celu

- **Opcjonalne:**
  - `long_term_goal_id` (string | null, UUID) - Powiązanie z celem długoterminowym
  - `milestone_id` (string | null, UUID) - Powiązanie z kamieniem milowym
  - `description` (string | null) - Opis celu
  - `position` (integer, ≥1, default: 1) - Kolejność wyświetlania

---

### 2.4. PATCH /api/v1/weekly-goals/:id

**Metoda HTTP:** PATCH

**Struktura URL:** `/api/v1/weekly-goals/{uuid}`

**Parametry URL:**
- **Wymagane:**
  - `id` (string, UUID) - Identyfikator celu tygodniowego

**Request Body (JSON):**
```json
{
  "title": "Complete authentication and authorization",
  "milestone_id": "uuid",
  "long_term_goal_id": "uuid"
}
```

**Pola (wszystkie opcjonalne, min. 1 wymagane):**
- `long_term_goal_id` (string | null, UUID) - Zmiana powiązania z celem długoterminowym
- `milestone_id` (string | null, UUID) - Zmiana powiązania z kamieniem milowym
- `title` (string, 1-255 chars) - Nowy tytuł
- `description` (string | null) - Nowy opis
- `position` (integer, ≥1) - Nowa pozycja

**Note:** Pole `week_number` nie jest edytowalne zgodnie ze specyfikacją `UpdateWeeklyGoalCommand`

---

### 2.5. DELETE /api/v1/weekly-goals/:id

**Metoda HTTP:** DELETE

**Struktura URL:** `/api/v1/weekly-goals/{uuid}`

**Parametry URL:**
- **Wymagane:**
  - `id` (string, UUID) - Identyfikator celu tygodniowego

**Request Body:** Brak

---

## 3. Wykorzystywane typy

### 3.1. DTOs (już zdefiniowane w `src/types.ts`)

```typescript
// Podstawowy DTO dla celów tygodniowych (zawiera milestone_id)
export type WeeklyGoalDTO = WeeklyGoalEntity;

// DTO dla celu z podzadaniami (GET /api/v1/weekly-goals/:id)
export interface WeeklyGoalWithSubtasksDTO extends WeeklyGoalDTO {
  subtasks: Pick<TaskDTO, 'id' | 'title' | 'priority' | 'status'>[];
}

// Command dla tworzenia (POST /api/v1/weekly-goals)
export type CreateWeeklyGoalCommand = Pick<
  WeeklyGoalInsert,
  'plan_id' | 'long_term_goal_id' | 'milestone_id' | 'week_number' | 'title' | 'description' | 'position'
>;

// Command dla aktualizacji (PATCH /api/v1/weekly-goals/:id)
export type UpdateWeeklyGoalCommand = Partial<
  Pick<WeeklyGoalUpdate, 'long_term_goal_id' | 'milestone_id' | 'title' | 'description' | 'position'>
>;

// Query parameters dla listy
export interface WeeklyGoalListParams extends ListQueryParams {
  plan_id: string;
  week_number?: number;
  long_term_goal_id?: string;
  milestone_id?: string;
}

// Response wrappers
export interface ListResponse<T> {
  data: T[];
  count?: number;
}

export interface ItemResponse<T> {
  data: T;
}
```

### 3.2. Validation Schemas (do utworzenia w `src/lib/validation/weekly-goal.validation.ts`)

```typescript
import { z } from 'zod';

// POST body validation
export const CreateWeeklyGoalBodySchema = z.object({
  plan_id: z.string().uuid(),
  long_term_goal_id: z.string().uuid().nullable().optional(),
  milestone_id: z.string().uuid().nullable().optional(),
  week_number: z.number().int().min(1).max(12),
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().nullable().optional(),
  position: z.number().int().min(1).default(1)
});

// PATCH body validation
export const UpdateWeeklyGoalBodySchema = z.object({
  long_term_goal_id: z.string().uuid().nullable().optional(),
  milestone_id: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  position: z.number().int().min(1).optional()
}).strict();

// URL params validation
export const WeeklyGoalIdParamsSchema = z.object({
  id: z.string().uuid()
});

// Query params validation
export const WeeklyGoalListQuerySchema = z.object({
  plan_id: z.string().uuid(),
  week_number: z.coerce.number().int().min(1).max(12).optional(),
  long_term_goal_id: z.string().uuid().optional(),
  milestone_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});
```

---

## 4. Szczegóły odpowiedzi

### 4.1. GET /api/v1/weekly-goals

**200 OK:**
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
  ],
  "count": 1
}
```

**400 Bad Request:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "plan_id",
      "message": "Invalid UUID format"
    }
  ]
}
```

---

### 4.2. GET /api/v1/weekly-goals/:id

**200 OK:**
```json
{
  "data": {
    "id": "uuid",
    "plan_id": "uuid",
    "long_term_goal_id": "uuid",
    "milestone_id": "uuid",
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

**404 Not Found:**
```json
{
  "error": "Weekly goal not found",
  "message": "Weekly goal does not exist or does not belong to user"
}
```

---

### 4.3. POST /api/v1/weekly-goals

**201 Created:**
```json
{
  "data": {
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
}
```

**404 Not Found (Plan):**
```json
{
  "error": "Plan not found",
  "message": "Plan does not exist or does not belong to user"
}
```

**404 Not Found (Long-term Goal):**
```json
{
  "error": "Long-term goal not found",
  "message": "Long-term goal does not exist or does not belong to user"
}
```

**404 Not Found (Milestone):**
```json
{
  "error": "Milestone not found",
  "message": "Milestone does not exist or does not belong to user's plan"
}
```

**400 Bad Request (Milestone-Goal mismatch):**
```json
{
  "error": "Validation failed",
  "message": "Milestone does not belong to a goal in the specified plan"
}
```

---

### 4.4. PATCH /api/v1/weekly-goals/:id

**200 OK:**
```json
{
  "data": {
    "id": "uuid",
    "plan_id": "uuid",
    "long_term_goal_id": "uuid",
    "milestone_id": "uuid",
    "week_number": 3,
    "title": "Complete authentication and authorization",
    "description": "Implement auth with Supabase",
    "position": 1,
    "created_at": "2025-01-20T10:00:00Z",
    "updated_at": "2025-01-22T14:15:00Z"
  }
}
```

**400 Bad Request (No fields):**
```json
{
  "error": "Validation failed",
  "message": "At least one field must be provided for update"
}
```

---

### 4.5. DELETE /api/v1/weekly-goals/:id

**200 OK:**
```json
{
  "message": "Weekly goal deleted successfully"
}
```

---

## 5. Przepływ danych

### 5.1. GET /api/v1/weekly-goals (Lista)

```
1. Client Request
   └─> GET /api/v1/weekly-goals?plan_id={uuid}&week_number=3&milestone_id={uuid}

2. API Route (/src/pages/api/v1/weekly-goals/index.ts)
   ├─> Extract DEFAULT_USER_ID
   ├─> Parse query parameters
   ├─> Validate with WeeklyGoalListQuerySchema
   └─> Call WeeklyGoalService.listWeeklyGoals(params, userId)

3. WeeklyGoalService
   ├─> Verify plan exists and belongs to user (via PlanService)
   ├─> Query weekly_goals table with filters
   │   └─> .eq('plan_id', planId)
   │   └─> .eq('week_number', weekNumber) [if provided]
   │   └─> .eq('long_term_goal_id', goalId) [if provided]
   │   └─> .eq('milestone_id', milestoneId) [if provided]
   │   └─> .order('position', { ascending: true })
   │   └─> .limit() and .offset() for pagination
   └─> Return WeeklyGoalDTO[]

4. API Route
   └─> Return 200 with ListResponse<WeeklyGoalDTO>
```

### 5.2. GET /api/v1/weekly-goals/:id (Szczegóły)

```
1. Client Request
   └─> GET /api/v1/weekly-goals/{uuid}

2. API Route (/src/pages/api/v1/weekly-goals/[id].ts)
   ├─> Extract DEFAULT_USER_ID
   ├─> Parse and validate :id parameter
   └─> Call WeeklyGoalService.getWeeklyGoalWithSubtasks(id, userId)

3. WeeklyGoalService
   ├─> Query weekly_goals with plan ownership check
   │   └─> Join with plans (inner join)
   │   └─> Filter by user_id
   ├─> If not found: return null
   ├─> Query tasks table for subtasks
   │   └─> .eq('weekly_goal_id', weeklyGoalId)
   │   └─> .eq('task_type', 'weekly_sub')
   │   └─> Select only: id, title, priority, status
   │   └─> .order('position')
   └─> Return WeeklyGoalWithSubtasksDTO

4. API Route
   ├─> If null: return 404
   └─> Return 200 with ItemResponse<WeeklyGoalWithSubtasksDTO>
```

### 5.3. POST /api/v1/weekly-goals (Tworzenie)

```
1. Client Request
   └─> POST /api/v1/weekly-goals
       Body: { plan_id, week_number, title, milestone_id, ... }

2. API Route (/src/pages/api/v1/weekly-goals/index.ts)
   ├─> Extract DEFAULT_USER_ID
   ├─> Parse request body
   ├─> Validate with CreateWeeklyGoalBodySchema
   └─> Call WeeklyGoalService.createWeeklyGoal(userId, data)

3. WeeklyGoalService
   ├─> Verify plan exists and belongs to user (via PlanService)
   ├─> If long_term_goal_id provided:
   │   └─> Verify goal exists and belongs to same plan
   ├─> If milestone_id provided:
   │   ├─> Verify milestone exists
   │   ├─> Get milestone's long_term_goal_id from database
   │   └─> Verify milestone's goal belongs to same plan
   ├─> Prepare WeeklyGoalInsert data
   ├─> Insert into weekly_goals table
   │   └─> Database auto-generates: id, created_at, updated_at
   └─> Return WeeklyGoalDTO

4. API Route
   └─> Return 201 with ItemResponse<WeeklyGoalDTO>
```

### 5.4. PATCH /api/v1/weekly-goals/:id (Aktualizacja)

```
1. Client Request
   └─> PATCH /api/v1/weekly-goals/{uuid}
       Body: { title: "New title", milestone_id: "uuid" }

2. API Route (/src/pages/api/v1/weekly-goals/[id].ts)
   ├─> Extract DEFAULT_USER_ID
   ├─> Parse :id parameter
   ├─> Parse request body
   ├─> Validate with UpdateWeeklyGoalBodySchema
   ├─> Ensure at least one field provided
   └─> Call WeeklyGoalService.updateWeeklyGoal(id, userId, data)

3. WeeklyGoalService
   ├─> Verify weekly goal exists and belongs to user
   ├─> Get current weekly goal data (including plan_id)
   ├─> If long_term_goal_id changed and not null:
   │   └─> Verify new goal exists and belongs to same plan
   ├─> If milestone_id changed and not null:
   │   ├─> Verify new milestone exists
   │   ├─> Get milestone's long_term_goal_id
   │   └─> Verify milestone's goal belongs to same plan
   ├─> Prepare partial WeeklyGoalUpdate data
   ├─> Update weekly_goals table
   │   └─> Database trigger auto-updates updated_at
   └─> Return updated WeeklyGoalDTO

4. API Route
   ├─> If null: return 404
   └─> Return 200 with ItemResponse<WeeklyGoalDTO>
```

### 5.5. DELETE /api/v1/weekly-goals/:id (Usuwanie)

```
1. Client Request
   └─> DELETE /api/v1/weekly-goals/{uuid}

2. API Route (/src/pages/api/v1/weekly-goals/[id].ts)
   ├─> Extract DEFAULT_USER_ID
   ├─> Parse and validate :id parameter
   └─> Call WeeklyGoalService.deleteWeeklyGoal(id, userId)

3. WeeklyGoalService
   ├─> Verify weekly goal exists and belongs to user
   ├─> Delete from weekly_goals table
   │   └─> Database CASCADE automatically deletes:
   │       └─> All tasks with task_type = 'weekly_sub'
   └─> Return true

4. API Route
   ├─> If false: return 404
   └─> Return 200 with success message
```

---

## 6. Względy bezpieczeństwa

### 6.1. Autentykacja i Autoryzacja (MVP)

**Obecna implementacja:**
- Używa `DEFAULT_USER_ID` z `supabase.client.ts`
- Brak weryfikacji JWT token
- RLS policies wyłączone w bazie danych

**Weryfikacja własności:**
- Wszystkie operacje weryfikują własność przez `plan_id → user_id`
- Service layer sprawdza czy plan należy do użytkownika przed operacjami
- Zapytania używają JOIN z tabelą `plans` i filtrują po `user_id`

### 6.2. Walidacja danych wejściowych

**Zod schemas zapewniają:**
- Walidacja typów (UUID, integer, string)
- Walidacja zakresów (week_number: 1-12, title: 1-255 chars)
- Walidacja wymaganych pól
- Sanityzacja (trim dla stringów)
- Odrzucenie nieznanych pól (.strict() w PATCH)

**Dodatkowa walidacja w service layer:**
- Weryfikacja istnienia powiązanych encji (plan, long_term_goal, milestone)
- Weryfikacja własności przez relacje FK
- **Weryfikacja hierarchii milestone → goal → plan**

### 6.3. Walidacja hierarchii milestone_id

**Problem bezpieczeństwa:**
Użytkownik może próbować podać `milestone_id` należący do:
1. Innego użytkownika (poprzez goal innego użytkownika)
2. Goala, który nie należy do tego samego planu co weekly goal

**Rozwiązanie:**
```typescript
// W WeeklyGoalService.createWeeklyGoal() i updateWeeklyGoal()
if (milestone_id) {
  // 1. Pobierz milestone z bazy
  const milestone = await getMilestoneById(milestone_id);
  if (!milestone) {
    throw new Error('Milestone not found');
  }
  
  // 2. Pobierz long_term_goal należący do milestone
  const goal = await getGoalById(milestone.long_term_goal_id);
  if (!goal) {
    throw new Error('Milestone has invalid goal reference');
  }
  
  // 3. Sprawdź czy goal należy do tego samego planu
  if (goal.plan_id !== weeklyGoal.plan_id) {
    throw new Error('Milestone does not belong to plan');
  }
}
```

### 6.4. Zapobieganie atakom

**SQL Injection:**
- Supabase client używa parametryzowanych zapytań
- Zod walidacja zapewnia poprawne typy

**XSS:**
- Brak renderowania HTML po stronie serwera
- Client-side odpowiedzialny za sanityzację przy wyświetlaniu

**Mass Assignment:**
- Używamy Pick<> types aby ograniczyć modyfikowalne pola
- Strict schema w PATCH odrzuca nieznane pola

**Unauthorized Access:**
- Weryfikacja łańcucha własności: milestone → goal → plan → user
- Weryfikacja przed każdą operacją CREATE/UPDATE/DELETE

### 6.5. Rate Limiting

**Obecna implementacja:**
- Brak rate limiting w MVP

**Przyszła implementacja:**
- Rate limiting na poziomie Astro middleware
- Limity per endpoint (np. 100 req/min dla GET, 20 req/min dla POST)

---

## 7. Obsługa błędów

### 7.1. Scenariusze błędów

| Kod | Scenariusz | Response Body | Trigger |
|-----|-----------|---------------|---------|
| **400** | Niepoprawny JSON | `{ error: "Invalid JSON" }` | Błąd parsowania request.json() |
| **400** | Walidacja query params | `{ error: "Validation failed", details: [...] }` | Zod validation error w query |
| **400** | Walidacja body | `{ error: "Validation failed", details: [...] }` | Zod validation error w body |
| **400** | Brak pól w PATCH | `{ error: "Validation failed", message: "At least one field..." }` | Puste PATCH body |
| **400** | Milestone-Plan mismatch | `{ error: "Validation failed", message: "Milestone does not belong to plan" }` | Milestone należy do goala z innego planu |
| **404** | Plan nie istnieje | `{ error: "Plan not found" }` | Service nie znalazł planu |
| **404** | Goal nie istnieje | `{ error: "Long-term goal not found" }` | Service nie znalazł goal |
| **404** | Milestone nie istnieje | `{ error: "Milestone not found" }` | Service nie znalazł milestone |
| **404** | Weekly goal nie istnieje | `{ error: "Weekly goal not found" }` | Service nie znalazł weekly goal |
| **500** | Błąd bazy danych | `{ error: "Internal server error" }` | Database connection error |
| **500** | Nieoczekiwany błąd | `{ error: "Internal server error" }` | Unhandled exception |

### 7.2. Error Handling Pattern

**Struktura try-catch w route handlers:**

```typescript
export const GET: APIRoute = async ({ locals, request }) => {
  try {
    // Step 1: Authentication
    const userId = DEFAULT_USER_ID;
    
    // Step 2: Parse and validate input
    // ... validation ...
    
    // Step 3: Call service
    try {
      const result = await service.method();
      return new Response(JSON.stringify({ data: result }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (serviceError) {
      // Handle specific service errors (404, 400)
      if (serviceError instanceof Error) {
        if (serviceError.message.includes('not found')) {
          return new Response(
            JSON.stringify({ 
              error: serviceError.message,
              message: 'Resource does not exist or does not belong to user'
            }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (serviceError.message.includes('does not belong')) {
          return new Response(
            JSON.stringify({ 
              error: 'Validation failed',
              message: serviceError.message
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      throw serviceError; // Re-throw for global handler
    }
  } catch (error) {
    // Global error handler
    console.error('Error in route:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### 7.3. Logging Strategy

**Development/MVP:**
- `console.error()` dla wszystkich błędów
- Zawiera endpoint path, error message, stack trace

**Production (future):**
- Structured logging (JSON format)
- Log aggregation service (e.g., Sentry, LogRocket)
- Nie logować sensitive data (tokens, passwords)

---

## 8. Rozważania dotyczące wydajności

### 8.1. Database Queries Optimization

**Indeksy (już istniejące w bazie):**
- `idx_weekly_goals_plan_id` ON (plan_id) - dla filtrowania po planie
- `idx_weekly_goals_week_number` ON (plan_id, week_number) - dla filtrowania po tygodniu
- `idx_weekly_goals_long_term_goal_id` ON (long_term_goal_id) - dla filtrowania po goal
- `idx_weekly_goals_milestone_id` ON (milestone_id) - dla filtrowania po milestone

**Query Optimization:**
- Użycie `.single()` zamiast `.limit(1)` gdzie możliwe
- Użycie `.maybeSingle()` dla optional results (zamiast sprawdzania array length)
- SELECT tylko potrzebnych kolumn dla subtasks (id, title, priority, status)
- Order by position index

### 8.2. Pagination

**GET /api/v1/weekly-goals:**
- Default limit: 50 (rozsądna wartość dla 12-tygodniowego planera)
- Max limit: 100
- Offset-based pagination (wystarczające dla MVP)
- Consider cursor-based pagination dla większych datasets w przyszłości

**Expected dataset sizes:**
- Max ~12 weekly goals per plan (1 per week)
- Pagination bardziej przydatna dla subtasks (max 10 per goal)

### 8.3. N+1 Query Problem

**Problem:**
- GET /api/v1/weekly-goals/:id musi pobrać weekly goal + subtasks
- Weryfikacja milestone wymaga dodatkowych zapytań (milestone → goal → plan)

**Rozwiązanie dla subtasks:**
```typescript
// Option 1: Two queries (current approach - acceptable dla MVP)
const weeklyGoal = await supabase.from('weekly_goals').select().eq('id', id).single();
const subtasks = await supabase.from('tasks').select().eq('weekly_goal_id', id);

// Option 2: Single query with nested select (better performance)
const { data } = await supabase
  .from('weekly_goals')
  .select(`
    *,
    tasks!inner(id, title, priority, status)
  `)
  .eq('id', id)
  .eq('tasks.task_type', 'weekly_sub');
```

**Rozwiązanie dla milestone validation:**
```typescript
// Optymalizacja: Single query z JOINs
const { data } = await supabase
  .from('milestones')
  .select(`
    id,
    long_term_goal_id,
    long_term_goals!inner(id, plan_id)
  `)
  .eq('id', milestone_id)
  .single();

// Teraz mamy milestone + goal + plan_id w jednym zapytaniu
if (data.long_term_goals.plan_id !== weeklyGoal.plan_id) {
  throw new Error('Milestone does not belong to plan');
}
```

### 8.4. Caching Strategy

**MVP (brak cachingu):**
- Direct database queries
- Acceptable dla małych datasets

**Future optimization:**
- Cache active plan ID dla użytkownika (Redis)
- Cache weekly goals dla bieżącego tygodnia
- Cache milestone-goal-plan relationships (rzadko się zmieniają)
- Invalidacja cache przy UPDATE/DELETE
- TTL: 5-10 minut

### 8.5. Response Size

**Minimalizacja rozmiaru:**
- Subtasks zawierają tylko 4 pola (id, title, priority, status)
- Brak zagnieżdżonych relacji w list endpoint
- Pagination limituje rozmiar response

**Estimated sizes:**
- Single weekly goal: ~600 bytes (z milestone_id)
- List of 50 weekly goals: ~30 KB
- Weekly goal with 10 subtasks: ~1.8 KB

---

## 9. Etapy wdrożenia

### Krok 1: Utworzenie Validation Schemas

**Plik:** `src/lib/validation/weekly-goal.validation.ts`

**Zawartość:**
- Import Zod
- `CreateWeeklyGoalBodySchema` z pełną walidacją (zawiera milestone_id)
- `UpdateWeeklyGoalBodySchema` z opcjonalnymi polami (zawiera milestone_id)
- `WeeklyGoalIdParamsSchema` dla URL params
- `WeeklyGoalListQuerySchema` dla query params (zawiera milestone_id filter)
- Helper function `validateUpdateWeeklyGoalCommand` - weryfikuje min. 1 pole
- Export TypeScript types

**Wzorować się na:** `src/lib/validation/goal.validation.ts`

**Pełna implementacja:**

```typescript
import { z } from 'zod';
import type { CreateWeeklyGoalCommand, UpdateWeeklyGoalCommand } from '../types';

// POST body validation
export const CreateWeeklyGoalBodySchema = z.object({
  plan_id: z.string().uuid({ message: 'Invalid plan_id format' }),
  long_term_goal_id: z.string().uuid({ message: 'Invalid long_term_goal_id format' })
    .nullable()
    .optional(),
  milestone_id: z.string().uuid({ message: 'Invalid milestone_id format' })
    .nullable()
    .optional(),
  week_number: z.number().int().min(1).max(12, { message: 'Week number must be between 1 and 12' }),
  title: z.string().trim().min(1, { message: 'Title is required' }).max(255),
  description: z.string().trim().nullable().optional(),
  position: z.number().int().min(1).default(1)
});

// PATCH body validation
export const UpdateWeeklyGoalBodySchema = z.object({
  long_term_goal_id: z.string().uuid({ message: 'Invalid long_term_goal_id format' })
    .nullable()
    .optional(),
  milestone_id: z.string().uuid({ message: 'Invalid milestone_id format' })
    .nullable()
    .optional(),
  title: z.string().trim().min(1, { message: 'Title cannot be empty' }).max(255).optional(),
  description: z.string().nullable().optional(),
  position: z.number().int().min(1).optional()
}).strict();

// URL params validation
export const WeeklyGoalIdParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid weekly goal ID format' })
});

// Query params validation
export const WeeklyGoalListQuerySchema = z.object({
  plan_id: z.string().uuid({ message: 'Invalid plan_id format' }),
  week_number: z.coerce.number().int().min(1).max(12).optional(),
  long_term_goal_id: z.string().uuid({ message: 'Invalid long_term_goal_id format' }).optional(),
  milestone_id: z.string().uuid({ message: 'Invalid milestone_id format' }).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

// Type exports
export type CreateWeeklyGoalBody = z.infer<typeof CreateWeeklyGoalBodySchema>;
export type UpdateWeeklyGoalBody = z.infer<typeof UpdateWeeklyGoalBodySchema>;
export type WeeklyGoalIdParams = z.infer<typeof WeeklyGoalIdParamsSchema>;
export type WeeklyGoalListQuery = z.infer<typeof WeeklyGoalListQuerySchema>;

/**
 * Validates that update command has at least one field
 * @throws Error if no fields provided
 */
export function validateUpdateWeeklyGoalCommand(data: UpdateWeeklyGoalCommand): void {
  const hasFields = Object.keys(data).length > 0;
  if (!hasFields) {
    throw new Error('At least one field must be provided for update');
  }
}
```

---

### Krok 2: Utworzenie Service Layer

**Plik:** `src/lib/services/weekly-goal.service.ts`

**Klasa:** `WeeklyGoalService`

**Metody do implementacji:**

1. **createWeeklyGoal(userId: string, data: CreateWeeklyGoalCommand): Promise<WeeklyGoalDTO>**
   - Weryfikacja istnienia planu (via PlanService.getPlanById)
   - Weryfikacja long_term_goal_id jeśli podany (via GoalService.getGoalById)
   - Sprawdzenie czy goal należy do tego samego planu
   - **Weryfikacja milestone_id jeśli podany:**
     - Pobierz milestone z long_term_goal_id
     - Sprawdź czy goal milestone'a należy do tego samego planu
   - Przygotowanie WeeklyGoalInsert
   - Insert do bazy
   - Obsługa constraint violations
   - Zwrot WeeklyGoalDTO

2. **getWeeklyGoalById(id: string, userId: string): Promise<WeeklyGoalDTO | null>**
   - Query z JOIN do plans
   - Filter po user_id
   - Return null jeśli nie znaleziono
   - Remove nested plans data przed return

3. **getWeeklyGoalWithSubtasks(id: string, userId: string): Promise<WeeklyGoalWithSubtasksDTO | null>**
   - Wywołaj getWeeklyGoalById
   - Jeśli null, return null
   - Query tasks where weekly_goal_id = id AND task_type = 'weekly_sub'
   - Select tylko: id, title, priority, status
   - Order by position
   - Combine weekly goal + subtasks
   - Return WeeklyGoalWithSubtasksDTO

4. **listWeeklyGoals(params: WeeklyGoalListParams, userId: string): Promise<WeeklyGoalDTO[]>**
   - Weryfikacja planu (via PlanService)
   - Query builder z filters:
     - .eq('plan_id', params.plan_id)
     - .eq('week_number', params.week_number) jeśli podany
     - .eq('long_term_goal_id', params.long_term_goal_id) jeśli podany
     - **.eq('milestone_id', params.milestone_id) jeśli podany**
   - Pagination: .range(offset, offset + limit - 1)
   - Order by position ASC
   - Return array

5. **updateWeeklyGoal(id: string, userId: string, data: UpdateWeeklyGoalCommand): Promise<WeeklyGoalDTO | null>**
   - Weryfikacja istnienia (via getWeeklyGoalById)
   - Jeśli null, return null
   - Get current weekly goal's plan_id
   - Jeśli long_term_goal_id zmieniony i nie null:
     - Weryfikacja nowego goala
     - Sprawdzenie czy należy do tego samego planu
   - **Jeśli milestone_id zmieniony i nie null:**
     - Weryfikacja nowego milestone
     - Sprawdzenie czy milestone's goal należy do tego samego planu
   - Prepare partial WeeklyGoalUpdate
   - Update query
   - Return updated DTO

6. **deleteWeeklyGoal(id: string, userId: string): Promise<boolean>**
   - Weryfikacja istnienia (via getWeeklyGoalById)
   - Jeśli null, return false
   - Delete query (CASCADE usuwa subtasks)
   - Return true

7. **Helper: validateMilestoneInPlan(milestoneId: string, planId: string): Promise<void>**
   - **Nowa metoda pomocnicza**
   - Pobierz milestone z bazy z JOIN do long_term_goals
   - Sprawdź czy goal należy do podanego planu
   - Throw error jeśli walidacja nie przejdzie

**Wzorować się na:** `src/lib/services/goal.service.ts` i `src/lib/services/milestone.service.ts`

**Dependencies:**
- Import PlanService for plan verification
- Import GoalService for long_term_goal verification
- Import MilestoneService for milestone operations
- Import types from types.ts

**Przykładowa implementacja kluczowych fragmentów:**

```typescript
import { supabaseClient } from '../../db/supabase.client';
import type { 
  WeeklyGoalDTO, 
  WeeklyGoalWithSubtasksDTO,
  CreateWeeklyGoalCommand, 
  UpdateWeeklyGoalCommand,
  WeeklyGoalListParams 
} from '../../types';
import { PlanService } from './plan.service';
import { GoalService } from './goal.service';
import { MilestoneService } from './milestone.service';

export class WeeklyGoalService {
  /**
   * Validates that milestone belongs to a goal in the specified plan
   * @throws Error if validation fails
   */
  private async validateMilestoneInPlan(
    milestoneId: string, 
    planId: string
  ): Promise<void> {
    // Query milestone with its goal's plan_id
    const { data, error } = await supabaseClient
      .from('milestones')
      .select(`
        id,
        long_term_goal_id,
        long_term_goals!inner(id, plan_id)
      `)
      .eq('id', milestoneId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      throw new Error('Milestone not found');
    }

    // Type assertion since Supabase doesn't infer nested types perfectly
    const milestone = data as unknown as {
      id: string;
      long_term_goal_id: string;
      long_term_goals: { id: string; plan_id: string };
    };

    if (milestone.long_term_goals.plan_id !== planId) {
      throw new Error('Milestone does not belong to a goal in the specified plan');
    }
  }

  /**
   * Creates a new weekly goal
   */
  async createWeeklyGoal(
    userId: string,
    data: CreateWeeklyGoalCommand
  ): Promise<WeeklyGoalDTO> {
    // 1. Verify plan exists and belongs to user
    const plan = await PlanService.getPlanById(data.plan_id, userId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    // 2. Verify long_term_goal if provided
    if (data.long_term_goal_id) {
      const goal = await GoalService.getGoalById(data.long_term_goal_id, userId);
      if (!goal) {
        throw new Error('Long-term goal not found');
      }
      if (goal.plan_id !== data.plan_id) {
        throw new Error('Long-term goal does not belong to the specified plan');
      }
    }

    // 3. Verify milestone if provided
    if (data.milestone_id) {
      await this.validateMilestoneInPlan(data.milestone_id, data.plan_id);
    }

    // 4. Insert weekly goal
    const { data: weeklyGoal, error } = await supabaseClient
      .from('weekly_goals')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create weekly goal: ${error.message}`);
    }

    return weeklyGoal;
  }

  /**
   * Updates an existing weekly goal
   */
  async updateWeeklyGoal(
    id: string,
    userId: string,
    data: UpdateWeeklyGoalCommand
  ): Promise<WeeklyGoalDTO | null> {
    // 1. Verify weekly goal exists and get current data
    const existingGoal = await this.getWeeklyGoalById(id, userId);
    if (!existingGoal) {
      return null;
    }

    // 2. Verify long_term_goal if changed
    if (data.long_term_goal_id !== undefined && data.long_term_goal_id !== null) {
      const goal = await GoalService.getGoalById(data.long_term_goal_id, userId);
      if (!goal) {
        throw new Error('Long-term goal not found');
      }
      if (goal.plan_id !== existingGoal.plan_id) {
        throw new Error('Long-term goal does not belong to the same plan');
      }
    }

    // 3. Verify milestone if changed
    if (data.milestone_id !== undefined && data.milestone_id !== null) {
      await this.validateMilestoneInPlan(data.milestone_id, existingGoal.plan_id);
    }

    // 4. Update weekly goal
    const { data: updatedGoal, error } = await supabaseClient
      .from('weekly_goals')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update weekly goal: ${error.message}`);
    }

    return updatedGoal;
  }

  /**
   * Lists weekly goals with optional filters
   */
  async listWeeklyGoals(
    params: WeeklyGoalListParams,
    userId: string
  ): Promise<WeeklyGoalDTO[]> {
    // 1. Verify plan
    const plan = await PlanService.getPlanById(params.plan_id, userId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    // 2. Build query
    let query = supabaseClient
      .from('weekly_goals')
      .select('*')
      .eq('plan_id', params.plan_id);

    // Apply filters
    if (params.week_number !== undefined) {
      query = query.eq('week_number', params.week_number);
    }
    if (params.long_term_goal_id) {
      query = query.eq('long_term_goal_id', params.long_term_goal_id);
    }
    if (params.milestone_id) {
      query = query.eq('milestone_id', params.milestone_id);
    }

    // Pagination and ordering
    const { limit = 50, offset = 0 } = params;
    query = query
      .order('position', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list weekly goals: ${error.message}`);
    }

    return data || [];
  }

  // ... pozostałe metody (getWeeklyGoalById, getWeeklyGoalWithSubtasks, deleteWeeklyGoal)
}
```

---

### Krok 3: Implementacja GET /api/v1/weekly-goals (Lista)

**Plik:** `src/pages/api/v1/weekly-goals/index.ts`

**Handler:** `export const GET: APIRoute`

**Implementacja:**
1. Extract DEFAULT_USER_ID
2. Parse query parameters z URL
3. Validate z WeeklyGoalListQuerySchema.safeParse()
4. Obsługa validation errors (400)
5. Call WeeklyGoalService.listWeeklyGoals()
6. Try-catch dla service errors (404 dla plan, 500 dla database)
7. Return 200 z ListResponse<WeeklyGoalDTO>
8. Global error handler (500)

**Headers:**
- `Content-Type: application/json`
- `export const prerender = false`

**Przykładowa implementacja:**

```typescript
import type { APIRoute } from 'astro';
import { DEFAULT_USER_ID } from '../../../db/supabase.client';
import { WeeklyGoalService } from '../../../lib/services/weekly-goal.service';
import { WeeklyGoalListQuerySchema } from '../../../lib/validation/weekly-goal.validation';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const userId = DEFAULT_USER_ID;
    
    // Parse query parameters
    const url = new URL(request.url);
    const rawParams = {
      plan_id: url.searchParams.get('plan_id'),
      week_number: url.searchParams.get('week_number'),
      long_term_goal_id: url.searchParams.get('long_term_goal_id'),
      milestone_id: url.searchParams.get('milestone_id'),
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset')
    };

    // Validate query parameters
    const validation = WeeklyGoalListQuerySchema.safeParse(rawParams);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call service
    const weeklyGoalService = new WeeklyGoalService();
    const data = await weeklyGoalService.listWeeklyGoals(validation.data, userId);

    return new Response(
      JSON.stringify({ data, count: data.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('GET /api/v1/weekly-goals error:', error);
    
    if (error instanceof Error && error.message === 'Plan not found') {
      return new Response(
        JSON.stringify({ 
          error: 'Plan not found',
          message: 'Plan does not exist or does not belong to user'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

---

### Krok 4: Implementacja POST /api/v1/weekly-goals (Tworzenie)

**Plik:** `src/pages/api/v1/weekly-goals/index.ts` (ten sam plik)

**Handler:** `export const POST: APIRoute`

**Implementacja:**
1. Extract DEFAULT_USER_ID
2. Parse request body (try-catch dla JSON parse errors)
3. Validate z CreateWeeklyGoalBodySchema.safeParse()
4. Obsługa validation errors (400)
5. Call WeeklyGoalService.createWeeklyGoal()
6. Try-catch dla specific errors:
   - Plan not found → 404
   - Long-term goal not found → 404
   - **Milestone not found → 404**
   - **Milestone-Plan mismatch → 400**
7. Return 201 z ItemResponse<WeeklyGoalDTO>
8. Global error handler (500)

---

### Krok 5: Implementacja GET /api/v1/weekly-goals/:id (Szczegóły)

**Plik:** `src/pages/api/v1/weekly-goals/[id].ts`

**Handler:** `export const GET: APIRoute`

**Implementacja:**
1. Extract DEFAULT_USER_ID
2. Extract :id z params
3. Validate z WeeklyGoalIdParamsSchema.safeParse()
4. Obsługa validation errors (400)
5. Call WeeklyGoalService.getWeeklyGoalWithSubtasks()
6. Jeśli null → 404
7. Return 200 z ItemResponse<WeeklyGoalWithSubtasksDTO>
8. Global error handler (500)

---

### Krok 6: Implementacja PATCH /api/v1/weekly-goals/:id (Aktualizacja)

**Plik:** `src/pages/api/v1/weekly-goals/[id].ts`

**Handler:** `export const PATCH: APIRoute`

**Implementacja:**
1. Extract DEFAULT_USER_ID
2. Extract :id z params
3. Validate :id z WeeklyGoalIdParamsSchema
4. Parse request body
5. Validate z UpdateWeeklyGoalBodySchema.safeParse()
6. Sprawdzenie min. 1 pole (via validateUpdateWeeklyGoalCommand)
7. Call WeeklyGoalService.updateWeeklyGoal()
8. Try-catch dla specific errors:
   - Weekly goal not found → 404
   - Long-term goal not found (jeśli zmieniony) → 404
   - **Milestone not found (jeśli zmieniony) → 404**
   - **Milestone-Plan mismatch → 400**
9. Return 200 z ItemResponse<WeeklyGoalDTO>
10. Global error handler (500)

---

### Krok 7: Implementacja DELETE /api/v1/weekly-goals/:id (Usuwanie)

**Plik:** `src/pages/api/v1/weekly-goals/[id].ts`

**Handler:** `export const DELETE: APIRoute`

**Implementacja:**
1. Extract DEFAULT_USER_ID
2. Extract :id z params
3. Validate z WeeklyGoalIdParamsSchema
4. Call WeeklyGoalService.deleteWeeklyGoal()
5. Jeśli false → 404
6. Return 200 z SuccessResponse
7. Global error handler (500)

**Response body:**
```json
{
  "message": "Weekly goal deleted successfully"
}
```

---

### Krok 8: Testy manualne (HTTP file)

**Plik:** `api-tests/weekly-goals-tests.http`

**Zawartość:**
- Zmienne środowiskowe (BASE_URL, PLAN_ID, GOAL_ID, MILESTONE_ID)
- Test GET /api/v1/weekly-goals (z różnymi filtrami including milestone_id)
- Test GET /api/v1/weekly-goals/:id
- Test POST /api/v1/weekly-goals (valid + invalid data, including milestone_id)
- Test PATCH /api/v1/weekly-goals/:id (partial update including milestone_id)
- Test DELETE /api/v1/weekly-goals/:id
- Edge cases:
  - Invalid UUID formats
  - Missing required fields
  - Out of range values (week_number: 0, 13)
  - Non-existent IDs
  - Empty PATCH body
  - **Milestone from different plan (should fail with 400)**
  - **Milestone from different user (should fail with 404)**

**Wzorować się na:** `api-tests/post-goals-tests.http` i `api-tests/milestones-tests.http`

**Przykładowe testy dla milestone_id:**

```http
### Create weekly goal with milestone_id
POST {{BASE_URL}}/api/v1/weekly-goals
Content-Type: application/json

{
  "plan_id": "{{PLAN_ID}}",
  "long_term_goal_id": "{{GOAL_ID}}",
  "milestone_id": "{{MILESTONE_ID}}",
  "week_number": 3,
  "title": "Complete authentication system",
  "description": "Implement auth with Supabase",
  "position": 1
}

### Filter weekly goals by milestone_id
GET {{BASE_URL}}/api/v1/weekly-goals?plan_id={{PLAN_ID}}&milestone_id={{MILESTONE_ID}}

### Update weekly goal - change milestone_id
PATCH {{BASE_URL}}/api/v1/weekly-goals/{{WEEKLY_GOAL_ID}}
Content-Type: application/json

{
  "milestone_id": "{{NEW_MILESTONE_ID}}"
}

### NEGATIVE TEST: Create with milestone from different plan (should fail)
POST {{BASE_URL}}/api/v1/weekly-goals
Content-Type: application/json

{
  "plan_id": "{{PLAN_ID}}",
  "milestone_id": "{{MILESTONE_FROM_OTHER_PLAN}}",
  "week_number": 3,
  "title": "This should fail"
}
```

---

### Krok 9: Dokumentacja i Cleanup

1. **Dodaj JSDoc comments** do wszystkich funkcji w service (szczególnie validateMilestoneInPlan)
2. **Code review** - sprawdzenie wzorców z istniejącymi endpointami
3. **Linter check** - uruchomienie ESLint
4. **Update API docs** jeśli potrzeba doprecyzowania
5. **Git commit** z opisowym message

---

## 10. Potencjalne problemy i rozwiązania

### Problem 1: Weryfikacja long_term_goal_id

**Problem:** Czy long_term_goal musi należeć do tego samego planu co weekly goal?

**Rozwiązanie:** TAK - dodać weryfikację w createWeeklyGoal i updateWeeklyGoal:
```typescript
if (data.long_term_goal_id) {
  const goal = await goalService.getGoalById(data.long_term_goal_id, userId);
  if (!goal || goal.plan_id !== data.plan_id) {
    throw new Error('Long-term goal not found or does not belong to plan');
  }
}
```

### Problem 2: Weryfikacja milestone_id (NOWY)

**Problem:** Czy milestone musi należeć do goala w tym samym planie co weekly goal?

**Rozwiązanie:** TAK - kluczowa weryfikacja bezpieczeństwa:
```typescript
if (data.milestone_id) {
  // Pobierz milestone z jego goalem
  const milestone = await getMilestoneWithGoal(data.milestone_id);
  if (!milestone) {
    throw new Error('Milestone not found');
  }
  
  // Sprawdź czy goal milestone'a należy do tego samego planu
  if (milestone.long_term_goals.plan_id !== weeklyGoal.plan_id) {
    throw new Error('Milestone does not belong to a goal in the specified plan');
  }
}
```

**Dlaczego to jest ważne:**
- Zapobiega linkowaniu milestone'ów z innych planów użytkownika
- Zapobiega linkowaniu milestone'ów z planów innych użytkowników
- Utrzymuje spójność hierarchii: plan → goal → milestone → weekly_goal

### Problem 3: Niezależność milestone i long_term_goal

**Problem:** Czy weekly goal może mieć milestone z innego goala niż podany long_term_goal_id?

**Rozwiązanie:** TAK - to jest dozwolone zgodnie z API specification:
- Weekly goal może mieć `long_term_goal_id = goalA` i `milestone_id` z goalB
- Oba goale muszą należeć do tego samego planu
- Daje to elastyczność w organizacji pracy

**Przykład użycia:**
```json
{
  "plan_id": "plan-1",
  "long_term_goal_id": "goal-A",  // "Launch MVP"
  "milestone_id": "milestone-B1",  // z "goal-B" (Infrastructure)
  "title": "Setup CI/CD for MVP launch"
}
```

### Problem 4: Kolejność position

**Problem:** Czy position musi być unikalny w obrębie tygodnia?

**Rozwiązanie:** NIE - position to tylko sugestia kolejności wyświetlania. Duplikaty są dopuszczalne. Database nie ma UNIQUE constraint.

### Problem 5: Subtasks query performance

**Problem:** Czy fetching subtasks dla GET :id może być wolny?

**Rozwiązanie:** 
- Max 10 subtasks per weekly goal (constraint)
- Index na weekly_goal_id już istnieje
- SELECT tylko 4 kolumny
- Performance powinien być OK dla MVP

### Problem 6: Pagination count

**Problem:** Czy zwracać total count w response?

**Rozwiązanie:** Opcjonalnie - dodać `count` field w ListResponse:
```typescript
const { data, count } = await supabase
  .from('weekly_goals')
  .select('*', { count: 'exact' })
  .eq('plan_id', planId);

return { data, count };
```

### Problem 7: Deleted plan/goal/milestone

**Problem:** Co się stanie jeśli powiązana encja zostanie usunięta?

**Rozwiązanie:** 
- **Plan deleted:** Database CASCADE automatycznie usuwa wszystkie weekly goals
- **Goal deleted:** Database ON DELETE SET NULL ustawia long_term_goal_id na NULL
- **Milestone deleted:** Database ON DELETE SET NULL ustawia milestone_id na NULL
- Weekly goal pozostaje, ale traci powiązania (desired behavior)

### Problem 8: Performance milestone validation

**Problem:** Weryfikacja milestone wymaga dodatkowego JOIN query - czy to nie będzie wolne?

**Rozwiązanie:**
- Query optymalizacja: Single query z JOIN (milestones → long_term_goals)
- Index na milestones.long_term_goal_id już istnieje
- Index na long_term_goals.plan_id już istnieje
- Expected latency: < 10ms
- Wykonywane tylko przy CREATE/UPDATE (nie przy każdym GET)

---

## 11. Future Enhancements (po MVP)

1. **Bulk operations:**
   - POST /api/v1/weekly-goals/bulk - create multiple weekly goals
   - PATCH /api/v1/weekly-goals/reorder - zmiana pozycji wielu goalów

2. **Filtering enhancements:**
   - Search by title (full-text search)
   - Filter by date ranges
   - Filter by completion status (via subtasks progress)
   - **Filter by milestone status (is_completed)**
   - **Combined filters: milestone + goal + week**

3. **Aggregations:**
   - GET /api/v1/weekly-goals/summary - progress summary per week
   - Include subtask completion percentage in list response
   - **Include milestone progress in response**

4. **Real-time updates:**
   - WebSocket subscriptions dla live updates
   - Supabase Realtime channels

5. **Caching:**
   - Redis cache dla active plan weekly goals
   - **Cache milestone-goal-plan relationships**
   - ETags dla conditional requests

6. **Rate limiting:**
   - Per-user rate limits
   - Exponential backoff hints in headers

7. **Validation enhancements:**
   - Validate milestone due_date vs week_number
   - Suggest milestones based on week_number

---

## 12. Checklist przed wdrożeniem

- [ ] Validation schemas utworzone i przetestowane (zawierają milestone_id)
- [ ] Service layer zaimplementowany z pełną obsługą błędów
- [ ] **Metoda validateMilestoneInPlan zaimplementowana i przetestowana**
- [ ] Wszystkie 5 endpointów zaimplementowane (GET list, GET by id, POST, PATCH, DELETE)
- [ ] **Wszystkie endpointy obsługują milestone_id**
- [ ] HTTP test file utworzony z kompletnymi test cases
- [ ] **Testy dla milestone_id (valid, invalid, from other plan)**
- [ ] Manualne testy przeprowadzone (happy path + error cases)
- [ ] Code review wykonany (wzorce zgodne z istniejącymi endpointami)
- [ ] ESLint passed (no errors)
- [ ] JSDoc comments dodane do service methods
- [ ] Error handling przetestowany (400, 404, 500)
- [ ] **Error handling dla milestone validation (400 dla wrong plan, 404 dla not found)**
- [ ] Weryfikacja własności działa poprawnie (plan → user)
- [ ] **Weryfikacja hierarchii działa poprawnie (milestone → goal → plan → user)**
- [ ] Cascade delete testowany (weekly goal → subtasks)
- [ ] **SET NULL testowany (goal/milestone delete → weekly_goal remains)**
- [ ] Foreign key validation testowana (plan_id, long_term_goal_id, milestone_id)

---

## 13. Referencje

### Pliki do konsultacji podczas implementacji:
- `src/lib/services/goal.service.ts` - wzorzec service layer
- `src/lib/services/milestone.service.ts` - wzorzec milestone operations
- `src/lib/validation/goal.validation.ts` - wzorzec validation schemas
- `src/lib/validation/milestone.validation.ts` - wzorzec milestone validation
- `src/pages/api/v1/goals/index.ts` - wzorzec route handlers
- `src/pages/api/v1/goals/[id].ts` - wzorzec param routes
- `src/pages/api/v1/milestones/[milestoneId]/weekly-goals.ts` - przykład milestone relations
- `src/types.ts` - wszystkie typy DTO i Command (już zawiera milestone_id!)
- `docs/db-plan.md` - schema bazy danych (weekly_goals.milestone_id)
- `docs/api/api-plan.md` - pełna specyfikacja API (zawiera milestone_id)

### Kluczowe koncepty:
- Używamy DEFAULT_USER_ID (RLS disabled dla MVP)
- Zawsze weryfikujemy własność przez plan_id → user_id
- **Weryfikujemy hierarchię milestone → goal → plan dla bezpieczeństwa**
- Wszystkie timestamps zarządzane przez database triggers
- Używamy UUID dla wszystkich ID
- Cascade delete dla powiązanych encji (weekly_goals → tasks)
- **SET NULL dla opcjonalnych powiązań (goal/milestone → weekly_goals)**
- Partial updates w PATCH (wszystkie pola opcjonalne)
- **milestone_id i long_term_goal_id są niezależne** (mogą być z różnych goalów w tym samym planie)

### Kluczowe różnice z pierwotnym planem:
1. **Dodano milestone_id** do wszystkich DTOs, Commands i Query Params
2. **Dodano weryfikację hierarchii** milestone → goal → plan
3. **Dodano filtrowanie** po milestone_id w GET list
4. **Dodano nowe error scenariusze** (milestone not found, milestone wrong plan)
5. **Dodano helper method** validateMilestoneInPlan w service layer
6. **Rozszerzono testy** o przypadki z milestone_id

