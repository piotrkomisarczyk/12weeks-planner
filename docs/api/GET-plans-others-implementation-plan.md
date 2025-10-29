# API Endpoint Implementation Plan: GET /api/v1/plans/active & GET /api/v1/plans/:id

## 1. Przegląd punktów końcowych

### GET /api/v1/plans/active
Zwraca aktualnie aktywny planer dla zalogowanego użytkownika. Jeden użytkownik może mieć tylko jeden aktywny planer w danym czasie (status='active'). Endpoint ten jest używany do szybkiego dostępu do głównego, roboczego planera użytkownika bez znajomości jego ID.

### GET /api/v1/plans/:id
Zwraca konkretny planer na podstawie jego identyfikatora UUID. Endpoint weryfikuje, czy planer należy do zalogowanego użytkownika, zapobiegając nieautoryzowanemu dostępowi do planerów innych użytkowników.

---

## 2. Szczegóły żądania

### GET /api/v1/plans/active

**Metoda HTTP:** GET

**Struktura URL:** `/api/v1/plans/active`

**Parametry:**
- Wymagane: brak
- Opcjonalne: brak
- Headers: 
  - Authorization: Bearer token (w przyszłości - obecnie używamy DEFAULT_USER_ID)

**Request Body:** N/A (GET request)

**Przykładowe żądanie:**
```bash
GET /api/v1/plans/active HTTP/1.1
Host: api.example.com
Authorization: Bearer <jwt_token>
```

### GET /api/v1/plans/:id

**Metoda HTTP:** GET

**Struktura URL:** `/api/v1/plans/:id`

**Parametry:**
- Wymagane:
  - `id` (UUID) - identyfikator planera w formacie UUID v4
- Opcjonalne: brak
- Headers:
  - Authorization: Bearer token (w przyszłości - obecnie używamy DEFAULT_USER_ID)

**Request Body:** N/A (GET request)

**Przykładowe żądanie:**
```bash
GET /api/v1/plans/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d HTTP/1.1
Host: api.example.com
Authorization: Bearer <jwt_token>
```

---

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

Z pliku `src/types.ts`:

```typescript
// PlanDTO - mapuje bezpośrednio na tabelę plans (linia 77)
export type PlanDTO = PlanEntity;

// ItemResponse - wrapper dla pojedynczego elementu (linia 426-428)
export interface ItemResponse<T> {
  data: T;
}

// ErrorResponse - dla prostych błędów (linia 454-457)
export interface ErrorResponse {
  error: string;
  message?: string;
}

// ValidationErrorResponse - dla błędów walidacji (linia 446-449)
export interface ValidationErrorResponse {
  error: 'Validation failed';
  details: ValidationErrorDetail[];
}

// ValidationErrorDetail (linia 437-441)
export interface ValidationErrorDetail {
  field: string;
  message: string;
  received?: unknown;
}
```

### Database Types

```typescript
// PlanEntity z database.types.ts (linia 19)
export type PlanEntity = Database['public']['Tables']['plans']['Row'];

// Struktura PlanEntity:
{
  id: string;                    // UUID
  user_id: string;               // UUID
  name: string;                  // TEXT
  start_date: string;            // DATE (ISO format)
  status: 'ready' | 'active' | 'completed' | 'archived';
  created_at: string;            // TIMESTAMPTZ (ISO format)
  updated_at: string;            // TIMESTAMPTZ (ISO format)
}
```

### Validation Types

Nowe typy do dodania w `src/lib/validation/plan.validation.ts`:

```typescript
// Walidacja parametru :id dla GET /api/v1/plans/:id
export const GetPlanByIdParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid plan ID format' })
});

export type GetPlanByIdParams = z.infer<typeof GetPlanByIdParamsSchema>;
```

---

## 4. Szczegóły odpowiedzi

### GET /api/v1/plans/active

**Sukces (200 OK):**
```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "user_id": "dac44a9c-c1a0-4c6b-bed0-127e367a4fe3",
    "name": "Planner_2025-01-06",
    "start_date": "2025-01-06",
    "status": "active",
    "created_at": "2025-01-06T10:00:00Z",
    "updated_at": "2025-01-06T10:00:00Z"
  }
}
```

**Nie znaleziono (404 Not Found):**
```json
{
  "error": "Not found",
  "message": "No active plan found"
}
```

**Nieautoryzowany (401 Unauthorized):**
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

