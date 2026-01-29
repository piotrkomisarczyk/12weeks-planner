# API Endpoint Implementation Plan: Weekly Reviews

## 1. Przegląd punktów końcowych

Implementacja 7 endpointów REST API do zarządzania cotygodniowymi podsumowaniami (weekly reviews) w systemie 12-weeks planner. Weekly reviews pozwalają użytkownikom refleksyjnie ocenić każdy tydzień, odpowiadając na 3 kluczowe pytania:

- Co się udało? (what_worked)
- Co się nie udało? (what_did_not_work)
- Co mogę poprawić? (what_to_improve)

**Endpointy:**

1. `GET /api/v1/weekly-reviews` - Lista przeglądów z filtrami
2. `GET /api/v1/weekly-reviews/week/:weekNumber` - Przegląd dla konkretnego tygodnia
3. `GET /api/v1/weekly-reviews/:id` - Konkretny przegląd po ID
4. `POST /api/v1/weekly-reviews` - Tworzenie nowego przeglądu
5. `PATCH /api/v1/weekly-reviews/:id` - Aktualizacja przeglądu (z auto-save)
6. `POST /api/v1/weekly-reviews/:id/complete` - Oznaczenie jako ukończone
7. `DELETE /api/v1/weekly-reviews/:id` - Usunięcie przeglądu

**Kluczowe cechy:**

- Auto-save support dla text fields (mogą być puste podczas tworzenia)
- Unique constraint: jeden review na plan_id + week_number
- is_completed flag do oznaczania wypełnionych przeglądów
- Relacja: weekly_review → plan → user (dla autoryzacji)

---

## 2. Szczegóły żądań

### 2.1 GET /api/v1/weekly-reviews

**Metoda HTTP:** GET  
**URL:** `/api/v1/weekly-reviews`  
**Opis:** Pobiera listę weekly reviews z opcjonalnymi filtrami

**Query Parameters:**

- `plan_id` (required): UUID - ID planera
- `week_number` (optional): integer 1-12 - filtrowanie po tygodniu
- `is_completed` (optional): boolean - filtrowanie po statusie ukończenia
- `limit` (optional): integer 1-100, default: 50
- `offset` (optional): integer >= 0, default: 0

**Response 200 OK:**

```json
{
  "data": [WeeklyReviewDTO[]],
  "count": number
}
```

---

### 2.2 GET /api/v1/weekly-reviews/week/:weekNumber

**Metoda HTTP:** GET  
**URL:** `/api/v1/weekly-reviews/week/:weekNumber`  
**Opis:** Pobiera review dla konkretnego tygodnia w planerze

**URL Parameters:**

- `weekNumber` (required): integer 1-12 - numer tygodnia

**Query Parameters:**

- `plan_id` (required): UUID - ID planera

**Response 200 OK:**

```json
{
  "data": WeeklyReviewDTO
}
```

**Response 404 Not Found:** Gdy review nie istnieje dla tego tygodnia

---

### 2.3 GET /api/v1/weekly-reviews/:id

**Metoda HTTP:** GET  
**URL:** `/api/v1/weekly-reviews/:id`  
**Opis:** Pobiera konkretny review po ID

**URL Parameters:**

- `id` (required): UUID - ID weekly review

**Response 200 OK:**

```json
{
  "data": WeeklyReviewDTO
}
```

---

### 2.4 POST /api/v1/weekly-reviews

**Metoda HTTP:** POST  
**URL:** `/api/v1/weekly-reviews`  
**Opis:** Tworzy nowy weekly review

**Request Body:**

```json
{
  "plan_id": "uuid",
  "week_number": 1-12,
  "what_worked": "string (optional)",
  "what_did_not_work": "string (optional)",
  "what_to_improve": "string (optional)"
}
```

**Validation:**

- `plan_id`: Required, valid UUID
- `week_number`: Required, integer 1-12
- Text fields: Optional (auto-save support)
- Unique constraint: plan_id + week_number

**Response 201 Created:**

```json
{
  "data": WeeklyReviewDTO
}
```

