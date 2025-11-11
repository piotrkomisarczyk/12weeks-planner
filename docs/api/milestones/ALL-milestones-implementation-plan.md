# API Endpoint Implementation Plan: Milestones

## 1. Przegląd punktów końcowych

Zestaw endpointów REST API do zarządzania kamieniami milowymi (milestones) w ramach celów długoterminowych. Milestones reprezentują kluczowe etapy w realizacji celu długoterminowego. Każdy cel może mieć maksymalnie 5 kamieni milowych.

**Endpoints do zaimplementowania:**
1. `GET /api/v1/milestones` - lista milestones z filtrami
2. `GET /api/v1/goals/:goalId/milestones` - milestones dla konkretnego celu
3. `GET /api/v1/milestones/:id` - pojedynczy milestone
4. `POST /api/v1/milestones` - tworzenie nowego milestone
5. `PATCH /api/v1/milestones/:id` - aktualizacja milestone
6. `DELETE /api/v1/milestones/:id` - usuwanie milestone

**Ograniczenia biznesowe:**
- Maksymalnie 5 milestones na goal (enforced przez database trigger)
- Position range: 1-5
- ⚠️ **MVP Mode**: Brak RLS i autentykacji - wszystkie operacje używają `DEFAULT_USER_ID`

---

## 2. Szczegóły żądań

### 2.1. GET /api/v1/milestones

**Metoda HTTP:** GET

**Struktura URL:** `/api/v1/milestones`

**Query Parameters:**
- `long_term_goal_id` (opcjonalny): UUID - filtrowanie po ID celu
- `is_completed` (opcjonalny): boolean - filtrowanie po statusie ukończenia (true/false)
- `limit` (opcjonalny): number - liczba wyników (default: 50, max: 100)
- `offset` (opcjonalny): number - offset dla paginacji (default: 0)

**Request Body:** Brak

**Headers:** Brak (MVP - bez autentykacji)

---

### 2.2. GET /api/v1/goals/:goalId/milestones

**Metoda HTTP:** GET

**Struktura URL:** `/api/v1/goals/:goalId/milestones`

**URL Parameters:**
- `goalId` (wymagany): UUID - ID celu długoterminowego

**Query Parameters:** Brak

**Request Body:** Brak

**Headers:** Brak (MVP - bez autentykacji)

---

### 2.3. GET /api/v1/milestones/:id

**Metoda HTTP:** GET

**Struktura URL:** `/api/v1/milestones/:id`

**URL Parameters:**
- `id` (wymagany): UUID - ID milestone

**Query Parameters:** Brak

**Request Body:** Brak

**Headers:** Brak (MVP - bez autentykacji)

---

### 2.4. POST /api/v1/milestones

**Metoda HTTP:** POST

**Struktura URL:** `/api/v1/milestones`

**URL Parameters:** Brak

**Query Parameters:** Brak

**Request Body:**
```json
{
  "long_term_goal_id": "uuid",
  "title": "Complete API design",
  "description": "Design all REST endpoints",
  "due_date": "2025-01-20",
  "position": 1
}
```

**Pola:**
- `long_term_goal_id` (wymagane): UUID - ID celu długoterminowego
- `title` (wymagane): string - tytuł milestone (max 255 znaków)
- `description` (opcjonalne): string - opis milestone
- `due_date` (opcjonalne): string - data w formacie ISO 8601 (YYYY-MM-DD)
- `position` (opcjonalne): number - pozycja w kolejności (1-5, default: 1)

**Headers:**
- `Content-Type: application/json` (wymagany)

---

### 2.5. PATCH /api/v1/milestones/:id

**Metoda HTTP:** PATCH

**Struktura URL:** `/api/v1/milestones/:id`

**URL Parameters:**
- `id` (wymagany): UUID - ID milestone

**Query Parameters:** Brak

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "due_date": "2025-02-20",
  "is_completed": true,
  "position": 2
}
```

**Pola (wszystkie opcjonalne):**
- `title`: string - nowy tytuł (max 255 znaków)
- `description`: string - nowy opis
- `due_date`: string - nowa data (ISO 8601)
- `is_completed`: boolean - status ukończenia
- `position`: number - nowa pozycja (1-5)

**Headers:**
- `Content-Type: application/json` (wymagany)

---

### 2.6. DELETE /api/v1/milestones/:id

**Metoda HTTP:** DELETE

**Struktura URL:** `/api/v1/milestones/:id`

**URL Parameters:**
- `id` (wymagany): UUID - ID milestone

**Query Parameters:** Brak

**Request Body:** Brak

**Headers:** Brak (MVP - bez autentykacji)

---

## 3. Wykorzystywane typy

### 3.1. DTOs (Data Transfer Objects)

**MilestoneDTO** - odpowiedź GET (mapuje na `milestones` table row):
```typescript
type MilestoneDTO = {
  id: string;
  long_term_goal_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}
```

### 3.2. Command Models

**CreateMilestoneCommand** - request body dla POST:
```typescript
type CreateMilestoneCommand = Pick<
  MilestoneInsert,
  'long_term_goal_id' | 'title' | 'description' | 'due_date' | 'position'
>;
```

**UpdateMilestoneCommand** - request body dla PATCH:
```typescript
type UpdateMilestoneCommand = Partial<
  Pick<MilestoneUpdate, 'title' | 'description' | 'due_date' | 'is_completed' | 'position'>
>;
```

### 3.3. Response Wrappers

**ListResponse** - dla list endpoints:
```typescript
interface ListResponse<T> {
  data: T[];
  count?: number;
}
```

**ItemResponse** - dla single item endpoints:
```typescript
interface ItemResponse<T> {
  data: T;
}
```

**SuccessResponse** - dla DELETE:
```typescript
interface SuccessResponse {
  message: string;
}
```

### 3.4. Error Types

**ValidationErrorResponse** - błędy walidacji (400):
```typescript
interface ValidationErrorResponse {
  error: 'Validation failed';
  details: Array<{
    field: string;
    message: string;
    received?: unknown;
  }>;
}
```

**ErrorResponse** - ogólne błędy:
```typescript
interface ErrorResponse {
  error: string;
  message?: string;
}
```

---

## 4. Szczegóły odpowiedzi

### 4.1. GET /api/v1/milestones

**Sukces - 200 OK:**
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

**Błąd - 400 Bad Request:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "long_term_goal_id",
      "message": "Invalid UUID format"
    }
  ]
}
```

