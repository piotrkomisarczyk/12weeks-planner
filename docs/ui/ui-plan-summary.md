<conversation_summary>

<decisions>
1.  **Struktura URL i Routing:** Zastosowanie aliasu `/active` dla aktywnego planera. Routing oparty na dynamicznych segmentach (np. `/plans/[id]/week/[nr]`). Wykorzystanie Astro View Transitions.
2.  **Dashboard vs Hierarchia:** Rozdzielenie widoków. Dashboard zawiera "Goals Overview" (cele + postęp), a osobny widok Hierarchii prezentuje drzewo zadań. Na górze obu widoków sekcja "Quick Links" (Current Week, Today, Review).
3.  **Nawigacja:** Top Bar zawiera Breadcrumbs (`[Plan] > [View]`), linki do głównych sekcji (Planners, Dashboard, Hierarchy, Goals, Weeks, Days, Reviews), ikonę użytkownika i flagę języka. Linki "Weeks" i "Days" prowadzą dynamicznie do *obecnego* tygodnia i *dzisiejszego* dnia.
4.  **Widok Tygodnia:** Układ 3-sekcyjny wertykalny (Main Focus, Goal Tasks, Other Tasks). Każda sekcja z własnym przyciskiem dodawania. Na mobile układ pozostaje wertykalny (stos).
5.  **Widok Dnia:** 3 sekcje (Important, Secondary, Additional). Zadanie "Najważniejsze" wyróżnione żółtym tłem i złotą ramką. Pasek nawigacji dni (Week Strip) na górze.
6.  **Statusy Zadań:** Ikona niestandardowa: Todo (pusty), In Progress (gradient po skosie), Completed (kwadrat z ptaszkiem). Działanie: lewy klik zmienia sekwencyjnie (pętla pomiędzy Todo, In Progress i Completed), obecność "chevrons" otwiera dropdown z dostępem do wszystkich statusów zadania, menu kontekstowe (prawy klik) pozwala wybrać dowolny status.
7.  **Edycja Zadań:** Panel boczny (Sheet). Na mobile szerokość 100%. Auto-save po zamknięciu. Podwójne kliknięcie w zadanie otwiera panel. Historia zmian (Activity Log) tylko do odczytu.
8.  **Interakcje:** Drag-and-drop do sortowania (z blokadą przenoszenia do pełnych sekcji). "Kopiuj/Przenieś" otwiera modal z wyborem daty. Slider postępu celu z efektem konfetti przy 100%.
9.  **Technologia UI:** TanStack Query (pobieranie danych, optimistic updates, prefetching). Nano Stores (współdzielenie stanu). Shadcn/ui (komponenty). Lucide React (ikony).
10. **Metryki i Eksport:** Metryki w profilu użytkownika. Eksport danych do JSON dostępny w ustawieniach profilu.
11. **Ustawienia Regionalne:** Język angielski (MVP). Daty w formacie `YYYY-MM-DD` (API) formatowane przez `date-fns` dla użytkownika.
</decisions>

<matched_recommendations>
1.  Zastosowanie **TanStack Query** do zarządzania stanem serwerowym i **Nano Stores** do stanu aplikacji, co ułatwi synchronizację w architekturze "Astro Island".
2.  Projektowanie **Desktop First**, ale z użyciem klas responsywnych (np. pełnoekranowe modale/sheety na mobile, wertykalne stosy).
3.  Wykorzystanie **Skeleton Loading** zamiast spinnerów dla list zadań i celów.
4.  Implementacja **Auto-save on close** dla formularzy edycji, aby zapobiec utracie danych.
5.  Obsługa błędów **429 (Rate Limit)** poprzez blokadę interfejsu i komunikat Toast, oraz błędów walidacji "sztywnych limitów" (np. 5 celów) po stronie klienta.
6.  Zastosowanie **Optimistic UI** dla zmian statusów i sortowania, z mechanizmem rollbacku w przypadku błędu.
7.  Użycie **Helperów Supabase** do obsługi sesji w Astro (SSR + Client).
8.  Formatowanie tytułów stron HTML (`[Widok] - [Plan]`) dla lepszej orientacji.
9.  Blokada dat w **Datepickerze** dla kamieni milowych do zakresu dat planera.
10. Wykorzystanie **Error Boundary** dla komponentów Reactowych.
</matched_recommendations>

