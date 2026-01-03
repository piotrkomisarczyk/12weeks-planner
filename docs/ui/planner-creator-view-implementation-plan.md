# Plan implementacji widoku Kreatora Planera (Planner Creator)

## 1. Przegląd
Widok Kreatora Planera ("Wizard") to dwuetapowy formularz pozwalający użytkownikowi na utworzenie nowego 12-tygodniowego planera. Proces dzieli się na zdefiniowanie parametrów planu (nazwa, data startu) oraz zdefiniowanie celów długoterminowych. Ze względu na atomowość operacji API (oddzielne endpointy dla planu i celów), frontend będzie pełnił rolę orkiestratora transakcji.

## 2. Routing widoku
*   **Ścieżka:** `/plans/new`
*   **Plik Astro:** `src/pages/plans/new.astro`
*   **Dostęp:** Tylko dla zalogowanych użytkowników (weryfikacja w middleware/layout).

## 3. Struktura komponentów

Widok zostanie zbudowany w oparciu o hierarchię komponentów React, osadzonych w stronie Astro.

*   `Layout.astro` (istniejący layout aplikacji)
    *   `PlanWizardPage` (kontener strony)
        *   `PlanWizardContainer` (Główny komponent React - "Smart Component")
            *   `WizardStepper` (Wizualizacja postępu: Step 1 / Step 2)
            *   `PlanDetailsForm` (Krok 1: Dane podstawowe)
                *   `Label`, `Input` (Shadcn UI)
                *   `DatePicker` (Shadcn UI - zmodyfikowany `Calendar` dla poniedziałków)
            *   `PlanGoalsForm` (Krok 2: Lista celów)
                *   `GoalInputList`
                    *   `GoalItem` (Pojedynczy wiersz celu)
                        *   `Input` (Tytuł)
                        *   `Select` (Kategoria)
                *   `AddGoalButton`
            *   `WizardControls` (Przyciski nawigacyjne: Back, Next, Create)

## 4. Szczegóły komponentów

### `PlanWizardContainer` (`src/components/plans/wizard/PlanWizardContainer.tsx`)
*   **Opis:** Zarządza stanem całego formularza (krok, dane planu, lista celów), logiką przejść między krokami oraz komunikacją z API.
*   **Główne elementy:** `div` (wrapper), `WizardStepper`, renderowanie warunkowe formularzy kroków, `WizardControls`.
*   **Obsługiwane interakcje:**
    *   `handleNext()`: Waliduje obecny krok i przechodzi dalej.
    *   `handleBack()`: Wraca do poprzedniego kroku.
    *   `handleSubmit()`: Wysyła dane do API.
*   **Typy:** `PlanWizardState`, `WizardStep`.

### `PlanDetailsForm` (`src/components/plans/wizard/steps/PlanDetailsForm.tsx`)
*   **Opis:** Formularz pierwszego kroku. Odpowiada za nazwę i datę startu.
*   **Główne elementy:**
    *   `DatePicker`: Wybór daty startu. Musi blokować dni inne niż poniedziałek. Domyślnie ustawiony na najbliższy poniedziałek.
    *   `Input`: Nazwa planera. Domyślnie `Planner_YYYY-MM-DD`.
*   **Obsługiwana walidacja:**
    *   `name`: Wymagane, min 1 znak.
    *   `start_date`: Wymagana, musi być poniedziałkiem.
*   **Propsy:** `data: PlanDetailsData`, `onChange: (data: PlanDetailsData) => void`, `errors: Record<string, string>`.

### `PlanGoalsForm` (`src/components/plans/wizard/steps/PlanGoalsForm.tsx`)
*   **Opis:** Formularz drugiego kroku. Pozwala dodawać i usuwać cele.
*   **Główne elementy:**
    *   Lista inputów dla celów.
    *   Przycisk "Add Goal" (zablokowany przy 5 celach).
    *   Przycisk "Remove" przy każdym celu (zablokowany, jeśli został tylko 1 cel).
*   **Obsługiwana walidacja:**
    *   Minimum 1 cel.
    *   Maksimum 5 celów.
    *   Każdy cel musi mieć `title`.
*   **Propsy:** `goals: GoalFormData[]`, `onChange: (goals: GoalFormData[]) => void`, `errors: Record<string, string>`.

## 5. Typy

Należy utworzyć nowe typy w `src/types.ts` lub lokalnie w folderze komponentu, jeśli są specyficzne dla widoku.

```typescript
// Typy ViewModel dla wizarda

export type PlanDetailsData = {
  name: string;
  startDate: Date | undefined; // Date object for UI, string for API
};

export type GoalFormData = {
  id: string; // tymczasowe ID do obsługi listy w React (np. uuid v4 lub random)
  title: string;
  category: GoalCategory; // enum z types.ts: 'work' | 'finance' | 'hobby' | 'relationships' | 'health' | 'development'
  // progress pomijamy dla uproszczenia w MVP wizarda, 
  // dajemy description opcjonalnie
  description: string;
};

export type PlanWizardState = {
  step: 1 | 2;
  details: PlanDetailsData;
  goals: GoalFormData[];
  isSubmitting: boolean;
  errors: Record<string, string>; // Klucze np. 'details.name', 'goals.0.title'
};
```

