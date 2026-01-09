# Plan implementacji widoku Day View

## 1. Przegląd
Nowy widok dnia `/plans/[id]/week/[nr]/day/[dayNumber]` (gdzie `dayNumber` = `due_day` 1–7) prezentuje listę zadań przypisanych do danego dnia w trzech slotach: Most Important (1), Secondary (2) i Others (7). Umożliwia zmianę priorytetu, stanu, kolejności (drag-and-drop w obrębie slotu), kopiowanie/przenoszenie zadań między dniami/tygodniami oraz dodawanie nowych zadań przypisanych do dnia. Wszystkie etykiety w UI pozostają w języku angielskim (MVP).

## 2. Routing widoku
- Ścieżka: `/plans/[planId]/week/[weekNumber]/day/[dayNumber]` (dayNumber = 1–7, Monday=1).
- Nawigacja: przyciski `Previous day` / `Next day` oraz date picker przeliczający `dayNumber` na datę na podstawie `planStartDate` (US-016). 

## 3. Struktura komponentów
- `DayPageContainer` (kontener danych/stanu, integracja API, DnD context)
  - `DayHeader` (nawigacja między dniami, date picker, numer tygodnia)
  - `PriorityColumns` (layout 3 kolumn)
    - `DailyTaskSlot` (Most Important)
      - `TaskCard` (re-use `TaskItem` z wariantem day)
      - `InlineAddTask`
    - `DailyTaskSlot` (Secondary)
      - `TaskCard`*
      - `InlineAddTask`
    - `DailyTaskSlot` (Others)
      - `TaskCard`*
      - `InlineAddTask`
  - `ConfettiOverlay` (po ukończeniu wszystkich zadań dnia)
  - `GoalMilestonePicker` (re-use)

## 4. Szczegóły komponentów
### DayPageContainer
- Opis: pobiera dane dnia (po `week_number` + `due_day`), zarządza stanem slotów, limitami, optimistic UI, DnD kontekstem; koordynuje akcje API (status/priority/due_day/position, copy/move).
- Elementy: wrapper, `DndContext`, toast/error handling, loader/empty states.
- Obsługiwane interakcje: drag-end w kolumnie, zmiana priorytetu, zmiana statusu, dodanie/usunięcie zadania, kopiowanie/przenoszenie, linkowanie goal/milestone, przypisanie do weekly goal.
- Walidacja: limity slotów (1/2/7), tygodniowe limity (weekly goal ≤10, ad-hoc ≤10), week_number/due_day range, blokada kopiowania/przenoszenia gdy status `completed`/`cancelled`.
- Typy: `DayViewData`, `DayTaskViewModel`, `DaySlot`, `DayViewMeta`.
- Propsy: `planId: string`, `planName: string`, `planStartDate: Date`, `weekNumber: number`, `dayNumber: number`.

### DayHeader
- Opis: nawigacja dni + prezentacja daty/tygodnia.
- Elementy: tytuł `Day <dayNumber>` + wyświetlana data wyliczona z `planStartDate`, badge `Week <nr>`, przyciski Previous/Next, date picker przeliczający na `dayNumber`.
- Interakcje: klik prev/next, wybór daty -> callback z nowym `dayNumber`.
- Walidacja: date picker ograniczony do dat planu; disable prev/next poza zakresem.
- Typy: korzysta z `WeekNumber`, `DayOfWeek` (z `types.ts`).
- Propsy: `dayNumber: number`, `weekNumber: number`, `computedDate: string`, `onNavigate(dayNumber: number): void`.

### DailyTaskSlot (PriorityColumn)
- Opis: pojedyncza kolumna slotu (Most Important / Secondary / Others) z listą i DnD.
- Elementy: nagłówek z limitem, `SortableContext`, lista `TaskCard`, przycisk `+ Add Task`.
- Interakcje: drag-and-drop w kolumnie, dodanie zadania, automatyczny rerender po zmianie priorytetu.
- Walidacja: blokada dodawania po osiągnięciu limitu (1/2/7), komunikat toast/label.
- Typy: `DaySlot`, `DayTaskViewModel`.
- Propsy: `slot: DaySlot`, `tasks: DayTaskViewModel[]`, `limit: number`, callbacki `onReorder`, `onAdd`.

