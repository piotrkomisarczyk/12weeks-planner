# API Endpoint Implementation Plan: PATCH & DELETE /api/v1/goals/:id

## 1. Przegląd punktów końcowych

### 1.1. PATCH /api/v1/goals/:id

**Cel:** Aktualizacja istniejącego długoterminowego celu (long-term goal) należącego do użytkownika.

**Funkcjonalność:**

- Użytkownik może zaktualizować dowolne pole celu (partial update)
- Wszystkie pola są opcjonalne - można zaktualizować tylko wybrane
- Aktualizacja title, description, category, progress_percentage, position
- System weryfikuje, że cel należy do użytkownika przez relację goal → plan → user
- Automatyczna aktualizacja pola `updated_at` przez trigger bazodanowy

### 1.2. DELETE /api/v1/goals/:id

**Cel:** Usunięcie długoterminowego celu należącego do użytkownika wraz z powiązanymi danymi.

**Funkcjonalność:**

- Trwałe usunięcie celu z bazy danych
- Kaskadowe usunięcie wszystkich powiązanych kamieni milowych (milestones)
- Ustawienie `long_term_goal_id = NULL` w powiązanych celach tygodniowych (weekly_goals)
- Weryfikacja, że cel należy do użytkownika
- Operacja jest nieodwracalna

**Powiązania z innymi zasobami:**

- Cel należy do konkretnego planera (`plan_id`)
- Cel ma powiązane kamienie milowe (milestones) - ON DELETE CASCADE
- Cel może być powiązany z celami tygodniowymi (weekly_goals) - ON DELETE SET NULL

---

## 2. Szczegóły żądań

### 2.1. PATCH /api/v1/goals/:id

#### 2.1.1. Metoda HTTP i URL

- **Metoda:** `PATCH`
- **Struktura URL:** `/api/v1/goals/:id`
- **Content-Type:** `application/json`

#### 2.1.2. Parametry URL

**:id** (string, UUID, required)

- Identyfikator celu do aktualizacji
- Walidacja: format UUID
- Cel musi należeć do użytkownika (weryfikacja przez JOIN z plans)

#### 2.1.3. Request Body (JSON)

Wszystkie pola są **opcjonalne**:

```json
{
  "title": "Launch MVP v1.0",
  "description": "Important for career growth and financial independence",
  "category": "work",
  "progress_percentage": 55,
  "position": 1
}
```

**Parametry opcjonalne:**

- **title** (string)
  - Tytuł długoterminowego celu
  - Walidacja: min 1 znak, max 255 znaków, trimmed
  - Nie może być pustym stringiem

- **description** (string, nullable)
  - Uzasadnienie - dlaczego cel jest ważny
  - Walidacja: brak ograniczeń długości
  - Można ustawić na null

- **category** (string, nullable)
  - Kategoria celu
  - Walidacja: enum - jedna z wartości: `work`, `finance`, `hobby`, `relationships`, `health`, `development`
  - Można ustawić na null

- **progress_percentage** (integer)
  - Manualny postęp celu (0-100%)
  - Walidacja: integer, zakres 0-100

- **position** (integer)
  - Kolejność wyświetlania celów (1-6)
  - Walidacja: integer, zakres 1-6

#### 2.1.4. Ograniczenia biznesowe

- Cel musi istnieć i należeć do użytkownika
- Co najmniej jedno pole musi być podane (nie można wysłać pustego obiektu)

---

### 2.2. DELETE /api/v1/goals/:id

#### 2.2.1. Metoda HTTP i URL

- **Metoda:** `DELETE`
- **Struktura URL:** `/api/v1/goals/:id`
- **Content-Type:** nie dotyczy (brak body)

#### 2.2.2. Parametry URL

**:id** (string, UUID, required)

- Identyfikator celu do usunięcia
- Walidacja: format UUID
- Cel musi należeć do użytkownika (weryfikacja przez JOIN z plans)

#### 2.2.3. Request Body

Brak - endpoint nie przyjmuje body.

#### 2.2.4. Ograniczenia biznesowe

- Cel musi istnieć i należeć do użytkownika
- Operacja jest nieodwracalna - wszystkie powiązane milestones zostaną usunięte

---

## 3. Wykorzystywane typy

### 3.1. PATCH - Command Model (Request)

```typescript
// Już zdefiniowany w src/types.ts
export type UpdateGoalCommand = Partial<
  Pick<LongTermGoalUpdate, "title" | "description" | "category" | "progress_percentage" | "position">
>;
```

### 3.2. PATCH - DTO (Response)

```typescript
// Już zdefiniowane w src/types.ts
export type GoalDTO = LongTermGoalEntity;

export interface ItemResponse<T> {
  data: T;
}
```

### 3.3. DELETE - Response Type

```typescript
// Już zdefiniowany w src/types.ts
export interface SuccessResponse {
  message: string;
}
```

### 3.4. Error Types

```typescript
// Już zdefiniowane w src/types.ts
export interface ValidationErrorResponse {
  error: "Validation failed";
  details: ValidationErrorDetail[];
}

export interface ErrorResponse {
  error: string;
  message?: string;
}
```

### 3.5. Nowe typy do stworzenia

Żadne - wszystkie potrzebne typy są już zdefiniowane w `src/types.ts`.

---

## 4. Szczegóły odpowiedzi

### 4.1. PATCH - Sukces (200 OK)

**Struktura odpowiedzi:**

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

**Headers:**

```
Content-Type: application/json
X-Content-Type-Options: nosniff
```

### 4.2. PATCH - Błąd walidacji (400 Bad Request)

**Przykład 1: Nieprawidłowy UUID**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "id",
      "message": "Invalid UUID format"
    }
  ]
}
```

**Przykład 2: Title zbyt krótki**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title must be at least 1 character long"
    }
  ]
}
```

