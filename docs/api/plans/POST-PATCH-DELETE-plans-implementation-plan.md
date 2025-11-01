# API Endpoint Implementation Plan: Plan Management (Create, Update, Delete, Archive)

## 1. Przegląd punktów końcowych

Ten dokument opisuje implementację czterech endpointów REST API do zarządzania planerami 12-tygodniowymi:

1. **POST /api/v1/plans** - Tworzenie nowego planera
2. **PATCH /api/v1/plans/:id** - Aktualizacja planera (nazwa i/lub status)
3. **DELETE /api/v1/plans/:id** - Trwałe usunięcie planera (hard delete)
4. **POST /api/v1/plans/:id/archive** - Archiwizacja planera (soft delete)

Wszystkie endpointy wymagają uwierzytelnienia użytkownika i stosują walidację danych wejściowych oraz weryfikację właściciela zasobu.

---

## 2. Szczegóły żądań

### 2.1. POST /api/v1/plans

**Cel:** Utworzenie nowego 12-tygodniowego planera dla uwierzytelnionego użytkownika.

**Metoda HTTP:** POST

**Struktura URL:** `/api/v1/plans`

**Parametry:**
- **Wymagane (Request Body):**
  - `name` (string): Nazwa planera, 1-255 znaków
  - `start_date` (string): Data rozpoczęcia w formacie ISO 8601 (YYYY-MM-DD), musi być poniedziałkiem

- **Opcjonalne:** Brak

**Request Body:**
```json
{
  "name": "Planner_2025-01-06",
  "start_date": "2025-01-06"
}
```

**Uwagi:**
- `start_date` musi być poniedziałkiem - walidacja wykonywana przez trigger bazodanowy
- `user_id` jest automatycznie przypisywany na podstawie tokenu uwierzytelnienia
- `status` domyślnie ustawiony na `'ready'`
- Aby aktywować planer, należy użyć endpointu PATCH do zmiany statusu na `'active'`
- Gdy planer jest ustawiany na `'active'`, wszystkie inne aktywne planery użytkownika są automatycznie ustawiane na `'ready'` (trigger bazodanowy)
- Pola `created_at` i `updated_at` są automatycznie generowane przez bazę danych

---

### 2.2. PATCH /api/v1/plans/:id

**Cel:** Aktualizacja istniejącego planera (nazwa i/lub status), w tym aktywacja planera.

**Metoda HTTP:** PATCH

**Struktura URL:** `/api/v1/plans/:id`

**Parametry:**
- **Wymagane (URL Path):**
  - `id` (UUID): Identyfikator planera do aktualizacji

- **Opcjonalne (Request Body):**
  - `name` (string): Nowa nazwa planera, 1-255 znaków
  - `status` (string): Nowy status planera ('ready', 'active', 'completed', 'archived')
  - **Przynajmniej jedno z pól musi być podane**

**Request Body (przykłady):**
```json
// Aktualizacja tylko nazwy
{
  "name": "My Q1 2025 Plan"
}

// Aktywacja planera
{
  "status": "active"
}

// Aktualizacja nazwy i statusu jednocześnie
{
  "name": "My Q1 2025 Plan",
  "status": "active"
}
```

**Uwagi:**
- Tylko właściciel planera może go zaktualizować
- Pole `updated_at` jest automatycznie aktualizowane przez trigger bazodanowy
- Nazwa i status mogą być aktualizowane niezależnie
- **Gdy status jest ustawiany na `'active'`, wszystkie inne aktywne planery użytkownika są automatycznie ustawiane na `'ready'`** (trigger bazodanowy zapewnia, że tylko jeden planer może być aktywny)
- Dozwolone przejścia statusów: ready ↔ active, dowolny status → completed, dowolny status → archived
- Inne pola (start_date, user_id) nie mogą być modyfikowane przez ten endpoint

---

### 2.3. DELETE /api/v1/plans/:id

**Cel:** Trwałe usunięcie planera i wszystkich powiązanych danych (hard delete).

**Metoda HTTP:** DELETE

**Struktura URL:** `/api/v1/plans/:id`

**Parametry:**
- **Wymagane (URL Path):**
  - `id` (UUID): Identyfikator planera do usunięcia

- **Opcjonalne:** Brak

**Request Body:** Brak (empty body)

**Uwagi:**
- Tylko właściciel planera może go usunąć
- To jest operacja **hard delete** - trwale usuwa planer i **wszystkie powiązane dane**
- Kaskadowe usuwanie obejmuje:
  - Wszystkie cele długoterminowe (long_term_goals)
  - Wszystkie kamienie milowe (milestones)
  - Wszystkie cele tygodniowe (weekly_goals)
  - Wszystkie zadania (tasks)
  - Historię zadań (task_history)
  - Tygodniowe podsumowania (weekly_reviews)
- **Operacja jest nieodwracalna** - nie ma możliwości przywrócenia usuniętych danych
- Metryki użytkownika (total_plans_created) **nie są** dekrementowane przy usunięciu planera
- Jeśli potrzebujesz opcji odwracalnej, użyj endpointu Archive zamiast Delete

---

### 2.4. POST /api/v1/plans/:id/archive

**Cel:** Archiwizacja planera (zmiana statusu na 'archived', soft delete).

**Metoda HTTP:** POST

**Struktura URL:** `/api/v1/plans/:id/archive`

**Parametry:**
- **Wymagane (URL Path):**
  - `id` (UUID): Identyfikator planera do archiwizacji

- **Opcjonalne:** Brak

**Request Body:** Brak (empty body)

**Uwagi:**
- Tylko właściciel planera może go zarchiwizować
- Archiwizacja zmienia `status` z 'active' lub 'completed' na 'archived'
- Wszystkie powiązane dane (cele, zadania, etc.) pozostają w bazie danych
- Operacja jest odwracalna przez zmianę statusu z powrotem na 'active'

---

## 3. Wykorzystywane typy

### 3.1. DTOs (Data Transfer Objects)

**Z pliku `src/types.ts`:**

```typescript
// Request Command Models
export type CreatePlanCommand = Pick<PlanInsert, 'name' | 'start_date'>;
export type UpdatePlanCommand = Pick<PlanUpdate, 'name' | 'status'>;

// Response DTOs
export type PlanDTO = PlanEntity;

// Response Wrappers
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

// Error Response Types
export interface ValidationErrorResponse {
  error: 'Validation failed';
  details: ValidationErrorDetail[];
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
```

### 3.2. Zod Validation Schemas

**Nowe schematy do dodania w `src/lib/validation/plan.validation.ts`:**