**Response 409 Conflict:** Gdy review już istnieje dla plan_id + week_number

---

### 2.5 PATCH /api/v1/weekly-reviews/:id

**Metoda HTTP:** PATCH  
**URL:** `/api/v1/weekly-reviews/:id`  
**Opis:** Aktualizuje review (partial update, auto-save)

**URL Parameters:**

- `id` (required): UUID - ID weekly review

**Request Body (wszystkie pola opcjonalne):**

```json
{
  "what_worked": "string",
  "what_did_not_work": "string",
  "what_to_improve": "string",
  "is_completed": boolean
}
```

**Validation:**

- Wszystkie pola opcjonalne
- Przynajmniej jedno pole musi być podane

**Response 200 OK:**

```json
{
  "data": WeeklyReviewDTO
}
```

---

### 2.6 POST /api/v1/weekly-reviews/:id/complete

**Metoda HTTP:** POST  
**URL:** `/api/v1/weekly-reviews/:id/complete`  
**Opis:** Oznacza review jako ukończony

**URL Parameters:**

- `id` (required): UUID - ID weekly review

**Request Body:** Brak

**Response 200 OK:**

```json
{
  "data": {
    "id": "uuid",
    "is_completed": true
  },
  "message": "Weekly review marked as complete"
}
```

---

### 2.7 DELETE /api/v1/weekly-reviews/:id

**Metoda HTTP:** DELETE  
**URL:** `/api/v1/weekly-reviews/:id`  
**Opis:** Usuwa weekly review

**URL Parameters:**

- `id` (required): UUID - ID weekly review

**Response 200 OK:**

```json
{
  "message": "Weekly review deleted successfully"
}
```

---

## 3. Wykorzystywane typy

**Z src/types.ts:**

### DTOs:

```typescript
// Weekly Review DTO - mapuje do weekly_reviews table
type WeeklyReviewDTO = {
  id: string;
  plan_id: string;
  week_number: number;
  what_worked: string | null;
  what_did_not_work: string | null;
  what_to_improve: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};
```

### Command Models:

```typescript
// Create Command
type CreateWeeklyReviewCommand = {
  plan_id: string;
  week_number: number;
  what_worked?: string | null;
  what_did_not_work?: string | null;
  what_to_improve?: string | null;
};

// Update Command
type UpdateWeeklyReviewCommand = {
  what_worked?: string | null;
  what_did_not_work?: string | null;
  what_to_improve?: string | null;
  is_completed?: boolean;
};
```

### Query Params:

```typescript
type WeeklyReviewListParams = {
  plan_id: string;
  week_number?: number;
  is_completed?: boolean;
  limit?: number;
  offset?: number;
};

type WeeklyReviewByWeekParams = {
  plan_id: string;
};
```

### Response Types:

```typescript
type ListResponse<T> = {
  data: T[];
  count?: number;
};

type ItemResponse<T> = {
  data: T;
};

type SuccessResponse = {
  data?: { id: string; [key: string]: unknown };
  message: string;
};

type ErrorResponse = {
  error: string;
  message?: string;
};

type ValidationErrorResponse = {
  error: "Validation failed";
  details: ValidationErrorDetail[];
};
```

---

## 4. Przepływ danych

### 4.1 POST /api/v1/weekly-reviews (Tworzenie)

```
1. Client → POST request z body
   ↓
2. Astro endpoint: parse & validate body (Zod)
   ↓
3. WeeklyReviewService.createWeeklyReview():
   a) Verify plan exists & belongs to user (PlanService)
   b) Check unique constraint violation (plan_id + week_number)
   c) Insert into weekly_reviews table
   ↓
4. Database:
   - Trigger: set created_at, updated_at
   - RLS policy: verify user ownership
   ↓
5. Service returns WeeklyReviewDTO
   ↓
6. Endpoint returns 201 Created
```

### 4.2 GET /api/v1/weekly-reviews (Lista)