---

### 4.2. GET /api/v1/goals/:goalId/milestones

**Sukces - 200 OK:**
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

**Błąd - 404 Not Found:**
```json
{
  "error": "Not Found",
  "message": "Goal not found or access denied"
}
```

---

### 4.3. GET /api/v1/milestones/:id

**Sukces - 200 OK:**
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

**Błąd - 404 Not Found:**
```json
{
  "error": "Not Found",
  "message": "Milestone not found or access denied"
}
```

---

### 4.4. POST /api/v1/milestones

**Sukces - 201 Created:**
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

**Błąd - 400 Bad Request (Validation):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title is required and must be max 255 characters"
    }
  ]
}
```

**Błąd - 400 Bad Request (Constraint):**
```json
{
  "error": "Bad Request",
  "message": "Cannot add more than 5 milestones to a goal"
}
```

**Błąd - 404 Not Found:**
```json
{
  "error": "Not Found",
  "message": "Goal not found or access denied"
}
```

---

### 4.5. PATCH /api/v1/milestones/:id

**Sukces - 200 OK:**
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

**Błąd - 404 Not Found:**
```json
{
  "error": "Not Found",
  "message": "Milestone not found or access denied"
}
```

**Błąd - 400 Bad Request:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "position",
      "message": "Position must be between 1 and 5"
    }
  ]
}
```

---

### 4.6. DELETE /api/v1/milestones/:id

**Sukces - 200 OK:**
```json
{
  "message": "Milestone deleted successfully"
}
```

**Błąd - 404 Not Found:**
```json
{
  "error": "Not Found",
  "message": "Milestone not found or access denied"
}
```

---

## 5. Przepływ danych

### 5.1. Architektura warstw

```
Client Request
    ↓
API Route Handler (/api/v1/milestones/...)
    ↓
Input Validation (Zod schemas)
    ↓
Service Layer (milestone.service.ts)
    ↓
Database Layer (Supabase Client)
    ↓
Response Formatting
    ↓
Client Response
```

**⚠️ MVP Mode:**
- Brak uwierzytelniania - używamy `DEFAULT_USER_ID`
- RLS wyłączone - zostanie włączone po implementacji wszystkich endpointów

### 5.2. GET /api/v1/milestones - Przepływ

1. **Endpoint**: Odbiera request z query params
2. **Walidacja**: Sprawdza poprawność query params (UUID format, boolean values, numeric limits)
3. **Service**: `milestoneService.listMilestones(filters, DEFAULT_USER_ID)`
4. **Database Query**:
   ```sql
   SELECT * FROM milestones
   WHERE (long_term_goal_id = $1 OR $1 IS NULL)
     AND (is_completed = $2 OR $2 IS NULL)
   ORDER BY position ASC
   LIMIT $3 OFFSET $4
   ```
5. **Response**: Zwraca `ListResponse<MilestoneDTO>` z count

**⚠️ MVP:** Bez sprawdzania user_id - wszystkie milestones są dostępne dla DEFAULT_USER_ID

### 5.3. GET /api/v1/goals/:goalId/milestones - Przepływ

1. **Endpoint**: Odbiera request z goalId w URL
2. **Walidacja**: Sprawdza poprawność UUID dla goalId
3. **Service**: `milestoneService.getMilestonesByGoalId(goalId, DEFAULT_USER_ID)`
4. **Database Query**:
   ```sql
   SELECT * FROM milestones
   WHERE long_term_goal_id = $1
   ORDER BY position ASC
   ```
5. **Weryfikacja**: Jeśli query zwróci 0 wyników, sprawdź czy goal istnieje
6. **Response**: Zwraca `ListResponse<MilestoneDTO>` lub 404 jeśli goal nie istnieje

### 5.4. GET /api/v1/milestones/:id - Przepływ

1. **Endpoint**: Odbiera request z id w URL
2. **Walidacja**: Sprawdza poprawność UUID dla id
3. **Service**: `milestoneService.getMilestoneById(id, DEFAULT_USER_ID)`
4. **Database Query**:
   ```sql
   SELECT * FROM milestones WHERE id = $1
   ```
5. **Response**: Zwraca `ItemResponse<MilestoneDTO>` lub 404 jeśli nie znaleziono

### 5.5. POST /api/v1/milestones - Przepływ

1. **Endpoint**: Odbiera request z body JSON
2. **Walidacja**: Sprawdza poprawność danych wg CreateMilestoneCommand schema
3. **Service**: `milestoneService.createMilestone(data, DEFAULT_USER_ID)`
4. **Weryfikacja Goal**: Sprawdza czy goal istnieje
5. **Database Insert**:
   ```sql
   INSERT INTO milestones (long_term_goal_id, title, description, due_date, position)
   VALUES ($1, $2, $3, $4, $5)
   RETURNING *
   ```
6. **Database Trigger**: `check_milestone_count` weryfikuje limit 5 milestones
7. **Response**: Zwraca `ItemResponse<MilestoneDTO>` z kodem 201

### 5.6. PATCH /api/v1/milestones/:id - Przepływ

1. **Endpoint**: Odbiera request z id w URL i body JSON
2. **Walidacja**: Sprawdza poprawność UUID i danych wg UpdateMilestoneCommand schema
3. **Service**: `milestoneService.updateMilestone(id, data, DEFAULT_USER_ID)`
4. **Database Update**:
   ```sql
   UPDATE milestones
   SET title = COALESCE($1, title),
       description = COALESCE($2, description),
       due_date = COALESCE($3, due_date),
       is_completed = COALESCE($4, is_completed),
       position = COALESCE($5, position),
       updated_at = NOW()
   WHERE id = $6
   RETURNING *
   ```
5. **Response**: Zwraca `ItemResponse<MilestoneDTO>` lub 404 jeśli nie znaleziono

### 5.7. DELETE /api/v1/milestones/:id - Przepływ

1. **Endpoint**: Odbiera request z id w URL
2. **Walidacja**: Sprawdza poprawność UUID dla id
3. **Service**: `milestoneService.deleteMilestone(id, DEFAULT_USER_ID)`
4. **Database Delete**:
   ```sql
   DELETE FROM milestones WHERE id = $1 RETURNING id
   ```
5. **Cascade**: Automatycznie ustawia `milestone_id = NULL` w powiązanych tasks (ON DELETE SET NULL)
6. **Response**: Zwraca `SuccessResponse` z message lub 404 jeśli nie znaleziono