```typescript
/**
 * Request body schema for POST /api/v1/plans
 * Validates plan creation data
 */
export const CreatePlanBodySchema = z.object({
  name: z.string()
    .min(1, { message: 'Name is required' })
    .max(255, { message: 'Name must not exceed 255 characters' })
    .trim(),
  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Start date must be in YYYY-MM-DD format' })
    .refine((date) => {
      // Additional validation: check if date is valid
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, { message: 'Invalid date' })
    // Note: Monday validation is handled by database trigger
});

export type CreatePlanBody = z.infer<typeof CreatePlanBodySchema>;

/**
 * Request body schema for PATCH /api/v1/plans/:id
 * Validates plan update data (both fields optional, but at least one required)
 */
export const UpdatePlanBodySchema = z.object({
  name: z.string()
    .min(1, { message: 'Name must not be empty' })
    .max(255, { message: 'Name must not exceed 255 characters' })
    .trim()
    .optional(),
  status: z.enum(['ready', 'active', 'completed', 'archived'], {
    errorMap: () => ({ message: 'Status must be one of: ready, active, completed, archived' })
  })
    .optional()
}).refine(
  (data) => data.name !== undefined || data.status !== undefined,
  { message: 'At least one field (name or status) must be provided' }
);

export type UpdatePlanBody = z.infer<typeof UpdatePlanBodySchema>;

/**
 * URL parameter schema for endpoints with :id
 * Validates UUID format
 */
export const PlanIdParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid plan ID format' })
});

export type PlanIdParams = z.infer<typeof PlanIdParamsSchema>;
```

---

## 4. Szczegóły odpowiedzi

### 4.1. POST /api/v1/plans

**Success Response (201 Created):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "name": "Planner_2025-01-06",
    "start_date": "2025-01-06",
    "status": "ready",
    "created_at": "2025-01-06T10:00:00Z",
    "updated_at": "2025-01-06T10:00:00Z"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Validation failed, missing required fields, start_date not Monday
- **401 Unauthorized** - Missing or invalid authentication token
- **500 Internal Server Error** - Database error or unexpected server error

---

### 4.2. PATCH /api/v1/plans/:id

**Success Response (200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "name": "My Q1 2025 Plan",
    "start_date": "2025-01-06",
    "status": "active",
    "created_at": "2025-01-06T10:00:00Z",
    "updated_at": "2025-01-10T14:30:00Z"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Invalid data (validation failed, invalid UUID, invalid status value, missing both name and status)
- **401 Unauthorized** - Missing or invalid authentication token
- **404 Not Found** - Plan not found or doesn't belong to user
- **500 Internal Server Error** - Database error or unexpected server error

---

### 4.3. DELETE /api/v1/plans/:id

**Success Response (200 OK):**
```json
{
  "message": "Plan deleted successfully"
}
```

**Error Responses:**
- **400 Bad Request** - Invalid UUID format
- **401 Unauthorized** - Missing or invalid authentication token
- **404 Not Found** - Plan not found or doesn't belong to user
- **500 Internal Server Error** - Database error or unexpected server error

---

### 4.4. POST /api/v1/plans/:id/archive

**Success Response (200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "archived"
  },
  "message": "Plan archived successfully"
}
```

**Error Responses:**
- **400 Bad Request** - Invalid UUID format
- **401 Unauthorized** - Missing or invalid authentication token
- **404 Not Found** - Plan not found or doesn't belong to user
- **500 Internal Server Error** - Database error or unexpected server error

---

## 5. Przepływ danych

### 5.1. POST /api/v1/plans - Create Plan Flow

```
1. Client Request
   └─> POST /api/v1/plans + JSON body

2. API Route Handler (src/pages/api/v1/plans.ts)
   ├─> Extract user_id from authentication (DEFAULT_USER_ID for MVP)
   ├─> Validate request body with CreatePlanBodySchema (Zod)
   │   └─> If invalid: Return 400 with validation errors
   ├─> Call PlanService.createPlan(userId, validatedData)
   │
   └─> 3. Service Layer (src/lib/services/plan.service.ts)
       ├─> Prepare insert data with user_id
       ├─> Execute Supabase insert into 'plans' table
       │   └─> Database triggers validate start_date is Monday
       ├─> Handle database errors
       │   ├─> Check constraint error (start_date not Monday): Return error
       │   └─> Other DB errors: Throw error
       └─> Return created PlanDTO

4. API Route Handler
   ├─> Wrap result in ItemResponse<PlanDTO>
   └─> Return 201 Created + JSON response

5. Client receives response
```

**Database Interaction:**
- Table: `plans`
- Operation: INSERT
- Constraints checked:
  - `user_id` references `auth.users(id)` (FK constraint)
  - `start_date` must be Monday (database trigger)
  - `status` defaults to 'ready'
- Triggers executed:
  - Validate start_date is Monday (raises error if not)
  - Set `created_at` and `updated_at` timestamps

---

### 5.2. PATCH /api/v1/plans/:id - Update Plan Flow

```
1. Client Request
   └─> PATCH /api/v1/plans/:id + JSON body

2. API Route Handler (src/pages/api/v1/plans/[id].ts)
   ├─> Extract user_id from authentication (DEFAULT_USER_ID for MVP)
   ├─> Validate URL parameter :id with PlanIdParamsSchema
   │   └─> If invalid UUID: Return 400 with validation error
   ├─> Validate request body with UpdatePlanBodySchema
   │   ├─> Check at least one field (name or status) is provided
   │   ├─> Validate name if provided (1-255 chars)
   │   ├─> Validate status if provided (ready, active, completed, archived)
   │   └─> If invalid: Return 400 with validation errors
   ├─> Call PlanService.updatePlan(planId, userId, validatedData)
   │
   └─> 3. Service Layer (src/lib/services/plan.service.ts)
       ├─> First check if plan exists and belongs to user
       │   ├─> Query plans table filtered by id AND user_id
       │   └─> If not found: Return null
       ├─> If plan not found: Return null (handler returns 404)
       ├─> Execute Supabase update on 'plans' table
       │   └─> Update provided fields (name and/or status)
       ├─> Database triggers executed:
       │   ├─> Update 'updated_at' timestamp
       │   └─> If status = 'active': Set all other user's active plans to 'ready'
       ├─> Handle database errors
       └─> Return updated PlanDTO

4. API Route Handler
   ├─> If service returned null: Return 404 Not Found
   ├─> Wrap result in ItemResponse<PlanDTO>
   └─> Return 200 OK + JSON response

5. Client receives response
```

**Database Interaction:**
- Table: `plans`
- Operation: UPDATE
- WHERE clause: `id = :planId AND user_id = :userId`
- Fields updated: `name` and/or `status` (based on request body)
- Triggers executed:
  - Update `updated_at` timestamp
  - **Single active plan trigger:** When status is set to 'active', automatically sets all other active plans for the user to 'ready'

**Security Note:** Using AND clause with user_id prevents unauthorized updates to other users' plans.

---

### 5.3. DELETE /api/v1/plans/:id - Delete Plan Flow

```
1. Client Request
   └─> DELETE /api/v1/plans/:id (no body)