**Błąd serwera (500 Internal Server Error):**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

### GET /api/v1/plans/:id

**Sukces (200 OK):**
```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "user_id": "dac44a9c-c1a0-4c6b-bed0-127e367a4fe3",
    "name": "Planner_2025-01-06",
    "start_date": "2025-01-06",
    "status": "active",
    "created_at": "2025-01-06T10:00:00Z",
    "updated_at": "2025-01-06T10:00:00Z"
  }
}
```

**Nieprawidłowy UUID (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "id",
      "message": "Invalid plan ID format",
      "received": "invalid-uuid"
    }
  ]
}
```

**Nie znaleziono (404 Not Found):**
```json
{
  "error": "Not found",
  "message": "Plan not found"
}
```
*Uwaga: Ta sama odpowiedź zwracana jest zarówno gdy plan nie istnieje, jak i gdy należy do innego użytkownika (ze względów bezpieczeństwa).*

**Nieautoryzowany (401 Unauthorized):**
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

**Błąd serwera (500 Internal Server Error):**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## 5. Przepływ danych

### GET /api/v1/plans/active

```
┌─────────────────┐
│   HTTP Request  │
│  GET /api/v1/   │
│  plans/active   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Astro Middleware                   │
│  - Attach supabase client to locals │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  API Route Handler                  │
│  src/pages/api/v1/plans/active.ts   │
│  ─────────────────────────────────  │
│  1. Get user_id (DEFAULT_USER_ID)   │
│  2. No validation needed            │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  PlanService                        │
│  getActivePlan(userId)              │
│  ─────────────────────────────────  │
│  1. Query plans table               │
│  2. Filter: user_id = userId        │
│  3. Filter: status = 'active'       │
│  4. Limit 1                         │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Supabase (PostgreSQL)              │
│  ─────────────────────────────────  │
│  SELECT * FROM plans                │
│  WHERE user_id = $1                 │
│    AND status = 'active'            │
│  LIMIT 1                            │
└────────┬────────────────────────────┘
         │
         ▼
    ┌────┴─────┐
    │          │
    ▼          ▼
┌────────┐  ┌────────────────┐
│ Found  │  │  Not Found     │
└───┬────┘  └────┬───────────┘
    │            │
    ▼            ▼
┌────────┐  ┌──────────────────┐
│ 200 OK │  │  404 Not Found   │
│ + data │  │  + error message │
└────────┘  └──────────────────┘
```

### GET /api/v1/plans/:id

```
┌─────────────────┐
│   HTTP Request  │
│  GET /api/v1/   │
│  plans/:id      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Astro Middleware                   │
│  - Attach supabase client to locals │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  API Route Handler                  │
│  src/pages/api/v1/plans/[id].ts     │
│  ─────────────────────────────────  │
│  1. Extract id from params          │
│  2. Validate UUID format (Zod)      │
│  3. Get user_id (DEFAULT_USER_ID)   │
└────────┬────────────────────────────┘
         │
         ▼
    ┌────┴─────┐
    │          │
    ▼          ▼
┌──────────┐  ┌───────────────────┐
│ Valid    │  │  Invalid UUID     │
└───┬──────┘  └────┬──────────────┘
    │              │
    │              ▼
    │         ┌────────────────────┐
    │         │  400 Bad Request   │
    │         │  + validation error│
    │         └────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  PlanService                        │
│  getPlanById(planId, userId)        │
│  ─────────────────────────────────  │
│  1. Query plans table by id         │
│  2. Filter: id = planId             │
│  3. Filter: user_id = userId        │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Supabase (PostgreSQL)              │
│  ─────────────────────────────────  │
│  SELECT * FROM plans                │
│  WHERE id = $1                      │
│    AND user_id = $2                 │
│  LIMIT 1                            │
└────────┬────────────────────────────┘
         │
         ▼
    ┌────┴─────┐
    │          │
    ▼          ▼
┌────────┐  ┌────────────────┐
│ Found  │  │  Not Found     │
└───┬────┘  └────┬───────────┘
    │            │
    ▼            ▼