---

## 6. Względy bezpieczeństwa

### 6.1. MVP Mode - Uproszczone bezpieczeństwo

**⚠️ Obecny stan (MVP):**
- Brak uwierzytelniania JWT
- Brak RLS policies
- Wszystkie operacje używają `DEFAULT_USER_ID` z `supabase.client.ts`
- Brak izolacji danych między użytkownikami

**Implementacja MVP:**
```typescript
// src/db/supabase.client.ts
export const DEFAULT_USER_ID = 'default-user-uuid';

// W route handlers
import { DEFAULT_USER_ID } from '../../../db/supabase.client';

// Używamy DEFAULT_USER_ID zamiast locals.user.id
const result = await service.method(data, DEFAULT_USER_ID);
```

**🔒 Planowane (Po MVP):**
- Włączenie RLS policies na wszystkich tabelach
- Implementacja JWT authentication przez Supabase Auth
- Middleware sprawdzający tokeny
- Izolacja danych per user (auth.uid())

### 6.2. Walidacja danych wejściowych (Aktywna w MVP)

**Zod Schemas w milestone.validation.ts:**

```typescript
// Query params dla GET /api/v1/milestones
const listMilestonesQuerySchema = z.object({
  long_term_goal_id: z.string().uuid().optional(),
  is_completed: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// Body dla POST
const createMilestoneSchema = z.object({
  long_term_goal_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  position: z.number().int().min(1).max(5).default(1),
});

// Body dla PATCH
const updateMilestoneSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  is_completed: z.boolean().optional(),
  position: z.number().int().min(1).max(5).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

// UUID validation helper
const uuidSchema = z.string().uuid();
```

**Ochrona przed:**
- SQL Injection (parametryzowane queries + walidacja UUID)
- XSS (sanityzacja stringów, brak HTML rendering)
- NoSQL Injection (nie dotyczy PostgreSQL)
- Type coercion attacks (strict type checking)

### 6.3. Ograniczenia biznesowe (Aktywne w MVP)

**Ograniczenia biznesowe (enforced przez DB triggers):**
- Maksymalnie 5 milestones per goal (`check_milestone_count` trigger)
- Position range: 1-5
- Title max 255 characters

**Monitoring (opcjonalne dla MVP):**
- Logowanie prób przekroczenia limitów biznesowych
- Error tracking (console.error)

---

## 7. Obsługa błędów

### 7.1. Tabela kodów statusu

| Kod | Scenariusz | Response Body |
|-----|------------|---------------|
| 200 | Sukces GET/PATCH/DELETE | `{ data: {...} }` lub `{ message: "..." }` |
| 201 | Sukces POST | `{ data: {...} }` |
| 400 | Błąd walidacji | `{ error: "Validation failed", details: [...] }` |
| 400 | Constraint violation (max milestones) | `{ error: "Bad Request", message: "Cannot add more than 5 milestones to a goal" }` |
| 404 | Milestone nie istnieje | `{ error: "Not Found", message: "Milestone not found" }` |
| 404 | Goal nie istnieje | `{ error: "Not Found", message: "Goal not found or access denied" }` |
| 500 | Błąd serwera/bazy danych | `{ error: "Internal Server Error", message: "..." }` |

### 7.2. Szczegółowe scenariusze błędów

#### 7.2.1. GET /api/v1/milestones

**400 Bad Request:**
```typescript
// Invalid UUID format
{
  error: "Validation failed",
  details: [
    {
      field: "long_term_goal_id",
      message: "Invalid UUID format",
      received: "not-a-uuid"
    }
  ]
}

// Invalid is_completed value
{
  error: "Validation failed",
  details: [
    {
      field: "is_completed",
      message: "Must be 'true' or 'false'",
      received: "yes"
    }
  ]
}

// Invalid limit
{
  error: "Validation failed",
  details: [
    {
      field: "limit",
      message: "Must be between 1 and 100",
      received: 200
    }
  ]
}
```

**500 Internal Server Error:**
```typescript
{
  error: "Internal Server Error",
  message: "An unexpected error occurred"
}
```

#### 7.2.2. GET /api/v1/goals/:goalId/milestones

**400 Bad Request:**
```typescript
// Invalid goalId UUID
{
  error: "Validation failed",
  details: [
    {
      field: "goalId",
      message: "Invalid UUID format",
      received: "123"
    }
  ]
}
```

**404 Not Found:**
```typescript
// Goal doesn't exist or belongs to another user
{
  error: "Not Found",
  message: "Goal not found or access denied"
}
```

#### 7.2.3. GET /api/v1/milestones/:id

**400 Bad Request:**
```typescript
// Invalid id UUID
{
  error: "Validation failed",
  details: [
    {
      field: "id",
      message: "Invalid UUID format",
      received: "abc-123"
    }
  ]
}
```

**404 Not Found:**
```typescript
// Milestone doesn't exist or belongs to another user
{
  error: "Not Found",
  message: "Milestone not found or access denied"
}
```

#### 7.2.4. POST /api/v1/milestones

**400 Bad Request - Validation:**
```typescript
// Missing required fields
{
  error: "Validation failed",
  details: [
    {
      field: "long_term_goal_id",
      message: "Required"
    },
    {
      field: "title",
      message: "Required"
    }
  ]
}

// Title too long
{
  error: "Validation failed",
  details: [
    {
      field: "title",
      message: "Must be max 255 characters",
      received: "very long title..."
    }
  ]
}

// Invalid date format
{
  error: "Validation failed",
  details: [
    {
      field: "due_date",
      message: "Must be in YYYY-MM-DD format",
      received: "20/01/2025"
    }
  ]
}

// Position out of range
{
  error: "Validation failed",
  details: [
    {
      field: "position",
      message: "Must be between 1 and 5",
      received: 10
    }
  ]
}
```

**400 Bad Request - Constraint:**
```typescript
// Max milestones exceeded (database trigger)
{
  error: "Bad Request",
  message: "Cannot add more than 5 milestones to a goal"
}
```

**404 Not Found:**
```typescript
// Goal doesn't exist or belongs to another user
{
  error: "Not Found",
  message: "Goal not found or access denied"
}
```

#### 7.2.5. PATCH /api/v1/milestones/:id

