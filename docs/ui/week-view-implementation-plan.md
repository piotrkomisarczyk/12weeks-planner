# Plan implementacji widoku Planowania Tygodniowego (Week View)

## 1. Przegląd
Widok planowania tygodniowego służy do taktycznego zarządzania zadaniami w wybranym tygodniu. Umożliwia użytkownikom tworzenie Celów Tygodniowych (Weekly Goals) powiązanych z celami długoterminowymi (i opcjonalnie kamieniami milowymi) oraz zarządzanie zadaniami luźnymi (Other Tasks). Kluczowym aspektem jest dedykowany system statusów zadań (5 stanów), priorytetyzacja (A/B/C) oraz ścisłe reguły przenoszenia zadań między sekcjami (tylko menu kontekstowe, brak D&D między sekcjami).

## 2. Routing widoku
*   **Ścieżka:** `/plans/[id]/week/[weekNumber]`
*   **Parametry:**
    *   `id`: UUID planu
    *   `weekNumber`: Numer tygodnia (1-12)

## 3. Struktura komponentów

```text
src/pages/plans/[id]/week/[weekNumber].astro (Page Wrapper)
└── WeekPlannerContainer.tsx (Smart Component - Data & State)
    ├── WeekHeader.tsx (Navigation, Week Summary)
    ├── GoalMilestonePicker.tsx (Dialog: 2-step selection Goal -> Milestone)
    ├── WeeklyGoalsSection.tsx (List of Weekly Goals)
    │   ├── SortableContext (Vertical list of goals)
    │   └── WeeklyGoalCard.tsx
    │       ├── GoalHeader.tsx (Title, Link Badge, Menu)
    │       ├── TaskList.tsx (SortableContext for tasks)
    │       │   └── TaskItem.tsx
    │       │       ├── TaskStatusControl.tsx (5-state icon + popover)
    │       │       ├── PriorityBadge.tsx (A/B/C toggle)
    │       │       ├── TaskContent.tsx (Editable title)
    │       │       ├── TaskMeta.tsx (Due Day Icon, Milestone Icon)
    │       │       ├── DragHandle.tsx ("=" icon)
    │       │       └── TaskContextMenu.tsx (Dropdown)
    │       └── InlineAddTask.tsx
    ├── AdHocSection.tsx
    │   ├── SectionHeader.tsx ("Other Tasks")
    │   ├── TaskList.tsx (SortableContext for ad-hoc tasks)
    │   │   └── TaskItem.tsx (Reused)
    │   └── InlineAddTask.tsx
    └── ErrorState.tsx
```

## 4. Szczegóły komponentów

### `WeekPlannerContainer`
- **Opis:** Główny kontener zarządzający logiką, pobieraniem danych (Weekly Goals, Tasks, Goals, Milestones) i optymistycznymi aktualizacjami.
- **Główne elementy:** `DndContext` (z ograniczeniami stref upuszczania), `WeeklyGoalsSection`, `AdHocSection`.
- **Obsługiwane interakcje:**
    - Zmiana tygodnia (nawigacja).
    - Dodawanie celu tygodniowego.
    - Obsługa globalnych zdarzeń `onDragEnd` (tylko sortowanie wewnątrz list).
    - Koordynacja dialogów (Picker).

### `WeeklyGoalCard`
- **Opis:** Karta reprezentująca cel tygodniowy.
- **Obsługiwane walidacja:**
    - Limit 10 zadań (zablokowanie `InlineAddTask`).
- **Obsługiwane interakcje:**
    - Edycja tytułu celu.
    - Linkowanie do Long-Term Goal/Milestone (otwiera `GoalMilestonePicker`).
    - Usuwanie celu (kaskadowe usuwanie podzadań).

### `TaskItem`
- **Opis:** Wiersz pojedynczego zadania. Nie używa checkboxa, lecz dedykowanego selektora statusu.
- **Główne elementy:**
    - `TaskStatusControl`:
        - Kliknięcie: cykl `todo` -> `in_progress` -> `completed`.
        - Chevron/Menu: wybór spośród 5 stanów (`todo`, `in_progress`, `completed`, `cancelled`, `postponed`).
        - Ikony: Pusty kwadrat (czarne obramowanie z białym tłem), 50% wypełniony od górnego lewego rogu do przekątnej, Pełny z checkiem (biały check na czarnym tle), Dwie przekątne, Strzałka w prawo.
    - `PriorityBadge`: Kliknięcie cyklicznie zmienia A -> B -> C -> A.
    - `DragHandle`: Ikona "=" na końcu wiersza, aktywator drag-and-drop.
