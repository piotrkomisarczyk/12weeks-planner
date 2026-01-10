# Plan implementacji widoku edycji celów (Goal Editing View)

## 1. Przegląd
Widok ten umożliwia użytkownikom zarządzanie celami długoterminowymi (Long-Term Goals) w ramach wybranego 12-tygodniowego planu. Użytkownik może dodawać, edytować i usuwać cele (do 6 na plan), określać ich postęp za pomocą suwaka oraz zarządzać powiązanymi kamieniami milowymi (Milestones).

## 2. Routing widoku
Ścieżka: `/src/pages/plans/[id]/goals.astro`
URL: `/plans/[id]/goals`

## 3. Struktura komponentów

Hierarchia komponentów:
1. `GoalsView.astro` (Strona serwerowa - Entry Point)
    └── `GoalsManager.tsx` (Główny kontener React - Client Island)
        ├── `PlanHeader.tsx` (Informacje o planie, daty, powrót)
        ├── `GoalList.tsx` (Lista celów)
        │   └── `GoalCard.tsx` (Pojedynczy cel - Accordion/Card)
        │       ├── `GoalProgress.tsx` (Suwak postępu i wskaźnik)
        │       ├── `GoalForm.tsx` (Formularz edycji danych celu)
        │       └── `MilestoneManager.tsx` (Sekcja kamieni milowych)
        │           ├── `MilestoneList.tsx`
        │           │   └── `MilestoneItem.tsx` (Wiersz kamienia z akcjami)
        │           └── `MilestoneForm.tsx` (Dodawanie nowego kamienia)
        └── `EmptyState.tsx` (Widok gdy brak celów)

## 4. Szczegóły komponentów

### `GoalsView.astro`
- **Opis**: Pobiera dane planu (tytuł, data rozpoczęcia, data zakończenia) po stronie serwera, aby zapewnić kontekst dla walidacji dat. Renderuje layout aplikacji i kontener Reacta.
- **Odpowiedzialność**: Data fetching (Plan details), przekazanie propsów do `GoalsManager`.

### `GoalsManager.tsx`
- **Opis**: Główny komponent stanowy. Zarządza pobieraniem listy celów.
- **Interakcje**: Dodawanie nowego celu (jeśli limit < 6).
- **Typy**: `PlanDTO` (partial).
- **Props**: `planId: string`, `planStartDate: Date`, `planEndDate: Date`.
- **Zarządzanie stanem**: Używa custom hooka `useGoals` do pobrania i zarządzania listą celów.

### `GoalCard.tsx`
- **Opis**: Wyświetla podsumowanie celu (tytuł, kategoria, postęp). Po rozwinięciu umożliwia pełną edycję.
- **Elementy UI**: Shadcn `Card`, `Accordion` lub `Collapsible`, `Badge` (kategoria).
- **Walidacja**: Blokada edycji jeśli plan jest zarchiwizowany.

### `GoalForm.tsx`
- **Opis**: Formularz edycji właściwości celu.
- **Pola**:
    - `Title` (Input, required)
    - `Category` (Select, options: work, finance, hobby, relationships, health, development)
    - `Description` (Textarea, optional)
    - `Progress` (Slider 0-100%, step by 5%)
- **Walidacja**: Tytuł max 255 znaków.
- **Interakcje**: Auto-save (debounce 1500 ms). Informacja pod formularzem "Saved" lub: "Saving..." gdy trwa zapis.

### `MilestoneManager.tsx`
- **Opis**: Kontener dla kamieni milowych wewnątrz celu.
- **Props**: `goalId: string`, `planStartDate: string`, `planEndDate: string`.
- **Logika**: Pobiera kamienie milowe dla danego celu (lazy loading przy rozwinięciu celu).

### `MilestoneForm.tsx`
- **Opis**: Formularz dodawania kamienia.
- **Pola**:
    - `Title` (Input)
    - `Due Date` (DatePicker)
- **Walidacja**:
    - Limit max 5 kamieni.
    - Data musi zawierać się w przedziale `[planStartDate, planEndDate]`.
    - Tytuł wymagany.

## 5. Typy

Należy wykorzystać istniejące typy z `src/types.ts` i rozszerzyć je o typy widoku.

```typescript
// Istniejące DTO (dla przypomnienia)
interface GoalDTO {
  id: string;
  plan_id: string;
  title: string;
  category: GoalCategory; // enum
  progress_percentage: number;
  // ...
}

interface MilestoneDTO {
  id: string;
  long_term_goal_id: string;
  title: string;
  due_date: string | null;
  is_completed: boolean;
  // ...
}

// Nowe typy widoku
interface GoalWithMilestones extends GoalDTO {
  milestones?: MilestoneDTO[]; // Opcjonalne, ładowane leniwie
  isLoadingMilestones?: boolean;
}

interface PlanContext {
  id: string;
  startDate: string;
  endDate: string;
  isArchived: boolean;
}
```