2. API Route Handler (src/pages/api/v1/plans/[id].ts)
   ├─> Extract user_id from authentication (DEFAULT_USER_ID for MVP)
   ├─> Validate URL parameter :id with PlanIdParamsSchema
   │   └─> If invalid UUID: Return 400 with validation error
   ├─> Call PlanService.deletePlan(planId, userId)
   │
   └─> 3. Service Layer (src/lib/services/plan.service.ts)
       ├─> First check if plan exists and belongs to user
       │   ├─> Query plans table filtered by id AND user_id
       │   └─> If not found: Return null
       ├─> If plan not found: Return null (handler returns 404)
       ├─> Execute Supabase delete from 'plans' table
       │   └─> WHERE id = :planId AND user_id = :userId
       ├─> Database cascade deletes all related data:
       │   ├─> All long_term_goals (via FK cascade)
       │   ├─> All milestones (via FK cascade from goals)
       │   ├─> All weekly_goals (via FK cascade)
       │   ├─> All tasks (via FK cascade)
       │   ├─> All task_history (via FK cascade from tasks)
       │   └─> All weekly_reviews (via FK cascade)
       ├─> Handle database errors
       └─> Return true (success)

4. API Route Handler
   ├─> If service returned null: Return 404 Not Found
   ├─> Return 200 OK with success message
   └─> Response: { "message": "Plan deleted successfully" }

5. Client receives response
```

**Database Interaction:**
- Table: `plans`
- Operation: DELETE
- WHERE clause: `id = :planId AND user_id = :userId`
- Cascade effects:
  - Foreign key constraints automatically delete all related records
  - CASCADE DELETE on: long_term_goals, milestones, weekly_goals, tasks, task_history, weekly_reviews
  - No data is retained - complete removal from database
- **Warning:** This operation is irreversible

**Security Note:** Using AND clause with user_id prevents unauthorized deletion of other users' plans.

---

### 5.4. POST /api/v1/plans/:id/archive - Archive Plan Flow

```
1. Client Request
   └─> POST /api/v1/plans/:id/archive (empty body)

2. API Route Handler (src/pages/api/v1/plans/[id]/archive.ts)
   ├─> Extract user_id from authentication (DEFAULT_USER_ID for MVP)
   ├─> Validate URL parameter :id with PlanIdParamsSchema
   │   └─> If invalid UUID: Return 400 with validation error
   ├─> Call PlanService.archivePlan(planId, userId)
   │
   └─> 3. Service Layer (src/lib/services/plan.service.ts)
       ├─> First check if plan exists and belongs to user
       │   ├─> Query plans table filtered by id AND user_id
       │   └─> If not found: Return null
       ├─> If plan not found: Return null (handler returns 404)
       ├─> Execute Supabase update on 'plans' table
       │   └─> Set status = 'archived'
       ├─> Database trigger updates 'updated_at' timestamp
       ├─> Handle database errors
       └─> Return updated PlanDTO (full object)

4. API Route Handler
   ├─> If service returned null: Return 404 Not Found
   ├─> Extract id and status from returned PlanDTO
   ├─> Wrap in SuccessResponse with minimal data + message
   └─> Return 200 OK + JSON response

5. Client receives response
```

**Database Interaction:**
- Table: `plans`
- Operation: UPDATE
- WHERE clause: `id = :planId AND user_id = :userId`
- Fields updated: `status` (set to 'archived')
- Triggers executed:
  - Update `updated_at` timestamp

**Cascade Effects:** None - archiving does not delete related data.

---

## 6. Względy bezpieczeństwa

### 6.1. Uwierzytelnianie (Authentication)

**MVP Implementation:**
- Używamy `DEFAULT_USER_ID` z `src/db/supabase.client.ts` dla wszystkich żądań
- W przyszłości: JWT token z Supabase Auth w header `Authorization: Bearer <token>`
- Weryfikacja tokenu będzie odbywała się w Astro middleware (`src/middleware/index.ts`)

**Kod MVP:**
```typescript
// For MVP - using default user
import { DEFAULT_USER_ID } from '../../../db/supabase.client';

export const POST: APIRoute = async ({ locals }) => {
  const userId = DEFAULT_USER_ID;
  // ... rest of implementation
};
```

**Przyszła implementacja (po MVP):**
```typescript
export const POST: APIRoute = async ({ locals }) => {
  // Get user from Supabase session
  const { data: { user }, error } = await locals.supabase.auth.getUser();
  
  if (error || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'Invalid or missing authentication token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  const userId = user.id;
  // ... rest of implementation
};
```

---

### 6.2. Autoryzacja (Authorization)

**Weryfikacja właściciela zasobu:**

Dla endpointów PATCH i POST (archive), które modyfikują istniejące zasoby:

1. **Query filtration:** Zawsze filtruj zapytania przez `user_id`:
   ```typescript
   // W service layer
   const { data, error } = await this.supabase
     .from('plans')
     .select('*')
     .eq('id', planId)
     .eq('user_id', userId)  // ✓ Ensures user owns the plan
     .single();
   ```

2. **Nie używaj RLS policies:** Zgodnie z migracją `20251016120600_disable_all_policies.sql`, wszystkie polityki RLS są wyłączone. Autoryzacja musi być implementowana manualnie w kodzie aplikacji.

3. **Zwróć 404 zamiast 403:** Jeśli plan nie istnieje LUB nie należy do użytkownika, zwróć 404 Not Found (bezpieczeństwo przez niejasność - nie ujawniaj, czy zasób istnieje).

---

### 6.3. Walidacja danych wejściowych

**Wielopoziomowa walidacja:**

1. **Type-level validation (TypeScript):** Typy zapewnione przez `types.ts`
2. **Runtime validation (Zod):** Wszystkie dane wejściowe walidowane przed przekazaniem do service layer
3. **Database constraints:** Dodatkowe sprawdzenia (np. trigger dla start_date)

**Ochrona przed atakami:**
- **SQL Injection:** Supabase używa parameterized queries - zabezpieczone automatycznie
- **XSS:** Walidacja typu string, trim() usuwa białe znaki
- **Length attacks:** Max 255 znaków dla `name`
- **Type confusion:** Zod wymusza poprawne typy danych

**Przykład walidacji:**
```typescript
const CreatePlanBodySchema = z.object({
  name: z.string()
    .min(1, { message: 'Name is required' })
    .max(255, { message: 'Name must not exceed 255 characters' })
    .trim(),  // Remove whitespace
  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Start date must be in YYYY-MM-DD format' })
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, { message: 'Invalid date' })
});
```

---

### 6.4. Ochrona przed nadużyciami

**Rate Limiting (przyszła implementacja):**
- Limit: 100 żądań / 15 minut na użytkownika dla POST endpoints
- Implementacja: Middleware w Astro lub na poziomie reverse proxy (nginx)
- Response: 429 Too Many Requests z header `Retry-After`

**Content-Type validation:**
- Akceptuj tylko `Content-Type: application/json`
- Odrzuć inne typy zawartości z 415 Unsupported Media Type

**CORS Headers:**
- Ustaw odpowiednie CORS headers w production
- Ogranicz dozwolone origins do własnej domeny

---

## 7. Obsługa błędów

### 7.1. Hierarchia obsługi błędów

```
1. Validation Errors (400)
   └─> Zod validation fails
       └─> Return ValidationErrorResponse with details