**400 Bad Request:**
```typescript
// No fields provided
{
  error: "Validation failed",
  details: [
    {
      field: "_root",
      message: "At least one field must be provided for update"
    }
  ]
}

// Invalid field values (same validation as POST)
{
  error: "Validation failed",
  details: [
    {
      field: "position",
      message: "Must be between 1 and 5",
      received: 0
    }
  ]
}
```

**404 Not Found:**
```typescript
{
  error: "Not Found",
  message: "Milestone not found or access denied"
}
```

#### 7.2.6. DELETE /api/v1/milestones/:id

**404 Not Found:**
```typescript
{
  error: "Not Found",
  message: "Milestone not found or access denied"
}
```

### 7.3. Error Handling Pattern w kodzie

```typescript
// W route handler
try {
  // Walidacja
  const validatedData = schema.parse(data);
  
  // Service call
  const result = await milestoneService.method(validatedData, userId);
  
  // Success response
  return new Response(JSON.stringify({ data: result }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
  
} catch (error) {
  // Zod validation error
  if (error instanceof z.ZodError) {
    return new Response(JSON.stringify({
      error: 'Validation failed',
      details: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
        received: e.received
      }))
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Database constraint error
  if (error.message.includes('Cannot add more than 5 milestones')) {
    return new Response(JSON.stringify({
      error: 'Bad Request',
      message: error.message
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Not found error
  if (error.message.includes('not found') || error.message.includes('access denied')) {
    return new Response(JSON.stringify({
      error: 'Not Found',
      message: error.message
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Generic server error
  console.error('Unexpected error:', error);
  return new Response(JSON.stringify({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 7.4. Logging strategia

**Development:**
- `console.log()` dla debug info
- `console.error()` dla błędów z pełnym stack trace

**Production:**
- Structured logging (np. Winston, Pino)
- Log levels: ERROR, WARN, INFO, DEBUG
- Logowanie do pliku lub external service (Sentry, LogRocket)
- Nie logować sensitive data (tokens, passwords)

**Co logować:**
- Wszystkie błędy 500 z full stack trace
- Database constraint violations (max milestones exceeded)
- Request metadata: timestamp, endpoint, method
- ⚠️ MVP: userId zawsze będzie DEFAULT_USER_ID

---

## 8. Rozważania dotyczące wydajności

### 8.1. Database Query Optimization

**Istniejące indeksy (z db-plan.md):**
```sql
-- Primary key index (automatic)
CREATE INDEX milestones_pkey ON milestones(id);

-- Foreign key indexes
CREATE INDEX idx_milestones_long_term_goal_id ON milestones(long_term_goal_id);

-- Position ordering
CREATE INDEX idx_milestones_position ON milestones(long_term_goal_id, position);

-- Completion status filtering
CREATE INDEX idx_milestones_is_completed ON milestones(is_completed);

-- Partial index dla incomplete milestones (często używane)
CREATE INDEX idx_milestones_incomplete ON milestones(long_term_goal_id) 
WHERE is_completed = FALSE;
```

**Query performance:**
- GET list z filtrami: używa `idx_milestones_long_term_goal_id` + `idx_milestones_is_completed`
- GET by goal: używa `idx_milestones_long_term_goal_id` + `idx_milestones_position`
- GET by id: używa primary key index (najszybsze)
- Wszystkie queries automatycznie ograniczone przez RLS policies

**Expected performance:**
- GET by id: <5ms
- GET list (without filters): <10ms
- GET list (with filters): <15ms
- POST/PATCH/DELETE: <20ms

### 8.2. Caching Strategy

**Dla MVP (opcjonalne):**
- Brak cachingu - database queries są wystarczająco szybkie
- Supabase PostgREST ma wbudowane connection pooling

**Dla produkcji (future consideration):**
- Redis cache dla często odczytywanych milestones
- Cache key: `milestone:{userId}:{goalId}`
- TTL: 5 minut
- Invalidation przy POST/PATCH/DELETE

### 8.3. Pagination

**Implementacja:**
- Cursor-based pagination preferowana nad offset-based dla dużych zbiorów
- Default limit: 50, max: 100
- Dla małych zbiorów (max 5 milestones per goal) pagination nie jest krytyczne

**Optymalizacja dla GET /api/v1/milestones:**
```typescript
// Zamiast COUNT(*) dla total (wolne dla dużych tabel)
// Używamy estimate lub pomijamy total count
const { data, error } = await supabase
  .from('milestones')
  .select('*', { count: 'estimated' }) // lub { count: 'exact' } jeśli potrzebne
  .range(offset, offset + limit - 1);
```

### 8.4. N+1 Query Problem

**Zapobieganie:**
- GET /api/v1/goals/:goalId/milestones już zwraca wszystkie milestones w jednym query
- Nie ma potrzeby dodatkowych queries dla related data w kontekście milestones

### 8.5. Request/Response Size Optimization

**Gzip compression:**
- Włączyć w Astro config dla JSON responses
- Redukcja rozmiaru response o ~70%

**Field selection (future enhancement):**
- Query param `fields` dla wyboru zwracanych pól
- Przykład: `?fields=id,title,is_completed` - zwróci tylko wybrane pola

### 8.6. Database Connection Pooling

**Supabase:**
- Wbudowane connection pooling (PgBouncer)
- Transaction pooling mode
- Max connections: zależne od planu (free tier: 60)

**Best practices:**
- Nie trzymać długo żyjących connections
- Używać prepared statements (automatycznie przez Supabase SDK)
- Zamykać connections po każdym request (automatyczne w serverless)

### 8.7. Monitoring i Profiling

**Metryki do monitorowania:**
- Response time per endpoint (p50, p95, p99)
- Error rate (4xx, 5xx)
- Database query time
- Active connections count

**Tools:**
- Supabase Dashboard: query performance
- Astro dev tools: SSR performance
- APM tools (New Relic, DataDog) dla produkcji

### 8.8. Potencjalne wąskie gardła

**Identyfikowane bottlenecks:**
1. RLS policies z JOIN przez 3 tabele (milestones → goals → plans)
   - Mitigation: indeksy na foreign keys, query planner optimization
2. Concurrent updates tego samego milestone
   - Mitigation: optimistic locking, row-level locks
3. Database triggers (check_milestone_count)
   - Mitigation: trigger już jest zoptymalizowany (COUNT tylko dla specific goal)

---

## 9. Etapy implementacji

### Krok 1: Przygotowanie struktury plików

**Utworzyć następujące pliki:**

```
src/
├── lib/
│   ├── services/
│   │   └── milestone.service.ts          # Service layer
│   └── validation/
│       └── milestone.validation.ts        # Zod schemas
└── pages/
    └── api/
        └── v1/
            ├── milestones/
            │   └── [id].ts                # GET/PATCH/DELETE /milestones/:id
            ├── milestones.ts              # GET/POST /milestones (nie istnieje jeszcze)
            └── goals/
                └── [goalId]/
                    └── milestones.ts      # GET /goals/:goalId/milestones