## 6. Zarządzanie stanem

Rekomendowane użycie React Hooks.

1. **`useGoals(planId)`**:
    - `goals`: lista celów.
    - `isLoading`: stan ładowania.
    - `addGoal(data)`: POST /goals.
    - `updateGoal(id, data)`: PATCH /goals/{id}.
    - `deleteGoal(id)`: DELETE /goals/{id}.
    - **Obsługa limitu**: Sprawdza czy `goals.length < 6` przed dodaniem.

2. **`useMilestones(goalId)`**:
    - `milestones`: lista kamieni.
    - `fetchMilestones()`: GET /goals/{id}/milestones.
    - `addMilestone(data)`: POST /milestones.
    - `toggleMilestone(id, status)`: PATCH /milestones/{id}.
    - `deleteMilestone(id)`: DELETE /milestones/{id}.

## 7. Integracja API

Wszystkie żądania powinny używać klienta Supabase lub fetch wrapper z autoryzacją.

- **Pobranie celów**: `GET /api/v1/plans/[planId]/goals` -> zwraca `ListResponse<GoalDTO>`.
- **Dodanie celu**: `POST /api/v1/goals` -> Payload: `{ plan_id, title, category, ... }`.
- **Aktualizacja celu**: `PATCH /api/v1/goals/[id]` -> Payload: `{ title, progress_percentage, ... }`.
- **Pobranie kamieni**: `GET /api/v1/goals/[goalId]/milestones`.
- **Dodanie kamienia**: `POST /api/v1/milestones` -> Payload: `{ long_term_goal_id, title, due_date }`.

## 8. Interakcje użytkownika

1. **Wejście na stronę**: Ładowanie danych planu i listy celów.
2. **Dodawanie celu**:
    - Kliknięcie "Add Goal".
    - Jeśli limit 6 osiągnięty -> Przycisk zablokowany (disabled).
    - Wyświetlenie formularza (modal podobny jak strona tworzenia celów w wizardzie do tworzenia planerów).
    - Zapisanie -> Odświeżenie listy.
3. **Edycja postępu**:
    - Przesunięcie suwaka (Slider).
    - Skok postępu o 5%.
    - Jeśli 100% -> Odpalenie konfetti (biblioteka np. `canvas-confetti`).
    - API Update po zakończeniu przesuwania (onCommit), (debounce 500 ms).
4. **Dodawanie kamienia milowego**:
    - Wewnątrz karty celu.
    - Wybór daty w DatePicker.
    - Jeśli data spoza zakresu planu -> Błąd walidacji pod polem, blokada zapisu.
5. **Usuwanie**:
    - Ikona kosza przy celu/kamieniu -> Confirmation Dialog -> API Delete -> Usunięcie z UI.

## 9. Warunki i walidacja

Walidacja realizowana przy użyciu `zod` na frontendzie (dla formularzy) oraz sprawdzanie warunków logicznych.

| Warunek | Weryfikacja | Akcja UI |
|---------|-------------|----------|
| Max 6 celów | `goals.length >= 6` | Ukrycie/Zablokowanie przycisku "Add Goal" |
| Max 5 kamieni | `milestones.length >= 5` | Ukrycie formularza dodawania kamieni |
| Data kamienia | `date < planStart || date > planEnd` | Wyświetlenie błędu "Date must be within plan duration" |
| Długość tytułu | `title.length > 255` | HTML maxlength + Zod error |
| Plan archiwalny | `plan.status === 'archived'` | Wszystkie pola read-only |

## 10. Obsługa błędów

- **Błędy sieciowe (500/Timeout)**: Wyświetlenie toast (Shadcn `use-toast`) z komunikatem "Something went wrong. Please try again.".
- **Błędy walidacji API (400)**: Wyświetlenie komunikatów pod konkretnymi polami formularza.
- **Błędy Not Found (404)**: Wyświetlenie komunikatu "Plan not found".

## 11. Kroki implementacji

1. **Setup**: Utworzenie struktury folderów w `src/components/plans/goals`.
2. **Types & Services**: Zdefiniowanie interfejsów i funkcji fetchujących w `src/lib/api/goals.ts` (jeśli nie istnieją).
3. **Astro Page**: Utworzenie `src/pages/plans/[id]/goals.astro`, pobranie danych planu i przekazanie do Reacta.
4. **Base Components**: Implementacja `GoalCard`, `GoalForm` (UI bez logiki).
5. **Logic Hooks**: Implementacja `useGoals` i `useMilestones`.
6. **Milestone Implementation**: Implementacja `MilestoneManager` z walidacją dat.
7. **Integration**: Połączenie komponentów w `GoalsManager`, podpięcie hooków.
8. **Validation & Limits**: Dodanie blokad dla limitów 6 celów i 5 kamieni oraz walidacji dat.
9. **UI Polish**: Dodanie styli, Slidera, Confetti, stanów Loading/Empty.

