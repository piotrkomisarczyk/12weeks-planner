# API Endpoint Implementation Plan: GET /api/v1/plans

## 1. Przegląd punktu końcowego

**Endpoint**: `GET /api/v1/plans`

**Cel**: Pobranie listy wszystkich planerów (12-tygodniowych planów) należących do uwierzytelnionego użytkownika. Endpoint obsługuje filtrowanie po statusie oraz paginację wyników.

**Wymagania funkcjonalne**:
- Zwrócenie wszystkich planerów użytkownika
- Możliwość filtrowania po statusie ('active', 'completed', 'archived')
- Obsługa paginacji (limit, offset)
- Weryfikacja uwierzytelnienia użytkownika
- Zapewnienie, że użytkownik widzi tylko własne planery

---

## 2. Szczegóły żądania

### HTTP Method
`GET`

### Struktura URL
```
/api/v1/plans
```

### Headers
```
Authorization: Bearer <supabase_jwt_token>
```

### Query Parameters

| Parametr | Typ | Wymagany | Domyślna wartość | Walidacja | Opis |
|----------|-----|----------|------------------|-----------|------|
| `status` | string | Nie | - | enum: 'ready', 'active', 'completed', 'archived' | Filtruje planery po statusie |
| `limit` | number | Nie | 50 | min: 1, max: 100 | Liczba wyników na stronę |
| `offset` | number | Nie | 0 | min: 0 | Przesunięcie dla paginacji |

### Request Body
Brak (endpoint GET nie przyjmuje body)

### Przykładowe żądania

**Pobranie wszystkich aktywnych planerów (pierwsza strona)**:
```
GET /api/v1/plans?status=active&limit=10&offset=0
```

**Pobranie wszystkich gotowych planerów**:
```
GET /api/v1/plans?status=ready
```

**Pobranie wszystkich planerów (domyślna paginacja)**:
```
GET /api/v1/plans
```

**Pobranie drugiej strony wyników**:
```
GET /api/v1/plans?limit=20&offset=20
```

---

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

**PlanDTO** (z `src/types.ts`):
```typescript
export type PlanDTO = PlanEntity;

// Struktura:
{
  id: string;              // UUID
  user_id: string;         // UUID
  name: string;            // np. "Planner_2025-01-06"
  start_date: string;      // ISO date format
  status: PlanStatus;      // 'ready' | 'active' | 'completed' | 'archived'
  created_at: string;      // ISO timestamp
  updated_at: string;      // ISO timestamp
}
```

### Query Parameter Types

**PlanListParams** (z `src/types.ts`):
```typescript
export interface PlanListParams extends ListQueryParams {
  status?: PlanStatus;
}

// Where ListQueryParams is:
export interface ListQueryParams {
  limit?: number;
  offset?: number;
  sort?: string;
}
```

### Response Types

**PaginatedResponse<PlanDTO>** (z `src/types.ts`):
```typescript
export interface PaginatedResponse<T> {
  data: T[];
  pagination?: PaginationMeta;
  count?: number;
  limit?: number;
  offset?: number;
}
```

Dla tego endpointu używamy uproszczonej wersji zgodnie ze specyfikacją:
```typescript
{
  data: PlanDTO[];
  count: number;
  limit: number;
  offset: number;
}
```

### Error Types

**ErrorResponse** (z `src/types.ts`):
```typescript
export interface ErrorResponse {
  error: string;
  message?: string;
}

export interface ValidationErrorResponse {
  error: 'Validation failed';
  details: ValidationErrorDetail[];
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  received?: unknown;
}
```

---

## 4. Szczegóły odpowiedzi

### Sukces - 200 OK

**Content-Type**: `application/json`

**Body**:
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Planner_2025-01-06",
      "start_date": "2025-01-06",
      "status": "active",
      "created_at": "2025-01-06T10:00:00Z",
      "updated_at": "2025-01-06T10:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "user_id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Planner_2025-04-07",
      "start_date": "2025-04-07",
      "status": "active",
      "created_at": "2025-04-07T08:30:00Z",
      "updated_at": "2025-04-07T08:30:00Z"
    }
  ],
  "count": 2,
  "limit": 50,
  "offset": 0
}
```

### Błąd walidacji - 400 Bad Request

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "status",
      "message": "Invalid enum value. Expected 'ready' | 'active' | 'completed' | 'archived', received 'invalid'",
      "received": "invalid"
    }
  ]
}
```