┌────────┐  ┌──────────────────┐
│ 200 OK │  │  404 Not Found   │
│ + data │  │  + error message │
└────────┘  └──────────────────┘
```

---

## 6. Względy bezpieczeństwa

### 6.1. Uwierzytelnianie (Authentication)

**Aktualny stan (MVP/Development):**
- Używamy stałej `DEFAULT_USER_ID` zdefiniowanej w `src/db/supabase.client.ts`
- Middleware w `src/middleware/index.ts` dodaje klienta Supabase do `context.locals`
- Uproszczone podejście umożliwia szybkie testowanie manualne bez konfiguracji JWT

**Przyszła implementacja (Production):**
- Wyciągnąć JWT token z nagłówka `Authorization: Bearer <token>`
- Zweryfikować token przez `locals.supabase.auth.getUser()`
- Wyciągnąć `user_id` z zweryfikowanego tokena
- Zwrócić 401 Unauthorized jeśli token jest nieprawidłowy lub brakuje

**Zgodność z regułami backendu:**
- Używamy `locals.supabase` zamiast importowania `supabaseClient` bezpośrednio
- Typ `SupabaseClient` z `src/db/supabase.client.ts`, nie z `@supabase/supabase-js`

### 6.2. Autoryzacja (Authorization)

**Kluczowe zabezpieczenie:**
- **ZAWSZE** filtrować zapytania po `user_id` w metodach serwisu
- Dla `GET /api/v1/plans/:id` - zapobiegamy dostępowi do planerów innych użytkowników
- Nie ujawniać w odpowiedzi czy planer nie istnieje czy należy do innego użytkownika (zawsze 404)

**Row Level Security (RLS):**
- Database posiada polityki RLS (zdefiniowane w migracji `20251016120300_create_rls_policies.sql`)
- Polityki są obecnie wyłączone dla MVP (`20251016120600_disable_all_policies.sql`)
- Po implementacji prawdziwej autentykacji - włączyć RLS jako dodatkową warstwę bezpieczeństwa

### 6.3. Walidacja danych wejściowych

**GET /api/v1/plans/:id:**
- Walidacja formatu UUID zapobiega SQL injection
- Użycie Zod schema: `z.string().uuid()`
- Nieprawidłowy format → 400 Bad Request

### 6.4. Nagłówki bezpieczeństwa

Dodać do wszystkich odpowiedzi:
```typescript
{
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff'
}
```

### 6.5. Potencjalne zagrożenia

| Zagrożenie | Mitygacja |
|------------|-----------|
| **Enumeracja zasobów** (odgadywanie ID planerów) | Zawsze weryfikuj user_id; nie ujawniaj czy zasób istnieje dla innego użytkownika |
| **SQL Injection** | Użycie Supabase client (parametryzowane zapytania) + walidacja UUID przez Zod |
| **Ujawnienie informacji** | Jednolite komunikaty błędów (404 dla not found / unauthorized) |
| **Brak rate limiting** | Do implementacji w przyszłości (np. przez middleware) |
| **CORS issues** | Skonfigurować odpowiednie nagłówki CORS w Astro config |

---

## 7. Obsługa błędów

### 7.1. Hierarchia obsługi błędów

```
1. Walidacja parametrów (Zod)
   ↓ niepowodzenie → 400 Bad Request
   
2. Autoryzacja użytkownika
   ↓ niepowodzenie → 401 Unauthorized
   
3. Wywołanie serwisu
   ↓ zasób nie znaleziony → 404 Not Found
   ↓ błąd bazy danych → 500 Internal Server Error
   
4. Nieoczekiwane błędy
   ↓ → 500 Internal Server Error