**Przykład 3: Progress poza zakresem**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "progress_percentage",
      "message": "Progress must be between 0 and 100",
      "received": 150
    }
  ]
}
```

**Przykład 4: Nieprawidłowa kategoria**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "category",
      "message": "Category must be one of: work, finance, hobby, relationships, health, development",
      "received": "invalid_category"
    }
  ]
}
```

**Przykład 5: Pusty request body**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "body",
      "message": "At least one field must be provided for update"
    }
  ]
}
```

### 4.3. PATCH - Cel nie znaleziony (404 Not Found)

```json
{
  "error": "Goal not found"
}
```

### 4.4. PATCH - Nieautoryzowany dostęp (401 Unauthorized)

```json
{
  "error": "Unauthorized"
}
```

### 4.5. DELETE - Sukces (200 OK)

**Struktura odpowiedzi:**

```json
{
  "message": "Goal deleted successfully"
}
```

**Headers:**

```
Content-Type: application/json
X-Content-Type-Options: nosniff
```

### 4.6. DELETE - Cel nie znaleziony (404 Not Found)

```json
{
  "error": "Goal not found"
}
```

### 4.7. DELETE - Nieautoryzowany dostęp (401 Unauthorized)

```json
{
  "error": "Unauthorized"
}
```

### 4.8. Błąd serwera (500 Internal Server Error)

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## 5. Przepływ danych

### 5.1. PATCH /api/v1/goals/:id

```
1. Request arrives at endpoint
   ↓
2. Middleware extracts DEFAULT_USER_ID from context
   ↓
3. Validate :id parameter (UUID format)
   ↓
4. Parse and validate request body (Zod schema)
   ↓
5. Check if at least one field is provided
   ↓
6. Call GoalService.updateGoal(goalId, userId, data)
   ↓
7. Service: Query database with JOIN to verify ownership
   SELECT g.* FROM long_term_goals g
   INNER JOIN plans p ON g.plan_id = p.id
   WHERE g.id = :goalId AND p.user_id = :userId
   ↓
8. If goal not found → return 404
   ↓
9. Update goal in database (only provided fields)
   UPDATE long_term_goals
   SET [provided fields]
   WHERE id = :goalId
   ↓
10. Database trigger automatically updates updated_at
   ↓
11. Return updated goal with 200 OK
   ↓
12. Wrap in ItemResponse<GoalDTO>
```

### 5.2. DELETE /api/v1/goals/:id

```
1. Request arrives at endpoint
   ↓
2. Middleware extracts DEFAULT_USER_ID from context
   ↓
3. Validate :id parameter (UUID format)
   ↓
4. Call GoalService.deleteGoal(goalId, userId)
   ↓
5. Service: Query database with JOIN to verify ownership
   SELECT g.id FROM long_term_goals g
   INNER JOIN plans p ON g.plan_id = p.id
   WHERE g.id = :goalId AND p.user_id = :userId
   ↓
6. If goal not found → return 404
   ↓
7. Delete goal from database
   DELETE FROM long_term_goals
   WHERE id = :goalId
   ↓
8. Database CASCADE DELETE automatically removes:
   - All milestones (ON DELETE CASCADE)
   ↓
9. Database SET NULL automatically updates:
   - weekly_goals.long_term_goal_id = NULL (ON DELETE SET NULL)
   ↓
10. Return success message with 200 OK
   ↓