### Brak autoryzacji - 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

### Błąd serwera - 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## 5. Przepływ danych

### Diagram przepływu

```
1. Klient → GET /api/v1/plans?status=active&limit=10
   ↓
2. Astro Middleware → Weryfikacja tokenu JWT
   ↓
3. API Route Handler → Walidacja query parameters (Zod)
   ↓
4. PlanService.getPlans() → Budowanie zapytania Supabase
   ↓
5. Supabase → SELECT * FROM plans WHERE user_id = ? AND status = ?
   ↓
6. PlanService → Transformacja wyników do PlanDTO[]
   ↓
7. API Route Handler → Formatowanie odpowiedzi z metadanymi paginacji
   ↓
8. Klient ← 200 OK { data: [...], count, limit, offset }
```

### Szczegółowy opis kroków

**Krok 1: Odbieranie żądania**
- Astro odbiera żądanie GET na `/api/v1/plans`
- Middleware dodaje instancję Supabase Client do `context.locals.supabase`

**Krok 2: Uwierzytelnianie**
- Middleware lub handler sprawdza obecność tokenu JWT w headerze `Authorization`
- Wywołanie `supabase.auth.getUser()` w celu weryfikacji tokenu
- Jeśli token jest nieprawidłowy/brakuje → zwrócenie 401

**Krok 3: Walidacja parametrów**
- Parser query parameters z `context.url.searchParams`
- Walidacja przez schemat Zod
- W przypadku niepowodzenia walidacji → zwrócenie 400 z szczegółami błędów

**Krok 4: Wywołanie serwisu**
- Handler wywołuje `PlanService.getPlans(userId, validatedParams)`
- Przekazanie zwalidowanych parametrów i ID użytkownika

**Krok 5: Zapytanie do bazy danych**
- PlanService buduje zapytanie Supabase:
  ```typescript
  let query = supabase
    .from('plans')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (params.status) {
    query = query.eq('status', params.status);
  }
  
  query = query.range(params.offset, params.offset + params.limit - 1);
  
  const { data, error, count } = await query;
  ```

**Krok 6: Obsługa odpowiedzi z bazy**
- Sprawdzenie czy wystąpił błąd
- Transformacja danych (w tym przypadku dane są już w formacie PlanDTO)
- Zwrócenie struktury z danymi i metadanymi paginacji

**Krok 7: Formatowanie odpowiedzi**
- Handler formatuje odpowiedź zgodnie ze specyfikacją
- Ustawienie odpowiednich headerów (Content-Type, Cache-Control)

**Krok 8: Zwrócenie odpowiedzi**
- Klient otrzymuje odpowiedź JSON ze statusem 200

### Interakcje z zewnętrznymi systemami

**Supabase Database (PostgreSQL)**:
- Tabela: `plans`
- Wykorzystywane indeksy:
  - `idx_plans_user_id` - dla filtrowania po user_id
  - `idx_plans_status` - dla filtrowania po statusie
  - `idx_plans_start_date` - potencjalnie dla sortowania

**Supabase Auth**:
- Weryfikacja tokenu JWT
- Pobranie user_id z tokenu

---

## 6. Względy bezpieczeństwa

### 1. Uwierzytelnianie

**Mechanizm**: JWT token w headerze Authorization
```
Authorization: Bearer <jwt_token>
```

**Implementacja**:
```typescript
const { data: { user }, error } = await supabase.auth.getUser();

if (error || !user) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized', message: 'Invalid or missing token' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### 2. Autoryzacja

**Zasada**: Użytkownik może widzieć TYLKO własne planery

**Implementacja**:
- Wszystkie zapytania do tabeli `plans` muszą zawierać filtr `WHERE user_id = <authenticated_user_id>`
- Nigdy nie polegać na parametrach klienta do określenia user_id
- Zawsze używać user_id z zweryfikowanego tokenu

```typescript
const query = supabase
  .from('plans')
  .select('*')
  .eq('user_id', user.id);  // ZAWSZE filtruj po user_id z tokenu
```

### 3. Walidacja danych wejściowych

**Schemat Zod**:
```typescript
import { z } from 'zod';