2. Authentication Errors (401)
   └─> Missing or invalid user_id
       └─> Return ErrorResponse

3. Authorization Errors (404)
   └─> Resource not found OR doesn't belong to user
       └─> Return ErrorResponse

4. Business Logic Errors (400)
   └─> Database constraint violation (e.g., start_date not Monday)
       └─> Return ErrorResponse with user-friendly message

5. Database Errors (500)
   └─> Connection issues, unexpected DB errors
       └─> Log full error server-side
       └─> Return generic ErrorResponse to client

6. Unexpected Errors (500)
   └─> Unhandled exceptions
       └─> Catch in try-catch at route level
       └─> Log error
       └─> Return generic ErrorResponse
```

---

### 7.2. Szczegółowa obsługa błędów dla każdego endpointu

#### POST /api/v1/plans

| Scenariusz błędu | Kod HTTP | Response Body | Przykład |
|-----------------|----------|---------------|----------|
| Brak pola `name` | 400 | ValidationErrorResponse | `{"error":"Validation failed","details":[{"field":"name","message":"Name is required"}]}` |
| `name` > 255 znaków | 400 | ValidationErrorResponse | `{"error":"Validation failed","details":[{"field":"name","message":"Name must not exceed 255 characters"}]}` |
| Brak pola `start_date` | 400 | ValidationErrorResponse | `{"error":"Validation failed","details":[{"field":"start_date","message":"Required"}]}` |
| Nieprawidłowy format daty | 400 | ValidationErrorResponse | `{"error":"Validation failed","details":[{"field":"start_date","message":"Start date must be in YYYY-MM-DD format"}]}` |
| `start_date` nie jest poniedziałkiem | 400 | ErrorResponse | `{"error":"Constraint violation","message":"Start date must be a Monday"}` |
| Brak uwierzytelnienia (przyszłość) | 401 | ErrorResponse | `{"error":"Unauthorized","message":"Invalid or missing authentication token"}` |
| Błąd bazy danych | 500 | ErrorResponse | `{"error":"Internal server error","message":"An unexpected error occurred"}` |

**Przykład kodu:**
```typescript
// Handle database constraint errors
if (error.code === '23514') {  // CHECK constraint violation
  if (error.message.includes('start_date')) {
    return new Response(
      JSON.stringify({
        error: 'Constraint violation',
        message: 'Start date must be a Monday'
      } as ErrorResponse),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

---

#### PATCH /api/v1/plans/:id

| Scenariusz błędu | Kod HTTP | Response Body | Przykład |
|-----------------|----------|---------------|----------|
| Nieprawidłowy format UUID | 400 | ValidationErrorResponse | `{"error":"Validation failed","details":[{"field":"id","message":"Invalid plan ID format"}]}` |
| Brak pola `name` i `status` w body | 400 | ValidationErrorResponse | `{"error":"Validation failed","details":[{"message":"At least one field (name or status) must be provided"}]}` |
| Puste pole `name` | 400 | ValidationErrorResponse | `{"error":"Validation failed","details":[{"field":"name","message":"Name must not be empty"}]}` |
| `name` > 255 znaków | 400 | ValidationErrorResponse | `{"error":"Validation failed","details":[{"field":"name","message":"Name must not exceed 255 characters"}]}` |
| Nieprawidłowa wartość `status` | 400 | ValidationErrorResponse | `{"error":"Validation failed","details":[{"field":"status","message":"Status must be one of: ready, active, completed, archived"}]}` |
| Brak uwierzytelnienia (przyszłość) | 401 | ErrorResponse | `{"error":"Unauthorized","message":"Invalid or missing authentication token"}` |
| Plan nie istnieje LUB nie należy do użytkownika | 404 | ErrorResponse | `{"error":"Not found","message":"Plan not found"}` |
| Błąd bazy danych | 500 | ErrorResponse | `{"error":"Internal server error","message":"An unexpected error occurred"}` |

**Przykład kodu:**
```typescript
// Check if plan was found and belongs to user
const plan = await planService.updatePlan(planId, userId, validatedData);

if (!plan) {
  return new Response(
    JSON.stringify({
      error: 'Not found',
      message: 'Plan not found'
    } as ErrorResponse),
    { status: 404, headers: { 'Content-Type': 'application/json' } }
  );
}
```

---

#### DELETE /api/v1/plans/:id

| Scenariusz błędu | Kod HTTP | Response Body | Przykład |
|-----------------|----------|---------------|----------|
| Nieprawidłowy format UUID | 400 | ValidationErrorResponse | `{"error":"Validation failed","details":[{"field":"id","message":"Invalid plan ID format"}]}` |
| Brak uwierzytelnienia (przyszłość) | 401 | ErrorResponse | `{"error":"Unauthorized","message":"Invalid or missing authentication token"}` |
| Plan nie istnieje LUB nie należy do użytkownika | 404 | ErrorResponse | `{"error":"Not found","message":"Plan not found"}` |
| Błąd bazy danych | 500 | ErrorResponse | `{"error":"Internal server error","message":"An unexpected error occurred"}` |

**Przykład kodu:**
```typescript
// Check if plan was found and belongs to user
const success = await planService.deletePlan(planId, userId);

if (!success) {
  return new Response(
    JSON.stringify({
      error: 'Not found',
      message: 'Plan not found'
    } as ErrorResponse),
    { status: 404, headers: { 'Content-Type': 'application/json' } }
  );
}
```

---

#### POST /api/v1/plans/:id/archive

| Scenariusz błędu | Kod HTTP | Response Body | Przykład |
|-----------------|----------|---------------|----------|
| Nieprawidłowy format UUID | 400 | ValidationErrorResponse | `{"error":"Validation failed","details":[{"field":"id","message":"Invalid plan ID format"}]}` |
| Brak uwierzytelnienia (przyszłość) | 401 | ErrorResponse | `{"error":"Unauthorized","message":"Invalid or missing authentication token"}` |
| Plan nie istnieje LUB nie należy do użytkownika | 404 | ErrorResponse | `{"error":"Not found","message":"Plan not found"}` |
| Błąd bazy danych | 500 | ErrorResponse | `{"error":"Internal server error","message":"An unexpected error occurred"}` |

---

### 7.3. Logowanie błędów

**Server-side logging:**
```typescript
try {
  // ... endpoint logic
} catch (error) {
  // Log full error details server-side
  console.error('Error in POST /api/v1/plans:', error);
  
  // Log additional context
  console.error('User ID:', userId);
  console.error('Request data:', JSON.stringify(requestData));
  
  // Return generic error to client (don't expose internals)
  return new Response(
    JSON.stringify({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    } as ErrorResponse),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**Przyszłe ulepszenia:**
- Integracja z systemem monitorowania (np. Sentry)
- Structured logging (np. Winston, Pino)
- Error tracking dashboard
- Alert notifications dla critical errors

---

## 8. Rozważania dotyczące wydajności

### 8.1. Optymalizacje zapytań bazodanowych

**Single-record operations:**
- CREATE: O(1) - pojedyncza operacja INSERT
- UPDATE: O(1) - UPDATE z WHERE id = ... (primary key lookup)
- ARCHIVE: O(1) - UPDATE z WHERE id = ... (primary key lookup)

**Indeksy wykorzystywane:**
- `plans.id` (PRIMARY KEY) - bardzo szybkie wyszukiwanie
- `plans.user_id` (idx_plans_user_id) - filtrowanie po właścicielu
- `plans.status` (idx_plans_status) - przyszłe filtry

**Connection pooling:**
- Supabase automatycznie zarządza connection pooling
- Nie ma potrzeby ręcznej konfiguracji dla MVP

---

### 8.2. Walidacja i serializacja

**Koszty walidacji Zod:**
- Zod.parse(): ~0.1-0.5ms dla prostych schematów
- Nakład minimalny w porównaniu do I/O bazy danych
- Bezpieczeństwo > koszt wydajności

**JSON serialization:**
- Native JSON.stringify() jest wystarczająco szybki
- Unikaj głęboko zagnieżdżonych obiektów (nie dotyczy tych endpointów)

---

### 8.3. Caching strategies (przyszła implementacja)

**Nie implementować na MVP:**
- Planery są często modyfikowane - cache invalidation complexity
- Pojedyncze operacje są już bardzo szybkie

**Przyszłe możliwości:**
- Cache user's active plan (GET /api/v1/plans/active)
- Cache plan lists z TTL 5 minut
- Invalidate cache po CREATE/UPDATE/ARCHIVE

---

### 8.4. Rate limiting i throttling

**Strategie ochrony:**
- Limit 100 req/15min per user dla POST/PATCH endpoints
- Implementacja na poziomie middleware lub reverse proxy
- Użycie Redis dla distributed rate limiting (przyszłość)

---

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie - Rozszerzenie walidacji

**Plik:** `src/lib/validation/plan.validation.ts`

**Zadanie:** Dodaj nowe schematy walidacji Zod

```typescript
/**
 * Request body schema for POST /api/v1/plans
 */
export const CreatePlanBodySchema = z.object({
  name: z.string()
    .min(1, { message: 'Name is required' })
    .max(255, { message: 'Name must not exceed 255 characters' })
    .trim(),
  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Start date must be in YYYY-MM-DD format' })
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, { message: 'Invalid date' })
});

export type CreatePlanBody = z.infer<typeof CreatePlanBodySchema>;

/**
 * Request body schema for PATCH /api/v1/plans/:id
 */
export const UpdatePlanBodySchema = z.object({
  name: z.string()
    .min(1, { message: 'Name is required' })
    .max(255, { message: 'Name must not exceed 255 characters' })
    .trim()
});

export type UpdatePlanBody = z.infer<typeof UpdatePlanBodySchema>;

/**
 * URL parameter schema for :id endpoints
 */
export const PlanIdParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid plan ID format' })
});