- **Propsy:** `task` (TaskViewModel), `isAdHoc` (boolean).

### `TaskContextMenu`
- **Opis:** Menu dropdown (`...`) dostępne przy każdym zadaniu.
- **Opcje:**
    - **Link to goal/Unlink goal:** Otwiera `GoalMilestonePicker` (dla Ad-hoc) lub usuwa powiązanie.
    - **Assign to weekly goal:** (Tylko dla Ad-hoc) Listuje dostępne cele tygodniowe -> przenosi zadanie, zmienia typ na `weekly_sub`, dodaje powiązania do celu głównego i kamienia milowego (o ile cel tygodniowy jest z nimi powiązany).
    - **Unassign from weekly goal:** (Tylko dla Subtask) Przenosi do Ad-hoc, zmienia typ na `ad_hoc`, pozostawia powiązania z celem głównym i kamieniem milowym.
    - **Assign to day:** Submenu (Monday - Sunday).
    - **Change priority:** Submenu (A/B/C).
    - **Copy to...:** Otwiera dialog kopiowania.
    - **Delete:** Usuwa zadanie.

### `GoalMilestonePicker`
- **Opis:** Dialog do wyboru kontekstu.
- **Logika:** 2-stopniowa.
    1. Lista celów długoterminowych (Long Term Goals).
    2. Po wyborze celu: Lista kamieni milowych (Milestones) tego celu + opcja "Just the goal".

## 5. Typy

Należy zdefiniować typy w `src/types.ts` lub lokalnie, jeśli są specyficzne dla widoku, ale zgodne z API.

```typescript
// Enums/Unions
export type TaskPriority = 'A' | 'B' | 'C';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
export type TaskType = 'weekly_main' | 'weekly_sub' | 'ad_hoc';

// DTOs (matching API response snake_case)
export interface WeeklyGoal {
  id: string;
  plan_id: string;
  long_term_goal_id: string | null;
  milestone_id: string | null;
  week_number: number;
  title: string;
  position: number;
  created_at: string;
}

export interface Task {
  id: string;
  weekly_goal_id: string | null;
  plan_id: string;
  long_term_goal_id: string | null;
  milestone_id: string | null;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  task_type: TaskType;
  week_number: number | null;
  due_day: number | null; // 1-7
  position: number;
}

// ViewModels
export interface TaskViewModel extends Task {
  // UI helper flags
  isOptimistic?: boolean;
}

export interface WeeklyGoalViewModel extends WeeklyGoal {
  tasks: TaskViewModel[];
}

export interface WeekViewData {
  weeklyGoals: WeeklyGoalViewModel[]; // sorted by position
  adHocTasks: TaskViewModel[];      // sorted by position
}
```

## 6. Zarządzanie stanem

Wykorzystanie custom hooka `useWeekPlan(planId, weekNumber)`:

*   **Stan:**
    *   `weeklyGoals`: Tablica celów z zagnieżdżonymi zadaniami.
    *   `adHocTasks`: Tablica zadań luźnych.
    *   `metadata`: `{ longTermGoals: Goal[], milestones: Milestone[] }` (do pickera).
*   **Metody (z Optimistic Updates):**
    *   `addWeeklyGoal(title, links?)`: `POST /api/v1/weekly-goals`.
    *   `addTask(sectionId, title)`: `POST /api/v1/tasks`. Jeśli `sectionId` to UUID celu -> `weekly_sub`, jeśli `sectionId` to 'adhoc' -> `ad_hoc`.
        *   **Ważne:** Zadania w celu tygodniowym dziedziczą `long_term_goal_id` i `milestone_id` od rodzica.
    *   `updateTask(id, changes)`: `PATCH /api/v1/tasks/[id]`.
    *   `moveTaskWithinList(taskId, newIndex)`: Aktualizacja `position`.
    *   `moveTaskBetweenSections(taskId, targetGoalId | null)`: Zmienia `weekly_goal_id` i `task_type`.
    *   `updateWeeklyGoal(id, changes)`: `PATCH /api/v1/weekly-goals/[id]`.

## 7. Integracja API

*   **Pobieranie danych:**
    *   `GET /api/v1/weekly-goals?plan_id=...&week_number=...`
    *   `GET /api/v1/tasks?plan_id=...&week_number=...` (Frontend filtruje: jeśli `weekly_goal_id` istnieje -> do celu, wpp -> ad-hoc).
    *   `GET /api/v1/goals?plan_id=...` (Do pickera).
    *   `GET /api/v1/milestones?plan_id=...` (Do pickera).
