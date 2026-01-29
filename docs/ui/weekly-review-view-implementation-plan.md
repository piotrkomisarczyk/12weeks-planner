# Plan implementacji widoku Podsumowania Tygodnia (Weekly Review)

## 1. Przegląd

Widok służy do przeprowadzania cotygodniowej refleksji nad postępami w realizacji planu. Umożliwia użytkownikowi udzielenie odpowiedzi na trzy kluczowe pytania (co zadziałało, co nie, co poprawić) oraz zaktualizowanie paska postępu dla celów długoterminowych. Formularz wspiera automatyczny zapis (auto-save) oraz łatwą nawigację między tygodniami.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką:
`/plans/[id]/review/[weekNumber]`

Gdzie:

- `id`: UUID planu
- `weekNumber`: Numer tygodnia (1-12)

## 3. Struktura komponentów

```text
src/pages/plans/[id]/review/[weekNumber].astro (Page - SSR)
└── src/layouts/Layout.astro
    └── src/components/plans/review/WeeklyReviewContainer.tsx (Client Component)
          ├── src/components/plans/review/ReviewHeader.tsx
          │     └── src/components/plans/review/ReviewNavigation.tsx
          ├── src/components/plans/review/GoalProgressList.tsx
          │     └── src/components/plans/review/GoalProgressItem.tsx
          ├── src/components/plans/review/ReflectionForm.tsx
          └── src/components/plans/review/ReviewCompletionStatus.tsx
```

## 4. Szczegóły komponentów

### 1. `src/pages/plans/[id]/review/[weekNumber].astro`

- **Opis**: Strona Astro odpowiedzialna za wstępne pobranie danych (SSR) i walidację parametrów URL.
- **Główne zadania**:
  - Pobranie `id` i `weekNumber` z parametrów.
  - Weryfikacja czy tydzień mieści się w zakresie 1-12.
  - Pobranie istniejącej recenzji (jeśli istnieje) oraz listy celów dla planu.
  - Renderowanie `WeeklyReviewContainer` z danymi początkowymi.
- **Integracja API (SSR)**:
  - `GET /api/v1/weekly-reviews/week/[weekNumber]?plan_id=[id]`
  - `GET /api/v1/goals?plan_id=[id]`

### 2. `WeeklyReviewContainer.tsx`

- **Opis**: Główny kontener logiki biznesowej (Smart Component). Zarządza stanem formularza, auto-zapisem i komunikacją z API.
- **Obsługiwane interakcje**:
  - Inicjalizacja stanu na podstawie propsów.
  - Obsługa zmian w polach tekstowych (debounce).
  - Obsługa zmian w paskach postępu celów.
  - Oznaczenie recenzji jako zakończonej.
- **Zarządzanie stanem**: Wykorzystuje hook `useWeeklyReview`.

### 3. `ReviewNavigation.tsx`

- **Opis**: Komponent nawigacyjny pozwalający na zmianę tygodnia.
- **Główne elementy**:
  - Przycisk "Previous Summary".
  - Dropdown (Select) z listą tygodni 1-12.
  - Przycisk "Next Summary".
- **Propsy**:
  - `currentWeek`: number
  - `planId`: string
  - `onWeekChange`: (week: number) => void (lub bezpośrednia nawigacja `<a>`)

### 4. `ReflectionForm.tsx`

- **Opis**: Formularz z trzema polami tekstowymi do refleksji.
- **Główne elementy**:
  - 3x `Textarea` (z Shadcn/ui) dla: "Co się udało?", "Co się nie udało?", "Co poprawić?".
  - Etykiety pytań zdefiniowane w PRD.
  - Wskaźnik statusu zapisu (np. "Saving...", "Saved") przy każdym polu lub globalnie.
- **Propsy**:
  - `values`: WeeklyReviewViewModel
  - `onChange`: (field: keyof WeeklyReviewDTO, value: string) => void
  - `isSaving`: boolean

### 5. `GoalProgressList.tsx` & `GoalProgressItem.tsx`

- **Opis**: Lista celów długoterminowych z możliwością edycji ich postępu.
- **Główne elementy**:
  - `Slider` (Shadcn/ui): zakres 0-100, krok 5.
  - `Input` (number): zsynchronizowany ze sliderem, zakres 0-100.
  - Tytuł celu.
- **Logika**: Zmiana slidera aktualizuje lokalny stan natychmiast, a wywołanie API następuje po zdarzeniu `onValueCommit` (puszczenie slidera) lub `onBlur` inputa.
- **Propsy**:
  - `goals`: GoalViewModel[]
  - `onProgressUpdate`: (goalId: string, progress: number) => void

### 6. `ReviewCompletionStatus.tsx`

- **Opis**: Sekcja wyświetlająca status ukończenia recenzji i przycisk do finalizacji.
- **Główne elementy**:
  - Checkbox lub Switch `is_completed`.
  - Przycisk "Mark as Complete" (jeśli nie ukończono).
- **Propsy**:
  - `isCompleted`: boolean
  - `onToggleComplete`: () => void

## 5. Typy

Należy rozszerzyć `src/types.ts`:

```typescript
// ViewModel dla Recenzji (rozszerza DTO o stan UI)
export interface WeeklyReviewViewModel extends Omit<WeeklyReviewDTO, "id"> {
  id: string | null; // Null jeśli recenzja jeszcze nie istnieje w bazie
  isSaving: boolean;
  lastSavedAt: Date | null;
}

// ViewModel dla Celu w kontekście recenzji
export interface GoalReviewViewModel extends GoalDTO {
  isUpdating: boolean; // Czy trwa zapisywanie postępu
}
```