const GetPlansQuerySchema = z.object({
  status: z.enum(['active', 'completed', 'archived']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});
```

**Zabezpieczenia**:
- `limit` ograniczony do max 100 (zapobiega przeciążeniu serwera)
- `offset` nie może być ujemny
- `status` musi być jedną z dozwolonych wartości
- `z.coerce` automatycznie konwertuje string → number i obsługuje błędy konwersji

### 4. Ochrona przed SQL Injection

- Supabase SDK automatycznie używa prepared statements
- Brak bezpośrednich zapytań SQL w kodzie aplikacji
- Wszystkie parametry są sanitized przez SDK

### 5. Rate Limiting

**MVP**: Nie implementujemy w pierwszej wersji

**Przyszłość**: Rozważyć dodanie:
- Rate limiting per user (np. 100 żądań/minutę)
- Rate limiting per IP
- Implementacja przez middleware Astro lub Supabase Edge Functions

### 6. CORS i Headers

**Headers bezpieczeństwa**:
```typescript
{
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
}
```

### 7. Logging i Monitoring

- NIE logować tokenów JWT
- Logować tylko niezbędne informacje (user_id, timestamp, endpoint, status)
- W produkcji rozważyć integrację z Sentry lub podobnym narzędziem

---

## 7. Obsługa błędów

### Katalog błędów

| Kod | Scenariusz | Przyczyna | Odpowiedź | Akcja |
|-----|-----------|-----------|-----------|-------|
| 400 | Validation Error | Nieprawidłowe query parameters | `{ error: 'Validation failed', details: [...] }` | Poprawić parametry żądania |
| 401 | Unauthorized | Brak tokenu JWT | `{ error: 'Unauthorized', message: 'Missing authentication token' }` | Zalogować się ponownie |
| 401 | Unauthorized | Nieprawidłowy token JWT | `{ error: 'Unauthorized', message: 'Invalid authentication token' }` | Zalogować się ponownie |
| 401 | Unauthorized | Token wygasł | `{ error: 'Unauthorized', message: 'Token expired' }` | Odświeżyć token |
| 500 | Database Error | Błąd połączenia z bazą | `{ error: 'Internal server error', message: 'Database connection failed' }` | Spróbować ponownie, skontaktować się z supportem |
| 500 | Unexpected Error | Nieoczekiwany błąd serwera | `{ error: 'Internal server error', message: 'An unexpected error occurred' }` | Spróbować ponownie, skontaktować się z supportem |

### Implementacja obsługi błędów

**1. Try-Catch w Handler**:
```typescript
try {
  // Główna logika
} catch (error) {
  console.error('Error in GET /api/v1/plans:', error);
  return new Response(
    JSON.stringify({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**2. Walidacja Zod**:
```typescript
const result = GetPlansQuerySchema.safeParse(queryParams);

if (!result.success) {
  const details = result.error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
    received: issue.received
  }));
  
  return new Response(
    JSON.stringify({ error: 'Validation failed', details }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**3. Obsługa błędów Supabase**:
```typescript
const { data, error, count } = await query;

if (error) {
  console.error('Supabase error:', error);
  return new Response(
    JSON.stringify({
      error: 'Internal server error',
      message: 'Database query failed'
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**4. Early Returns dla Edge Cases**:
```typescript
// Sprawdzenie uwierzytelnienia
if (!user) {
  return new Response(..., { status: 401 });
}

// Sprawdzenie walidacji
if (!result.success) {
  return new Response(..., { status: 400 });
}

// Happy path na końcu
return new Response(JSON.stringify(response), { status: 200 });
```

---

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

**1. Duża liczba planerów**:
- Problem: Użytkownik z setkami planerów
- Rozwiązanie: Paginacja z ograniczeniem max limit=100

**2. Brak indeksów**:
- Problem: Wolne zapytania przy dużej liczbie rekordów
- Rozwiązanie: Wykorzystanie istniejących indeksów:
  - `idx_plans_user_id`
  - `idx_plans_status`

**3. Brak cache'owania**:
- Problem: Powtarzające się identyczne zapytania
- Rozwiązanie MVP: Brak (dla uproszczenia)
- Rozwiązanie przyszłość: Dodać Cache-Control headers

### Strategie optymalizacji

**1. Paginacja**:
```typescript
// Użycie .range() dla efektywnej paginacji
query = query.range(offset, offset + limit - 1);
```

**2. Selective Field Loading** (opcjonalnie na przyszłość):
```typescript
// Zamiast SELECT *
.select('id, name, start_date, status, created_at, updated_at')
```

**3. Proper Indexing**:
- Upewnić się, że migracje zawierają wszystkie wymagane indeksy
- Monitorować slow queries w Supabase Dashboard

**4. Cache Headers** (przyszłość):
```typescript
headers: {
  'Content-Type': 'application/json',
  'Cache-Control': 'private, max-age=60' // 1 minuta cache
}
```

**5. Connection Pooling**:
- Supabase automatycznie zarządza connection pooling
- Brak dodatkowej konfiguracji w MVP

### Metryki do monitorowania

- Średni czas odpowiedzi endpointu
- Liczba żądań per sekunda
- Wskaźnik błędów (error rate)
- Rozmiar odpowiedzi (payload size)
- Użycie bazy danych (query execution time)

---

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji Zod

**Plik**: `src/lib/validation/plan.validation.ts`

**Zawartość**:
```typescript
import { z } from 'zod';

export const GetPlansQuerySchema = z.object({
  status: z.enum(['ready', 'active', 'completed', 'archived']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export type GetPlansQuery = z.infer<typeof GetPlansQuerySchema>;
```

**Testy**:
- Sprawdzić poprawną walidację prawidłowych parametrów (w tym status='ready')
- Sprawdzić odrzucenie nieprawidłowych wartości (np. status='invalid')
- Sprawdzić domyślne wartości (limit=50, offset=0)
- Sprawdzić wszystkie wartości enum dla status: 'ready', 'active', 'completed', 'archived'

---

### Krok 2: Utworzenie PlanService

**Plik**: `src/lib/services/plan.service.ts`

**Zawartość**:
```typescript
import type { SupabaseClient } from '../db/supabase.client';
import type { Database } from '../db/database.types';
import type { PlanDTO, PlanListParams, PaginatedResponse } from '../types';

export class PlanService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Pobiera listę planerów dla danego użytkownika z opcjonalnym filtrowaniem i paginacją
   * 
   * @param userId - ID użytkownika (z tokenu JWT)
   * @param params - Parametry zapytania (status, limit, offset)
   * @returns Promise z listą planerów i metadanymi paginacji
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   * 
   * @example
   * ```typescript
   * const plans = await planService.getPlans(userId, {
   *   status: 'active',
   *   limit: 10,
   *   offset: 0
   * });
   * ```
   */
  async getPlans(
    userId: string,
    params: PlanListParams
  ): Promise<PaginatedResponse<PlanDTO>> {
    const { status, limit = 50, offset = 0 } = params;

    let query = this.supabase
      .from('plans')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch plans: ${error.message}`);
    }

    return {
      data: data || [],
      count: count || 0,
      limit,
      offset
    };
  }
}
```

**Testy**:
- Sprawdzić filtrowanie po user_id
- Sprawdzić filtrowanie po statusie
- Sprawdzić paginację (limit, offset)
- Sprawdzić sortowanie (najnowsze na początku)
- Sprawdzić obsługę błędów

---

### Krok 3: Utworzenie API Route Handler

**Plik**: `src/pages/api/v1/plans.ts`

**Zawartość**:
```typescript
/**
 * API Endpoint: GET /api/v1/plans
 * 
 * Returns all plans for the authenticated user with optional filtering and pagination.
 * 
 * Query Parameters:
 * - status: Filter by plan status (ready, active, completed, archived) - optional
 * - limit: Number of results per page (1-100, default: 50) - optional
 * - offset: Pagination offset (min: 0, default: 0) - optional
 * 
 * Responses:
 * - 200: Success with paginated list of plans
 * - 400: Invalid query parameters
 * - 401: Unauthorized (missing or invalid token)
 * - 500: Internal server error
 */

import type { APIRoute } from 'astro';
import { PlanService } from '../../../lib/services/plan.service';
import { GetPlansQuerySchema } from '../../../lib/validation/plan.validation';
import { DEFAULT_USER_ID } from '../../../db/supabase.client';
import type { ErrorResponse, ValidationErrorResponse } from '../../../types';

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    // Step 1: Authentication - Using default user for MVP/development
    // TODO: Implement real authentication with JWT token verification
    const userId = DEFAULT_USER_ID;

    // Step 2: Parse and validate query parameters
    const queryParams = {
      status: url.searchParams.get('status'),
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset')
    };

    const validationResult = GetPlansQuerySchema.safeParse(queryParams);

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

    // Step 3: Call service to fetch plans
    const planService = new PlanService(locals.supabase);
    const result = await planService.getPlans(userId, validationResult.data);

    // Step 4: Return successful response
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
    console.error('Error in GET /api/v1/plans:', error);
    
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

**Testy**:
- Sprawdzić odpowiedź 400 dla nieprawidłowych parametrów
- Sprawdzić odpowiedź 200 z prawidłowymi danymi
- Sprawdzić obsługę błędów serwera

---

### Krok 4: Testy integracyjne

**Scenariusze testowe**:

1. **Test walidacji**:
   - `status=invalid` → 400
   - `status=ready` → 200 (poprawny status)
   - `status=active` → 200 (poprawny status)
   - `status=completed` → 200 (poprawny status)
   - `status=archived` → 200 (poprawny status)
   - `limit=-10` → 400
   - `limit=200` → 400 (przekracza max)
   - `offset=-5` → 400
   - Brak parametrów → 200 z domyślnymi wartościami (limit=50, offset=0)

2. **Test funkcjonalności**:
   - Pobranie wszystkich planerów → sprawdzić czy zwraca tylko planery użytkownika
   - Filtrowanie po status=active → sprawdzić czy zwraca tylko aktywne
   - Paginacja → sprawdzić czy limit i offset działają poprawnie
   - Sortowanie → sprawdzić czy najnowsze są na początku

3. **Test edge cases**:
   - Użytkownik bez planerów → `{ data: [], count: 0, limit: 50, offset: 0 }`
   - Offset większy niż liczba wyników → pusta tablica
   - Bardzo duży limit (100) → sprawdzić wydajność

---

### Krok 5: Dokumentacja

**Aktualizacje**:

1. Dodać endpoint do dokumentacji API
2. Dodać przykłady użycia w README (jeśli dotyczy)
3. Dodać komentarze JSDoc do funkcji serwisu
4. Dodać przykładowe requesty/responses do docs

**Przykład JSDoc**:
```typescript
/**
 * Pobiera listę planerów dla danego użytkownika
 * 
 * @param userId - ID użytkownika (z tokenu JWT)
 * @param params - Parametry zapytania (status, limit, offset)
 * @returns Promise z listą planerów i metadanymi paginacji
 * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
 * 
 * @example
 * ```typescript
 * const plans = await planService.getPlans(userId, {
 *   status: 'active',
 *   limit: 10,
 *   offset: 0
 * });
 * ```
 */
async getPlans(userId: string, params: PlanListParams): Promise<PaginatedResponse<PlanDTO>>
```

---

### Krok 6: Weryfikacja i deployment

**Checklist przed deployment**:

- [ ] Wszystkie testy przechodzą
- [ ] Walidacja działa poprawnie
- [ ] Uwierzytelnianie jest wymuszane
- [ ] Użytkownik widzi tylko własne planery
- [ ] Paginacja działa zgodnie z oczekiwaniami
- [ ] Błędy są obsługiwane i logowane
- [ ] Kod jest zgodny z regułami lintera/formattera
- [ ] Dokumentacja jest aktualna
- [ ] Przeprowadzono code review
- [ ] Zmienne środowiskowe są skonfigurowane (SUPABASE_URL, SUPABASE_KEY)

**Deployment**:
1. Merge do main branch
2. CI/CD pipeline uruchamia testy
3. Deploy do środowiska staging
4. Smoke tests na staging
5. Deploy do produkcji
6. Monitoring metryk i błędów

---

## 10. Dodatkowe uwagi

### Rozszerzenia przyszłościowe

**1. Sortowanie**:
- Dodać parametr `sort` do sortowania po różnych polach
- Przykład: `?sort=start_date:asc` lub `?sort=name:desc`

**2. Wyszukiwanie**:
- Dodać parametr `search` do wyszukiwania po nazwie planera
- Przykład: `?search=Q1%202025`

**3. Bulk operations**:
- Endpoint do masowej aktualizacji statusów
- Endpoint do eksportu wielu planerów

**4. Cache'owanie**:
- Implementacja Redis cache dla często pobieranych danych
- Cache invalidation przy aktualizacji/usunięciu

**5. Real-time updates**:
- Supabase Realtime subscriptions dla live updates
- WebSocket notifications przy zmianach

### Monitorowanie w produkcji

**Metryki do śledzenia**:
- Request rate (żądania/sekundę)
- Response time (p50, p95, p99)
- Error rate (błędy/wszystkie żądania)
- Cache hit rate (gdy cache będzie zaimplementowany)
- Database query performance

**Alerty**:
- Error rate > 5% → alert
- Response time p95 > 1s → warning
- Database connection failures → critical alert