### TaskCard (wariant TaskItem dla dnia)
- Opis: re-use `TaskItem` z dodatkowymi badge: category > goal > milestone > weekly goal (zamiast day badge). Ukrywa badge dnia. Menu kontekstowe rozszerzone o kopiowanie/przenoszenie do innego dnia/tygodnia.
- Elementy: status control (`TaskStatusControl`), tytuł (inline edit), priorytet (cyklicznie), drag handle, badge hierarchy, kontekstowe menu `...`.
- Interakcje: status click/cycle; chevron pełny wybór 5 stanów; priority click (zmienia slot z walidacją limitów), drag handle reorder, link goal/milestone (re-use `GoalMilestonePicker`), assign/unassign weekly goal (respect task limit 10), copy/move.
- Walidacja: odmowa zmiany priorytetu gdy slot docelowy pełny (toast + rollback); nie pokazuj opcji copy/move jeśli task `completed`/`cancelled` (edge multi-day); confirm delete.
- Typy: `DayTaskViewModel`, `SimpleGoal`, `SimpleMilestone`, `WeeklyGoalViewModel`.
- Propsy: rozszerzenie istniejących z `TaskItem` o `slot: DaySlot`, `onChangeSlot`, `onCopy`, `onMoveToDay`, `hideDayBadge`.

### InlineAddTask / AddTaskButton
- Opis: reuse istniejącego komponentu do szybkiego dodania; w Day view domyślnie ustawia `due_day = currentDayNumber`, `week_number = currentWeek`, `task_type` domyślnie `ad_hoc` lub `weekly_sub` jeśli przypięty do weekly goal z menu.
- Walidacja: disabled gdy limit slotu osiągnięty.
- Typy: input string.
- Propsy: `onAdd(title: string)`, `onCancel()`.

### GoalMilestonePicker (reuse)
- Opis: bez zmian, użyty do przypisywania zadań do celu/milestone.
- Propsy: jak obecnie; używany z tytułami dostosowanymi do kontekstu dnia.

### ConfettiOverlay
- Opis: wyświetla konfetti gdy wszystkie zadania dnia mają status `completed` lub sloty puste.
- Propsy: `isDone: boolean`.

## 5. Typy
- Nowe typy (TS):
  - `type DaySlot = 'most_important' | 'secondary' | 'additional';`
  - `interface DayTaskViewModel extends TaskViewModel { slot: DaySlot; }`
  - `interface DayViewData { weekNumber: number; dayNumber: number; date: string; slots: { mostImportant: DayTaskViewModel | null; secondary: DayTaskViewModel[]; additional: DayTaskViewModel[]; }; }`
  - `interface DayViewMeta { longTermGoals: SimpleGoal[]; milestones: SimpleMilestone[]; weeklyGoals: Pick<WeeklyGoalViewModel, 'id' | 'title' | 'long_term_goal_id' | 'milestone_id'>[]; }`
  - `interface DayCopyMovePayload { targetWeek?: number | null; targetDayNumber?: number | null; }`
- Re-use: `TaskPriority`, `TaskStatus`, `TaskType`, `UpdateTaskCommand`, `CopyTaskCommand`, `DailyTasksParams`.
- ViewModel helper: `type SlotLimits = { most_important: 1; secondary: 2; additional: 7; };`