```
1. Client → GET request z query params
   ↓
2. Endpoint: parse & validate query (Zod)
   ↓
3. WeeklyReviewService.listWeeklyReviews():
   a) Verify plan exists & belongs to user
   b) Build filtered query (week_number, is_completed)
   c) Apply pagination (limit, offset)
   d) Execute query
   ↓
4. Database: RLS policy filters by user_id
   ↓
5. Service returns WeeklyReviewDTO[]
   ↓
6. Endpoint returns 200 OK with list
```

### 4.3 PATCH /api/v1/weekly-reviews/:id (Aktualizacja)

```
1. Client → PATCH request z body
   ↓
2. Endpoint: validate id & body (Zod)
   ↓
3. WeeklyReviewService.updateWeeklyReview():
   a) Verify review exists & belongs to user
   b) Prepare partial update data
   c) Execute update
   ↓
4. Database:
   - Trigger: auto-update updated_at
   - RLS policy: verify ownership
   ↓
5. Service returns updated WeeklyReviewDTO
   ↓
6. Endpoint returns 200 OK
```

### 4.4 POST /api/v1/weekly-reviews/:id/complete (Oznacz jako ukończone)

```
1. Client → POST request (no body)
   ↓
2. Endpoint: validate id (Zod)
   ↓
3. WeeklyReviewService.markAsComplete():
   a) Verify review exists & belongs to user
   b) Update is_completed = true
   ↓
4. Database: RLS + trigger
   ↓
5. Service returns success
   ↓
6. Endpoint returns 200 OK with message
```

### 4.5 GET /api/v1/weekly-reviews/week/:weekNumber (Po tygodniu)

```
1. Client → GET request z weekNumber & plan_id
   ↓
2. Endpoint: validate params & query (Zod)
   ↓
3. WeeklyReviewService.getWeeklyReviewByWeek():
   a) Verify plan exists & belongs to user
   b) Query: plan_id + week_number
   c) Return single result or null
   ↓
4. Database: RLS policy filters
   ↓
5. Service returns WeeklyReviewDTO or null
   ↓
6. Endpoint returns 200 OK or 404 Not Found
```

---

## 5. Względy bezpieczeństwa

### 5.1 Uwierzytelnianie

**MVP (Current):**

- Używa `DEFAULT_USER_ID` jako placeholder
- Brak JWT token verification
- Wszystkie requesty traktowane jako authenticated user

**Production (Future):**

```typescript
// TODO: Replace DEFAULT_USER_ID with:
const token = request.headers.get("Authorization")?.replace("Bearer ", "");
const {
  data: { user },
  error,
} = await supabase.auth.getUser(token);
if (error || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}
const userId = user.id;
```

### 5.2 Autoryzacja

**Row Level Security (RLS):**

- Polityki w DB: `weekly_reviews` table (zdefiniowane w db-plan.md)
- Weryfikacja: `weekly_reviews → plans → auth.users`
- Każda operacja sprawdza ownership przez relację

**Service Layer:**

- Explicit ownership verification przed operacjami
- `PlanService.getPlanById(planId, userId)` - weryfikuje plan należy do usera
- Zwraca null jeśli brak dostępu

### 5.3 Walidacja danych wejściowych

**Zod Schemas:**

```typescript
// UUID validation
z.string().uuid({ message: "Invalid UUID format" });

// Week number validation
z.number()
  .int()
  .min(1, { message: "Week number must be at least 1" })
  .max(12, { message: "Week number must not exceed 12" });

// Text fields - optional, nullable
z.string().trim().nullable().optional();

// Boolean
z.boolean().optional();
```

**Sanitization:**

- `.trim()` na wszystkich text inputs
- Usuwanie whitespace przed zapisem do DB

**Injection Prevention:**

- Supabase query builder (parametryzowane zapytania)
- Brak raw SQL w application layer
- Prepared statements przez Supabase SDK

### 5.4 Rate Limiting

**MVP:** Nie zaimplementowane

**Future:**