```

**Uwaga:** Sprawdzić czy struktura goals/ już istnieje, jeśli nie - utworzyć.

---

### Krok 2: Implementacja validation schemas

**Plik: `src/lib/validation/milestone.validation.ts`**

```typescript
import { z } from 'zod';

// UUID validation helper
export const uuidSchema = z.string().uuid({
  message: 'Invalid UUID format'
});

// Query params dla GET /api/v1/milestones
export const listMilestonesQuerySchema = z.object({
  long_term_goal_id: uuidSchema.optional(),
  is_completed: z.enum(['true', 'false'], {
    errorMap: () => ({ message: "Must be 'true' or 'false'" })
  }).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// Body schema dla POST /api/v1/milestones
export const createMilestoneSchema = z.object({
  long_term_goal_id: uuidSchema,
  title: z.string()
    .min(1, { message: 'Title is required' })
    .max(255, { message: 'Title must be max 255 characters' }),
  description: z.string().optional().nullable(),
  due_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Must be in YYYY-MM-DD format' })
    .optional()
    .nullable(),
  position: z.number()
    .int({ message: 'Position must be an integer' })
    .min(1, { message: 'Position must be at least 1' })
    .max(5, { message: 'Position must be at most 5' })
    .default(1),
});

// Body schema dla PATCH /api/v1/milestones/:id
export const updateMilestoneSchema = z.object({
  title: z.string()
    .min(1, { message: 'Title cannot be empty' })
    .max(255, { message: 'Title must be max 255 characters' })
    .optional(),
  description: z.string().optional().nullable(),
  due_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Must be in YYYY-MM-DD format' })
    .optional()
    .nullable(),
  is_completed: z.boolean({
    errorMap: () => ({ message: 'Must be a boolean' })
  }).optional(),
  position: z.number()
    .int({ message: 'Position must be an integer' })
    .min(1, { message: 'Position must be at least 1' })
    .max(5, { message: 'Position must be at most 5' })
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

// Type exports dla TypeScript
export type ListMilestonesQuery = z.infer<typeof listMilestonesQuerySchema>;
export type CreateMilestoneData = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneData = z.infer<typeof updateMilestoneSchema>;
```

**Sprawdzić:**
- ✅ Import z 'zod'
- ✅ Wszystkie validation messages są czytelne
- ✅ Regex dla daty poprawny
- ✅ Ranges dla position (1-5) i limit (1-100)
- ✅ Type exports na końcu pliku

---

### Krok 3: Implementacja service layer

**Plik: `src/lib/services/milestone.service.ts`**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  MilestoneDTO,
  CreateMilestoneCommand,
  UpdateMilestoneCommand,
} from '../../types';
import type {
  ListMilestonesQuery,
} from '../validation/milestone.validation';

/**
 * Service for milestone operations
 * All methods assume RLS policies are enabled and userId is authenticated
 */
export class MilestoneService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * List milestones with optional filters
   */
  async listMilestones(
    filters: ListMilestonesQuery,
    userId: string
  ): Promise<{ data: MilestoneDTO[]; count: number }> {
    let query = this.supabase
      .from('milestones')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.long_term_goal_id) {
      query = query.eq('long_term_goal_id', filters.long_term_goal_id);
    }

    if (filters.is_completed !== undefined) {
      query = query.eq('is_completed', filters.is_completed === 'true');
    }

    // Apply pagination and ordering
    query = query
      .order('position', { ascending: true })
      .range(filters.offset, filters.offset + filters.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error listing milestones:', error);
      throw new Error(`Failed to list milestones: ${error.message}`);
    }

    return {
      data: data as MilestoneDTO[],
      count: count ?? 0,
    };
  }

  /**
   * Get milestones for a specific goal
   */
  async getMilestonesByGoalId(
    goalId: string,
    userId: string
  ): Promise<MilestoneDTO[]> {
    // First check if goal exists and belongs to user
    const { data: goal, error: goalError } = await this.supabase
      .from('long_term_goals')
      .select('id')
      .eq('id', goalId)
      .single();

    if (goalError || !goal) {
      throw new Error('Goal not found or access denied');
    }

    // Get milestones
    const { data, error } = await this.supabase
      .from('milestones')
      .select('*')
      .eq('long_term_goal_id', goalId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching milestones by goal:', error);
      throw new Error(`Failed to fetch milestones: ${error.message}`);
    }

    return data as MilestoneDTO[];
  }

  /**
   * Get a single milestone by ID
   */
  async getMilestoneById(
    id: string,
    userId: string
  ): Promise<MilestoneDTO> {
    const { data, error } = await this.supabase
      .from('milestones')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new Error('Milestone not found or access denied');
    }

    return data as MilestoneDTO;
  }

  /**
   * Create a new milestone
   */
  async createMilestone(
    milestoneData: CreateMilestoneCommand,
    userId: string
  ): Promise<MilestoneDTO> {
    // Verify goal exists and belongs to user
    const { data: goal, error: goalError } = await this.supabase
      .from('long_term_goals')
      .select('id')
      .eq('id', milestoneData.long_term_goal_id)
      .single();

    if (goalError || !goal) {
      throw new Error('Goal not found or access denied');
    }

    // Create milestone
    const { data, error } = await this.supabase
      .from('milestones')
      .insert([{
        long_term_goal_id: milestoneData.long_term_goal_id,
        title: milestoneData.title,
        description: milestoneData.description ?? null,
        due_date: milestoneData.due_date ?? null,
        position: milestoneData.position ?? 1,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating milestone:', error);
      
      // Check for max milestones constraint
      if (error.message.includes('Cannot add more than 5 milestones')) {
        throw new Error('Cannot add more than 5 milestones to a goal');
      }
      
      throw new Error(`Failed to create milestone: ${error.message}`);
    }

    return data as MilestoneDTO;
  }

  /**
   * Update a milestone
   */
  async updateMilestone(
    id: string,
    updateData: UpdateMilestoneCommand,
    userId: string
  ): Promise<MilestoneDTO> {
    const { data, error } = await this.supabase
      .from('milestones')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      if (error?.code === 'PGRST116') {
        throw new Error('Milestone not found or access denied');
      }
      console.error('Error updating milestone:', error);
      throw new Error(`Failed to update milestone: ${error?.message || 'Unknown error'}`);
    }

    return data as MilestoneDTO;
  }

  /**
   * Delete a milestone
   */
  async deleteMilestone(
    id: string,
    userId: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('milestones')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Milestone not found or access denied');
      }
      console.error('Error deleting milestone:', error);
      throw new Error(`Failed to delete milestone: ${error.message}`);
    }
  }
}
```

**Sprawdzić:**
- ✅ Wszystkie metody są async
- ✅ RLS policies są wykorzystywane (nie ma ręcznych JOIN do plans)
- ✅ Error handling z informacyjnymi messages
- ✅ Weryfikacja własności goala przed CREATE
- ✅ Proper type casting do DTO
- ✅ Single responsibility - tylko database operations

---

### Krok 4: Implementacja GET/POST /api/v1/milestones

**Plik: `src/pages/api/v1/milestones.ts`** (NOWY PLIK)

```typescript
import type { APIRoute } from 'astro';
import { supabase, DEFAULT_USER_ID } from '../../../db/supabase.client';
import { MilestoneService } from '../../../lib/services/milestone.service';
import {
  listMilestonesQuerySchema,
  createMilestoneSchema,
} from '../../../lib/validation/milestone.validation';
import { z } from 'zod';

export const prerender = false;

// GET /api/v1/milestones
export const GET: APIRoute = async ({ request }) => {
  try {
    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      long_term_goal_id: url.searchParams.get('long_term_goal_id') ?? undefined,
      is_completed: url.searchParams.get('is_completed') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    };

    const validatedParams = listMilestonesQuerySchema.parse(queryParams);

    // Get milestones from service
    const milestoneService = new MilestoneService(supabase);
    const result = await milestoneService.listMilestones(
      validatedParams,
      DEFAULT_USER_ID
    );

    return new Response(
      JSON.stringify({
        data: result.data,
        count: result.count,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // Zod validation error
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.') || '_root',
            message: e.message,
            received: e.input,
          })),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Other errors
    console.error('Error in GET /api/v1/milestones:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// POST /api/v1/milestones
export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createMilestoneSchema.parse(body);

    // Create milestone via service
    const milestoneService = new MilestoneService(supabase);
    const milestone = await milestoneService.createMilestone(
      validatedData,
      DEFAULT_USER_ID
    );

    return new Response(
      JSON.stringify({
        data: milestone,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // Zod validation error
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.') || '_root',
            message: e.message,
            received: e.input,
          })),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Not found errors
    if (error instanceof Error && error.message.includes('not found')) {
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          message: error.message,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Max milestones constraint
    if (error instanceof Error && error.message.includes('Cannot add more than 5')) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: error.message,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Other errors
    console.error('Error in POST /api/v1/milestones:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
```

**Sprawdzić:**
- ✅ `export const prerender = false` na początku
- ✅ Import `DEFAULT_USER_ID` z supabase.client
- ✅ Brak sprawdzania `locals.user`
- ✅ Proper error handling dla wszystkich przypadków
- ✅ Status codes: 200 dla GET, 201 dla POST
- ✅ Content-Type header w każdej odpowiedzi

---

### Krok 5: Implementacja GET/PATCH/DELETE /api/v1/milestones/:id

**Plik: `src/pages/api/v1/milestones/[id].ts`** (NOWY PLIK)

```typescript
import type { APIRoute } from 'astro';
import { supabase, DEFAULT_USER_ID } from '../../../../db/supabase.client';
import { MilestoneService } from '../../../../lib/services/milestone.service';
import {
  uuidSchema,
  updateMilestoneSchema,
} from '../../../../lib/validation/milestone.validation';
import { z } from 'zod';

export const prerender = false;

// GET /api/v1/milestones/:id
export const GET: APIRoute = async ({ params }) => {
  try {
    // Validate milestone ID
    const milestoneId = uuidSchema.parse(params.id);

    // Get milestone from service
    const milestoneService = new MilestoneService(supabase);
    const milestone = await milestoneService.getMilestoneById(
      milestoneId,
      DEFAULT_USER_ID
    );

    return new Response(
      JSON.stringify({
        data: milestone,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // Zod validation error
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: 'id',
            message: e.message,
            received: e.input,
          })),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Not found error
    if (error instanceof Error && error.message.includes('not found')) {
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          message: error.message,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Other errors
    console.error('Error in GET /api/v1/milestones/:id:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// PATCH /api/v1/milestones/:id
export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    // Validate milestone ID
    const milestoneId = uuidSchema.parse(params.id);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateMilestoneSchema.parse(body);

    // Update milestone via service
    const milestoneService = new MilestoneService(supabase);
    const milestone = await milestoneService.updateMilestone(
      milestoneId,
      validatedData,
      DEFAULT_USER_ID
    );

    return new Response(
      JSON.stringify({
        data: milestone,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // Zod validation error
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.') || 'id',
            message: e.message,
            received: e.input,
          })),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Not found error
    if (error instanceof Error && error.message.includes('not found')) {
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          message: error.message,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Other errors
    console.error('Error in PATCH /api/v1/milestones/:id:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// DELETE /api/v1/milestones/:id
export const DELETE: APIRoute = async ({ params }) => {
  try {
    // Validate milestone ID
    const milestoneId = uuidSchema.parse(params.id);

    // Delete milestone via service
    const milestoneService = new MilestoneService(supabase);
    await milestoneService.deleteMilestone(milestoneId, DEFAULT_USER_ID);

    return new Response(
      JSON.stringify({
        message: 'Milestone deleted successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // Zod validation error
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: 'id',
            message: e.message,
            received: e.input,
          })),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Not found error
    if (error instanceof Error && error.message.includes('not found')) {
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          message: error.message,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Other errors
    console.error('Error in DELETE /api/v1/milestones/:id:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
```

**Sprawdzić:**
- ✅ Wszystkie trzy handlery (GET, PATCH, DELETE)
- ✅ Walidacja UUID dla params.id
- ✅ Consistent error handling pattern
- ✅ DELETE zwraca message, nie data object

---

### Krok 6: Implementacja GET /api/v1/goals/:goalId/milestones

**Plik: `src/pages/api/v1/goals/[goalId]/milestones.ts`** (NOWY PLIK, sprawdzić czy folder istnieje)

```typescript
import type { APIRoute } from 'astro';
import { supabase, DEFAULT_USER_ID } from '../../../../../db/supabase.client';
import { MilestoneService } from '../../../../../lib/services/milestone.service';
import { uuidSchema } from '../../../../../lib/validation/milestone.validation';
import { z } from 'zod';

export const prerender = false;

// GET /api/v1/goals/:goalId/milestones
export const GET: APIRoute = async ({ params }) => {
  try {
    // Validate goal ID
    const goalId = uuidSchema.parse(params.goalId);

    // Get milestones from service
    const milestoneService = new MilestoneService(supabase);
    const milestones = await milestoneService.getMilestonesByGoalId(
      goalId,
      DEFAULT_USER_ID
    );

    return new Response(
      JSON.stringify({
        data: milestones,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // Zod validation error
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: 'goalId',
            message: e.message,
            received: e.input,
          })),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Not found error
    if (error instanceof Error && error.message.includes('not found')) {
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          message: error.message,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Other errors
    console.error('Error in GET /api/v1/goals/:goalId/milestones:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
```

**Sprawdzić:**
- ✅ Proper path depth (6x ../ dla imports)
- ✅ params.goalId (nie params.id)
- ✅ Same error handling pattern jako inne endpoints

---

### Krok 7: Testowanie ręczne (Manual Testing)

**Przygotować test file: `api-tests/milestones-tests.http`**

```http
### Variables
@baseUrl = http://localhost:4321/api/v1
@goalId = existing-goal-uuid
@milestoneId = existing-milestone-uuid

### 1. GET /api/v1/milestones - List all milestones
GET {{baseUrl}}/milestones

### 2. GET /api/v1/milestones - Filter by goal
GET {{baseUrl}}/milestones?long_term_goal_id={{goalId}}

### 3. GET /api/v1/milestones - Filter by completion status
GET {{baseUrl}}/milestones?is_completed=false

### 4. GET /api/v1/milestones - With pagination
GET {{baseUrl}}/milestones?limit=10&offset=0

### 5. GET /api/v1/goals/:goalId/milestones - Milestones for goal
GET {{baseUrl}}/goals/{{goalId}}/milestones

### 6. GET /api/v1/milestones/:id - Get single milestone
GET {{baseUrl}}/milestones/{{milestoneId}}

### 7. POST /api/v1/milestones - Create milestone
POST {{baseUrl}}/milestones
Content-Type: application/json

{
  "long_term_goal_id": "{{goalId}}",
  "title": "Test Milestone",
  "description": "This is a test milestone",
  "due_date": "2025-12-31",
  "position": 1
}

### 8. POST /api/v1/milestones - Create without optional fields
POST {{baseUrl}}/milestones
Content-Type: application/json

{
  "long_term_goal_id": "{{goalId}}",
  "title": "Minimal Milestone"
}

### 9. PATCH /api/v1/milestones/:id - Update milestone
PATCH {{baseUrl}}/milestones/{{milestoneId}}
Content-Type: application/json

{
  "title": "Updated Title",
  "is_completed": true
}

### 10. DELETE /api/v1/milestones/:id - Delete milestone
DELETE {{baseUrl}}/milestones/{{milestoneId}}

### ERROR TESTS

### 11. POST with invalid UUID - Should return 400
POST {{baseUrl}}/milestones
Content-Type: application/json

{
  "long_term_goal_id": "invalid-uuid",
  "title": "Test"
}

### 12. POST with title too long - Should return 400
POST {{baseUrl}}/milestones
Content-Type: application/json

{
  "long_term_goal_id": "{{goalId}}",
  "title": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit."
}

### 13. POST with invalid date format - Should return 400
POST {{baseUrl}}/milestones
Content-Type: application/json

{
  "long_term_goal_id": "{{goalId}}",
  "title": "Test",
  "due_date": "31/12/2025"
}

### 14. POST with position out of range - Should return 400
POST {{baseUrl}}/milestones
Content-Type: application/json

{
  "long_term_goal_id": "{{goalId}}",
  "title": "Test",
  "position": 10
}

### 15. GET non-existent milestone - Should return 404
GET {{baseUrl}}/milestones/00000000-0000-0000-0000-000000000000

### 16. PATCH without any fields - Should return 400
PATCH {{baseUrl}}/milestones/{{milestoneId}}
Content-Type: application/json

{}

### 17. POST 6th milestone to goal - Should return 400 (max 5)
# First create 5 milestones, then try to create 6th
POST {{baseUrl}}/milestones
Content-Type: application/json

{
  "long_term_goal_id": "{{goalId}}",
  "title": "Milestone 6"
}
```

**Test checklist:**
- [ ] Upewnić się że `DEFAULT_USER_ID` jest zdefiniowany w `supabase.client.ts`
- [ ] Uruchomić Supabase lokalnie (bez RLS)
- [ ] Uruchomić dev server: `npm run dev`
- [ ] Utworzyć test goal ID (należący do DEFAULT_USER_ID)
- [ ] Wykonać wszystkie success tests (1-10)
- [ ] Wykonać wszystkie error tests (11-17)
- [ ] Sprawdzić response bodies i status codes
- [ ] Sprawdzić logi w konsoli

---

### Krok 8: ~~Weryfikacja RLS Policies~~ (Pominięte w MVP)

**⚠️ MVP Mode: RLS wyłączone**

RLS Policies zostaną włączone po implementacji wszystkich endpointów API. W obecnym stanie:

- RLS jest **wyłączone** na tabeli `milestones`
- Wszystkie operacje używają `DEFAULT_USER_ID`
- Brak izolacji danych między użytkownikami

**Sprawdzenie czy RLS jest wyłączone:**

```sql
-- W Supabase SQL Editor lub lokalnym psql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'milestones';

-- Powinno zwrócić: rowsecurity = false (dla MVP)
```

**🔒 Po MVP - Planowane włączenie RLS:**

1. Włączyć RLS na tabeli milestones:
   ```sql
   ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
   ```

2. Utworzyć policies dla SELECT, INSERT, UPDATE, DELETE

3. Przetestować policies z różnymi użytkownikami

4. Dodać JWT authentication w middleware

---

### Krok 9: Optymalizacja i cleanup

**9.1. Sprawdzić query performance:**

```sql
-- W Supabase SQL Editor
EXPLAIN ANALYZE
SELECT * FROM milestones
WHERE long_term_goal_id = 'some-uuid'
ORDER BY position ASC;

-- Sprawdzić czy używa index: idx_milestones_position
```

**9.2. Dodać missing indexes (jeśli potrzebne):**

```sql
-- Sprawdzić czy indexes istnieją
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'milestones';

-- Dodać brakujące (jeśli nie istnieją):
CREATE INDEX IF NOT EXISTS idx_milestones_long_term_goal_id 
ON milestones(long_term_goal_id);

CREATE INDEX IF NOT EXISTS idx_milestones_position 
ON milestones(long_term_goal_id, position);

CREATE INDEX IF NOT EXISTS idx_milestones_is_completed 
ON milestones(is_completed);

CREATE INDEX IF NOT EXISTS idx_milestones_incomplete 
ON milestones(long_term_goal_id) WHERE is_completed = FALSE;
```

**9.3. Code cleanup:**
- [ ] Usunąć console.log statements (zostawić tylko console.error)
- [ ] Dodać JSDoc comments do wszystkich public methods
- [ ] Sprawdzić consistent naming conventions
- [ ] Sprawdzić czy brak unused imports

**9.4. Type safety check:**

```bash
# Uruchomić TypeScript compiler
npx tsc --noEmit

# Nie powinno być błędów
```

---

### Krok 10: Dokumentacja i finalizacja

**10.1. Aktualizować główny plik API documentation:**

W pliku `docs/api/api-plan.md` sprawdzić czy sekcja Milestones (3.4) jest aktualna i zgodna z implementacją.

**10.2. Utworzyć CHANGELOG entry (opcjonalne):**

```markdown
## [Unreleased]

### Added
- Milestone API endpoints (GET, POST, PATCH, DELETE)
- MilestoneService for business logic
- Zod validation schemas for milestones
- RLS policies enforcement for milestone operations
- Manual tests in api-tests/milestones-tests.http
```

**10.3. Code review checklist:**

- [ ] Wszystkie endpoints zwracają proper status codes
- [ ] Error messages są informacyjne i bezpieczne (nie leakują sensitive data)
- [ ] Walidacja jest comprehensive (UUID, strings, numbers, dates)
- [ ] RLS policies są wykorzystywane (nie ma bypassing)
- [ ] Service layer jest oddzielony od route handlers
- [ ] Brak hardcoded values (user IDs, tokens, etc.)
- [ ] Consistent code style (formatowanie, naming)
- [ ] Type safety (brak `any`, proper DTOs)

**10.4. Final testing:**

- [ ] Smoke test wszystkich endpoints
- [ ] Test z różnymi users (isolation test)
- [ ] Test edge cases (empty lists, max limits, invalid data)
- [ ] Test error scenarios (404, 400, 401)

---

## 10. Podsumowanie implementacji

### Zaimplementowane pliki:

1. **src/lib/validation/milestone.validation.ts** - Zod schemas
2. **src/lib/services/milestone.service.ts** - Service layer
3. **src/pages/api/v1/milestones.ts** - GET/POST endpoints
4. **src/pages/api/v1/milestones/[id].ts** - GET/PATCH/DELETE by ID
5. **src/pages/api/v1/goals/[goalId]/milestones.ts** - GET by goal ID
6. **api-tests/milestones-tests.http** - Manual test suite

### Wykorzystywane typy z types.ts:

- `MilestoneDTO`
- `CreateMilestoneCommand`
- `UpdateMilestoneCommand`
- `ListResponse<T>`
- `ItemResponse<T>`
- `ValidationErrorResponse`
- `ErrorResponse`
- `SuccessResponse`

### Database resources:

- **Table**: `milestones`
- **RLS Policies**: ⚠️ Wyłączone w MVP (zostaną włączone później)
- **Indexes**: `idx_milestones_long_term_goal_id`, `idx_milestones_position`, `idx_milestones_is_completed`, `idx_milestones_incomplete`
- **Triggers**: `check_milestone_count` (max 5 per goal), `set_updated_at` (auto timestamp)
- **Cascade**: ON DELETE SET NULL dla `tasks.milestone_id`

### Security measures:

**⚠️ MVP Mode:**
- ⚠️ Brak JWT authentication - używamy `DEFAULT_USER_ID`
- ⚠️ RLS wyłączone - zostanie włączone po MVP
- ✅ Input validation (Zod schemas)
- ✅ UUID validation (SQL injection prevention)
- ✅ Business rules enforcement (database triggers)
- ✅ Error message sanitization (no data leakage)

**🔒 Po MVP:**
- JWT token authentication
- RLS policies (row-level isolation)
- Multi-user support

### Performance optimizations:

- ✅ Database indexes (wszystkie foreign keys + composite)
- ✅ Partial index dla incomplete milestones
- ✅ Pagination support (limit/offset)
- ✅ Ordered results (position ASC)
- ✅ Connection pooling (Supabase built-in)

### Następne kroki (post-implementacja):

**Priorytet 1 - Po implementacji wszystkich endpointów:**
1. **Włączenie RLS policies** - Aktywować RLS na wszystkich tabelach
2. **JWT Authentication** - Dodać Supabase Auth middleware
3. **Multi-user support** - Usunąć DEFAULT_USER_ID, używać rzeczywistych user ID

**Priorytet 2 - Testy i monitoring:**
4. **Integration tests** - Napisać automated tests (Vitest + Supabase test client)
5. **E2E tests** - Przetestować flow: create plan → create goal → create milestones
6. **Performance monitoring** - Dodać logging/metrics dla query times

**Opcjonalne (produkcja):**
7. **API documentation** - Rozważyć OpenAPI/Swagger spec
8. **Rate limiting** - Implementacja dla produkcji
9. **Caching** - Rozważyć Redis cache dla często odczytywanych danych

---

**Koniec planu implementacji**

Data utworzenia: 2025-01-11  
Data aktualizacji: 2025-01-11  
Wersja: 1.1 (MVP Mode - bez autentykacji i RLS)  
Status: Ready for implementation

**⚠️ Uwaga MVP:**
Ten plan implementuje uproszczoną wersję API bez autentykacji JWT i RLS policies. 
Używany jest `DEFAULT_USER_ID` dla wszystkich operacji. Po implementacji wszystkich 
endpointów należy włączyć RLS i dodać prawdziwą autentykację.

