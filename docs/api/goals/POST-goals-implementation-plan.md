# API Endpoint Implementation Plan: POST /api/v1/goals

## 1. Przegląd punktu końcowego

**Endpoint:** `POST /api/v1/goals`

**Cel:** Utworzenie nowego długoterminowego celu (long-term goal) powiązanego z istniejącym 12-tygodniowym planerem.

**Funkcjonalność:**
- Użytkownik może utworzyć do 5 celów długoterminowych dla każdego planera
- Cele służą do definiowania głównych priorytetów na 12 tygodni
- Każdy cel może mieć przypisaną kategorię (praca, finanse, hobby, relacje, zdrowie, rozwój)
- Postęp celu jest śledzony manualnie (0-100%)
- Cele mają określoną kolejność wyświetlania (position 1-5)

**Powiązania z innymi zasobami:**
- Cel należy do konkretnego planera (`plan_id`)
- Cel może mieć powiązane kamienie milowe (milestones) - relacja 1:N
- Cel może być powiązany z celami tygodniowymi (weekly_goals) - relacja 1:N

---

## 2. Szczegóły żądania

### 2.1. Metoda HTTP i URL
- **Metoda:** `POST`
- **Struktura URL:** `/api/v1/goals`
- **Content-Type:** `application/json`

### 2.2. Parametry żądania

#### Request Body (JSON):

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

#### Parametry wymagane:
- **plan_id** (string, UUID)
  - Identyfikator planera, do którego należy cel
  - Musi wskazywać na istniejący plan należący do użytkownika
  - Walidacja: format UUID
  
- **title** (string)
  - Tytuł długoterminowego celu
  - Walidacja: wymagany, min 1 znak, max 255 znaków, trimmed

#### Parametry opcjonalne:
- **description** (string, nullable)
  - Uzasadnienie - dlaczego cel jest ważny
  - Walidacja: brak ograniczeń długości
  - Domyślnie: null

- **category** (string, nullable)
  - Kategoria celu
  - Walidacja: enum - jedna z wartości: `work`, `finance`, `hobby`, `relationships`, `health`, `development`
  - Domyślnie: null

- **progress_percentage** (integer)
  - Manualny postęp celu (0-100%)
  - Walidacja: integer, zakres 0-100
  - Domyślnie: 0

- **position** (integer)
  - Kolejność wyświetlania celów (1-5)
  - Walidacja: integer, zakres 1-5
  - Domyślnie: 1

### 2.3. Ograniczenia biznesowe
- **Maksymalnie 5 celów na plan** - egzekwowane przez trigger bazodanowy `validate_max_goals_per_plan`
- Plan musi istnieć i należeć do użytkownika

---

## 3. Wykorzystywane typy

### 3.1. Command Model (Request)

```typescript
// Już zdefiniowany w src/types.ts
export type CreateGoalCommand = Pick<
  LongTermGoalInsert,
  'plan_id' | 'title' | 'description' | 'category' | 'progress_percentage' | 'position'
>;
```

### 3.2. DTO (Response)

```typescript
// Już zdefiniowany w src/types.ts
export type GoalDTO = LongTermGoalEntity;

export interface ItemResponse<T> {
  data: T;
}
```

### 3.3. Error Types

```typescript
// Już zdefiniowane w src/types.ts
export interface ValidationErrorResponse {
  error: 'Validation failed';
  details: ValidationErrorDetail[];
}

export interface ErrorResponse {
  error: string;
  message?: string;
}
```

### 3.4. Nowe typy do stworzenia

Żadne - wszystkie potrzebne typy są już zdefiniowane w `src/types.ts`.

---

## 4. Szczegóły odpowiedzi

### 4.1. Sukces - 201 Created

**Struktura odpowiedzi:**
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

**Headers:**
```
Content-Type: application/json
X-Content-Type-Options: nosniff
```

### 4.2. Błąd walidacji - 400 Bad Request

**Przykład 1: Brakujące wymagane pole**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

**Przykład 2: Nieprawidłowa kategoria**
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