11. Wrap in SuccessResponse
```

### 5.3. Interakcje z bazą danych

**PATCH - Query sequence:**

1. SELECT with JOIN (verify ownership)
2. UPDATE (partial update with provided fields)
3. SELECT (return updated record)

**DELETE - Query sequence:**

1. SELECT with JOIN (verify ownership)
2. DELETE (cascade to milestones, set null in weekly_goals)

**Database Triggers:**

- `update_updated_at_column` - automatycznie aktualizuje `updated_at` przy PATCH

**Database Constraints:**

- Foreign key `plan_id` references `plans(id)` ON DELETE CASCADE
- Check constraints na category, progress_percentage, position

---

## 6. Względy bezpieczeństwa

### 6.1. Uwierzytelnianie i autoryzacja

**Uwierzytelnianie:**

- W tym projekcie używamy `DEFAULT_USER_ID` zamiast prawdziwej autentykacji
- `DEFAULT_USER_ID` jest ustawiany w middleware i dostępny w `context.locals.userId`
- Brak tokenu/sesji nie jest błędem (różnica od produkcyjnego API)

**Autoryzacja:**

- Weryfikacja właściciela przez JOIN: `long_term_goals → plans → user_id`
- Cel może należeć tylko do planerów użytkownika
- Brak możliwości edycji/usunięcia celów innych użytkowników
- Query zawsze filtruje po `user_id`

### 6.2. Walidacja danych wejściowych

**URL Parameter Validation:**

- `:id` musi być poprawnym UUID v4
- Zod schema: `z.string().uuid()`

**Request Body Validation (PATCH):**

- Wszystkie pola opcjonalne, ale co najmniej jedno wymagane
- Strict mode w Zod - dodatkowe pola są odrzucane
- Walidacja typów, zakresów, enumów
- String trimming dla `title`

**Sanitization:**

- Supabase client automatycznie escapuje wartości (prepared statements)
- Brak ryzyka SQL injection

### 6.3. Zagrożenia bezpieczeństwa

**1. Horizontal Privilege Escalation:**

- **Ryzyko:** Użytkownik może próbować zaktualizować/usunąć cel innego użytkownika
- **Mitigation:** JOIN z tabelą plans i filtrowanie po user_id w każdym query

**2. UUID Enumeration:**

- **Ryzyko:** Atakujący może próbować zgadywać UUID celów
- **Mitigation:** UUID v4 ma 122 bity entropii, praktycznie niemożliwe do zgadnięcia
- **Mitigation:** Zawsze weryfikujemy właściciela przed operacją

**3. Mass Assignment:**

- **Ryzyko:** Atakujący może próbować ustawić dodatkowe pola (np. plan_id, id)
- **Mitigation:** Zod strict mode odrzuca nieznane pola
- **Mitigation:** Service używa tylko typowanych pól z UpdateGoalCommand

**4. Cascade Delete Side Effects:**

- **Ryzyko:** Użytkownik może nie być świadomy, że DELETE usuwa milestones
- **Mitigation:** Dokumentacja API jasno komunikuje to zachowanie
- **Mitigation:** Frontend powinien pokazać ostrzeżenie przed usunięciem

**5. Race Conditions:**

- **Ryzyko:** Równoczesne PATCH requests mogą nadpisać zmiany
- **Mitigation:** PostgreSQL ACID guarantees
- **Mitigation:** `updated_at` timestamp pokazuje kiedy nastąpiła ostatnia zmiana

### 6.4. Rate Limiting

- Brak implementacji rate limiting w MVP
- W produkcji: rozważyć rate limiting na poziomie middleware lub API gateway
- Sugerowane limity: 100 requests/minute per user

---

## 7. Obsługa błędów

### 7.1. Kategorie błędów

#### 7.1.1. Błędy walidacji (400 Bad Request)

**Trigger:**

- Nieprawidłowy format UUID w URL
- Nieprawidłowe wartości w request body
- Pusty request body dla PATCH

**Obsługa:**

```typescript
try {
  const validatedData = updateGoalSchema.parse(requestBody);
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          received: err.input,
        })),
      }),
      { status: 400 }
    );
  }
}
```

**Przykłady:**

- Title zbyt krótki/długi
- Progress percentage poza zakresem 0-100
- Position poza zakresem 1-6
- Category nie jest jednym z dozwolonych wartości
- UUID w nieprawidłowym formacie

#### 7.1.2. Błędy autoryzacji (401 Unauthorized)

**Trigger:**

- Brak `DEFAULT_USER_ID` w context (bardzo rzadkie w tym projekcie)

**Obsługa:**

```typescript
const userId = context.locals.userId;
if (!userId) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
    }),
    { status: 401 }
  );
}
```

#### 7.1.3. Błędy zasobów (404 Not Found)

**Trigger:**

- Cel o podanym ID nie istnieje
- Cel istnieje, ale należy do innego użytkownika

**Obsługa:**

```typescript
const goal = await goalService.updateGoal(goalId, userId, data);
if (!goal) {
  return new Response(
    JSON.stringify({
      error: "Goal not found",
    }),
    { status: 404 }
  );
}
```

**Uwaga bezpieczeństwa:**

- Nie rozróżniamy w odpowiedzi czy cel nie istnieje czy należy do innego użytkownika
- Zapobiega to information disclosure

#### 7.1.4. Błędy bazy danych (500 Internal Server Error)

**Trigger:**

- Błąd połączenia z bazą danych
- Naruszenie constraint (nie powinno się zdarzyć po walidacji)
- Timeout query
- Niespodziewane błędy

**Obsługa:**

```typescript
try {
  // database operations
} catch (error) {
  console.error("Database error:", error);
  return new Response(
    JSON.stringify({
      error: "Internal server error",
      message: "An unexpected error occurred",
    }),
    { status: 500 }
  );
}
```

**Logging:**

- Błędy 500 powinny być logowane z pełnym stack trace
- W produkcji: integracja z Sentry lub podobnym narzędziem
- Nie ujawniamy szczegółów błędów bazy danych klientowi

### 7.2. Error Handling Strategy

#### 7.2.1. Kolejność sprawdzania błędów (Error Handling Order)

```
1. Validate authentication (401)
   ↓
2. Validate URL parameters (400)
   ↓
3. Validate request body (400)
   ↓
4. Check resource existence and ownership (404)
   ↓
5. Perform database operation (500 on failure)
   ↓
6. Return success response
```

#### 7.2.2. Centralized Error Handling

**W pliku endpoint:**

```typescript
try {
  // main logic
} catch (error) {
  if (error instanceof ValidationError) {
    return validationErrorResponse(error);
  }
  if (error instanceof NotFoundError) {
    return notFoundResponse();
  }
  // Unexpected errors
  console.error("Unexpected error:", error);
  return internalServerErrorResponse();
}
```

#### 7.2.3. Database Error Mapping

| PostgreSQL Error Code | HTTP Status | Response Message          |
| --------------------- | ----------- | ------------------------- |
| 23503 (foreign key)   | 400         | Invalid plan_id reference |
| 23514 (check)         | 400         | Constraint violation      |
| Connection timeout    | 500         | Internal server error     |
| Other errors          | 500         | Internal server error     |

### 7.3. Logging Strategy

**Development:**

```typescript
console.error("Error details:", {
  endpoint: "PATCH /api/v1/goals/:id",
  goalId,
  userId,
  error: error.message,
  stack: error.stack,
});
```

**Production (future):**

```typescript
logger.error("Goal update failed", {
  endpoint: "PATCH /api/v1/goals/:id",
  goalId,
  userId,
  error: error.message,
  // DON'T log sensitive data (passwords, tokens, etc.)
});
```

---

## 8. Rozważania dotyczące wydajności

### 8.1. Database Query Optimization

#### 8.1.1. Index Usage

**Istniejące indeksy (z migracji):**

- `idx_long_term_goals_plan_id` - używany w JOIN
- Primary key `id` - używany w WHERE clause

**Query plan dla PATCH/DELETE:**

```sql
-- Efficient query using indexes
SELECT g.* FROM long_term_goals g
INNER JOIN plans p ON g.plan_id = p.id
WHERE g.id = :goalId AND p.user_id = :userId;