```

### 7.2. Szczegółowe scenariusze błędów

#### GET /api/v1/plans/active

| Scenariusz | Kod HTTP | Response Body | Logowanie |
|------------|----------|---------------|-----------|
| Brak aktywnego planera | 404 | `{"error": "Not found", "message": "No active plan found"}` | Nie |
| Brak/nieprawidłowy token | 401 | `{"error": "Unauthorized", "message": "..."}` | Nie |
| Błąd bazy danych | 500 | `{"error": "Internal server error", "message": "..."}` | Tak (console.error) |
| Nieoczekiwany wyjątek | 500 | `{"error": "Internal server error", "message": "..."}` | Tak (console.error) |
| Sukces - znaleziono plan | 200 | `{"data": {...}}` | Nie |

#### GET /api/v1/plans/:id

| Scenariusz | Kod HTTP | Response Body | Logowanie |
|------------|----------|---------------|-----------|
| Nieprawidłowy format UUID | 400 | `{"error": "Validation failed", "details": [...]}` | Nie |
| Planer nie istnieje | 404 | `{"error": "Not found", "message": "Plan not found"}` | Nie |
| Planer należy do innego użytkownika | 404 | `{"error": "Not found", "message": "Plan not found"}` | Nie |
| Brak/nieprawidłowy token | 401 | `{"error": "Unauthorized", "message": "..."}` | Nie |
| Błąd bazy danych | 500 | `{"error": "Internal server error", "message": "..."}` | Tak (console.error) |
| Nieoczekiwany wyjątek | 500 | `{"error": "Internal server error", "message": "..."}` | Tak (console.error) |
| Sukces - znaleziono plan | 200 | `{"data": {...}}` | Nie |

### 7.3. Format błędów

**Błędy walidacji (400):**
```typescript
{
  error: "Validation failed",
  details: [
    {
      field: "id",
      message: "Invalid plan ID format",
      received: "not-a-uuid"
    }
  ]
}
```

**Proste błędy (404, 401, 500):**
```typescript
{
  error: "Not found" | "Unauthorized" | "Internal server error",
  message: "Descriptive error message"
}
```

### 7.4. Strategia logowania

**Co logować:**
- Błędy bazy danych (z pełnym komunikatem error.message)
- Nieoczekiwane wyjątki (z pełnym stack trace)
- Kontekst: nazwa endpointa, userId (jeśli dostępny)

**Czego nie logować:**
- Błędów walidacji (to błędy klienta)
- 404 Not Found (normalna sytuacja)
- Danych wrażliwych (hasła, tokeny)

**Przykład:**
```typescript
console.error('Error in GET /api/v1/plans/active:', {
  userId,
  error: error.message,
  stack: error.stack
});
```

---

## 8. Rozważania dotyczące wydajności

### 8.1. Optymalizacje zapytań do bazy danych

**Indeksy (już zdefiniowane w migracji):**
- `idx_plans_user_id` - przyspiesza filtrowanie po user_id
- `idx_plans_status` - przyspiesza filtrowanie po status='active'

**Zapytania:**
- Użycie `LIMIT 1` dla obu endpointów (zwracamy pojedynczy zasób)
- Filtrowanie po indeksowanych kolumnach (user_id, status, id)
- Brak joinów - zwracamy tylko dane z tabeli plans

**Przykład wydajnego zapytania dla getActivePlan:**
```sql
SELECT * FROM plans
WHERE user_id = $1 AND status = 'active'
LIMIT 1;
-- Użyje: idx_plans_user_id + idx_plans_status
```

### 8.2. Caching (przyszłe wdrożenie)

**Potencjalne strategie:**
- Redis cache dla często pobieranych aktywnych planerów
- Cache-Control headers dla GET requests
- Invalidacja cache'u po UPDATE/DELETE planera

**Przykładowy TTL:**
- GET /api/v1/plans/active - 5 minut (często odczytywany)
- GET /api/v1/plans/:id - 10 minut (rzadziej modyfikowany)

### 8.3. Monitoring

**Metryki do śledzenia:**
- Czas odpowiedzi (target: < 100ms)
- Rate limit per user (do implementacji)
- Liczba 404 (jeśli wysoka - może wskazywać problem)
- Liczba 500 (critical - wymagają natychmiastowej uwagi)

### 8.4. Potencjalne wąskie gardła

| Wąskie gardło | Prawdopodobieństwo | Mitygacja |
|---------------|-------------------|-----------|
| Wolne zapytania DB | Niskie (proste SELECT z indeksami) | Monitoring query performance |
| Duża liczba jednoczesnych requestów | Średnie | Connection pooling (Supabase), rate limiting |
| Brak cache'owania | Średnie | Implementacja Redis cache |
| Network latency do Supabase | Niskie | Wybór regionu bliskiego użytkownikom |

---

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie walidacji
**Plik:** `src/lib/validation/plan.validation.ts`

Dodać nowy schema dla walidacji parametru :id:

```typescript
/**
 * Validation schema for GET /api/v1/plans/:id
 * Validates UUID format for plan ID parameter
 */
export const GetPlanByIdParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid plan ID format' })
});

