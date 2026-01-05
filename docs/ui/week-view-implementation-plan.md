# Plan implementacji widoku Planowania Tygodniowego (Week View)

## 1. Przegląd
Widok planowania tygodniowego umożliwia użytkownikom taktyczne planowanie działań na konkretny tydzień w ramach 12-tygodniowego cyklu. Pozwala na tworzenie celów tygodniowych (Weekly Goals) powiązanych z celami długoterminowymi, zarządzanie zadaniami (Tasks) w ramach tych celów oraz zarządzanie zadaniami luźnymi (Ad-hoc). Widok wspiera priorytetyzację (A/B/C), przypisywanie zadań do dni tygodnia oraz linkowanie zadań z kamieniami milowymi.

## 2. Routing widoku
*   **Ścieżka:** `/plans/[id]/week/[weekNumber]`
*   **Parametry:**
    *   `id`: UUID planu
    *   `weekNumber`: Numer tygodnia (1-12)

## 3. Struktura komponentów

src/pages/plans/[id]/week/[weekNumber].astro (Strona wejściowa)
└── WeekPlannerContainer.tsx (Główny kontener React - State & Data)
    ├── WeekHeader.tsx (Nawigacja, daty tygodnia, podsumowanie postępu)
    ├── DndContext (Kontekst Drag & Drop)
    │   ├── WeeklyGoalsSection.tsx (Lista celów tygodniowych)
    │   │   ├── SortableContext (Pionowa lista celów)
    │   │   │   └── WeeklyGoalCard.tsx (Karta celu)
    │   │   │       ├── GoalHeader.tsx (Tytuł, Link do LT Goal, Menu akcji)
    │   │   │       ├── GoalProgressBar.tsx
    │   │   │       ├── TaskList.tsx (Lista zadań w celu)
    │   │   │       │   └── SortableContext
    │   │   │       │       └── TaskItem.tsx (Pojedyncze zadanie)
    │   │   │       │           ├── TaskStatusCheckbox.tsx
    │   │   │       │           ├── TaskContent.tsx (Tytuł, Badge Priorytetu, Badge Milestone, Info o dniu)
    │   │   │       │           └── TaskContextMenu.tsx (Menu kontekstowe: Dzień, Milestone, Usuń)
    │   │   │       └── InlineAddTask.tsx (Szybkie dodawanie podzadań)
    │   │   └── CreateWeeklyGoalButton.tsx
    │   │
    │   └── AdHocSection.tsx (Sekcja zadań luźnych)
    │       ├── SectionHeader.tsx
    │       ├── TaskList.tsx (Reużywalna lista zadań)
    │       │   └── SortableContext
    │       │       └── TaskItem.tsx (Reużywalny komponent zadania)
    │       └── InlineAddTask.tsx
    │
    ├── LinkToGoalDialog.tsx (Dialog wyboru celu długoterminowego)
    └── LinkToMilestoneDialog.tsx (Dialog wyboru kamienia milowego)## 4. Szczegóły komponentów

### 4.1. `WeekPlannerContainer`
*   **Opis:** Główny komponent zarządzający stanem całego widoku, pobieraniem danych i logiką biznesową.
*   **Główne elementy:** Wrapper dla layoutu, dostawca kontekstu DND.
*   **Obsługiwane interakcje:** Drag & Drop (onDragEnd), nawigacja między tygodniami.
*   **Typy:** Przyjmuje `planId` i `weekNumber`.
*   **Zarządzanie stanem:** Używa hooka `useWeekPlan`.

### 4.2. `WeeklyGoalCard`
*   **Opis:** Karta reprezentująca pojedynczy cel tygodniowy. Jest elementem sortowalnym.
*   **Główne elementy:** `Card` (Shadcn), `GoalHeader` (tytuł, ikona linkowania), `TaskList`.
*   **Obsługiwane interakcje:** Edycja tytułu, Usuwanie celu, Linkowanie celu (otwiera dialog).
*   **Warunki walidacji:** Limit 10 podzadań (blokada dodawania, jeśli osiągnięto).
*   **Propsy:** `WeeklyGoalWithTasks`, `availableLongTermGoals` (do menu), funkcje callback (`onUpdate`, `onDelete`, `onAddTask`, `onLinkGoal`).