## 6. Zarządzanie stanem
- Nowy hook `useDayPlan(planId, weekNumber, dayNumber, planStartDate)`:
  - Fetch równoległy: `/api/v1/tasks?plan_id=...&week_number=...&due_day=${dayNumber}` (pełne pola) + `/api/v1/plans/:id/goals` + `/api/v1/milestones` + `/api/v1/weekly-goals?plan_id=...&week_number=...`.
  - Mapper slotów: sortuj po `priority` (A>B>C) i `position`; rozkładaj na sloty wg limitów (A pierwszy do Most Important, reszta A do Secondary/Others; B maks 2 w Secondary; C w Others, chyba że wolne miejsca).
  - Stan: `data`, `meta`, `status`, `error`, `isSaving`, `debounceRefresh` (1000 ms po zmianie priorytetu), `showConfetti`.
  - Optimistic updates dla status/priority/due_day/position, z rollback przy błędzie.
  - Wyliczanie daty: `date` obliczana z `planStartDate + (weekNumber-1)*7 + (dayNumber-1)` dla wyświetlenia w nagłówku/date pickerze.
  - DnD: kontekst ograniczony do pojedynczego slotu; cross-slot zmiana tylko przez update priorytetu (spójne z wymaganiem).

## 7. Integracja API
- Pobranie:
  - GET `/api/v1/tasks?plan_id=<id>&week_number=<nr>&due_day=<dayNumber>` — pełne dane zadań dla dnia (preferowane zamiast `/tasks/daily`, bo potrzebne pola goal/milestone/weekly_goal_id/position).
  - GET `/api/v1/plans/:id/goals` — meta do badge/pickerów.
  - GET `/api/v1/milestones` — filtrować po goalach planu.
  - GET `/api/v1/weekly-goals?plan_id=<id>&week_number=<nr>` — meta weekly goals.
- Mutacje:
  - PATCH `/api/v1/tasks/:id` — status, priority, due_day (dayNumber), week_number (dla move), weekly_goal_id/milestone/goal links, position (reorder/slot update).
  - POST `/api/v1/tasks` — dodanie zadania z `due_day=currentDayNumber`, `week_number=currentWeek`, `task_type` zależnie od weekly_goal_id (null => ad_hoc).
  - POST `/api/v1/tasks/:id/copy` — kopiowanie na inny tydzień/dzień (dayNumber); status reset do `todo`; po sukcesie refetch dnia docelowego jeśli bieżący.
  - DELETE `/api/v1/tasks/:id`.
  - GET `/api/v1/tasks/:taskId/history` (opcjonalnie dla multi-day audit, do wykorzystania w dialogu potwierdzenia).
- Request/response typy: korzystać z `TaskDTO`, `ItemResponse<T>`, `ListResponse<T>`, `APIErrorResponse`.

## 8. Interakcje użytkownika
- Status click/cycle (todo → in_progress → completed); chevron pozwala na pełny wybór 5 stanów.
- Priority click: cykliczna zmiana A/B/C; przenosi zadanie między slotami zgodnie z limitami (jeśli limit pełny, blok + toast).
- Drag-and-drop: reorder w obrębie slotu; brak cross-slot DnD (spójność z regułą zmiany priorytetu).
- Context menu:
  - Assign to Day (pon–niedz) / Clear Day.
  - Copy to… (week/dayNumber) — używa `/copy`.
  - Move to… (week/dayNumber) — PATCH week_number/due_day (tylko jeśli status ≠ completed/cancelled).
  - Link/Unlink Goal & Milestone (GoalMilestonePicker).
  - Assign/Unassign Weekly Goal (z listy tygodniowych; respektuje limit 10 tasks na weekly goal).
  - Delete.
- Add Task: button pod listą slotu (most imp/secondary/others); domyślnie priority wynikające ze slotu (A dla Most Important, B dla Secondary, C dla Others).
- Confetti: pokazuje się gdy wszystkie zadania dnia są `completed` lub brak zadań.