export type PlanIdParams = z.infer<typeof PlanIdParamsSchema>;
```

**Test:** Zweryfikuj, że schematy są poprawnie exportowane i importowane.

---

### Krok 2: Rozszerzenie Service Layer

**Plik:** `src/lib/services/plan.service.ts`

**Zadanie:** Dodaj 3 nowe metody do PlanService class

#### 2.1. createPlan()

```typescript
/**
 * Tworzy nowy 12-tygodniowy planer
 * 
 * @param userId - ID użytkownika (z tokenu JWT)
 * @param data - Dane planera (name, start_date)
 * @returns Promise z utworzonym planerem
 * @throws Error jeśli start_date nie jest poniedziałkiem (constraint violation)
 * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
 */
async createPlan(
  userId: string,
  data: CreatePlanCommand
): Promise<PlanDTO> {
  // Prepare insert data with user_id
  const insertData: PlanInsert = {
    user_id: userId,
    name: data.name,
    start_date: data.start_date,
    status: 'ready' // Default status
  };

  // Execute insert
  const { data: plan, error } = await this.supabase
    .from('plans')
    .insert(insertData)
    .select()
    .single();

  // Handle database errors
  if (error) {
    // Check for constraint violations
    if (error.code === '23514') {  // CHECK constraint
      throw new Error('Start date must be a Monday');
    }
    // Other database errors
    throw new Error(`Failed to create plan: ${error.message}`);
  }

  return plan;
}
```

#### 2.2. updatePlan()

```typescript
/**
 * Aktualizuje istniejący planer (nazwa i/lub status)
 * Weryfikuje, że planer należy do użytkownika
 * 
 * @param planId - UUID planera
 * @param userId - ID użytkownika (z tokenu JWT)
 * @param data - Dane do aktualizacji (name and/or status)
 * @returns Promise z zaktualizowanym planerem lub null jeśli nie istnieje
 * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
 * 
 * @example
 * ```typescript
 * // Update name only
 * const plan = await planService.updatePlan(planId, userId, {
 *   name: 'Updated Q1 2025 Goals'
 * });
 * 
 * // Activate plan
 * const plan = await planService.updatePlan(planId, userId, {
 *   status: 'active'
 * });
 * 
 * // Update both
 * const plan = await planService.updatePlan(planId, userId, {
 *   name: 'My Active Plan',
 *   status: 'active'
 * });
 * ```
 */
async updatePlan(
  planId: string,
  userId: string,
  data: UpdatePlanCommand
): Promise<PlanDTO | null> {
  // First verify plan exists and belongs to user
  const existingPlan = await this.getPlanById(planId, userId);
  
  if (!existingPlan) {
    return null;
  }

  // Prepare update data with provided fields only
  const updateData: PlanUpdate = {};
  
  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  
  if (data.status !== undefined) {
    updateData.status = data.status;
  }
  
  // updated_at is automatically set by database trigger

  // Execute update
  const { data: plan, error } = await this.supabase
    .from('plans')
    .update(updateData)
    .eq('id', planId)
    .eq('user_id', userId)  // Security: ensure user owns the plan
    .select()
    .single();

  // Handle database errors
  if (error) {
    throw new Error(`Failed to update plan: ${error.message}`);
  }

  // Note: If status is set to 'active', database trigger automatically
  // sets all other active plans for this user to 'ready'

  return plan;
}
```

#### 2.3. archivePlan()

```typescript
/**
 * Archiwizuje planer (zmiana statusu na 'archived')
 * Weryfikuje, że planer należy do użytkownika
 * 
 * @param planId - UUID planera
 * @param userId - ID użytkownika (z tokenu JWT)
 * @returns Promise z zarchiwizowanym planerem lub null jeśli nie istnieje
 * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
 */