## 6. Zarządzanie stanem (Custom Hook)

Utworzyć hook `src/hooks/useWeeklyReview.ts`:

### Stan

- `review`: WeeklyReviewViewModel
- `goals`: GoalReviewViewModel[]
- `error`: string | null

### Funkcje

1.  **`updateReflection(field, value)`**:
    - Aktualizuje stan lokalny natychmiast.
    - Uruchamia `debouncedSave` (np. 1000ms).
    - Jeśli `review.id` jest `null` -> woła `POST /weekly-reviews`.
    - Jeśli `review.id` istnieje -> woła `PATCH /weekly-reviews/[id]`.
2.  **`updateGoalProgress(goalId, newProgress)`**:
    - Aktualizuje stan lokalny (optimistic update).
    - Woła `PATCH /api/v1/goals/[goalId]` z `{ progress_percentage: newProgress }`.
    - W razie błędu cofa zmianę.
3.  **`toggleCompletion()`**:
    - Woła `POST /weekly-reviews/[id]/complete` (lub PATCH is_completed).

## 7. Integracja API

### Endpointy

1.  **Pobieranie (SSR/Client)**:
    - Recenzja: `GET /api/v1/weekly-reviews/week/[week]?plan_id=[uuid]`
    - Cele: `GET /api/v1/goals?plan_id=[uuid]`
2.  **Tworzenie/Aktualizacja Recenzji**:
    - Utworzenie: `POST /api/v1/weekly-reviews`
      - Payload: `{ plan_id, week_number, ...fields }`
    - Aktualizacja: `PATCH /api/v1/weekly-reviews/[id]`
      - Payload: `{ [field]: value }`
3.  **Aktualizacja Celów**:
    - `PATCH /api/v1/goals/[id]`
      - Payload: `{ progress_percentage: number }`

### Obsługa "Lazy Creation"

Ponieważ formularz jest dostępny zawsze, a rekord w bazie może nie istnieć:

- Jeśli API `GET` zwróci 404 (lub `null`), frontend inicjalizuje pusty formularz.
- Pierwsza edycja dowolnego pola tekstowego wyzwala `POST`.
- Kolejne edycje wyzwalają `PATCH`.

## 8. Interakcje użytkownika

1.  **Wybór Tygodnia**:
    - Użytkownik klika "Next Week" -> Przeładowanie strony (nawigacja Astro) do nowego URL.
2.  **Wypełnianie refleksji**:
    - Użytkownik pisze w textarea.
    - UI pokazuje "Saving..." w rogu.
    - Po chwili bezczynności UI pokazuje "Saved".
3.  **Zmiana postępu celu**:
    - Użytkownik przesuwa suwak.
    - Wartość procentowa zmienia się w czasie rzeczywistym.
    - Po puszczeniu suwaka następuje zapis do bazy.

## 9. Warunki i walidacja

- **Numer tygodnia**: Musi być w zakresie 1-12 (weryfikacja w `Astro.params`).
- **Postęp celu**:
  - Min: 0, Max: 100.
  - Krok: 5 (wymuszony przez atrybuty Slidera/Inputa).
- **Kompletność**: Recenzja może być oznaczona jako kompletna nawet przy pustych polach (wg PRD brak ścisłej walidacji wymaganych pól tekstowych, ale warto dodać ostrzeżenie wizualne).

## 10. Obsługa błędów

- **Błąd zapisu (Auto-save)**:
  - Wyświetlenie `toast` z informacją "Failed to save changes".
  - Opcjonalnie: przycisk "Retry" lub czerwona obwódka pola.
- **Błąd zapisu celu**:
  - Przywrócenie poprzedniej wartości suwaka.
  - Wyświetlenie `toast` z błędem.
- **Brak Planu/Recenzji**:
  - Toast z informacją o braku planu/recenzji oraz przekierowanie do dashboardu.

## 11. Kroki implementacji

1.  **Przygotowanie API i Typów**:
    - Upewnienie się, że typy w `src/types.ts` są aktualne.
    - Stworzenie `src/lib/services/weekly-review.service.ts` (opcjonalnie, do obsługi fetchy).
2.  **Strona Astro i Routing**:
    - Utworzenie pliku `src/pages/plans/[id]/review/[weekNumber].astro`.
    - Implementacja pobierania danych po stronie serwera.
3.  **Komponenty UI (Statyczne)**:
    - Implementacja `ReviewNavigation`, `ReflectionForm` (pusty), `GoalProgressList`.
    - Stylowanie zgodnie z Shadcn/ui i Tailwind.
4.  **Logika Biznesowa (Hook)**:
    - Implementacja `useWeeklyReview`.
    - Obsługa debounce i logiki `create OR update`.
5.  **Integracja Komponentów**:
    - Złożenie wszystkiego w `WeeklyReviewContainer`.
    - Podpięcie hooka do formularzy.
6.  **Testy Manualne**:
    - Sprawdzenie auto-zapisu (tworzenie nowego rekordu).
    - Sprawdzenie aktualizacji istniejącego rekordu.
    - Sprawdzenie nawigacji między tygodniami.
    - Sprawdzenie aktualizacji celów.