- Middleware level rate limiting
- Rate limit per user: 100 requests/min
- Rate limit per IP: 1000 requests/hour
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`
- Response 429: `{ error: 'Rate limit exceeded', retry_after: 60 }`

### 5.5 CORS & Security Headers

**Headers:**

```typescript
{
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  // Future: 'X-Frame-Options': 'DENY',
  // Future: 'X-XSS-Protection': '1; mode=block'
}
```

---

## 6. Obsługa błędów

### 6.1 Kody statusu i scenariusze

**200 OK:**

- Successful GET, PATCH, DELETE operations
- Successful POST /complete

**201 Created:**

- Successful POST /api/v1/weekly-reviews

**400 Bad Request:**

- Invalid JSON in request body
- Zod validation errors (invalid UUID, week_number out of range)
- Missing required fields
- No fields provided in PATCH request
- Text fields too long (if limits added)

**401 Unauthorized (Future):**

- Missing JWT token
- Invalid/expired JWT token
- Not implemented in MVP (uses DEFAULT_USER_ID)

**404 Not Found:**

- Weekly review nie istnieje dla danego ID
- Weekly review nie należy do użytkownika
- Plan nie istnieje lub nie należy do użytkownika
- Review nie istnieje dla plan_id + week_number (GET by week)

**409 Conflict:**

- Review już istnieje dla plan_id + week_number combination
- Database unique constraint violation
- Handled przez PostgreSQL constraint

**500 Internal Server Error:**

- Unexpected errors w application logic
- Database connection failures
- Supabase query failures
- Unhandled exceptions

### 6.2 Error Response Formats

**Validation Error (400):**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "week_number",
      "message": "Week number must be between 1 and 12",
      "received": 15
    }
  ]
}
```

**Generic Error (400, 404, 500):**

```json
{
  "error": "Weekly review not found",
  "message": "Weekly review does not exist or does not belong to user"
}
```

**Conflict Error (409):**

```json
{
  "error": "Conflict",
  "message": "Weekly review already exists for this week"
}
```

### 6.3 Error Handling Strategy

**Try-Catch Hierarchy:**

```typescript
try {
  // Main operation
  try {
    // Service call
  } catch (serviceError) {
    // Handle specific service errors (404, 409)
    // Re-throw unexpected errors
  }
} catch (error) {
  // Global error handler (500)
  console.error('Error in endpoint:', error);
  return 500 response;
}
```

**Error Logging:**

- `console.error()` dla wszystkich błędów
- Include: endpoint name, error message, stack trace
- Format: `Error in [METHOD /path]:`, error object

**Client Error Messages:**

- User-friendly messages
- No sensitive information leaked
- No stack traces w production

---

## 7. Rozważania dotyczące wydajności

### 7.1 Database Indexes

**Existing (from db-plan.md):**

```sql
-- Primary index
idx_weekly_reviews_plan_id ON (plan_id)

-- Composite index
idx_weekly_reviews_week_number ON (plan_id, week_number)

-- Filter index
idx_weekly_reviews_is_completed ON (is_completed)
```

**Query Performance:**

- GET list by plan_id: O(log n) - index on plan_id
- GET by plan_id + week_number: O(1) - composite index
- Filter by is_completed: O(log n) - partial index

### 7.2 Pagination

**Implementation:**

- Default limit: 50
- Max limit: 100 (prevents large result sets)
- Offset-based pagination (simple, acceptable for MVP)

**Future Optimization:**

- Cursor-based pagination dla large datasets
- `cursor` param zamiast `offset`
- Better performance dla deep pagination

### 7.3 Query Optimization

**N+1 Prevention:**

- Single query dla list (bez nested queries)
- WeeklyReviewDTO nie zawiera nested objects
- No joins required (flat structure)

**Connection Pooling:**

- Handled przez Supabase SDK
- Connection reuse przez middleware

### 7.4 Caching Strategy (Future)

**Not implemented in MVP**

**Future:**

- Cache weekly reviews per plan (Redis)
- TTL: 5 minutes
- Invalidation: on PATCH, POST complete, DELETE
- Cache key: `weekly_reviews:${planId}`

### 7.5 Auto-save Performance

**Issue:** Frequent PATCH requests podczas pisania