**Przykład 3: Progress poza zakresem**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "progress_percentage",
      "message": "Progress must be between 0 and 100"
    }
  ]
}
```

**Przykład 4: Przekroczony limit 5 celów**
```json
{
  "error": "Constraint violation",
  "message": "Maximum 5 goals per plan exceeded"
}
```

### 4.3. Plan nie znaleziony - 404 Not Found

```json
{
  "error": "Plan not found",
  "message": "Plan does not exist or does not belong to user"
}
```

### 4.4. Brak autoryzacji - 401 Unauthorized

**Uwaga:** W MVP używamy `DEFAULT_USER_ID`, więc ten błąd nie wystąpi. 

W przyszłości (po implementacji autentykacji):
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

### 4.5. Błąd serwera - 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## 5. Przepływ danych

### 5.1. Diagram przepływu

```
1. Client
   ↓ POST /api/v1/goals + JSON body
   
2. API Route Handler (/api/v1/goals.ts)
   ↓ Parse request body
   ↓ Validate with Zod schema
   ↓ Extract DEFAULT_USER_ID
   
3. GoalService.createGoal()
   ↓ Verify plan exists (getPlanById)
   ↓ Check plan belongs to user
   ↓ Insert goal into database
   ↓ Handle database constraints
   
4. Supabase (PostgreSQL)
   ↓ Execute INSERT INTO long_term_goals
   ↓ Trigger: validate_max_goals_per_plan (max 5)
   ↓ Trigger: update_updated_at_column
   ↓ Return inserted row
   
5. API Route Handler
   ↓ Format response (ItemResponse<GoalDTO>)
   ↓ Return 201 Created
   
6. Client
   ← Receive created goal data
```

### 5.2. Interakcje z bazą danych

#### Zapytanie 1: Weryfikacja istnienia planu (w GoalService)
```sql
SELECT * FROM plans 
WHERE id = $1 AND user_id = $2
LIMIT 1;
```

#### Zapytanie 2: Wstawienie nowego celu
```sql
INSERT INTO long_term_goals (
  plan_id,
  title,
  description,
  category,
  progress_percentage,
  position
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;
```

#### Triggery aktywowane automatycznie:
1. **validate_max_goals_per_plan** - sprawdza limit 5 celów na plan
2. **update_updated_at_column** - ustawia `updated_at` na NOW()

### 5.3. Zewnętrzne zależności

- **Supabase Client** - komunikacja z bazą PostgreSQL
- **Zod** - walidacja danych wejściowych
- **Astro middleware** - dostęp do `locals.supabase`

---

## 6. Względy bezpieczeństwa

### 6.1. Autentykacja

**Aktualny stan (MVP):**
- Używamy `DEFAULT_USER_ID` z `src/db/supabase.client.ts`
- Brak weryfikacji tokenu JWT

**Plan przyszłościowy:**
```typescript
// TODO: Implement authentication
const authHeader = request.headers.get('Authorization');
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401 }
  );
}

const token = authHeader.substring(7);
const { data: { user }, error } = await locals.supabase.auth.getUser(token);

if (error || !user) {
  return new Response(
    JSON.stringify({ error: 'Invalid token' }),
    { status: 401 }
  );
}

