# API Endpoint Implementation Plan: GET Plan Dashboard Data

## 1. Przegląd punktu końcowego

Endpoint `GET /api/v1/plans/:id/dashboard` służy do pobierania zagregowanych danych niezbędnych do wyświetlenia głównego widoku planera (Dashboard) oraz drzewa hierarchii. Zwraca znormalizowaną strukturę (płaskie tablice) wszystkich powiązanych encji (cele, kamienie milowe, cele tygodniowe, zadania), co pozwala na zbudowanie widoku po stronie klienta bez konieczności wykonywania wielu zapytań ("waterfall request"). Endpoint obsługuje filtrowanie czasowe (widok tygodnia) oraz statusowe (widok aktywny).

## 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/v1/plans/[id]/dashboard`
- **Parametry:**
  - **Path (Wymagane):**
    - `id`: UUID (identyfikator planu)
  - **Query (Opcjonalne):**
    - `week_view`: `current` | `all` (domyślnie `current` w logice aplikacji klienckiej, tutaj opcjonalny filtr)
    - `status_view`: `active` | `all` (domyślnie `all`)
    - `week_number`: integer (1-12) - wymagane/używane tylko gdy `week_view=current` (jeśli brak, system wyliczy na podstawie daty startu planu)

## 3. Wykorzystywane typy

Należy dodać nowy typ odpowiedzi do `src/types.ts`, ponieważ istniejący `PlanDashboardDTO` posiada strukturę zagnieżdżoną, a specyfikacja wymaga struktury płaskiej.

```typescript
// Propozycja dodatku do src/types.ts

export interface DashboardMetrics {
  total_goals: number;
  completed_goals: number;
  total_tasks: number;
  completed_tasks: number;
}

export interface PlanDashboardResponse {
  plan: PlanDTO;
  goals: GoalDTO[];
  milestones: MilestoneDTO[];
  weekly_goals: WeeklyGoalDTO[];
  tasks: TaskDTO[];
  metrics: DashboardMetrics;
}

export interface DashboardOptions {
  weekView?: "current" | "all";
  statusView?: "active" | "all";
  weekNumber?: number;
}
```

## 4. Szczegóły odpowiedzi

- **Kod sukcesu:** `200 OK`
- **Format:** JSON (`PlanDashboardResponse`)

```json
{
  "data": {
    "plan": { ... },
    "goals": [ ... ],
    "milestones": [ ... ],
    "weekly_goals": [ ... ],
    "tasks": [ ... ],
    "metrics": {
      "total_goals": 3,
      "completed_goals": 0,
      "total_tasks": 45,
      "completed_tasks": 20
    }
  }
}
```

## 5. Przepływ danych

1.  **Klient** wysyła żądanie `GET`.
2.  **Astro API Route** (`src/pages/api/v1/plans/[id]/dashboard.ts`) odbiera żądanie.
3.  **Walidacja** parametrów wejściowych (Zod) sprawdza poprawność UUID oraz parametrów query.
4.  **Serwis** (`PlanService`) pobiera instancję `Supabase` z kontekstu żądania (`locals`).
5.  **Serwis** wykonuje zapytanie o plan, weryfikując `user_id` (właściciel).
6.  Jeśli plan istnieje, **Serwis** uruchamia równoległe zapytania (`Promise.all`) do bazy danych:
    - `long_term_goals` (z uwzględnieniem `status_view`)
    - `milestones` (z uwzględnieniem `status_view`)
    - `weekly_goals` (z uwzględnieniem `week_view`)
    - `tasks` (z uwzględnieniem `week_view` i `status_view`)
    - Agregacje dla `metrics` (osobne zapytania `count` lub wyliczenie na podstawie pobranych danych, jeśli to optymalne).
7.  **Serwis** zwraca obiekt `PlanDashboardResponse`.
8.  **API Route** zwraca odpowiedź JSON do klienta.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Endpoint chroniony middlewarem weryfikującym sesję użytkownika.
- **Autoryzacja:** Każde zapytanie do bazy danych musi zawierać klauzulę `.eq('user_id', userId)` (Defense in Depth), mimo że RLS (Row Level Security) w Supabase powinno to również egzekwować.
- **Walidacja:** Rygorystyczna walidacja typów parametrów (UUID, enumy) zapobiega SQL Injection i błędom logicznym.

## 7. Obsługa błędów

| Scenariusz                           | Kod HTTP | Komunikat/Akcja                                               |
| :----------------------------------- | :------- | :------------------------------------------------------------ |
| Plan nieznaleziony / brak dostępu    | 404      | `Plan not found`                                              |
| Błędny format UUID                   | 400      | `Invalid plan ID`                                             |
| Błędne parametry query (np. week=13) | 400      | `Validation failed` (z detalami Zod)                          |
| Błąd bazy danych                     | 500      | Logowanie błędu na serwerze, generyczny komunikat dla klienta |
| Brak tokenu autoryzacji              | 401      | Obsługiwane przez middleware                                  |

## 8. Rozważania dotyczące wydajności

- **Indeksy:** Wykorzystanie istniejących indeksów (`idx_tasks_plan_id`, `idx_tasks_week_number`, `idx_tasks_status` itp.) zdefiniowanych w `db-plan.md` jest kluczowe dla szybkości filtrowania.
- **Parallel Fetching:** Użycie `Promise.all` znacząco skróci czas odpowiedzi w porównaniu do sekwencyjnego pobierania encji.
- **Selekcja kolumn:** Należy pobierać tylko wymagane kolumny (w tym przypadku większość, ale warto upewnić się, że nie pobieramy zbędnych danych binarnych, jeśli takie by były).
- **Cache:** Rozważenie nagłówków Cache-Control (np. `private, max-age=60`) dla krótkotrwałego cache'owania po stronie klienta, jeśli dane nie zmieniają się co sekundę.

## 9. Etapy wdrożenia

### Krok 1: Aktualizacja Typów

Zaktualizuj plik `src/types.ts`, dodając interfejsy `DashboardMetrics`, `PlanDashboardResponse` oraz `DashboardOptions`.

### Krok 2: Implementacja Logiki w PlanService

Rozszerz klasę `PlanService` w `src/lib/services/plan.service.ts` o metodę:

```typescript
async getDashboardData(
  planId: string,
  userId: string,
  options: DashboardOptions
): Promise<PlanDashboardResponse | null>
```

Metoda ta powinna implementować logikę równoległego pobierania danych z uwzględnieniem filtrów.

### Krok 3: Utworzenie Endpointu API

Utwórz plik `src/pages/api/v1/plans/[id]/dashboard.ts`.

- Zaimplementuj handler `GET`.
- Użyj `zod` do walidacji `params` (id) i `request.url` (query parameters).
- Wywołaj `planService.getDashboardData`.
- Obsłuż stany błędów (404, 500).

### Krok 4: Weryfikacja (Testy Manualne)

Użyj pliku `.http` lub narzędzia Postman, aby zweryfikować działanie endpointu:

- Pobranie pełnego dashboardu.
- Pobranie z filtrem `week_view=current` (sprawdź czy wracają zadania tylko z danego tygodnia).
- Pobranie z filtrem `status_view=active` (sprawdź czy ukrywa ukończone zadania).
- Próba dostępu do nieistniejącego planu (404).