**Mitigation:**

- Client-side debouncing (500ms)
- Optimistic UI updates
- Background save (non-blocking)

**Database:**

- `updated_at` trigger auto-updates (low overhead)
- Indexed queries (fast updates)

---

## 8. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji Zod

**Plik:** `src/lib/validation/weekly-review.validation.ts`

**Zadania:**

1. Zdefiniuj `CreateWeeklyReviewBodySchema`:
   - `plan_id`: UUID, required
   - `week_number`: integer 1-12, required
   - Text fields: string, nullable, optional, trim
2. Zdefiniuj `UpdateWeeklyReviewBodySchema`:
   - Wszystkie pola optional
   - `.strict()` - reject unknown fields
3. Zdefiniuj `WeeklyReviewIdParamsSchema`:
   - `id`: UUID validation
4. Zdefiniuj `WeeklyReviewListQuerySchema`:
   - `plan_id`: UUID, required
   - `week_number`: coerce number, 1-12, optional
   - `is_completed`: coerce boolean, optional
   - `limit`: coerce number, 1-100, default 50
   - `offset`: coerce number, >= 0, default 0
5. Zdefiniuj `WeeklyReviewByWeekParamsSchema`:
   - `weekNumber`: coerce number, 1-12
6. Zdefiniuj `WeeklyReviewByWeekQuerySchema`:
   - `plan_id`: UUID, required
7. Create helper function `validateUpdateWeeklyReviewCommand`:
   - Parse schema
   - Check at least one field provided

**Wzór:** `src/lib/validation/weekly-goal.validation.ts`

---

### Krok 2: Implementacja Weekly Review Service

**Plik:** `src/lib/services/weekly-review.service.ts`

**Klasa:** `WeeklyReviewService`

**Constructor:**

```typescript
constructor(private supabase: SupabaseClient) {}
```

**Metody:**

#### 2.1 `createWeeklyReview(userId, data)`

- Verify plan exists: `PlanService.getPlanById()`
- Check unique constraint (try-catch for DB error)
- Insert into `weekly_reviews` table
- Return WeeklyReviewDTO
- Throw errors: plan not found, conflict

#### 2.2 `getWeeklyReviewById(id, userId)`

- Query with join to plans (verify user_id)
- `.maybeSingle()`
- Remove nested plans data
- Return WeeklyReviewDTO | null

#### 2.3 `getWeeklyReviewByWeek(planId, weekNumber, userId)`

- Verify plan exists & belongs to user
- Query by plan_id + week_number
- `.maybeSingle()`
- Return WeeklyReviewDTO | null

#### 2.4 `listWeeklyReviews(params, userId)`

- Verify plan exists & belongs to user
- Build query with filters (week_number, is_completed)
- Apply pagination (limit, offset)
- Order by week_number ASC
- Return WeeklyReviewDTO[]

#### 2.5 `updateWeeklyReview(id, userId, data)`

- Verify review exists & belongs to user
- Prepare partial update data
- Execute update with `.eq('id', id)`
- Return WeeklyReviewDTO | null
- Handle not found

#### 2.6 `markAsComplete(id, userId)`

- Verify review exists & belongs to user
- Update `is_completed = true`
- Return success boolean
- Handle not found

#### 2.7 `deleteWeeklyReview(id, userId)`

- Verify review exists & belongs to user
- Execute delete
- Return success boolean
- Handle not found

**Wzór:** `src/lib/services/weekly-goal.service.ts`

**Imports:**

```typescript
import type { SupabaseClient } from "../../db/supabase.client";
import type {
  WeeklyReviewDTO,
  CreateWeeklyReviewCommand,
  UpdateWeeklyReviewCommand,
  WeeklyReviewListParams,
  WeeklyReviewInsert,
  WeeklyReviewUpdate,
} from "../../types";
import { PlanService } from "./plan.service";
```

---

### Krok 3: Implementacja GET/POST /api/v1/weekly-reviews

**Plik:** `src/pages/api/v1/weekly-reviews/index.ts`

**Exports:**