*   **Create Task:**
    *   Payload: `{ plan_id, week_number, title, priority: 'A', status: 'todo', ...context }`
    *   Context zależy od sekcji:
        *   Ad-hoc: `task_type: 'ad_hoc'`, `weekly_goal_id: null`.
        *   Weekly Goal: `task_type: 'weekly_sub'`, `weekly_goal_id: uuid`, `long_term_goal_id` (inherited), `milestone_id` (inherited).

## 8. Interakcje użytkownika

1.  **Status Zadania:**
    *   Kliknięcie ikony: `todo` -> `in_progress` -> `completed` -> `todo`.
    *   Interakcja "Chevron" (lub long-press): Otwiera menu z 5 opcjami (w tym `cancelled`, `postponed`).
2.  **Priorytet:**
    *   Kliknięcie badge'a: A -> B -> C -> A.
3.  **Drag & Drop:**
    *   Tylko sortowanie (reorder) w obrębie tej samej listy.
    *   Próba przeniesienia zadania z "Ad-hoc" do "Weekly Goal" metodą D&D powinna być zablokowana (wizualnie i logicznie).
4.  **Przenoszenie zadań (Context Menu):**
    *   Ad-hoc -> Weekly Goal: Menu "Assign to weekly goal" -> Lista celów.
    *   Weekly Goal -> Ad-hoc: Menu "Unassign from weekly goal".
5.  **Linkowanie:**
    *   Weekly Goal: Badge linku otwiera picker. Po zmianie – backend powinien zaktualizować też podzadania (o ile API tego nie robi, frontend musi odświeżyć dane).
    *   Ad-hoc: Menu "Link to goal".

## 9. Warunki i walidacja

*   **Limit Celów Tygodniowych:** Max 3. Przycisk "Add Weekly Goal" wyłączony (disabled) lub ukryty, gdy `weeklyGoals.length >= 3`.
*   **Limit Zadań:** Max 10 per lista. Input "Add task" wyłączony, gdy lista osiągnie 10 elementów.
*   **Spójność:**
    *   Subtask musi mieć te same `long_term_goal_id`/`milestone_id` co jego Weekly Goal (domyślnie dziedziczy, użytkownik NIE MOŻE ręcznie nadpisać dla zadań podlinkowanych do celu głównego / kamienia milowego).
    *   Ad-hoc domyślnie nie ma powiązań.

## 10. Obsługa błędów

*   **API Errors:** Standardowy `toast.error("Message")`.
*   **Rollback:** Przy błędzie optymistycznej aktualizacji (np. statusu), UI wraca do poprzedniego stanu.
*   **Limity API:** Jeśli API zwróci 400 z powodu limitów (np. konkurencja z innym urządzeniem), wyświetl jasny komunikat i odśwież widok.

## 11. Kroki implementacji

1.  **Types & Service:** Zaktualizowanie `types.ts` o nowe enumy statusów i interfejsy. Rozbudowa `task.service.ts` i `weekly-goal.service.ts` o metody obsługujące `task_type` i filtrowanie.
2.  **Hook `useWeekPlan`:** Implementacja pobierania danych (Promise.all) i segregacji zadań na `weeklyGoals` i `adHocTasks`.
3.  **Komponent `GoalMilestonePicker`:** Implementacja logiki 2-krokowej (Wybór celu -> Wybór kamienia).
4.  **Komponenty Bazowe Zadania:**
    *   Implementacja `TaskStatusControl` (ikony 5 stanów).
    *   Implementacja `TaskItem` (layout, style, badge).
5.  **Sekcje UI:**
    *   Stworzenie `WeeklyGoalCard` i listy celów.
    *   Stworzenie `AdHocSection`.
6.  **Drag & Drop (Sortowanie):** Integracja `@dnd-kit/sortable`. Konfiguracja, aby blokować przenoszenie między kontenerami.
7.  **Menu Kontekstowe:** Implementacja logiki "Assign/Unassign" i zmiany priorytetów w `TaskContextMenu`.
8.  **Integracja:** Złożenie wszystkiego w `WeekPlannerContainer` i osadzenie w stronie Astro.
9.  **Weryfikacja:** Testowanie limitów (3 cele, 10 zadań) i cykli statusów.
10. **Lokalizacja:** Upewnienie się, że wszystkie etykiety są po angielsku.