async archivePlan(
  planId: string,
  userId: string
): Promise<PlanDTO | null> {
  // First verify plan exists and belongs to user
  const existingPlan = await this.getPlanById(planId, userId);
  
  if (!existingPlan) {
    return null;
  }

  // Update status to archived
  const { data: plan, error } = await this.supabase
    .from('plans')
    .update({ status: 'archived' })
    .eq('id', planId)
    .eq('user_id', userId)  // Security: ensure user owns the plan
    .select()
    .single();

  // Handle database errors
  if (error) {
    throw new Error(`Failed to archive plan: ${error.message}`);
  }

  return plan;
}
```

#### 2.4. deletePlan()

```typescript
/**
 * Trwale usuwa planer i wszystkie powiązane dane (hard delete)
 * Weryfikuje, że planer należy do użytkownika
 * 
 * @param planId - UUID planera
 * @param userId - ID użytkownika (z tokenu JWT)
 * @returns Promise z true jeśli usunięto lub null jeśli plan nie istnieje
 * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
 * 
 * @example
 * ```typescript
 * const success = await planService.deletePlan(planId, userId);
 * if (!success) {
 *   // Plan not found or doesn't belong to user
 * }
 * ```
 */
async deletePlan(
  planId: string,
  userId: string
): Promise<boolean> {
  // First verify plan exists and belongs to user
  const existingPlan = await this.getPlanById(planId, userId);
  
  if (!existingPlan) {
    return false;
  }

  // Execute delete - cascade will remove all related data
  const { error } = await this.supabase
    .from('plans')
    .delete()
    .eq('id', planId)
    .eq('user_id', userId);  // Security: ensure user owns the plan

  // Handle database errors
  if (error) {
    throw new Error(`Failed to delete plan: ${error.message}`);
  }

  // Note: Database CASCADE DELETE automatically removes:
  // - long_term_goals, milestones, weekly_goals, tasks, task_history, weekly_reviews

  return true;
}
```

**Test:** Napisz unit testy dla każdej metody z mockami Supabase client.

---

### Krok 3: Implementacja POST /api/v1/plans

**Plik:** `src/pages/api/v1/plans.ts` (rozszerzenie istniejącego pliku)

**Zadanie:** Dodaj handler POST do istniejącego pliku

```typescript
/**
 * POST /api/v1/plans
 * Creates a new 12-week planner
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Step 1: Authentication - Using default user for MVP
    const userId = DEFAULT_USER_ID;

    // Step 2: Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 3: Validate request body
    const validationResult = CreatePlanBodySchema.safeParse(body);

    if (!validationResult.success) {
      const details = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        received: 'input' in issue ? issue.input : undefined
      }));

      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details
        } as ValidationErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 4: Call service to create plan
    const planService = new PlanService(locals.supabase);
    
    try {
      const plan = await planService.createPlan(userId, validationResult.data);

      // Step 5: Return successful response
      return new Response(
        JSON.stringify({ data: plan } as ItemResponse<PlanDTO>),
        {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff'
          }
        }
      );
    } catch (serviceError) {
      // Handle specific service errors
      const errorMessage = serviceError instanceof Error ? serviceError.message : 'Unknown error';
      
      // Check for constraint violations (e.g., start_date not Monday)
      if (errorMessage.includes('Monday')) {
        return new Response(
          JSON.stringify({
            error: 'Constraint violation',
            message: errorMessage
          } as ErrorResponse),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Re-throw for general error handler
      throw serviceError;
    }
  } catch (error) {
    // Global error handler for unexpected errors
    console.error('Error in POST /api/v1/plans:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      } as ErrorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
```

**Dodaj import na początku pliku:**
```typescript
import { 
  CreatePlanBodySchema 
} from '../../../lib/validation/plan.validation';
import type { ItemResponse } from '../../../types';
```

**Test:** 
- Testuj z prawidłowymi danymi (201 Created)
- Testuj z nieprawidłową datą (400)
- Testuj z datą nie-poniedziałek (400)
- Testuj bez pola name (400)

---

### Krok 4: Implementacja PATCH i DELETE /api/v1/plans/:id

**Plik:** `src/pages/api/v1/plans/[id].ts` (nowy plik)

**Zadanie:** Utwórz nowy plik z handlerami GET, PATCH i DELETE

```typescript
/**
 * API Endpoint: /api/v1/plans/:id
 * 
 * GET - Retrieves a single plan by ID
 * PATCH - Updates a plan's name and/or status
 * DELETE - Permanently deletes a plan (hard delete)
 * 
 * Authentication required for all methods.
 */

import type { APIRoute } from 'astro';
import { PlanService } from '../../../../lib/services/plan.service';
import {
  PlanIdParamsSchema,
  UpdatePlanBodySchema
} from '../../../../lib/validation/plan.validation';
import { DEFAULT_USER_ID } from '../../../../db/supabase.client';
import type {
  ErrorResponse,
  ValidationErrorResponse,
  ItemResponse,
  SuccessResponse,
  PlanDTO
} from '../../../../types';

export const prerender = false;

/**
 * GET /api/v1/plans/:id
 * Retrieves a single plan by ID
 */