```typescript
export const prerender = false;
export const GET: APIRoute = async ({ locals, request }) => { ... }
export const POST: APIRoute = async ({ locals, request }) => { ... }
```

#### GET Handler:

1. Get userId (DEFAULT_USER_ID for MVP)
2. Parse query params from URL
3. Validate with `WeeklyReviewListQuerySchema.safeParse()`
4. Handle validation errors → 400
5. Call `weeklyReviewService.listWeeklyReviews()`
6. Handle service errors:
   - Plan not found → 404
   - Other → re-throw
7. Return 200 with `ListResponse<WeeklyReviewDTO>`

#### POST Handler:

1. Get userId (DEFAULT_USER_ID)
2. Parse request body (try-catch for invalid JSON)
3. Validate with `CreateWeeklyReviewBodySchema.safeParse()`
4. Handle validation errors → 400
5. Call `weeklyReviewService.createWeeklyReview()`
6. Handle service errors:
   - Plan not found → 404
   - Conflict (unique constraint) → 409
   - Other → re-throw
7. Return 201 with `ItemResponse<WeeklyReviewDTO>`

**Wzór:** `src/pages/api/v1/weekly-goals/index.ts`

**Imports:**

```typescript
import type { APIRoute } from "astro";
import { WeeklyReviewService } from "../../../../lib/services/weekly-review.service";
import {
  WeeklyReviewListQuerySchema,
  CreateWeeklyReviewBodySchema,
} from "../../../../lib/validation/weekly-review.validation";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";
import type {
  ErrorResponse,
  ValidationErrorResponse,
  ListResponse,
  ItemResponse,
  WeeklyReviewDTO,
} from "../../../../types";
```

---

### Krok 4: Implementacja GET/PATCH/DELETE /api/v1/weekly-reviews/:id

**Plik:** `src/pages/api/v1/weekly-reviews/[id].ts`

**Exports:**

```typescript
export const prerender = false;
export const GET: APIRoute = async ({ params, locals }) => { ... }
export const PATCH: APIRoute = async ({ params, request, locals }) => { ... }
export const DELETE: APIRoute = async ({ params, locals }) => { ... }
```

#### GET Handler:

1. Get userId
2. Validate `id` param with `WeeklyReviewIdParamsSchema`
3. Handle validation errors → 400
4. Call `weeklyReviewService.getWeeklyReviewById()`
5. If null → 404
6. Return 200 with `ItemResponse<WeeklyReviewDTO>`

#### PATCH Handler:

1. Get userId
2. Validate `id` param
3. Parse request body (try-catch)
4. Validate with `validateUpdateWeeklyReviewCommand()`
5. Handle validation errors (Zod + at least one field) → 400
6. Call `weeklyReviewService.updateWeeklyReview()`
7. If null → 404
8. Return 200 with `ItemResponse<WeeklyReviewDTO>`

#### DELETE Handler:

1. Get userId
2. Validate `id` param
3. Call `weeklyReviewService.deleteWeeklyReview()`
4. If false → 404
5. Return 200 with success message

**Wzór:** `src/pages/api/v1/weekly-goals/[id].ts`

---

### Krok 5: Implementacja POST /api/v1/weekly-reviews/:id/complete

**Plik:** `src/pages/api/v1/weekly-reviews/[id]/complete.ts`

**Struktura:**

```
src/pages/api/v1/weekly-reviews/
  [id]/
    complete.ts
```

**Export:**

```typescript
export const prerender = false;
export const POST: APIRoute = async ({ params, locals }) => { ... }
```

**POST Handler:**

1. Get userId (DEFAULT_USER_ID)
2. Validate `id` param with `WeeklyReviewIdParamsSchema`
3. Handle validation errors → 400
4. Call `weeklyReviewService.markAsComplete(id, userId)`
5. If false (not found) → 404
6. Return 200 with:

```json
{
  "data": { "id": id, "is_completed": true },
  "message": "Weekly review marked as complete"
}
```