const userId = user.id;
```

### 6.2. Autoryzacja

**Weryfikacja własności planera:**
- Service musi sprawdzić, czy `plan_id` należy do użytkownika
- Zapobiega tworzeniu celów dla cudzych planerów

```typescript
// W GoalService.createGoal()
const plan = await this.getPlanById(data.plan_id, userId);
if (!plan) {
  throw new Error('Plan not found or does not belong to user');
}
```

### 6.3. Walidacja danych wejściowych

**Poziom 1: Walidacja formatu (Zod)**
- UUID dla `plan_id`
- String constraints dla `title`
- Enum dla `category`
- Range checking dla `progress_percentage` i `position`

**Poziom 2: Walidacja biznesowa (Service + Database)**
- Istnienie planera
- Własność planera
- Limit 5 celów (database trigger)

### 6.4. Bezpieczeństwo SQL

- **Parametryzowane zapytania:** Supabase Client automatycznie używa prepared statements
- **Brak SQL injection:** Wszystkie dane przechodzą przez Supabase Client API

### 6.5. Ochrona XSS

- Wszystkie dane są serializowane przez `JSON.stringify()`
- Header `X-Content-Type-Options: nosniff` zapobiega MIME sniffing

### 6.6. Rate Limiting

**Aktualnie:** Brak rate limiting w MVP

**Rekomendacja przyszłościowa:**
- Implementacja middleware z rate limiting
- Limit: np. 100 requests/godzinę per użytkownik
- Response 429 Too Many Requests

---

## 7. Obsługa błędów

### 7.1. Hierarchia obsługi błędów

```
1. Parse Error (Invalid JSON)
   → 400 Bad Request
   
2. Validation Error (Zod)
   → 400 Bad Request + details
   
3. Business Logic Error (Service)
   → 404 Not Found (plan not exists)
   → 400 Bad Request (constraint violations)
   
4. Database Error
   → 400 Bad Request (constraint: max 5 goals)
   → 500 Internal Server Error (unexpected)
   
5. Unexpected Error
   → 500 Internal Server Error
```

### 7.2. Scenariusze błędów

| Status | Kod błędu | Scenariusz | Przykład |
|--------|-----------|------------|----------|
| 400 | Invalid JSON | Body nie jest poprawnym JSON | `{ invalid json` |
| 400 | Validation failed | Brak wymaganego pola | `title` nie podany |
| 400 | Validation failed | Nieprawidłowy format UUID | `plan_id: "123"` |
| 400 | Validation failed | Nieprawidłowa kategoria | `category: "unknown"` |
| 400 | Validation failed | Progress poza zakresem | `progress_percentage: 150` |
| 400 | Validation failed | Position poza zakresem | `position: 10` |
| 400 | Validation failed | Title za długi | `title: "a".repeat(300)` |
| 400 | Constraint violation | Maksymalnie 5 celów | Próba dodania 6. celu |
| 404 | Plan not found | Plan nie istnieje | Nieistniejący UUID |
| 404 | Plan not found | Plan należy do innego użytkownika | Cudzy plan |
| 500 | Internal server error | Nieoczekiwany błąd bazy danych | Timeout, connection lost |

### 7.3. Logowanie błędów

**Console logging:**
```typescript
console.error('Error in POST /api/v1/goals:', {
  error: error.message,
  userId,
  planId: data.plan_id,
  timestamp: new Date().toISOString()
});
```

**Logi nie zawierają:**
- Pełnych danych użytkownika (tylko ID)
- Wrażliwych informacji
- Stack traces w produkcji (tylko w development)

### 7.4. Obsługa błędów constraint z bazy danych

```typescript
// W GoalService.createGoal()
try {
  const { data: goal, error } = await this.supabase
    .from('long_term_goals')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    // Constraint violation: max 5 goals per plan
    if (error.code === '23514' || error.message.includes('max_goals')) {
      throw new Error('Maximum 5 goals per plan exceeded');
    }
    
    // Other database errors
    throw new Error(`Failed to create goal: ${error.message}`);
  }

  return goal;
} catch (error) {
  // Re-throw for handler
  throw error;
}
```

---

## 8. Rozważania dotyczące wydajności

### 8.1. Potencjalne wąskie gardła

1. **Weryfikacja istnienia planu**
   - Dodatkowe zapytanie SELECT przed INSERT
   - Opóźnienie: ~10-50ms

2. **Database triggers**
   - `validate_max_goals_per_plan` - COUNT query na long_term_goals
   - `update_updated_at_column` - update timestamp
   - Opóźnienie: ~5-20ms per trigger

### 8.2. Optymalizacje

**1. Index na plan_id w long_term_goals**
- Już istnieje: `idx_long_term_goals_plan_id`
- Przyspiesza weryfikację limitu 5 celów w triggerze

**2. Single database transaction**
- Weryfikacja planu + insert celu powinny być w jednej transakcji
- Zapobiega race conditions

**3. Connection pooling**
- Supabase Client automatycznie używa connection pooling
- Brak dodatkowej konfiguracji

### 8.3. Benchmarki oczekiwane

- **Typowy request:** 50-150ms
  - Walidacja Zod: ~5ms
  - Weryfikacja planu: ~20ms
  - Insert + triggers: ~30ms
  - Overhead network: ~20-100ms

- **Worst case:** 300-500ms
  - Przy wysokim obciążeniu bazy danych
  - Przy wolnym połączeniu sieciowym

### 8.4. Skalowanie

**Limit celów:**
- Maksymalnie 5 celów na plan (constraint)
- Przy 1000 użytkownikach i średnio 2 planach: ~10,000 celów
- Tabela `long_term_goals` może obsłużyć miliony rekordów bez problemu

**Concurrent requests:**
- Supabase obsługuje tysiące równoczesnych połączeń
- Database triggers są atomic - brak race conditions

---

## 9. Etapy wdrożenia

### Krok 1: Utworzenie walidacji Zod
**Plik:** `src/lib/validation/goal.validation.ts`

```typescript
import { z } from 'zod';