-- Uses:
-- 1. Index Scan on long_term_goals (PK: id)
-- 2. Index Scan on plans (idx_plans_user_id)
-- 3. Join on plan_id (idx_long_term_goals_plan_id)
```

**Performance characteristics:**

- O(log n) dla lookup po ID (B-tree index)
- JOIN z plans jest szybki dzięki indexed foreign key
- Brak full table scans

#### 8.1.2. Query Complexity

**PATCH:**

- 1 SELECT (verify ownership + fetch current data)
- 1 UPDATE (partial update)
- 1 SELECT (return updated data - automatic with .select())
- **Total: 2-3 queries** (Supabase może optymalizować)

**DELETE:**

- 1 SELECT (verify ownership)
- 1 DELETE (cascade handled by database)
- **Total: 2 queries**

**Optimization opportunities:**

- Supabase client może cache'ować niektóre queries
- PostgreSQL prepare/execute cache dla repeated queries

### 8.2. Response Time Expectations

**Expected latencies (localhost Supabase):**

- PATCH: 10-50ms (depending on data size)
- DELETE: 10-30ms (cascade może wydłużyć dla dużej liczby milestones)

**Expected latencies (remote Supabase):**

- PATCH: 50-200ms (w zależności od network latency)
- DELETE: 50-150ms

**Timeout recommendations:**

- Client-side timeout: 10 seconds
- Server-side query timeout: 5 seconds

### 8.3. Caching Strategy

**Not applicable for PATCH/DELETE:**

- Mutating operations nie powinny być cache'owane
- Po PATCH/DELETE należy invalidate cache dla:
  - GET /api/v1/goals/:id
  - GET /api/v1/goals (list)
  - GET /api/v1/plans/:id (jeśli zawiera goals)

**Future consideration:**

- ETags dla GET requests
- Cache invalidation strategy

### 8.4. Concurrent Request Handling

**Race conditions:**

- Dwa równoczesne PATCH na tym samym goal
- PATCH podczas DELETE

**Mitigation:**

- PostgreSQL ACID properties zapewniają consistency
- Last-write-wins strategy (akceptowalne dla MVP)
- `updated_at` timestamp pozwala wykryć konflikty

**Future improvement:**

- Optimistic locking z version field
- Conflict detection na podstawie `updated_at`

### 8.5. Cascade Delete Performance

**Potential bottleneck:**

- DELETE goal z wieloma milestones (do 5)
- Każdy milestone może mieć powiązane tasks

**Database cascade behavior:**

```
DELETE goal
  → CASCADE DELETE milestones (1-5 records)
  → SET NULL in weekly_goals (0-12 records)
  → SET NULL in tasks.milestone_id (0-60 records)
```

**Performance impact:**

- Low for MVP (maksymalnie kilkadziesiąt rekordów)
- Database triggers są atomowe i szybkie
- W produkcji można rozważyć soft delete dla archiwizacji

### 8.6. Monitoring and Metrics

**Recommended metrics:**

- Request duration (p50, p95, p99)
- Error rate (4xx, 5xx)
- Database query time
- Concurrent requests

**Alerting thresholds (suggestions):**

- p95 latency > 1 second
- Error rate > 5%
- Database connection pool exhaustion

---

## 9. Kroki implementacji

### Krok 1: Utworzenie schematu walidacji Zod

**Plik:** `src/lib/validation/goal.validation.ts`

**Zadania:**

1. Utworzyć nowy plik walidacji dla goal endpoints
2. Zaimportować Zod i typy z `src/types.ts`
3. Zdefiniować `updateGoalSchema` dla PATCH request body
4. Zdefiniować `goalIdParamSchema` dla walidacji UUID w URL
5. Dodać customowe error messages dla każdego pola
6. Eksportować schematy

**Szczegóły implementacji:**

```typescript
import { z } from "zod";
import type { GoalCategory } from "../../types";

// Schema for :id URL parameter
export const goalIdParamSchema = z.string().uuid("Invalid goal ID format");

// Schema for PATCH /api/v1/goals/:id request body
export const updateGoalSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title must be at least 1 character long")
      .max(255, "Title must not exceed 255 characters")
      .optional(),

    description: z.string().nullable().optional(),

    category: z
      .enum(["work", "finance", "hobby", "relationships", "health", "development"], {
        errorMap: () => ({
          message: "Category must be one of: work, finance, hobby, relationships, health, development",
        }),
      })
      .nullable()
      .optional(),

    progress_percentage: z
      .number()
      .int("Progress must be an integer")
      .min(0, "Progress must be at least 0")
      .max(100, "Progress must not exceed 100")
      .optional(),

    position: z
      .number()
      .int("Position must be an integer")
      .min(1, "Position must be at least 1")
      .max(6, "Position must not exceed 6")
      .optional(),
  })
  .strict(); // Reject unknown fields