**Imports:**

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { WeeklyReviewService } from "../../../../../lib/services/weekly-review.service";
import { WeeklyReviewIdParamsSchema } from "../../../../../lib/validation/weekly-review.validation";
import { DEFAULT_USER_ID } from "../../../../../db/supabase.client";
import type { ErrorResponse, ValidationErrorResponse, SuccessResponse } from "../../../../../types";
```

**Error Handling:**

- Try-catch wrapper
- console.error for unexpected errors
- Return 500 for unhandled exceptions

---

### Krok 6: Implementacja GET /api/v1/weekly-reviews/week/:weekNumber

**Plik:** `src/pages/api/v1/weekly-reviews/week/[weekNumber].ts`

**Struktura:**

```
src/pages/api/v1/weekly-reviews/
  week/
    [weekNumber].ts
```

**Export:**

```typescript
export const prerender = false;
export const GET: APIRoute = async ({ params, request, locals }) => { ... }
```

**GET Handler:**

1. Get userId (DEFAULT_USER_ID)
2. Parse `weekNumber` from params
3. Parse `plan_id` from query string
4. Validate params with `WeeklyReviewByWeekParamsSchema`
5. Validate query with `WeeklyReviewByWeekQuerySchema`
6. Handle validation errors → 400
7. Call `weeklyReviewService.getWeeklyReviewByWeek(planId, weekNumber, userId)`
8. If null → 404 (review not found for this week)
9. Handle service errors:
   - Plan not found → 404
   - Other → re-throw
10. Return 200 with `ItemResponse<WeeklyReviewDTO>`

**Imports:**

```typescript
import type { APIRoute } from "astro";
import { WeeklyReviewService } from "../../../../../lib/services/weekly-review.service";
import {
  WeeklyReviewByWeekParamsSchema,
  WeeklyReviewByWeekQuerySchema,
} from "../../../../../lib/validation/weekly-review.validation";
import { DEFAULT_USER_ID } from "../../../../../db/supabase.client";
import type { ErrorResponse, ValidationErrorResponse, ItemResponse, WeeklyReviewDTO } from "../../../../../types";
```

---

### Krok 7: Testowanie endpointów

**Plik testowy:** `api-tests/weekly-reviews-tests.http`

**Testy do utworzenia:**

```http
### 1. GET List - wszystkie reviews dla planu
GET http://localhost:4321/api/v1/weekly-reviews?plan_id={{planId}}

### 2. GET List - filtrowanie po week_number
GET http://localhost:4321/api/v1/weekly-reviews?plan_id={{planId}}&week_number=3

### 3. GET List - filtrowanie po is_completed
GET http://localhost:4321/api/v1/weekly-reviews?plan_id={{planId}}&is_completed=true

### 4. GET List - z paginacją
GET http://localhost:4321/api/v1/weekly-reviews?plan_id={{planId}}&limit=10&offset=0

### 5. GET by week - review dla konkretnego tygodnia
GET http://localhost:4321/api/v1/weekly-reviews/week/3?plan_id={{planId}}

### 6. POST - create new review (empty fields for auto-save)
POST http://localhost:4321/api/v1/weekly-reviews
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "week_number": 3,
  "what_worked": "",
  "what_did_not_work": "",
  "what_to_improve": ""
}

### 7. GET by ID - konkretny review
GET http://localhost:4321/api/v1/weekly-reviews/{{reviewId}}

### 8. PATCH - auto-save update (partial)
PATCH http://localhost:4321/api/v1/weekly-reviews/{{reviewId}}
Content-Type: application/json

{
  "what_worked": "Early morning sessions were productive"
}

### 9. PATCH - complete all fields
PATCH http://localhost:4321/api/v1/weekly-reviews/{{reviewId}}
Content-Type: application/json

{
  "what_worked": "Early morning sessions were productive",
  "what_did_not_work": "Too many meetings",
  "what_to_improve": "Block calendar for deep work"
}

### 10. POST complete - mark as completed
POST http://localhost:4321/api/v1/weekly-reviews/{{reviewId}}/complete

### 11. DELETE - remove review
DELETE http://localhost:4321/api/v1/weekly-reviews/{{reviewId}}