<ui_architecture_planning_summary>
Pełna architektura UI została zdefiniowana w pliku **`docs/ui/ui-plan.md`**.

### Główne wymagania i struktura
Aplikacja "12 Weeks Planner" będzie oparta na **Astro 5** (SSR) z interaktywnymi "wyspami" **React 19**. Interfejs użytkownika wykorzystuje bibliotekę **Shadcn/ui** oraz **Tailwind CSS v4**. Projekt jest realizowany w podejściu **Desktop First**, z zachowaniem responsywności (RWD) dla kluczowych widoków. Język interfejsu to angielski (MVP).

### Kluczowe Widoki i Przepływy
1.  **Lista Planerów (`/plans`)**: Karta planera zawiera status, daty i zwijalną listę celów. Pierwsza karta to przycisk "Create New".
2.  **Kreator Planera**: Proces krokowy (Stepper): Dane podstawowe -> Cele -> Podsumowanie. Wymusza start w poniedziałek.
3.  **Dashboard (`/active` lub `/plans/[id]/dashboard`)**:
    *   Quick Links: Current Week, Today, Weekly Review.
    *   Goals Overview: Lista celów z paskami postępu.
4.  **Hierarchia (`/plans/[id]/hierarchy`)**: Drzewo zadań (Goals + Other Tasks). Elementy zakończone ukryte domyślnie. Brak edycji via Drag-and-Drop w tym widoku. Możliwość pokazania elementów zakończonych (checkbox).
5.  **Tydzień (`/plans/[id]/week/[nr]`)**: 3 sekcje zadań. Możliwość dodawania, edycji statusów i "odhaczania" zadań.
6.  **Dzień (`/plans/[id]/week/[nr]/day/[day]`)**: Pasek nawigacji dni. Sekcje priorytetów (Primary, Secondary, Additional).
7.  **Podsumowanie Tygodnia**: Podział ekranu: Prawa (Formularz pytań + auto-save), Lewa (Cele ze sliderami postępu).

### Integracja z API i Zarządzanie Stanem
*   **Pobieranie danych**: Wstępne pobieranie na serwerze (Astro) -> Przekazywanie jako `initialData` do **TanStack Query** (React).
*   **Mutacje**: Optymistyczne aktualizacje interfejsu (natychmiastowa reakcja UI) z debouncowaniem (500ms dla statusów, 1500ms dla opisów review).
*   **Drag-and-Drop**: Obsługa sortowania list zadań. Przenoszenie zadań między dniami/tygodniami realizowane przez Modal (nie D&D między widokami).
*   **Walidacja**: Limity biznesowe (np. max 10 zadań) walidowane po stronie klienta przed wysłaniem żądania.

### UX i Design System
*   **Ikony**: Lucide React. Specyficzne ikony dla statusów (Gradient dla In Progress).
*   **Feedback**: Toasty (Sonner) na górze (mobile) lub dole (desktop). Konfetti po osiągnięciu 100% celu (po 2 sekundach).
*   **Dostępność**: Obsługa klawiatury dla niestandardowych przycisków statusu. Tryb Ciemny (Dark Mode).
*   **Błędy**: Dedykowane strony 404/500 w stylu aplikacji. Obsługa wygaśnięcia sesji (Modal Re-login).

</ui_architecture_planning_summary>

<unresolved_issues>
Brak istotnych nierozwiązanych kwestii na tym etapie. Wszystkie kluczowe decyzje architektoniczne dla MVP zostały podjęte. Szczegóły implementacyjne (np. konkretne treści tekstowe, dokładne palety kolorów gradientów) zostaną doprecyzowane w fazie developmentu.
</unresolved_issues>

</conversation_summary>