// Validation to ensure at least one field is provided
export const validateUpdateGoalCommand = (data: unknown) => {
  const parsed = updateGoalSchema.parse(data);

  // Check if at least one field is provided
  if (Object.keys(parsed).length === 0) {
    throw new Error("At least one field must be provided for update");
  }

  return parsed;
};
```

**Testing:**

- Test z poprawnymi danymi
- Test z wszystkimi polami opcjonalnymi
- Test z nieprawidłowym UUID
- Test z wartościami poza zakresem
- Test z nieprawidłową kategorią
- Test z pustym obiektem
- Test z dodatkowymi polami (strict mode)

---

### Krok 2: Utworzenie Goal Service

**Plik:** `src/lib/services/goal.service.ts`

**Zadania:**

1. Utworzyć nowy plik service dla goal operations
2. Zaimportować typy i Supabase client
3. Zdefiniować klasę `GoalService` z constructor przyjmującym `SupabaseClient`
4. Zaimplementować `getGoalById()` z weryfikacją właściciela
5. Zaimplementować `updateGoal()` z partial update
6. Zaimplementować `deleteGoal()` z cascade
7. Dodać JSDoc comments dla każdej metody
8. Dodać error handling

**Szczegóły implementacji:**

```typescript
/**
 * Goal Service
 * Handles business logic for long-term goal operations
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { GoalDTO, UpdateGoalCommand, LongTermGoalUpdate } from "../../types";

export class GoalService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Pobiera cel długoterminowy po ID z weryfikacją właściciela
   *
   * @param goalId - UUID celu
   * @param userId - ID użytkownika (z DEFAULT_USER_ID)
   * @returns Promise z celem lub null jeśli nie istnieje/nie należy do użytkownika
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   */
  async getGoalById(goalId: string, userId: string): Promise<GoalDTO | null> {
    // Query with JOIN to verify ownership through plans table
    const { data, error } = await this.supabase
      .from("long_term_goals")
      .select(
        `
        *,
        plans!inner(user_id)
      `
      )
      .eq("id", goalId)
      .eq("plans.user_id", userId)
      .maybeSingle();

    // Handle database errors
    if (error) {
      throw new Error(`Failed to fetch goal: ${error.message}`);
    }

    // Return null if not found (either doesn't exist or belongs to another user)
    return data
      ? {
          id: data.id,
          plan_id: data.plan_id,
          title: data.title,
          description: data.description,
          category: data.category,
          progress_percentage: data.progress_percentage,
          position: data.position,
          created_at: data.created_at,
          updated_at: data.updated_at,
        }
      : null;
  }

  /**
   * Aktualizuje cel długoterminowy (partial update)
   * Weryfikuje, że cel należy do użytkownika
   *
   * @param goalId - UUID celu
   * @param userId - ID użytkownika (z DEFAULT_USER_ID)
   * @param data - Dane do aktualizacji (wszystkie pola opcjonalne)
   * @returns Promise z zaktualizowanym celem lub null jeśli nie istnieje
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   */
  async updateGoal(goalId: string, userId: string, data: UpdateGoalCommand): Promise<GoalDTO | null> {
    // First verify goal exists and belongs to user
    const existingGoal = await this.getGoalById(goalId, userId);

    if (!existingGoal) {
      return null;
    }

    // Prepare update data with only provided fields
    const updateData: LongTermGoalUpdate = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.category !== undefined) {
      updateData.category = data.category;
    }

    if (data.progress_percentage !== undefined) {
      updateData.progress_percentage = data.progress_percentage;
    }

    if (data.position !== undefined) {
      updateData.position = data.position;
    }

    // updated_at is automatically set by database trigger

    // Execute update
    const { data: goal, error } = await this.supabase
      .from("long_term_goals")
      .update(updateData)
      .eq("id", goalId)
      .select()
      .single();

    // Handle database errors
    if (error) {
      throw new Error(`Failed to update goal: ${error.message}`);
    }

    return goal;
  }

  /**
   * Usuwa cel długoterminowy
   * Weryfikuje, że cel należy do użytkownika
   * Automatycznie usuwa powiązane milestones (CASCADE)
   * Automatycznie ustawia long_term_goal_id = NULL w weekly_goals (SET NULL)
   *
   * @param goalId - UUID celu
   * @param userId - ID użytkownika (z DEFAULT_USER_ID)
   * @returns Promise z true jeśli usunięto lub false jeśli cel nie istnieje
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   */
  async deleteGoal(goalId: string, userId: string): Promise<boolean> {
    // First verify goal exists and belongs to user
    const existingGoal = await this.getGoalById(goalId, userId);

    if (!existingGoal) {
      return false;
    }

    // Execute delete - cascade will remove all related milestones
    const { error } = await this.supabase.from("long_term_goals").delete().eq("id", goalId);

    // Handle database errors
    if (error) {
      throw new Error(`Failed to delete goal: ${error.message}`);
    }

    // Note: Database CASCADE DELETE automatically removes:
    // - milestones (ON DELETE CASCADE)
    // Note: Database SET NULL automatically updates:
    // - weekly_goals.long_term_goal_id = NULL (ON DELETE SET NULL)

    return true;
  }
}
```

**Testing:**

- Test `getGoalById` z istniejącym celem
- Test `getGoalById` z nieistniejącym celem
- Test `getGoalById` z celem należącym do innego użytkownika
- Test `updateGoal` z pojedynczym polem
- Test `updateGoal` z wieloma polami
- Test `updateGoal` z nullable fields (description, category)
- Test `updateGoal` z nieistniejącym celem
- Test `deleteGoal` z istniejącym celem
- Test `deleteGoal` z cascade (sprawdzić usunięcie milestones)
- Test error handling dla database errors

---

### Krok 3: Implementacja PATCH endpoint

**Plik:** `src/pages/api/v1/goals/[id].ts`

**Zadania:**

1. Utworzyć nowy plik endpoint (jeśli nie istnieje, lub dodać PATCH handler)
2. Dodać `export const prerender = false`
3. Zaimplementować funkcję `PATCH`
4. Zaimportować wymagane zależności
5. Wyodrębnić userId z context.locals
6. Walidować URL parameter (:id)
7. Parse i walidować request body
8. Wywołać GoalService.updateGoal()
9. Zwrócić odpowiednie response (200, 400, 404, 500)
10. Obsłużyć wszystkie edge cases

**Szczegóły implementacji:**

```typescript
import type { APIRoute } from "astro";
import { GoalService } from "../../../../lib/services/goal.service";
import { goalIdParamSchema, validateUpdateGoalCommand } from "../../../../lib/validation/goal.validation";
import type {
  GoalDTO,
  ItemResponse,
  ValidationErrorResponse,
  ErrorResponse,
  UpdateGoalCommand,
} from "../../../../types";
import { z } from "zod";

export const prerender = false;

