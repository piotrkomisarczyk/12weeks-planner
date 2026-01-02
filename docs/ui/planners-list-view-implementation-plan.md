# Plan implementacji widoku Listy Planerów (Planners List View)

## 1. Przegląd
Widok ten służy do zarządzania wszystkimi planerami 12-tygodniowymi użytkownika. Pozwala na podgląd planów aktywnych, gotowych do rozpoczęcia (ready) oraz archiwalnych. Umożliwia tworzenie nowych planów, zmianę aktywnego planera, archiwizację oraz usuwanie planerów. Jest to główny punkt nawigacyjny dla funkcji zarządzania celami długoterminowymi.

## 2. Routing widoku
*   **Ścieżka:** `/plans`
*   **Typ:** Strona Astro (`src/pages/plans/index.astro`) renderująca główny kontener Reacta (Client-side rendering dla interaktywności).

## 3. Struktura komponentów

```text
src/pages/plans/index.astro (Page Wrapper)
└── PlansView (React Container)
    ├── PageHeader (Title + CreatePlanButton)
    ├── CreatePlanDialog (Modal z formularzem)
    ├── ActivePlanSection (Sekcja wyróżniona)
    │   └── PlanCard (Variant: Active)
    ├── ReadyPlansSection (Sekcja planów oczekujących)
    │   └── PlanCard (Variant: Default)
    └── ArchivedPlansSection (Sekcja zwijana/oddzielna)
        └── PlanCard (Variant: Muted)
```

## 4. Szczegóły komponentów

### `PlansView` (Container)
*   **Opis:** Główny komponent zarządzający stanem listy planerów. Pobiera dane, obsługuje ładowanie i błędy.
*   **Główne elementy:** Wrapper layoutu, nagłówki sekcji, renderowanie warunkowe list.
*   **Obsługiwane interakcje:** Inicjalizacja pobierania danych.
*   **Zarządzanie stanem:** Wykorzystuje hook `usePlans`.

### `PlanCard`
*   **Opis:** Karta prezentująca pojedynczy planer. Wygląd zależy od statusu planera.
*   **Główne elementy:**
    *   Tytuł planera.
    *   Daty (Start - End).
    *   Badge ze statusem (`Active`, `Ready`, `Archived`, `Completed`).
    *   Informacja o bieżącym tygodniu (np. "Week 3 of 12").
    *   Dropdown Menu z akcjami (`Activate`, `Archive`, `Delete` - dostępne zależnie od statusu).
*   **Obsługiwane zdarzenia:**
    *   `onActivate(id: string)`
    *   `onArchive(id: string)`
    *   `onDelete(id: string)`
    *   `onClick` (przekierowanie do dashboardu planera `/plans/[id]`).
*   **Walidacja UI:**
    *   Przycisk "Activate" ukryty dla statusu `active` i `completed`.
    *   Przycisk "Archive" ukryty dla statusu `archived`.
*   **Propsy:**
    *   `plan: PlanViewModel`
    *   `actions: PlanActions` (obiekt z handlerami).

### `CreatePlanDialog`
*   **Opis:** Modal pozwalający utworzyć nowy planer.
*   **Główne elementy:**
    *   `Dialog` (Shadcn/ui).
    *   Formularz (React Hook Form + Zod).
    *   Input `name` (tekst).
    *   Input `start_date` (Date Picker - wymuszenie poniedziałku).
*   **Warunki walidacji:**
    *   `name`: Wymagane, min. 1 znak.
    *   `start_date`: Wymagane, musi być poniedziałkiem.
*   **Obsługiwane zdarzenia:**
    *   `onSubmit(data: CreatePlanDTO)`

## 5. Typy

Wymagane jest rozszerzenie istniejących typów o modele widoku (ViewModel), aby obsłużyć formatowanie danych na froncie.

### `PlanViewModel`
Rozszerza `PlanDTO` o pola wyliczalne na froncie:
```typescript
interface PlanViewModel extends PlanDTO {
  endDate: Date;         // Obliczone: start_date + 12 tygodni
  currentWeek: number;   // Obliczone na podstawie dzisiejszej daty (1-12, lub null jeśli poza zakresem)
  isOverdue: boolean;    // Czy data zakończenia minęła
  displayStatus: string; // Sformatowany status do wyświetlenia (np. Capitalized)
}
```

### `CreatePlanFormSchema`
Schema Zod dla formularza:
```typescript
const createPlanSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  start_date: z.date().refine(isMonday, "Start date must be a Monday"),
});
```

## 6. Zarządzanie stanem

Zalecane utworzenie custom hooka `usePlans` w `src/lib/hooks/usePlans.ts`.