/**
 * Request body schema for POST /api/v1/goals
 * Validates goal creation data
 */
export const CreateGoalBodySchema = z.object({
  plan_id: z.string().uuid({ message: 'Invalid plan ID format' }),
  
  title: z.string()
    .trim()
    .min(1, { message: 'Title is required' })
    .max(255, { message: 'Title must not exceed 255 characters' }),
  
  description: z.string().trim().nullish(),
  
  category: z.enum(
    ['work', 'finance', 'hobby', 'relationships', 'health', 'development'],
    {
      errorMap: () => ({ 
        message: 'Category must be one of: work, finance, hobby, relationships, health, development' 
      })
    }
  ).nullish(),
  
  progress_percentage: z.number()
    .int({ message: 'Progress must be an integer' })
    .min(0, { message: 'Progress must be at least 0' })
    .max(100, { message: 'Progress must not exceed 100' })
    .default(0),
  
  position: z.number()
    .int({ message: 'Position must be an integer' })
    .min(1, { message: 'Position must be at least 1' })
    .max(5, { message: 'Position must not exceed 5' })
    .default(1)
}).transform((data) => ({
  ...data,
  description: data.description ?? null,
  category: data.category ?? null
}));

/**
 * Inferred TypeScript type from CreateGoalBodySchema
 */
export type CreateGoalBody = z.infer<typeof CreateGoalBodySchema>;
```

**Testy walidacji:**
- Brakujące wymagane pola (plan_id, title)
- Nieprawidłowy format UUID
- Title za długi (>255 znaków)
- Nieprawidłowa kategoria
- Progress poza zakresem (< 0 lub > 100)
- Position poza zakresem (< 1 lub > 5)

---

### Krok 2: Utworzenie GoalService
**Plik:** `src/lib/services/goal.service.ts`

```typescript
import type { SupabaseClient } from '../../db/supabase.client';
import type { 
  GoalDTO, 
  CreateGoalCommand,
  LongTermGoalInsert
} from '../../types';
import { PlanService } from './plan.service';