## 9. Warunki i walidacja
- Limity slotów: Most Important max 1 (priority A), Secondary max 2 (A/B), Others max 7 (A/B/C). Sprawdzać przed zmianą priorytetu/dodaniem/przeniesieniem.
- Range: `week_number` 1–12, `due_day` 1–7 (wymuszać w pickerach i ścieżce `dayNumber`).
- Stany kopiowania/przenoszenia: blokuj dla `completed`/`cancelled` (edge multi-day).
- Weekly goal limits: przy assign to weekly goal sprawdź `tasks.length < 10`.
- Ad-hoc limit: max 10 na tydzień (przy dodaniu w Others).
- Walidacja formularzy: tytuł wymagany, trim, max 255 (spójnie z API).
- Pozycjonowanie: po każdej zmianie reindeksuj pozycje w danej kolumnie (1..n) i wyślij PATCH.
- Single-field `position` strategia: użyj zakresów „blokowych” dla tygodnia i slotu:
  - `position = weekOrder * 100 + dayRank`, gdzie `weekOrder` to indeks kolejności w tygodniu (nadawany przy tworzeniu/reorder w Week view jako 1,2,3… → zapisany jako 100,200,300...), `dayRank` (1–99) służy do sortowania w obrębie dnia/slotu.
  - Reorder w Day view aktualizuje tylko `dayRank` (nie zmienia `weekOrder`, więc Week view zachowuje blokową kolejność celów/sekcji). Reorder w Week view ustawia nowe `weekOrder` (co 100) i resetuje `dayRank` na bieżącą kolejność w danym kontenerze.
  - Co pewien czas (np. po dużej liczbie operacji) reindex (normalize) by utrzymać `weekOrder * 100 + dayRank` w granicach int.

## 10. Obsługa błędów
- API error: toast z informacją, rollback optimistic update, opcja retry.
- Limit exceeded (z triggerów): pokaż message z API lub własny komunikat; nie zmieniaj stanu lokalnego.
- Brak danych meta (goals/milestones): pokaż „Not linked” badge i zablokuj linkowanie, dopóki fetch nie wróci.
- Network fail: `status=error` w kontenerze z CTA „Try again”.
- Drag/drop failure: toast i refetch bieżącego dnia.

## 11. Kroki implementacji
1. Utwórz typy w `src/types.ts`: `DaySlot`, `DayTaskViewModel`, `DayViewData`, `DayViewMeta`, `DayCopyMovePayload` (z `dayNumber`).
2. Dodaj hook `useDayPlan` w `src/components/plans/day/hooks/useDayPlan.ts`: fetch równoległy, mapowanie slotów, limity, optimistic actions (status/priority/due_day/position/copy/move/link) z parametrami `planId`, `weekNumber`, `dayNumber`, `planStartDate`.
3. Dodaj stronę/entry `src/pages/plans/[planId]/week/[weekNumber]/day/[dayNumber].astro` z klientowym `DayPageContainer`.
4. Zaimplementuj `DayPageContainer` + `DayHeader` + layout kolumn (Tailwind grid) + DnD context (dnd-kit).
5. Dodaj `DailyTaskSlot` komponent z `SortableContext`, limitami i add button reuse `InlineAddTask`.
6. Rozszerz `TaskItem` na wariant day (prop `variant="day"`): ukryj badge dnia, pokaż hierarchię category>goal>milestone>weekly goal, dodaj menu copy/move, blokady limitów, priority->slot sync.
7. Dodaj dialog/akcje copy/move (prostego selecta week/dayNumber + POST /copy lub PATCH) z obsługą edge case statusów.
8. Implementuj logikę single-field `position`: helper funkcje `encodePosition(weekOrder, dayRank)` i normalizacja w hooku dla reorder w day/week; aktualizuj move/reorder patch payloady.
9. Dodaj Confetti overlay (np. re-use istniejący komponent lub prosty `react-confetti`).
10. Testy manualne scenariuszy: limity slotów, zmiana priorytetu, reorder, copy/move, assign/unassign weekly goal, link/unlink goal/milestone, error handling.
11. Dokumentacja: uzupełnij README/komentarze, upewnij się że etykiety są po angielsku.