/**
 * PATCH /api/v1/goals/:id
 * Updates an existing long-term goal
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Extract user ID from context (DEFAULT_USER_ID)
    const userId = locals.userId as string;

    if (!userId) {
      const errorResponse: ErrorResponse = {
        error: "Unauthorized",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Validate goal ID from URL parameter
    const goalId = params.id;

    try {
      goalIdParamSchema.parse(goalId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError: ValidationErrorResponse = {
          error: "Validation failed",
          details: error.errors.map((err) => ({
            field: "id",
            message: err.message,
          })),
        };
        return new Response(JSON.stringify(validationError), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }

    // 3. Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      const errorResponse: ErrorResponse = {
        error: "Invalid JSON in request body",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Validate update data
    let updateData: UpdateGoalCommand;
    try {
      updateData = validateUpdateGoalCommand(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError: ValidationErrorResponse = {
          error: "Validation failed",
          details: error.errors.map((err) => ({
            field: err.path.join(".") || "body",
            message: err.message,
            received: err.input,
          })),
        };
        return new Response(JSON.stringify(validationError), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle "at least one field" error
      if (error instanceof Error) {
        const validationError: ValidationErrorResponse = {
          error: "Validation failed",
          details: [
            {
              field: "body",
              message: error.message,
            },
          ],
        };
        return new Response(JSON.stringify(validationError), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw error;
    }

    // 5. Get Supabase client from context
    const supabase = locals.supabase;

    if (!supabase) {
      throw new Error("Supabase client not available in context");
    }

    // 6. Update goal via service
    const goalService = new GoalService(supabase);
    const updatedGoal = await goalService.updateGoal(goalId!, userId, updateData);

    // 7. Handle not found
    if (!updatedGoal) {
      const errorResponse: ErrorResponse = {
        error: "Goal not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 8. Return success response
    const response: ItemResponse<GoalDTO> = {
      data: updatedGoal,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    // Log error for debugging
    console.error("Error in PATCH /api/v1/goals/:id:", error);

    // Return generic error response
    const errorResponse: ErrorResponse = {
      error: "Internal server error",
      message: "An unexpected error occurred",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

**Testing:**

- Test z poprawnymi danymi (200)
- Test z pojedynczym polem do update
- Test z wieloma polami do update
- Test z nullable fields (null dla description, category)
- Test z nieistniejącym goalId (404)
- Test z nieprawidłowym UUID (400)
- Test z pustym body (400)
- Test z nieprawidłowymi wartościami (400)
- Test z dodatkowym polem (400 - strict mode)
- Test z celem należącym do innego użytkownika (404)
- Test error handling (500)

---

### Krok 4: Implementacja DELETE endpoint

**Plik:** `src/pages/api/v1/goals/[id].ts` (ten sam plik co PATCH)

**Zadania:**

1. Dodać funkcję `DELETE` do istniejącego pliku
2. Wyodrębnić userId z context.locals
3. Walidować URL parameter (:id)
4. Wywołać GoalService.deleteGoal()
5. Zwrócić odpowiednie response (200, 404, 500)
6. Obsłużyć wszystkie edge cases

**Szczegóły implementacji:**

```typescript
/**
 * DELETE /api/v1/goals/:id
 * Deletes a long-term goal and all related milestones
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Extract user ID from context (DEFAULT_USER_ID)
    const userId = locals.userId as string;

    if (!userId) {
      const errorResponse: ErrorResponse = {
        error: "Unauthorized",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Validate goal ID from URL parameter
    const goalId = params.id;

    try {
      goalIdParamSchema.parse(goalId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError: ValidationErrorResponse = {
          error: "Validation failed",
          details: error.errors.map((err) => ({
            field: "id",
            message: err.message,
          })),
        };
        return new Response(JSON.stringify(validationError), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }

    // 3. Get Supabase client from context
    const supabase = locals.supabase;

    if (!supabase) {
      throw new Error("Supabase client not available in context");
    }

    // 4. Delete goal via service
    const goalService = new GoalService(supabase);
    const deleted = await goalService.deleteGoal(goalId!, userId);

    // 5. Handle not found
    if (!deleted) {
      const errorResponse: ErrorResponse = {
        error: "Goal not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 6. Return success response
    const response = {
      message: "Goal deleted successfully",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    // Log error for debugging
    console.error("Error in DELETE /api/v1/goals/:id:", error);

    // Return generic error response
    const errorResponse: ErrorResponse = {
      error: "Internal server error",
      message: "An unexpected error occurred",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

**Testing:**

- Test z istniejącym goalId (200)
- Test cascade delete (sprawdzić, że milestones zostały usunięte)
- Test SET NULL (sprawdzić, że weekly_goals.long_term_goal_id = NULL)
- Test z nieistniejącym goalId (404)
- Test z nieprawidłowym UUID (400)
- Test z celem należącym do innego użytkownika (404)
- Test error handling (500)

---

### Krok 5: Aktualizacja middleware (jeśli potrzebne)

**Plik:** `src/middleware/index.ts`

**Zadania:**

1. Sprawdzić, czy middleware ustawia `DEFAULT_USER_ID` w `locals.userId`
2. Sprawdzić, czy middleware przekazuje Supabase client w `locals.supabase`
3. Jeśli nie, dodać odpowiedni kod

**Szczegóły implementacji:**

```typescript
// Sprawdzić istniejący middleware i upewnić się, że zawiera:

export const onRequest = async (context, next) => {
  // Set DEFAULT_USER_ID
  context.locals.userId = "DEFAULT_USER_ID"; // lub faktyczna wartość z env

  // Set Supabase client
  context.locals.supabase = createSupabaseClient(); // lub istniejąca logika

  return next();
};
```

**Uwaga:** Ten krok może być już zaimplementowany. Sprawdzić istniejący kod.

---

### Krok 6: Utworzenie testów HTTP (opcjonalne)

**Plik:** `api-tests/goals-tests.http`

**Zadania:**

1. Utworzyć plik z testami HTTP dla wszystkich scenariuszy
2. Dodać testy dla PATCH endpoint
3. Dodać testy dla DELETE endpoint
4. Uwzględnić pozytywne i negatywne scenariusze

**Szczegóły implementacji:**

```http
### Variables
@baseUrl = http://localhost:4321
@apiPath = /api/v1
@validGoalId = PASTE_VALID_UUID_HERE
@invalidGoalId = not-a-uuid
@nonExistentGoalId = 00000000-0000-0000-0000-000000000000

### ========================================
### PATCH Tests
### ========================================

### PATCH - Success: Update single field (title)
PATCH {{baseUrl}}{{apiPath}}/goals/{{validGoalId}}
Content-Type: application/json

{
  "title": "Updated Goal Title"
}

### PATCH - Success: Update multiple fields
PATCH {{baseUrl}}{{apiPath}}/goals/{{validGoalId}}
Content-Type: application/json

{
  "title": "Launch MVP v2.0",
  "progress_percentage": 75,
  "category": "work"
}

### PATCH - Success: Set nullable field to null
PATCH {{baseUrl}}{{apiPath}}/goals/{{validGoalId}}
Content-Type: application/json

{
  "description": null,
  "category": null
}

### PATCH - Error: Invalid UUID
PATCH {{baseUrl}}{{apiPath}}/goals/{{invalidGoalId}}
Content-Type: application/json

{
  "title": "Updated Title"
}

### PATCH - Error: Goal not found
PATCH {{baseUrl}}{{apiPath}}/goals/{{nonExistentGoalId}}
Content-Type: application/json

{
  "title": "Updated Title"
}

### PATCH - Error: Empty body
PATCH {{baseUrl}}{{apiPath}}/goals/{{validGoalId}}
Content-Type: application/json

{}

### PATCH - Error: Invalid category
PATCH {{baseUrl}}{{apiPath}}/goals/{{validGoalId}}
Content-Type: application/json

{
  "category": "invalid_category"
}

### PATCH - Error: Progress out of range
PATCH {{baseUrl}}{{apiPath}}/goals/{{validGoalId}}
Content-Type: application/json

{
  "progress_percentage": 150
}

### PATCH - Error: Position out of range
PATCH {{baseUrl}}{{apiPath}}/goals/{{validGoalId}}
Content-Type: application/json

{
  "position": 10
}

### PATCH - Error: Unknown field (strict mode)
PATCH {{baseUrl}}{{apiPath}}/goals/{{validGoalId}}
Content-Type: application/json

{
  "title": "Valid Title",
  "unknown_field": "should fail"
}

### ========================================
### DELETE Tests
### ========================================

### DELETE - Success: Delete existing goal
DELETE {{baseUrl}}{{apiPath}}/goals/{{validGoalId}}

### DELETE - Error: Invalid UUID
DELETE {{baseUrl}}{{apiPath}}/goals/{{invalidGoalId}}

### DELETE - Error: Goal not found
DELETE {{baseUrl}}{{apiPath}}/goals/{{nonExistentGoalId}}

### DELETE - Error: Already deleted (idempotency test)
DELETE {{baseUrl}}{{apiPath}}/goals/{{validGoalId}}
```

**Testing:**

- Uruchomić wszystkie testy HTTP
- Sprawdzić response codes
- Sprawdzić strukturę response bodies
- Sprawdzić cascade delete w bazie danych

---

### Krok 7: Weryfikacja i testowanie

**Zadania:**

1. Uruchomić serwer developerski: `npm run dev`
2. Uruchomić testy HTTP z Kroku 6
3. Sprawdzić logi serwera pod kątem błędów
4. Sprawdzić bazę danych po DELETE (czy milestones zostały usunięte)
5. Sprawdzić updated_at po PATCH (czy trigger działa)
6. Przetestować edge cases:
   - Równoczesne PATCH requests
   - PATCH po DELETE
   - DELETE z wieloma milestones
7. Sprawdzić linter errors: `npm run lint`
8. Naprawić wszystkie znalezione błędy

**Checklist:**

- [ ] PATCH zwraca 200 dla poprawnych danych
- [ ] PATCH zwraca 400 dla nieprawidłowych danych
- [ ] PATCH zwraca 404 dla nieistniejącego celu
- [ ] PATCH zwraca 404 dla celu innego użytkownika
- [ ] PATCH aktualizuje tylko podane pola (partial update)
- [ ] PATCH akceptuje nullable values (null dla description, category)
- [ ] PATCH odrzuca puste body
- [ ] PATCH odrzuca dodatkowe pola (strict mode)
- [ ] DELETE zwraca 200 dla poprawnego usunięcia
- [ ] DELETE zwraca 404 dla nieistniejącego celu
- [ ] DELETE zwraca 404 dla celu innego użytkownika
- [ ] DELETE kaskadowo usuwa milestones
- [ ] DELETE ustawia NULL w weekly_goals.long_term_goal_id
- [ ] Wszystkie błędy są prawidłowo formatowane
- [ ] Wszystkie response zawierają odpowiednie headers
- [ ] Linter nie pokazuje błędów
- [ ] Kod jest zgodny z guidelines (early returns, error handling)

---

### Krok 8: Dokumentacja i cleanup

**Zadania:**

1. Sprawdzić, czy wszystkie funkcje mają JSDoc comments
2. Sprawdzić, czy wszystkie error cases są udokumentowane
3. Zaktualizować API documentation (jeśli istnieje osobny plik)
4. Dodać przykłady użycia w komentarzach
5. Usunąć zbędne console.log() (pozostawić tylko console.error dla błędów)
6. Upewnić się, że kod spełnia guidelines z .cursorrules

**Final checklist:**

- [ ] Wszystkie pliki mają odpowiednie comments
- [ ] Service methods mają JSDoc z @params i @returns
- [ ] Validation schemas mają opisowe error messages
- [ ] Endpoints mają header comments z opisem
- [ ] Wszystkie edge cases są obsłużone
- [ ] Error handling używa early returns
- [ ] Happy path jest na końcu funkcji
- [ ] Nie ma zbędnych console.log()
- [ ] Kod jest czytelny i maintainable
- [ ] Wszystkie typy są prawidłowo używane

---

## 10. Podsumowanie

### 10.1. Pliki do utworzenia

1. **src/lib/validation/goal.validation.ts**
   - Schematy Zod dla walidacji
   - Eksport: `goalIdParamSchema`, `updateGoalSchema`, `validateUpdateGoalCommand`

2. **src/lib/services/goal.service.ts**
   - Logika biznesowa dla operacji na goals
   - Eksport: `GoalService` class z metodami `getGoalById`, `updateGoal`, `deleteGoal`

3. **src/pages/api/v1/goals/[id].ts**
   - Endpoints PATCH i DELETE
   - Eksport: `PATCH` i `DELETE` functions

4. **api-tests/goals-tests.http** (opcjonalnie)
   - Testy HTTP dla wszystkich scenariuszy

### 10.2. Pliki do zmodyfikowania

1. **src/middleware/index.ts** (jeśli potrzebne)
   - Upewnić się, że ustawia `locals.userId` i `locals.supabase`

### 10.3. Zależności

- Wszystkie potrzebne typy są już zdefiniowane w `src/types.ts`
- Supabase client jest już skonfigurowany
- Zod jest już zainstalowany

### 10.4. Kluczowe punkty implementacji

1. **Weryfikacja właściciela:**
   - Zawsze JOIN przez `plans` table
   - Nigdy nie expose informacji o istnieniu celu należącego do innego użytkownika

2. **Partial updates (PATCH):**
   - Wszystkie pola opcjonalne
   - Co najmniej jedno pole wymagane
   - Aktualizuj tylko podane pola

3. **Cascade delete:**
   - Database automatycznie usuwa milestones
   - Database automatycznie ustawia NULL w weekly_goals

4. **Error handling:**
   - Walidacja przed database operations
   - Early returns dla error conditions
   - Generic error messages dla 500 errors (nie ujawniaj database details)

5. **Security:**
   - UUID validation w URL
   - Ownership verification przez JOIN
   - Strict mode w Zod (reject unknown fields)
   - No SQL injection (Supabase prepared statements)

### 10.5. Typowe pułapki do uniknięcia

1. ❌ Nie sprawdzać ownership tylko po `goal.id` - zawsze JOIN przez `plans.user_id`
2. ❌ Nie akceptować `plan_id` w PATCH body - pole nie jest edytowalne
3. ❌ Nie zwracać różnych error messages dla "not found" vs "belongs to another user"
4. ❌ Nie zapominać o walidacji UUID przed query
5. ❌ Nie używać `.single()` dla queries, które mogą zwrócić 0 rows - użyć `.maybeSingle()`
6. ❌ Nie logować sensitive data w error logs
7. ❌ Nie ujawniać database error details w response (tylko w console)
8. ❌ Nie zapominać o strict mode w Zod schemas

### 10.6. Performance considerations

- Używaj istniejących indexes (covered in section 8)
- 2-3 queries dla PATCH, 2 queries dla DELETE
- Expected latency: 10-200ms (depending on network)
- Cascade delete jest wydajny dla małej liczby milestones (1-5)

### 10.7. Future improvements

- Optimistic locking dla conflict detection
- Soft delete zamiast hard delete (archiwizacja)
- Rate limiting
- Request validation middleware
- Automated integration tests
- Performance monitoring

---

## Załącznik A: Przykładowe Response Bodies

### A.1. PATCH Success (200 OK)

```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "plan_id": "123e4567-e89b-12d3-a456-426614174001",
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

### A.2. DELETE Success (200 OK)

```json
{
  "message": "Goal deleted successfully"
}
```

### A.3. Validation Error (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "progress_percentage",
      "message": "Progress must be between 0 and 100",
      "received": 150
    }
  ]
}
```

### A.4. Not Found (404 Not Found)

```json
{
  "error": "Goal not found"
}
```

### A.5. Unauthorized (401 Unauthorized)

```json
{
  "error": "Unauthorized"
}
```

### A.6. Server Error (500 Internal Server Error)

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Załącznik B: Database Query Examples

### B.1. PATCH - Verify Ownership

```sql
SELECT g.*
FROM long_term_goals g
INNER JOIN plans p ON g.plan_id = p.id
WHERE g.id = '123e4567-e89b-12d3-a456-426614174000'
  AND p.user_id = 'DEFAULT_USER_ID';
```

### B.2. PATCH - Update Goal

```sql
UPDATE long_term_goals
SET
  title = 'Updated Title',
  progress_percentage = 75,
  updated_at = NOW()
WHERE id = '123e4567-e89b-12d3-a456-426614174000';
```

### B.3. DELETE - Verify Ownership

```sql
SELECT g.id
FROM long_term_goals g
INNER JOIN plans p ON g.plan_id = p.id
WHERE g.id = '123e4567-e89b-12d3-a456-426614174000'
  AND p.user_id = 'DEFAULT_USER_ID';
```

### B.4. DELETE - Delete Goal (with cascade)

```sql
-- This single DELETE triggers cascade
DELETE FROM long_term_goals
WHERE id = '123e4567-e89b-12d3-a456-426614174000';

-- Database automatically executes:
-- 1. DELETE FROM milestones WHERE long_term_goal_id = '...'
-- 2. UPDATE weekly_goals SET long_term_goal_id = NULL WHERE long_term_goal_id = '...'
```

---

## Załącznik C: Supabase Query Examples

### C.1. Get Goal with Ownership Verification

```typescript
const { data, error } = await supabase
  .from("long_term_goals")
  .select(
    `
    *,
    plans!inner(user_id)
  `
  )
  .eq("id", goalId)
  .eq("plans.user_id", userId)
  .maybeSingle();
```

### C.2. Update Goal

```typescript
const { data, error } = await supabase
  .from("long_term_goals")
  .update({
    title: "Updated Title",
    progress_percentage: 75,
  })
  .eq("id", goalId)
  .select()
  .single();
```

### C.3. Delete Goal

```typescript
const { error } = await supabase.from("long_term_goals").delete().eq("id", goalId);
```

---

**Koniec dokumentu**