### Error Cases

### 12. POST - conflict (duplicate week_number)
POST http://localhost:4321/api/v1/weekly-reviews
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "week_number": 3
}

### 13. GET - invalid UUID
GET http://localhost:4321/api/v1/weekly-reviews/invalid-uuid

### 14. GET - missing required plan_id
GET http://localhost:4321/api/v1/weekly-reviews

### 15. POST - week_number out of range
POST http://localhost:4321/api/v1/weekly-reviews
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "week_number": 15
}

### 16. PATCH - no fields provided
PATCH http://localhost:4321/api/v1/weekly-reviews/{{reviewId}}
Content-Type: application/json

{}

### 17. GET by week - review not found
GET http://localhost:4321/api/v1/weekly-reviews/week/10?plan_id={{planId}}
```

**Test Scenarios:**

- Happy path: create, read, update, complete, delete
- Validation errors: invalid UUIDs, out of range, missing fields
- Not found errors: non-existent IDs, wrong user
- Conflict errors: duplicate week_number
- Auto-save: partial updates with empty fields

---

### Krok 8: Dokumentacja i code review

**Zadania:**

1. **JSDoc comments:**
   - Dodaj do wszystkich public methods w service
   - Include: @param, @returns, @throws, @example
   - Wzór: WeeklyGoalService

2. **Type safety:**
   - Verify all types importowane z types.ts
   - No `any` types (use `unknown` if needed)
   - Proper DTO vs Entity usage

3. **Error messages:**
   - User-friendly error messages
   - Consistent error format
   - No sensitive info leaked

4. **Code consistency:**
   - Follow existing patterns (WeeklyGoalService, TaskService)
   - Consistent naming conventions
   - Proper indentation and formatting

5. **Security review:**
   - Verify RLS policies active
   - User ownership verification w każdej metodzie
   - Input validation complete

6. **Performance review:**
   - Check query optimization
   - Verify indexes usage
   - No N+1 queries

---

## 9. Podsumowanie implementacji

**Pliki do utworzenia:**

1. `src/lib/validation/weekly-review.validation.ts` - 7 schemas
2. `src/lib/services/weekly-review.service.ts` - 7 methods
3. `src/pages/api/v1/weekly-reviews/index.ts` - GET, POST
4. `src/pages/api/v1/weekly-reviews/[id].ts` - GET, PATCH, DELETE
5. `src/pages/api/v1/weekly-reviews/[id]/complete.ts` - POST
6. `src/pages/api/v1/weekly-reviews/week/[weekNumber].ts` - GET
7. `api-tests/weekly-reviews-tests.http` - test cases

**Szacowany czas implementacji:**

- Krok 1 (Validation): 1-2h
- Krok 2 (Service): 2-3h
- Krok 3-6 (Endpoints): 3-4h
- Krok 7 (Testing): 1-2h
- Krok 8 (Review): 1h
- **Total: 8-12h**

**Zależności:**

- Istniejące: PlanService, SupabaseClient, types.ts
- Database: weekly_reviews table, RLS policies, triggers (już istniejące)

**Następne kroki po implementacji:**

1. Integration testing z frontend
2. Performance testing (load test)
3. Security audit
4. JWT authentication implementation (production)
5. Rate limiting middleware
6. Caching strategy

---

## 10. Checklist końcowy

- [ ] Validation schemas utworzone (7 schemas)
- [ ] Service methods zaimplementowane (7 methods)
- [ ] API endpoints działają (6 files, 7 endpoints)
- [ ] Error handling kompletny (wszystkie kody statusu)
- [ ] Ownership verification w każdym endpoincie
- [ ] JSDoc comments dodane
- [ ] Type safety verified (no `any`)
- [ ] Test cases przygotowane (.http file)
- [ ] All tests passing (happy path + errors)
- [ ] Code review completed
- [ ] Documentation updated

**Po zakończeniu wszystkich kroków, weekly reviews API będzie w pełni funkcjonalne i gotowe do integracji z frontendem.**