export const GET: APIRoute = async ({ locals, params }) => {
  try {
    // Step 1: Authentication
    const userId = DEFAULT_USER_ID;

    // Step 2: Validate URL parameter
    const paramValidation = PlanIdParamsSchema.safeParse(params);

    if (!paramValidation.success) {
      const details = paramValidation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        received: 'input' in issue ? issue.input : undefined
      }));

      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details
        } as ValidationErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 3: Call service to fetch plan
    const planService = new PlanService(locals.supabase);
    const plan = await planService.getPlanById(
      paramValidation.data.id,
      userId
    );

    // Step 4: Handle not found
    if (!plan) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'Plan not found'
        } as ErrorResponse),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 5: Return successful response
    return new Response(
      JSON.stringify({ data: plan } as ItemResponse<PlanDTO>),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  } catch (error) {
    console.error('Error in GET /api/v1/plans/:id:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      } as ErrorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * PATCH /api/v1/plans/:id
 * Updates a plan's name and/or status
 */
export const PATCH: APIRoute = async ({ locals, params, request }) => {
  try {
    // Step 1: Authentication
    const userId = DEFAULT_USER_ID;

    // Step 2: Validate URL parameter
    const paramValidation = PlanIdParamsSchema.safeParse(params);

    if (!paramValidation.success) {
      const details = paramValidation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        received: 'input' in issue ? issue.input : undefined
      }));

      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details
        } as ValidationErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 3: Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 4: Validate request body
    const bodyValidation = UpdatePlanBodySchema.safeParse(body);

    if (!bodyValidation.success) {
      const details = bodyValidation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        received: 'input' in issue ? issue.input : undefined
      }));

      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details
        } as ValidationErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 5: Call service to update plan
    const planService = new PlanService(locals.supabase);
    const plan = await planService.updatePlan(
      paramValidation.data.id,
      userId,
      bodyValidation.data
    );

    // Step 6: Handle not found
    if (!plan) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'Plan not found'
        } as ErrorResponse),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 7: Return successful response
    return new Response(
      JSON.stringify({ data: plan } as ItemResponse<PlanDTO>),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  } catch (error) {
    console.error('Error in PATCH /api/v1/plans/:id:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      } as ErrorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * DELETE /api/v1/plans/:id
 * Permanently deletes a plan (hard delete)
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
  try {
    // Step 1: Authentication
    const userId = DEFAULT_USER_ID;

    // Step 2: Validate URL parameter
    const paramValidation = PlanIdParamsSchema.safeParse(params);

    if (!paramValidation.success) {
      const details = paramValidation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        received: 'input' in issue ? issue.input : undefined
      }));

      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details
        } as ValidationErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 3: Call service to delete plan
    const planService = new PlanService(locals.supabase);
    const success = await planService.deletePlan(
      paramValidation.data.id,
      userId
    );

    // Step 4: Handle not found
    if (!success) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'Plan not found'
        } as ErrorResponse),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 5: Return successful response
    return new Response(
      JSON.stringify({
        message: 'Plan deleted successfully'
      } as SuccessResponse),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  } catch (error) {
    console.error('Error in DELETE /api/v1/plans/:id:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      } as ErrorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
```

**Test:**
- GET: Testuj z prawidłowym UUID (200)
- GET: Testuj z nieprawidłowym UUID (400)
- GET: Testuj z nieistniejącym planem (404)
- PATCH: Testuj aktualizację nazwy (200)
- PATCH: Testuj aktywację planera (status: active) (200)
- PATCH: Testuj aktualizację nazwy i statusu jednocześnie (200)
- PATCH: Testuj z pustą nazwą (400)
- PATCH: Testuj z nieprawidłowym statusem (400)
- PATCH: Testuj bez name i status (400)
- PATCH: Testuj z nieistniejącym planem (404)
- DELETE: Testuj usunięcie istniejącego planera (200)
- DELETE: Testuj z nieprawidłowym UUID (400)
- DELETE: Testuj z nieistniejącym planem (404)
- DELETE: Sprawdź, że powiązane dane zostały usunięte (cascade)

---

### Krok 5: Implementacja POST /api/v1/plans/:id/archive

**Plik:** `src/pages/api/v1/plans/[id]/archive.ts` (nowy plik)

**Zadanie:** Utwórz nowy plik z handlerem POST dla archiwizacji

**Struktura katalogów:**
```
src/pages/api/v1/plans/
├── [id].ts          # GET, PATCH
└── [id]/
    └── archive.ts   # POST
```

**Implementacja:**

```typescript
/**
 * API Endpoint: POST /api/v1/plans/:id/archive
 * 
 * Archives a plan (sets status to 'archived').
 * This is a soft delete - all related data remains in the database.
 * 
 * Authentication required.
 */

import type { APIRoute } from 'astro';
import { PlanService } from '../../../../../lib/services/plan.service';
import { PlanIdParamsSchema } from '../../../../../lib/validation/plan.validation';
import { DEFAULT_USER_ID } from '../../../../../db/supabase.client';
import type {
  ErrorResponse,
  ValidationErrorResponse,
  SuccessResponse
} from '../../../../../types';

export const prerender = false;

/**
 * POST /api/v1/plans/:id/archive
 * Archives a plan
 */
export const POST: APIRoute = async ({ locals, params }) => {
  try {
    // Step 1: Authentication
    const userId = DEFAULT_USER_ID;

    // Step 2: Validate URL parameter
    const paramValidation = PlanIdParamsSchema.safeParse(params);

    if (!paramValidation.success) {
      const details = paramValidation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        received: 'input' in issue ? issue.input : undefined
      }));

      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details
        } as ValidationErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 3: Call service to archive plan
    const planService = new PlanService(locals.supabase);
    const plan = await planService.archivePlan(
      paramValidation.data.id,
      userId
    );

    // Step 4: Handle not found
    if (!plan) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'Plan not found'
        } as ErrorResponse),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 5: Return successful response with minimal data
    return new Response(
      JSON.stringify({
        data: {
          id: plan.id,
          status: plan.status
        },
        message: 'Plan archived successfully'
      } as SuccessResponse),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  } catch (error) {
    console.error('Error in POST /api/v1/plans/:id/archive:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      } as ErrorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
```

**Test:**
- POST: Testuj archiwizację istniejącego planu (200)
- POST: Testuj z nieprawidłowym UUID (400)
- POST: Testuj z nieistniejącym planem (404)
- POST: Sprawdź, że status zmienił się na 'archived'
- POST: Sprawdź, że powiązane dane nie zostały usunięte

---

### Krok 6: Testowanie integracyjne

**Narzędzia:**
- REST client (np. Thunder Client, Postman, curl)
- Supabase Studio do weryfikacji danych w bazie

**Test scenarios:**

#### Scenariusz 1: Happy path - Tworzenie i modyfikacja planera

```bash
# 1. Create new plan
curl -X POST http://localhost:4321/api/v1/plans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 2025 Goals",
    "start_date": "2025-01-06"
  }'

# Expected: 201 Created with plan data, status = 'ready'
# Note plan.id from response

# 2. Update plan name
curl -X PATCH http://localhost:4321/api/v1/plans/{plan_id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Q1 2025 Goals"
  }'

# Expected: 200 OK with updated plan data

# 3. Activate plan
curl -X PATCH http://localhost:4321/api/v1/plans/{plan_id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }'

# Expected: 200 OK with status = 'active'

# 4. Get plan by ID
curl http://localhost:4321/api/v1/plans/{plan_id}

# Expected: 200 OK with plan data (updated name, active status)

# 5. Archive plan (soft delete)
curl -X POST http://localhost:4321/api/v1/plans/{plan_id}/archive

# Expected: 200 OK with success message

# 6. Verify archived status
curl http://localhost:4321/api/v1/plans/{plan_id}

# Expected: 200 OK with status = 'archived'

# 7. Create another plan to test hard delete
curl -X POST http://localhost:4321/api/v1/plans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Delete Plan",
    "start_date": "2025-01-13"
  }'

# Expected: 201 Created
# Note new plan.id

# 8. Delete plan permanently (hard delete)
curl -X DELETE http://localhost:4321/api/v1/plans/{new_plan_id}

# Expected: 200 OK with success message

# 9. Try to get deleted plan
curl http://localhost:4321/api/v1/plans/{new_plan_id}

# Expected: 404 Not Found
```

#### Scenariusz 2: Validation errors

```bash
# 1. Create plan with missing name
curl -X POST http://localhost:4321/api/v1/plans \
  -H "Content-Type: application/json" \
  -d '{"start_date": "2025-01-06"}'