export class GoalService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Tworzy nowy długoterminowy cel
   * 
   * @param userId - ID użytkownika (z tokenu JWT)
   * @param data - Dane celu (plan_id, title, description, category, progress_percentage, position)
   * @returns Promise z utworzonym celem
   * @throws Error jeśli plan nie istnieje lub nie należy do użytkownika
   * @throws Error jeśli przekroczono limit 5 celów (constraint violation)
   * @throws Error jeśli zapytanie do bazy danych nie powiedzie się
   */
  async createGoal(
    userId: string,
    data: CreateGoalCommand
  ): Promise<GoalDTO> {
    // Step 1: Verify plan exists and belongs to user
    const planService = new PlanService(this.supabase);
    const plan = await planService.getPlanById(data.plan_id, userId);
    
    if (!plan) {
      throw new Error('Plan not found or does not belong to user');
    }

    // Step 2: Prepare insert data
    const insertData: LongTermGoalInsert = {
      plan_id: data.plan_id,
      title: data.title,
      description: data.description ?? null,
      category: data.category ?? null,
      progress_percentage: data.progress_percentage ?? 0,
      position: data.position ?? 1
    };

    // Step 3: Execute insert
    const { data: goal, error } = await this.supabase
      .from('long_term_goals')
      .insert(insertData)
      .select()
      .single();

    // Step 4: Handle database errors
    if (error) {
      // Check for constraint violations (max 5 goals per plan)
      if (error.code === '23514' || error.message.includes('max_goals')) {
        throw new Error('Maximum 5 goals per plan exceeded');
      }
      
      // Other database errors
      throw new Error(`Failed to create goal: ${error.message}`);
    }

    return goal;
  }

  /**
   * Pobiera cel po ID
   * Weryfikuje, że cel należy do użytkownika (przez plan_id)
   * 
   * @param goalId - UUID celu
   * @param userId - ID użytkownika
   * @returns Promise z celem lub null jeśli nie istnieje/nie należy do użytkownika
   */
  async getGoalById(goalId: string, userId: string): Promise<GoalDTO | null> {
    // Join with plans to verify user ownership
    const { data, error } = await this.supabase
      .from('long_term_goals')
      .select(`
        *,
        plans!inner(user_id)
      `)
      .eq('id', goalId)
      .eq('plans.user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch goal: ${error.message}`);
    }

    // Remove nested plans data before returning
    if (data) {
      const { plans, ...goal } = data as any;
      return goal as GoalDTO;
    }

    return null;
  }
}
```

**Testy service:**
- Utworzenie celu dla istniejącego planu
- Błąd 404 gdy plan nie istnieje
- Błąd 404 gdy plan należy do innego użytkownika
- Błąd 400 gdy przekroczono limit 5 celów
- Poprawne domyślne wartości (progress_percentage=0, position=1)

---

### Krok 3: Utworzenie API Route Handler
**Plik:** `src/pages/api/v1/goals.ts`

```typescript
/**
 * API Endpoints: /api/v1/goals
 * 
 * POST - Creates a new long-term goal
 * 
 * POST Request Body:
 * - plan_id: UUID (required)
 * - title: string (required, 1-255 characters)
 * - description: string (optional)
 * - category: enum (optional) - work, finance, hobby, relationships, health, development
 * - progress_percentage: integer (0-100, default: 0)
 * - position: integer (1-5, default: 1)
 * 
 * Responses:
 * - 201: Created
 * - 400: Validation error or constraint violation
 * - 404: Plan not found
 * - 500: Internal server error
 */

import type { APIRoute } from 'astro';
import { GoalService } from '../../../lib/services/goal.service';
import { CreateGoalBodySchema } from '../../../lib/validation/goal.validation';
import { DEFAULT_USER_ID } from '../../../db/supabase.client';
import type { 
  ErrorResponse, 
  ValidationErrorResponse,
  ItemResponse,
  GoalDTO
} from '../../../types';

export const prerender = false;