**State:**
*   `plans: PlanDTO[]`
*   `isLoading: boolean`
*   `error: string | null`

**Actions (zwracane przez hook):**
*   `fetchPlans(filter?: { status?: PlanStatus })`: Pobiera listę.
*   `createPlan(data: CreatePlanCommand)`: POST `/api/v1/plans`. Po sukcesie odświeża listę.
*   `activatePlan(id: string)`: PATCH `/api/v1/plans/:id` z `{ status: 'active' }`. Po sukcesie odświeża listę (ważne: backend zmienia statusy innych planerów).
*   `archivePlan(id: string)`: POST `/api/v1/plans/:id/archive`.
*   `deletePlan(id: string)`: DELETE `/api/v1/plans/:id`.

## 7. Integracja API

Integracja z istniejącymi endpointami w `src/pages/api/v1/plans`.

1.  **List Plans:**
    *   Request: `GET /api/v1/plans`
    *   Response: `{ data: PlanDTO[], count: number }`
2.  **Create Plan:**
    *   Request: `POST /api/v1/plans` Body: `{ name: string, start_date: string (YYYY-MM-DD) }`
    *   Response: `{ data: PlanDTO }`
3.  **Activate Plan:**
    *   Request: `PATCH /api/v1/plans/[id]` Body: `{ status: 'active' }`
4.  **Archive Plan:**
    *   Request: `POST /api/v1/plans/[id]/archive`
5.  **Delete Plan:**
    *   Request: `DELETE /api/v1/plans/[id]`

## 8. Interakcje użytkownika

1.  **Wejście na stronę:**
    *   Ładowanie listy planerów (spinner/skeleton).
    *   Wyświetlenie podzielonej listy (Active na górze, potem Ready, na dole Archived).
    *   Jeśli brak planerów -> Wyświetlenie Empty State z przyciskiem "Create First Plan".

2.  **Tworzenie planera:**
    *   Kliknięcie "Create New Plan".
    *   Wypełnienie nazwy i daty (kalendarz blokuje dni inne niż poniedziałek).
    *   Zatwierdzenie -> Spinner na przycisku -> Zamknięcie modala -> Toast "Plan created" -> Odświeżenie listy.

3.  **Aktywacja planera (Switch):**
    *   Użytkownik klika "Activate" na planerze ze statusem `ready`.
    *   Modal potwierdzenia (opcjonalnie, lub bezpośrednia akcja).
    *   Toast "Plan activated".
    *   Poprzedni aktywny planer zmienia się wizualnie na `ready` (po odświeżeniu listy).

4.  **Archiwizacja:**
    *   Kliknięcie "Archive" w menu kontekstowym.
    *   Confirmation Dialog: "Are you sure? This will hide the plan from the main view."
    *   Po sukcesie planer przenosi się do sekcji "Archived".

## 9. Warunki i walidacja

*   **Tylko jeden aktywny plan:** Wymuszane przez backend, frontend musi odzwierciedlić zmianę po akcji `activate`.
*   **Data startu:** Musi być poniedziałkiem. Frontendowy DatePicker powinien wyłączyć inne dni tygodnia.
*   **Delete:** Operacja Hard Delete. Powinna wymagać wyraźnego potwierdzenia ("This action cannot be undone").

## 10. Obsługa błędów

*   **Błąd pobierania:** Wyświetlenie komunikatu "Failed to load plans" z przyciskiem "Retry".
*   **Błąd walidacji (Create):** Komunikaty pod polami formularza (React Hook Form).
*   **Błędy API (4xx/5xx):** Wyświetlenie Toasta (Shadcn `toast`) z komunikatem błędu z backendu (np. "Internal Server Error" lub specyficzny message).

## 11. Kroki implementacji

1.  **Setup Hooka:** Stworzenie `src/lib/hooks/usePlans.ts` z logiką fetchowania i mutacji.
2.  **Komponent Karty:** Implementacja `PlanCard.tsx` z wariantami wyglądu dla statusów i menu akcji.
3.  **Sekcja Tworzenia:** Implementacja `CreatePlanDialog.tsx` z formularzem i walidacją daty (poniedziałek).
4.  **Widok Główny:** Implementacja `PlansView.tsx` składająca komponenty w całość.
5.  **Integracja:** Podpięcie widoku pod stronę Astro `src/pages/plans/index.astro`.
6.  **Testy Manualne:**
    *   Stworzenie pierwszego planu.
    *   Stworzenie drugiego planu (Ready).
    *   Przełączenie aktywnego planu.
    *   Archiwizacja starego planu.
    *   Usunięcie planu.