# Expected: 400 Bad Request with validation error

# 2. Create plan with non-Monday date
curl -X POST http://localhost:4321/api/v1/plans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Plan",
    "start_date": "2025-01-07"
  }'

# Expected: 400 Bad Request with constraint violation

# 3. Update plan with empty name
curl -X PATCH http://localhost:4321/api/v1/plans/{plan_id} \
  -H "Content-Type: application/json" \
  -d '{"name": ""}'

# Expected: 400 Bad Request with validation error

# 4. Update plan with invalid UUID
curl -X PATCH http://localhost:4321/api/v1/plans/invalid-uuid \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'

# Expected: 400 Bad Request with validation error

# 5. Update plan with invalid status
curl -X PATCH http://localhost:4321/api/v1/plans/{plan_id} \
  -H "Content-Type: application/json" \
  -d '{"status": "invalid_status"}'

# Expected: 400 Bad Request with validation error

# 6. Update plan without name or status
curl -X PATCH http://localhost:4321/api/v1/plans/{plan_id} \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 400 Bad Request with validation error

# 7. Delete plan with invalid UUID
curl -X DELETE http://localhost:4321/api/v1/plans/invalid-uuid

# Expected: 400 Bad Request with validation error
```

#### Scenariusz 3: Not found errors

```bash
# 1. Get non-existent plan
curl http://localhost:4321/api/v1/plans/00000000-0000-0000-0000-000000000000

# Expected: 404 Not Found

# 2. Update non-existent plan
curl -X PATCH http://localhost:4321/api/v1/plans/00000000-0000-0000-0000-000000000000 \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'

# Expected: 404 Not Found

# 3. Archive non-existent plan
curl -X POST http://localhost:4321/api/v1/plans/00000000-0000-0000-0000-000000000000/archive

# Expected: 404 Not Found

# 4. Delete non-existent plan
curl -X DELETE http://localhost:4321/api/v1/plans/00000000-0000-0000-0000-000000000000

# Expected: 404 Not Found
```

---

### Krok 7: Weryfikacja i czyszczenie kodu

**Checklist:**

- [ ] Wszystkie endpointy zwracają poprawne kody statusu HTTP
- [ ] Wszystkie błędy są obsługiwane i logowane
- [ ] Walidacja Zod działa poprawnie dla wszystkich pól
- [ ] Service layer methods są dobrze udokumentowane
- [ ] Nie ma zduplikowanego kodu (DRY principle)
- [ ] Security: weryfikacja właściciela zasobu działa poprawnie
- [ ] Security: używamy `locals.supabase` zamiast importu bezpośredniego
- [ ] Response headers zawierają `Content-Type` i `X-Content-Type-Options`
- [ ] Testy integracyjne przechodzą pomyślnie
- [ ] Kod jest zgodny z linterem (ESLint)
- [ ] TypeScript nie wyświetla błędów kompilacji

**Uruchom:**
```bash
# Check TypeScript errors
npm run build

# Run linter
npm run lint

# Start dev server and test
npm run dev
```

---

### Krok 8: Dokumentacja i przegląd

**Zadania końcowe:**

1. **Aktualizacja dokumentacji API:** Upewnij się, że specyfikacja w `docs/api/` jest zgodna z implementacją

2. **Dodanie przykładów użycia:** Dodaj przykłady curl/fetch do dokumentacji

3. **Code review checklist:**
   - Czy kod jest czytelny i zrozumiały?
   - Czy nazwy zmiennych są opisowe?
   - Czy error messages są przyjazne dla użytkownika?
   - Czy wszystkie edge cases są obsłużone?

4. **Przygotowanie do produkcji:**
   - Zmienić `DEFAULT_USER_ID` na prawdziwą autentykację JWT
   - Skonfigurować rate limiting
   - Skonfigurować monitoring i error tracking
   - Przetestować na środowisku staging

---

## 10. Podsumowanie

Po zaimplementowaniu wszystkich kroków będziesz mieć:

✅ **4 w pełni funkcjonalne endpointy:**
- POST /api/v1/plans - tworzenie planera (status domyślnie 'ready')
- PATCH /api/v1/plans/:id - aktualizacja nazwy i/lub statusu (w tym aktywacja)
- DELETE /api/v1/plans/:id - trwałe usunięcie planera (hard delete)
- POST /api/v1/plans/:id/archive - archiwizacja (soft delete)

✅ **Kompletną warstewkę aplikacji:**
- Validation layer (Zod schemas)
- Service layer (business logic)
- API routes (HTTP handlers)

✅ **Bezpieczeństwo:**
- Walidacja danych wejściowych (Zod)
- Weryfikacja właściciela zasobu (user_id filtering)
- Przyjazne komunikaty błędów
- Kaskadowe usuwanie danych przy DELETE

✅ **Funkcje biznesowe:**
- Domyślny status 'ready' dla nowych planerów
- Aktywacja planera przez PATCH (zmiana statusu na 'active')
- **Single active plan trigger:** Automatyczne ustawienie innych aktywnych planerów na 'ready' przy aktywacji
- Rozróżnienie między hard delete (DELETE) a soft delete (Archive)

✅ **Wydajność:**
- Optymalne zapytania bazodanowe
- Wykorzystanie indeksów
- Minimalna liczba round-trips do DB

✅ **Dokumentację:**
- Ten implementation plan
- Komentarze w kodzie
- Type definitions

---

## 11. Następne kroki (poza MVP)

1. **Implementacja prawdziwej autentykacji:**
   - Zastąpić `DEFAULT_USER_ID` tokenem JWT z Supabase Auth
   - Dodać middleware do weryfikacji tokenu

2. **Rate limiting:**
   - Implementacja na poziomie middleware lub reverse proxy
   - Użycie Redis dla distributed rate limiting

3. **Monitoring i observability:**
   - Integracja z Sentry dla error tracking
   - Structured logging (Winston/Pino)
   - Metryki wydajności (odpowiedzi time, database queries)

4. **Optymalizacje:**
   - Caching dla często odczytywanych danych
   - Database query optimization
   - Response compression (gzip)

5. **Dodatkowe features:**
   - Bulk operations (archive multiple plans)
   - Soft delete z możliwością restore
   - Plan templates
   - Sharing and collaboration

---

**Dokument stworzony:** 2025-01-26  
**Ostatnia aktualizacja:** 2025-10-29  
**Wersja:** 2.0  
**Autor:** AI Architecture Assistant  

**Historia zmian:**
- **v2.0 (2025-10-29):** 
  - Dodano endpoint DELETE dla hard delete
  - Zaktualizowano PATCH do obsługi aktualizacji statusu
  - Zmieniono domyślny status z 'active' na 'ready'
  - Dodano obsługę single active plan trigger
  - Rozszerzono dokumentację o nowy status 'ready'
- **v1.0 (2025-01-26):** Pierwsza wersja dokumentu