/**
 * POST /api/v1/goals
 * Creates a new long-term goal
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Step 1: Authentication - Using default user for MVP
    // TODO: Implement real authentication with JWT token verification
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
    const validationResult = CreateGoalBodySchema.safeParse(body);

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

    // Step 4: Call service to create goal
    const goalService = new GoalService(locals.supabase);
    
    try {
      const goal = await goalService.createGoal(userId, validationResult.data);

      // Step 5: Return successful response
      return new Response(
        JSON.stringify({ data: goal } as ItemResponse<GoalDTO>),
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
      const errorMessage = serviceError instanceof Error 
        ? serviceError.message 
        : 'Unknown error';
      
      // Plan not found or doesn't belong to user
      if (errorMessage.includes('not found') || errorMessage.includes('does not belong')) {
        return new Response(
          JSON.stringify({
            error: 'Plan not found',
            message: 'Plan does not exist or does not belong to user'
          } as ErrorResponse),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Maximum 5 goals exceeded
      if (errorMessage.includes('Maximum 5 goals')) {
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
    console.error('Error in POST /api/v1/goals:', error);
    
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

**Testy endpoint:**
- Utworzenie celu z minimalnymi danymi (plan_id, title)
- Utworzenie celu ze wszystkimi opcjonalnymi polami
- Błąd 400 dla nieprawidłowego JSON
- Błąd 400 dla brakujących wymaganych pól
- Błąd 400 dla nieprawidłowych wartości enum
- Błąd 400 dla przekroczenia limitu 5 celów
- Błąd 404 dla nieistniejącego planu
- Błąd 404 dla planu należącego do innego użytkownika

---

### Krok 4: Utworzenie pliku testowego HTTP
**Plik:** `api-tests/goals-tests.http`

```http
### POST /api/v1/goals - Create goal with minimal data
POST http://localhost:4321/api/v1/goals
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "title": "Launch MVP"
}

### POST /api/v1/goals - Create goal with all fields
POST http://localhost:4321/api/v1/goals
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "title": "Achieve Financial Independence",
  "description": "Build passive income streams and reduce expenses",
  "category": "finance",
  "progress_percentage": 10,
  "position": 2
}

### POST /api/v1/goals - Create goal with work category
POST http://localhost:4321/api/v1/goals
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "title": "Get promoted to Senior Engineer",
  "description": "Demonstrate leadership and technical excellence",
  "category": "work",
  "progress_percentage": 25,
  "position": 1
}

### POST /api/v1/goals - Error: Missing required field (plan_id)
POST http://localhost:4321/api/v1/goals
Content-Type: application/json

{
  "title": "Test Goal"
}

### POST /api/v1/goals - Error: Missing required field (title)
POST http://localhost:4321/api/v1/goals
Content-Type: application/json

{
  "plan_id": "{{planId}}"
}

### POST /api/v1/goals - Error: Invalid UUID format
POST http://localhost:4321/api/v1/goals
Content-Type: application/json

{
  "plan_id": "not-a-uuid",
  "title": "Test Goal"
}

### POST /api/v1/goals - Error: Title too long (>255 characters)
POST http://localhost:4321/api/v1/goals
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "title": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet."
}

### POST /api/v1/goals - Error: Invalid category
POST http://localhost:4321/api/v1/goals
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "title": "Test Goal",
  "category": "invalid_category"
}

### POST /api/v1/goals - Error: Progress out of range (negative)
POST http://localhost:4321/api/v1/goals
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "title": "Test Goal",
  "progress_percentage": -10
}

### POST /api/v1/goals - Error: Progress out of range (>100)
POST http://localhost:4321/api/v1/goals
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "title": "Test Goal",
  "progress_percentage": 150
}

### POST /api/v1/goals - Error: Position out of range (<1)
POST http://localhost:4321/api/v1/goals
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "title": "Test Goal",
  "position": 0
}

### POST /api/v1/goals - Error: Position out of range (>5)
POST http://localhost:4321/api/v1/goals
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "title": "Test Goal",
  "position": 10
}

### POST /api/v1/goals - Error: Plan not found
POST http://localhost:4321/api/v1/goals
Content-Type: application/json

{
  "plan_id": "00000000-0000-0000-0000-000000000000",
  "title": "Test Goal"
}

### POST /api/v1/goals - Error: Invalid JSON
POST http://localhost:4321/api/v1/goals
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "title": "Test Goal",
  invalid json
}

### Create 5 goals to test constraint (repeat until error)
### Goal 1
POST http://localhost:4321/api/v1/goals
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "title": "Goal 1",
  "position": 1
}

### Goal 2
POST http://localhost:4321/api/v1/goals
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "title": "Goal 2",
  "position": 2
}

### Goal 3
POST http://localhost:4321/api/v1/goals
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "title": "Goal 3",
  "position": 3
}

### Goal 4
POST http://localhost:4321/api/v1/goals
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "title": "Goal 4",
  "position": 4
}

### Goal 5
POST http://localhost:4321/api/v1/goals
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "title": "Goal 5",
  "position": 5
}

### Goal 6 - Should fail with max 5 goals constraint
POST http://localhost:4321/api/v1/goals
Content-Type: application/json

{
  "plan_id": "{{planId}}",
  "title": "Goal 6 - This should fail",
  "position": 1
}
```

---

### Krok 5: Testowanie integracyjne

**5.1. Przygotowanie środowiska testowego**
```bash
# Start Supabase locally
npx supabase start

# Start Astro dev server
npm run dev
```

**5.2. Utworzenie testowego planu**
```http
POST http://localhost:4321/api/v1/plans
Content-Type: application/json

{
  "name": "Test Plan for Goals",
  "start_date": "2025-01-06"
}
```

Zapisz `id` z odpowiedzi jako `{{planId}}` do testów.

**5.3. Wykonanie testów:**
1. Testy pozytywne:
   - Utworzenie celu z minimalnymi danymi ✓
   - Utworzenie celu ze wszystkimi polami ✓
   - Różne kategorie (work, finance, hobby, etc.) ✓
   - Różne wartości progress (0, 50, 100) ✓
   - Różne pozycje (1-5) ✓

2. Testy walidacji:
   - Brakujące wymagane pola ✓
   - Nieprawidłowy format UUID ✓
   - Title za długi ✓
   - Nieprawidłowa kategoria ✓
   - Progress poza zakresem ✓
   - Position poza zakresem ✓

3. Testy logiki biznesowej:
   - Plan nie istnieje ✓
   - Maksymalnie 5 celów ✓

4. Testy błędów:
   - Nieprawidłowy JSON ✓
   - Błędy bazy danych ✓

---

### Krok 6: Weryfikacja w bazie danych

**Sprawdzenie utworzonych celów:**
```sql
SELECT * FROM long_term_goals 
WHERE plan_id = '{{planId}}' 
ORDER BY position;
```

**Sprawdzenie triggera (max 5 celów):**
```sql
SELECT COUNT(*) as goal_count 
FROM long_term_goals 
WHERE plan_id = '{{planId}}';
-- Should be <= 5
```

**Sprawdzenie timestamps:**
```sql
SELECT 
  id, 
  title, 
  created_at, 
  updated_at 
FROM long_term_goals 
WHERE plan_id = '{{planId}}';
-- created_at and updated_at should be set automatically
```

---

### Krok 7: Dokumentacja i cleanup

**7.1. Dodanie komentarzy JSDoc**
- ✓ Komentarze w validation schema
- ✓ Komentarze w service methods
- ✓ Komentarze w API route handler

**7.2. Aktualizacja dokumentacji API**
- Dodanie przykładów do `docs/api/api-plan.md`
- Aktualizacja statusu implementacji w `docs/api/api-plan-status.md`

**7.3. Cleanup**
- Usunięcie testowych danych z bazy
- Przegląd kodu pod kątem redundancji
- Formatowanie kodu (Prettier)

---

## 10. Checklist implementacji

### Validation
- [ ] Utworzenie `src/lib/validation/goal.validation.ts`
- [ ] Schema dla CreateGoalBodySchema
- [ ] Testy walidacji wszystkich pól
- [ ] Testy edge cases (nullish values, defaults)

### Service
- [ ] Utworzenie `src/lib/services/goal.service.ts`
- [ ] Metoda `createGoal(userId, data)`
- [ ] Metoda `getGoalById(goalId, userId)` (helper)
- [ ] Weryfikacja własności planu
- [ ] Obsługa constraint violation (max 5 goals)
- [ ] Error handling

### API Route
- [ ] Utworzenie `src/pages/api/v1/goals.ts`
- [ ] POST handler
- [ ] Parse request body
- [ ] Walidacja z Zod
- [ ] Wywołanie service
- [ ] Obsługa wszystkich błędów (400, 404, 500)
- [ ] Poprawne response headers
- [ ] Status 201 dla sukcesu

### Testing
- [ ] Utworzenie `api-tests/goals-tests.http`
- [ ] Testy pozytywne (różne kombinacje pól)
- [ ] Testy walidacji (wszystkie scenariusze błędów)
- [ ] Test max 5 goals constraint
- [ ] Test plan not found
- [ ] Weryfikacja w bazie danych

### Documentation
- [ ] Komentarze JSDoc w validation
- [ ] Komentarze JSDoc w service
- [ ] Komentarze JSDoc w API route
- [ ] Aktualizacja `docs/api/api-plan-status.md`

### Code Quality
- [ ] Linting (ESLint)
- [ ] Formatting (Prettier)
- [ ] Type safety (TypeScript strict mode)
- [ ] No console.logs (poza error logging)
- [ ] Security review

---

## 11. Przyszłe usprawnienia

### Autentykacja
- [ ] Implementacja JWT token verification
- [ ] Middleware dla autentykacji
- [ ] Endpoint testing z różnymi użytkownikami

### Rate Limiting
- [ ] Middleware dla rate limiting
- [ ] Response 429 Too Many Requests
- [ ] Per-user limits

### Caching
- [ ] Cache verification planu (Redis/Memory)
- [ ] Invalidacja cache po update planu

### Monitoring
- [ ] Structured logging (Winston/Pino)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (APM)

### Testy jednostkowe
- [ ] Unit tests dla validation schemas
- [ ] Unit tests dla service methods
- [ ] Mock Supabase Client

### API Extensions
- [ ] GET /api/v1/goals - lista celów
- [ ] GET /api/v1/goals/:id - szczegóły celu
- [ ] PATCH /api/v1/goals/:id - aktualizacja celu
- [ ] DELETE /api/v1/goals/:id - usunięcie celu

---

## 12. Zależności i wymagania

### Wymagane pakiety (już zainstalowane)
- `astro` (v5+)
- `@supabase/supabase-js`
- `zod`
- `typescript`

### Baza danych
- Supabase PostgreSQL
- Tabela `long_term_goals` (już utworzona)
- Tabela `plans` (już utworzona)
- Trigger `validate_max_goals_per_plan` (już utworzony)
- Trigger `update_updated_at_column` (już utworzony)

### Środowisko
- Node.js 18+
- Supabase project (local or cloud)
- Environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_KEY`

---

## 13. Kontakt i wsparcie

**Pytania implementacyjne:**
- Sprawdź dokumentację w `docs/api/api-plan.md`
- Przejrzyj istniejący kod w `src/pages/api/v1/plans.ts`
- Przejrzyj service pattern w `src/lib/services/plan.service.ts`

**Problemy z bazą danych:**
- Sprawdź migracje w `supabase/migrations/`
- Sprawdź schema w `docs/db-plan-tables-relations.md`

**Problemy z walidacją:**
- Przejrzyj przykłady w `src/lib/validation/plan.validation.ts`
- Dokumentacja Zod: https://zod.dev

---

## 14. Podsumowanie

Ten endpoint implementuje kluczową funkcjonalność tworzenia długoterminowych celów w aplikacji 12 Weeks Planner. 

**Kluczowe aspekty:**
- ✅ Walidacja danych wejściowych na 3 poziomach (format, typ, biznesowa)
- ✅ Bezpieczna weryfikacja własności zasobów
- ✅ Obsługa constraint bazodanowych (max 5 celów)
- ✅ Szczegółowe komunikaty błędów dla klienta
- ✅ Struktura zgodna z istniejącym kodem (plan.service pattern)
- ✅ Kompletne pokrycie testami

**Timeline:**
- Implementacja: 2-3 godziny
- Testing: 1 godzina
- Documentation: 30 minut
- **Łącznie: ~4 godziny**

**Priorytet:** HIGH - blokuje implementację milestones i weekly goals