### 4.3. `TaskItem`
*   **Opis:** Komponent wyświetlający pojedyncze zadanie. Obsługuje edycję in-place, zmianę statusu i menu kontekstowe.
*   **Główne elementy:** Checkbox, Input (edycja) / Span (odczyt), Badge (A/B/C), Ikony (Milestone, Dzień tygodnia).
*   **Obsługiwane interakcje:**
    *   Kliknięcie checkboxa -> zmiana statusu (`status`).
    *   Kliknięcie tekstu -> tryb edycji tytułu.
    *   Menu kontekstowe -> Przypisz do dnia, Linkuj Milestone, Usuń.
*   **Warunki walidacji:** Brak specyficznej walidacji na poziomie itemu, poza formatem inputu.
*   **Propsy:** `TaskViewModel`, `isAdHoc` (bool), `availableMilestones` (do menu), funkcje callback (`onUpdate`, `onDelete`, `onAssignDay`, `onLinkMilestone`).

### 4.4. `TaskContextMenu`
*   **Opis:** Menu dropdown (Shadcn `DropdownMenu`) dostępne pod prawym przyciskiem myszy lub ikoną "trzech kropek".
*   **Główne elementy:**
    *   Grupa "Planowanie": "Assign to Day" (Submenu: Monday-Sunday).
    *   Grupa "Powiązania": "Link to Milestone" (Trigger dla dialogu).
    *   Grupa "Edycja": "Priority" (Submenu: A/B/C), "Delete".

## 5. Typy

// DTOs (zgodne z API)
export interface WeeklyGoalDTO {
  id: string;
  plan_id: string;
  long_term_goal_id: string | null;
  week_number: number;
  title: string;
  position: number;
  created_at: string;
}

export interface TaskDTO {
  id: string;
  weekly_goal_id: string | null; // null dla ad-hoc
  plan_id: string;
  milestone_id: string | null;
  title: string;
  priority: 'A' | 'B' | 'C';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  task_type: 'weekly_sub' | 'ad_hoc'; // 'weekly_main' jest de facto WeeklyGoal
  week_number: number | null;
  due_day: number | null; // 1-7
  position: number;
}

// ViewModels
export interface TaskViewModel extends TaskDTO {
  // Opcjonalnie: UI specific flags, np. isEditing, isSaving
}

export interface WeeklyGoalViewModel extends WeeklyGoalDTO {
  tasks: TaskViewModel[];
}

export interface WeekViewData {
  weeklyGoals: WeeklyGoalViewModel[]; // Posortowane wg position
  adHocTasks: TaskViewModel[]; // Zadania bez weekly_goal_id, posortowane wg position
}

## 6. Zarządzanie stanem


Custom hook `useWeekPlan(planId, weekNumber)`:

*   **Stan:**
    *   `data`: `WeekViewData`
    *   `meta`: `{ longTermGoals: SimpleGoal[], milestones: SimpleMilestone[] }` (do dropdownów)
    *   `status`: `'loading' | 'error' | 'success'`
*   **Akcje (Async z Optimistic Updates):**
    *   `addWeeklyGoal(title, longTermGoalId?)`
    *   `updateWeeklyGoal(id, updates)`
    *   `deleteWeeklyGoal(id)`
    *   `addTask(weeklyGoalId, title)` (dla ad-hoc `weeklyGoalId` jest null)
    *   `updateTask(id, updates)` (zmiana statusu, priorytetu, due_day, milestone_id)
    *   `moveTask(taskId, sourceContainerId, destContainerId, newIndex)` (DND logic)
    *   `reorderWeeklyGoals(newOrder)`

## 7. Integracja API

Wykorzystanie endpointów zdefiniowanych w `@src/pages/api/v1`:

*   **Pobieranie danych:**
    *   `GET /api/v1/weekly-goals?plan_id=...&week_number=...` (zwraca cele)
    *   `GET /api/v1/tasks?plan_id=...&week_number=...` (zwraca WSZYSTKIE zadania dla tygodnia - frontend dzieli je na `subtasks` i `ad-hoc` na podstawie `weekly_goal_id`)
    *   `GET /api/v1/goals?plan_id=...` (pomocniczo do listowania celów LT)
    *   `GET /api/v1/milestones?plan_id=...` (pomocniczo do listowania kamieni milowych)