## 6. Zarządzanie stanem

Stan będzie zarządzany lokalnie w `PlanWizardContainer` przy użyciu hooka `useState` lub `useReducer` (ze względu na złożoność obiektu stanu).

Można utworzyć custom hook `usePlanWizardController`:
*   Inicjalizacja domyślnej daty (najbliższy poniedziałek).
*   Funkcja `autoGenerateName(date: Date)` do aktualizacji nazwy, jeśli użytkownik nie wpisał własnej (opcjonalne, ale zgodne z PRD).
*   Funkcje `addGoal`, `removeGoal`, `updateGoal`.
*   Walidacja "in-flight" przy przejściu `handleNext`.

## 7. Integracja API

Proces zapisu jest dwuetapowy i musi być obsłużony jako transakcja logiczna po stronie klienta (tzw. Saga pattern w uproszczeniu).

1.  **Request 1 (Utworzenie planu):**
    *   **Metoda:** `POST /api/v1/plans`
    *   **Body:** `{ name: string, start_date: string (YYYY-MM-DD) }`
    *   **Response:** `PlanDTO` (zawiera `id`).

2.  **Request 2...N (Utworzenie celów):**
    *   Dla każdego celu z listy:
    *   **Metoda:** `POST /api/v1/goals`
    *   **Body:**
        ```json
        {
          "plan_id": "uuid_from_step_1",
          "title": "Goal Title",
          "category": "work",
          "description": "",
          "progress_percentage": 0,
          "position": 1 // index + 1
        }
        ```

3.  **Rollback (Obsługa błędu):**
    *   Jeśli tworzenie planu się uda, ale tworzenie celów zawiedzie (nawet jednego), należy wywołać `DELETE /api/v1/plans/{id}`, aby nie zostawiać użytkownika z pustym planem, i wyświetlić stosowny komunikat błędu.

## 8. Interakcje użytkownika

1.  Użytkownik klika "Create New Plan" na widoku planów -> Przekierowanie do `/plans/new`.
2.  Wyświetla się Krok 1.
    *   Data startu jest ustawiona na obecny poniedziałek.
    *   Nazwa jest wypełniona.
3.  Użytkownik zmienia datę w DatePicker (dni inne niż poniedziałek są "disabled").
4.  Użytkownik klika "Next".
    *   Walidacja nazwy i daty.
    *   Przejście do Kroku 2.
5.  Użytkownik widzi jeden pusty wiersz celu.
6.  Wpisuje tytuł celu, wybiera kategorię (default development), opcjonalnie dodaje opis (description).
7.  Klika "Add Goal" -> pojawia się nowy wiersz.
8.  Klika "Create".
    *   Przycisk zmienia stan na `Processing...`.
    *   System tworzy zasoby.
    *   Success Toast ("Planner created successfully").
    *   Przekierowanie do widoku planów (`/plans`).

## 9. Warunki i walidacja

Walidacja odbywa się po stronie klienta (Zod) przed wysyłką, oraz po stronie serwera (API zwraca błędy 400).

*   **Data startu:** Musi być poniedziałkiem. (UI: blokada w kalendarzu + walidacja przy Next).
*   **Nazwa:** Niepusta, max 255 znaków.
*   **Cele:** Tablica o długości 1-5.
*   **Cel:** Tytuł niepusty.

## 10. Obsługa błędów

*   **Błędy walidacji (400):** Wyświetlenie komunikatu pod odpowiednim polem (np. "Name is required").
*   **Błąd sieci/serwera (500):** Toast z komunikatem "Failed to create planner. Please try again.".
*   **Błąd częściowy (Plan created, Goals failed):**
    *   Próba automatycznego usunięcia planu (`DELETE`).
    *   Komunikat: "Error creating goals. The planner creation was rolled back.".

## 11. Kroki implementacji

1.  **Przygotowanie typów:** Zaktualizowanie `src/types.ts` (jeśli potrzebne) lub utworzenie lokalnych definicji.
2.  **Stworzenie komponentów UI:**
    *   Utworzenie `PlanWizardContainer` i struktury kroków.
    *   Implementacja logiki nawigacji (Next/Back).
3.  **Implementacja Kroku 1 (Detale):**
    *   Integracja `DatePicker` z logiką "tylko poniedziałki".
    *   Logika generowania domyślnej nazwy.
4.  **Implementacja Kroku 2 (Cele):**
    *   Obsługa dynamicznej listy formularzy.
    *   Walidacja limitów (1-5).
5.  **Integracja API:**
    *   Implementacja metody `submit` w kontenerze.
    *   Obsługa łańcucha Promises (Plan -> Goals).
    *   Obsługa Rollbacku w przypadku błędu.
6.  **Strona Astro:**
    *   Utworzenie `src/pages/plans/new.astro`.
    *   Osadzenie komponentu React.
7.  **Testy manualne:** Przejście ścieżki "Happy path" oraz próba wywołania błędów (np. odłączenie sieci w trakcie).