export type GetPlanByIdParams = z.infer<typeof GetPlanByIdParamsSchema>;
```

---

### Krok 2: Rozszerzenie PlanService
**Plik:** `src/lib/services/plan.service.ts`

Dodać dwie nowe metody do klasy `PlanService`:

```typescript
/**
 * Pobiera aktywny planer dla danego użytkownika
 * 
 * @param userId - ID użytkownika (z tokenu JWT)
 * @returns Promise z aktywnym planerem lub null jeśli nie istnieje
 * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
 * 
 * @example
 * ```typescript
 * const activePlan = await planService.getActivePlan(userId);
 * if (!activePlan) {
 *   // No active plan found
 * }
 * ```
 */
async getActivePlan(userId: string): Promise<PlanDTO | null> {
  // Query for active plan
  const { data, error } = await this.supabase
    .from('plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  // Handle database errors
  if (error) {
    throw new Error(`Failed to fetch active plan: ${error.message}`);
  }

  // Return null if no active plan found (not an error)
  return data;
}

/**
 * Pobiera konkretny planer po ID
 * Weryfikuje, że planer należy do danego użytkownika
 * 
 * @param planId - UUID planera
 * @param userId - ID użytkownika (z tokenu JWT)
 * @returns Promise z planerem lub null jeśli nie istnieje/nie należy do użytkownika
 * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
 * 
 * @example
 * ```typescript
 * const plan = await planService.getPlanById(planId, userId);
 * if (!plan) {
 *   // Plan not found or doesn't belong to user
 * }
 * ```
 */
async getPlanById(planId: string, userId: string): Promise<PlanDTO | null> {
  // Query for plan by ID, filtered by user_id for security
  const { data, error } = await this.supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .eq('user_id', userId)
    .maybeSingle();

  // Handle database errors
  if (error) {
    throw new Error(`Failed to fetch plan: ${error.message}`);
  }

  // Return null if not found (either doesn't exist or belongs to another user)
  return data;
}
```

**Uwagi implementacyjne:**
- Użycie `.maybeSingle()` zamiast `.single()` - nie rzuca błędu gdy brak wyników, zwraca null
- `.maybeSingle()` jest bezpieczniejsze niż `.single()` który rzuca błąd PGRST116 przy braku danych
- Zawsze filtrujemy po `user_id` dla bezpieczeństwa
- Zwracamy `null` gdy nie znaleziono (endpoint obsłuży 404)
- Rzucamy Error tylko przy rzeczywistych błędach bazy danych

---

### Krok 3: Stworzenie route handlera dla GET /api/v1/plans/active
**Plik:** `src/pages/api/v1/plans/active.ts` (nowy plik)

```typescript
/**
 * API Endpoint: GET /api/v1/plans/active
 * 
 * Returns the currently active plan for the authenticated user.
 * A user can have only one active plan at a time (status='active').
 * 
 * Responses:
 * - 200: Success with active plan data
 * - 401: Unauthorized (missing or invalid token)
 * - 404: No active plan found
 * - 500: Internal server error
 */

import type { APIRoute } from 'astro';
import { PlanService } from '../../../lib/services/plan.service';
import { DEFAULT_USER_ID } from '../../../db/supabase.client';
import type { ErrorResponse, ItemResponse, PlanDTO } from '../../../types';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Step 1: Authentication - Using default user for MVP/development
    // TODO: Implement real authentication with JWT token verification
    const userId = DEFAULT_USER_ID;

    // Step 2: No validation needed (no parameters)

    // Step 3: Call service to fetch active plan
    const planService = new PlanService(locals.supabase);
    const activePlan = await planService.getActivePlan(userId);

    // Step 4: Handle not found case
    if (!activePlan) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'No active plan found'
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
        data: activePlan
      } as ItemResponse<PlanDTO>),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  } catch (error) {
    // Global error handler for unexpected errors
    console.error('Error in GET /api/v1/plans/active:', error);
    
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

---

### Krok 4: Stworzenie route handlera dla GET /api/v1/plans/:id
**Plik:** `src/pages/api/v1/plans/[id].ts` (nowy plik)

```typescript
/**
 * API Endpoint: GET /api/v1/plans/:id
 * 
 * Returns a specific plan by ID.
 * Verifies that the plan belongs to the authenticated user.
 * 
 * URL Parameters:
 * - id: UUID of the plan
 * 
 * Responses:
 * - 200: Success with plan data
 * - 400: Invalid UUID format
 * - 401: Unauthorized (missing or invalid token)
 * - 404: Plan not found or doesn't belong to user
 * - 500: Internal server error
 */

import type { APIRoute } from 'astro';
import { PlanService } from '../../../lib/services/plan.service';
import { GetPlanByIdParamsSchema } from '../../../lib/validation/plan.validation';
import { DEFAULT_USER_ID } from '../../../db/supabase.client';
import type { 
  ErrorResponse, 
  ItemResponse, 
  PlanDTO,
  ValidationErrorResponse 
} from '../../../types';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Authentication - Using default user for MVP/development
    // TODO: Implement real authentication with JWT token verification
    const userId = DEFAULT_USER_ID;

    // Step 2: Validate UUID parameter
    const validationResult = GetPlanByIdParamsSchema.safeParse(params);

    if (!validationResult.success) {
      const details = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        received: params.id
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

    const { id: planId } = validationResult.data;

    // Step 3: Call service to fetch plan by ID
    const planService = new PlanService(locals.supabase);
    const plan = await planService.getPlanById(planId, userId);

    // Step 4: Handle not found case
    // Note: Same response whether plan doesn't exist or belongs to another user
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
      JSON.stringify({
        data: plan
      } as ItemResponse<PlanDTO>),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  } catch (error) {
    // Global error handler for unexpected errors
    console.error('Error in GET /api/v1/plans/:id:', {
      planId: params.id,
      error
    });
    
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

---

### Krok 5: Testowanie manualne

**Przygotowanie:**
1. Upewnij się, że lokalna instancja Supabase jest uruchomiona
2. Sprawdź czy `DEFAULT_USER_ID` ma jakieś dane w tabeli `plans`
3. Uruchom dev server: `npm run dev`

**Test Case 1: GET /api/v1/plans/active - Success**
```bash
curl -X GET http://localhost:4321/api/v1/plans/active
# Expected: 200 OK with active plan data
```

**Test Case 2: GET /api/v1/plans/active - Not Found**
```bash
# Zmień wszystkie plany użytkownika na status='archived'
curl -X GET http://localhost:4321/api/v1/plans/active
# Expected: 404 Not Found
```

**Test Case 3: GET /api/v1/plans/:id - Success**
```bash
# Użyj prawdziwego UUID planera z bazy
curl -X GET http://localhost:4321/api/v1/plans/{valid-uuid}
# Expected: 200 OK with plan data
```

**Test Case 4: GET /api/v1/plans/:id - Invalid UUID**
```bash
curl -X GET http://localhost:4321/api/v1/plans/not-a-uuid
# Expected: 400 Bad Request with validation error
```

**Test Case 5: GET /api/v1/plans/:id - Not Found**
```bash
# Użyj poprawnego UUID, ale nieistniejącego
curl -X GET http://localhost:4321/api/v1/plans/00000000-0000-0000-0000-000000000000
# Expected: 404 Not Found
```

**Test Case 6: GET /api/v1/plans/:id - Different User**
```bash
# Użyj UUID planera należącego do innego użytkownika
# (symulacja - zmień DEFAULT_USER_ID lub stwórz plan dla innego użytkownika)
curl -X GET http://localhost:4321/api/v1/plans/{other-user-plan-uuid}
# Expected: 404 Not Found (same as not existing - bezpieczeństwo)
```

---

### Krok 6: Integracja z frontendem (przyszłe zadanie)

**Przykłady użycia w komponentach React:**

```typescript
// Pobranie aktywnego planera
async function fetchActivePlan() {
  const response = await fetch('/api/v1/plans/active');
  
  if (response.status === 404) {
    // No active plan - redirect to create plan page
    return null;
  }
  
  if (!response.ok) {
    throw new Error('Failed to fetch active plan');
  }
  
  const { data } = await response.json();
  return data;
}

// Pobranie konkretnego planera
async function fetchPlanById(planId: string) {
  const response = await fetch(`/api/v1/plans/${planId}`);
  
  if (response.status === 404) {
    // Plan not found or unauthorized
    return null;
  }
  
  if (!response.ok) {
    throw new Error('Failed to fetch plan');
  }
  
  const { data } = await response.json();
  return data;
}
```

---

### Krok 7: Dokumentacja API (aktualizacja)

**Plik:** `docs/api/api-plan.md`

Upewnić się, że sekcje 3.2.2 i 3.2.3 są zgodne z implementacją:
- Struktura response używa `ItemResponse<PlanDTO>`
- Komunikaty błędów są dokładnie takie jak w implementacji
- Przykłady zawierają prawdziwe dane

---

### Krok 8: Future improvements (dla następnych iteracji)

**Uwierzytelnianie:**
- [ ] Implementacja JWT token verification (przez locals.supabase.auth.getUser())
- [ ] Wyciąganie userId z zweryfikowanego tokenu
- [ ] Obsługa 401 Unauthorized dla brakujących/nieprawidłowych tokenów
- [x] MVP: Używanie DEFAULT_USER_ID dla szybkich testów

**Optymalizacja:**
- [ ] Dodanie Redis cache dla getActivePlan
- [ ] Implementacja Cache-Control headers
- [ ] Monitoring czasu odpowiedzi

**Bezpieczeństwo:**
- [ ] Włączenie Row Level Security policies
- [ ] Rate limiting per user/IP
- [ ] CORS configuration

**Testy:**
- [ ] Unit testy dla PlanService methods
- [ ] Integration testy dla endpoints
- [ ] E2E testy z prawdziwą bazą

---

## 10. Checklist przed wdrożeniem

- [ ] Rozszerzona walidacja (`plan.validation.ts`) z nowym schema
- [ ] Dwie nowe metody w PlanService (`getActivePlan`, `getPlanById`)
- [ ] Utworzony plik `src/pages/api/v1/plans/active.ts`
- [ ] Utworzony plik `src/pages/api/v1/plans/[id].ts`
- [ ] Testy manualne przeszły pomyślnie dla wszystkich scenariuszy
- [ ] Sprawdzone logowanie błędów w konsoli
- [ ] Weryfikacja formatów odpowiedzi zgodnie z typami
- [ ] Sprawdzone nagłówki bezpieczeństwa w odpowiedziach
- [ ] Kod przeszedł przez linter bez błędów
- [ ] Dokumentacja API jest aktualna

---

## 11. Troubleshooting

### Problem: 500 Error przy każdym wywołaniu GET /api/v1/plans/active

**Możliwe przyczyny:**
1. Supabase nie jest uruchomiony lokalnie
2. Błędne zmienne środowiskowe (SUPABASE_URL, SUPABASE_KEY)
3. Middleware nie dodaje supabase do locals

**Rozwiązanie:**
- Sprawdź logi w konsoli (console.error)
- Zweryfikuj połączenie z Supabase
- Sprawdź czy middleware jest prawidłowo skonfigurowany

### Problem: Zawsze 404 dla GET /api/v1/plans/active mimo że mam aktywny plan

**Możliwe przyczyny:**
1. Plan należy do innego użytkownika (inny user_id)
2. Status planera nie jest 'active'
3. Token JWT należy do innego użytkownika niż oczekiwany

**Rozwiązanie:**
- Sprawdź w bazie: `SELECT * FROM plans WHERE user_id = 'DEFAULT_USER_ID' AND status = 'active';`
- Zweryfikuj wartość `DEFAULT_USER_ID` w `src/db/supabase.client.ts`
- Sprawdź czy userId w handlerze jest poprawny (dodaj console.log)
- Upewnij się że plan rzeczywiście istnieje dla tego użytkownika

### Problem: 400 Bad Request dla poprawnego UUID

**Możliwe przyczyny:**
1. UUID zawiera dodatkowe białe znaki
2. UUID jest w innym formacie niż v4
3. Problemy z routingiem Astro

**Rozwiązanie:**
- Sprawdź czy params.id jest prawidłowo ekstraktowany
- Dodaj console.log przed walidacją aby sprawdzić wartość
- Upewnij się że nazwa pliku to dokładnie `[id].ts`

---

## Podsumowanie

Ten plan implementacji dostarcza kompletny przewodnik do wdrożenia dwóch nowych endpointów GET dla zasobu plans:
- `GET /api/v1/plans/active` - szybki dostęp do aktywnego planera użytkownika
- `GET /api/v1/plans/:id` - dostęp do konkretnego planera z weryfikacją własności

Implementacja zachowuje spójność z istniejącym kodem, wykorzystuje te same wzorce (service layer, validation, error handling) i przygotowuje grunt pod przyszłe rozszerzenia (prawdziwa autentykacja, caching, RLS).

Kluczowe aspekty bezpieczeństwa (filtrowanie po user_id, jednolite komunikaty błędów 404) są wbudowane od początku, co zapewnia że aplikacja jest secure-by-default.