*   **Modyfikacje:**
    *   Standardowe metody POST/PATCH/DELETE zgodnie z dokumentacją API.
    *   Dla DND: Aktualizacja pola `position` przez PATCH.

## 8. Interakcje użytkownika

1.  **Dodawanie Celu Tygodniowego:**
    *   Użytkownik klika "Add Weekly Goal".
    *   Może opcjonalnie wybrać powiązany Cel Długoterminowy z listy.
    *   Wpisuje tytuł i zatwierdza.
2.  **Zarządzanie Zadaniami:**
    *   Dodawanie: Input na dole listy zadań wewnątrz celu lub sekcji Ad-hoc.
    *   Priorytet: Domyślnie 'C'. Kliknięcie w badge zmienia cyklicznie lub otwiera menu.
    *   Przypisanie do dnia: Context Menu -> Assign to Day. Ikona dnia (np. "Mon") pojawia się przy zadaniu.
    *   Linkowanie Milestone: Context Menu -> Link Milestone -> Wybór z listy. Ikona diamentu/flagi przy zadaniu.
3.  **Drag and Drop:**
    *   Możliwość zmiany kolejności celów tygodniowych.
    *   Możliwość zmiany kolejności zadań wewnątrz celu.
    *   Możliwość przenoszenia zadań między celami a sekcją Ad-hoc (zmiana `weekly_goal_id` i `task_type`).

## 9. Warunki i walidacja

*   **Limity (Front-end validation):**
    *   Przycisk dodawania zadania w `WeeklyGoalCard` jest zablokowany (disabled), jeśli `tasks.length >= 10`. Wyświetlany jest tooltip z wyjaśnieniem.
    *   To samo dla sekcji Ad-hoc (limit 10).
*   **Wymagane pola:** Tytuł jest wymagany przy tworzeniu/edycji (HTML input required / Zod schema).
*   **Spójność:** Usunięcie celu tygodniowego kaskadowo usuwa jego podzadania (informacja w dialogu potwierdzenia).

## 10. Obsługa błędów

*   **Limity API:** Jeśli mimo blokady UI, API zwróci błąd limitu (np. wyścig z innym urządzeniem), wyświetlany jest `Toast` (Sonner) z komunikatem błędu.
*   **Błędy sieci:** Stan `error` w hooku wyświetla komponent `ErrorState` z przyciskiem "Try Again".
*   **Optimistic Rollback:** Jeśli operacja (np. DND) nie powiedzie się w API, stan UI jest cofany do poprzedniej wartości.

## 11. Kroki implementacji

1.  **Setup Typów i Serwisów:** Utworzenie brakujących typów w `src/types.ts` oraz rozszerzenie serwisów frontendowych w `src/lib/services` (task.service, weekly-goal.service).
2.  **Hook Logiki (useWeekPlan):** Implementacja pobierania danych (Promise.all), mapowania płaskiej listy zadań do struktury drzewiastej oraz funkcji mutujących.
3.  **Komponenty Bazowe (UI):** Implementacja `TaskItem` (wygląd, status, badge) i `WeeklyGoalCard` (szkielet).
4.  **Sekcje i Listy:** Złożenie `WeeklyGoalsList` i `AdHocSection` bez DND.
5.  **Dodawanie i Edycja:** Implementacja formularzy/inputów do tworzenia i edycji encji.
6.  **Context Menu & Dialogs:** Implementacja menu kontekstowego dla zadań (Dzień, Milestone) i celów (Long Term Goal).
7.  **Drag and Drop:** Integracja `@dnd-kit` – obsługa sortowania i przenoszenia między kontenerami.
8.  **Walidacja i Limity:** Dodanie sprawdzeń `length >= 10` i obsługi błędów API.
9.  **Integracja ze stroną Astro:** Osadzenie kontenera w `src/pages/plans/[id]/week/[weekNumber].astro`.