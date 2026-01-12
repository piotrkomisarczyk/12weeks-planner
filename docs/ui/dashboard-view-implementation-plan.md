# Plan implementacji widoku Dashboard Planera

## 1. Przegląd
Widok Dashboardu jest centralnym punktem zarządzania planerem 12-tygodniowym. Zapewnia użytkownikowi "perspektywę z lotu ptaka" na postępy, umożliwia szybką nawigację do kluczowych widoków (tydzień, dzień, cele) oraz prezentuje pełną, hierarchiczną strukturę planu (drzewo celów i zadań). Widok jest w trybie "read-only" z możliwością interaktywnego zwijania/rozwijania gałęzi oraz filtrowania.

## 2. Routing widoku
*   **Ścieżka:** `/plans/[id]/dashboard`
*   **Plik strony:** `src/pages/plans/[id]/index.astro` (lub przekierowanie z index do dashboard, jeśli struktura plików to `plans/[id]/index.astro` to jest to główny widok planera). Zgodnie z obecną strukturą plików: `src/pages/plans/[id]/index.astro`.

## 3. Struktura komponentów

```text
DashboardPage (Astro Page)
└── Layout (istniejący layout aplikacji)
    └── DashboardContainer (React - Client Component)
        ├── DashboardHeader (Info o planerze, obecny tydzień, wskaźniki)
        ├── QuickActionsPanel (Grid z linkami do widoków)
        ├── GoalsOverview (Lista postępów celów głównych)
        │   └── GoalProgressCard
        └── HierarchySection
            ├── HierarchyControls (Filtry: Pokaż zakończone, Pokaż wszystkie tygodnie)
            └── HierarchyTree
                ├── HierarchyNode (Rekurencyjny węzeł)
                │   ├── NodeContent (Ikona, Tytuł, Status)
                │   └── NodeChildren (Zagnieżdżona lista)
                └── EmptyState (gdy brak danych)
```

## 4. Szczegóły komponentów

### 1. `DashboardPage` (`src/pages/plans/[id]/index.astro`)
*   **Opis:** Główna strona Astro. Odpowiada za pobranie `planId` z parametrów URL.
*   **Główne elementy:**
    *   Weryfikacja sesji (middleware).
    *   Przekazanie `planId` do komponentu React `DashboardContainer`.
*   **Typy:** `Astro.props`.

### 2. `DashboardContainer` (`src/components/plans/dashboard/DashboardContainer.tsx`)
*   **Opis:** Główny kontener logiki biznesowej po stronie klienta. Pobiera dane z API i zarządza stanem widoku.
*   **Główne elementy:**
    *   `usePlanDashboard` (custom hook do pobierania danych).
    *   Renderowanie warunkowe (Loading, Error, Content).
*   **Obsługiwane zdarzenia:**
    *   Pobranie danych przy montowaniu komponentu.
*   **Typy:** `DashboardContainerProps { planId: string }`.

### 3. `DashboardHeader`
*   **Opis:** Wyświetla nazwę planera, datę startu/końca, numer obecnego tygodnia i główne metryki (np. liczba celów, zadań).
*   **Propsy:** `plan: PlanDTO`, `metrics: DashboardMetrics`.

### 4. `QuickActionsPanel`
*   **Opis:** Panel z przyciskami nawigacyjnymi ("Current Week", "Today", "Goals View", "Summary").
*   **Propsy:** `planId: string`, `currentWeek: number`.

### 5. `HierarchySection` & `HierarchyTree`
*   **Opis:** Sekcja zawierająca logikę filtrowania i renderowania drzewa.
*   **Główne elementy:**
    *   Toggle Switch: "Show completed" (domyślnie ukryte).
    *   Toggle Switch: "Show current week only" (domyślnie włączone).
    *   Komponent `HierarchyTree` renderujący listę węzłów korzenia.
*   **Logika:**
    *   Konstrukcja drzewa z płaskiej struktury danych (flat arrays -> nested tree).
    *   Filtrowanie węzłów na podstawie stanu toggle'i.
*   **Propsy:** `data: PlanDashboardResponse`.

### 6. `HierarchyNode`
*   **Opis:** Pojedynczy wiersz w drzewie. Obsługuje zwijanie/rozwijanie i linkowanie.
*   **Główne elementy:**
    *   Chevron (expand/collapse).
    *   Ikona typu (Cel, Milestone, Zadanie).
    *   Status Indicator (kolor/ikona).
    *   Tytuł (Link).
*   **Interakcje:**
    *   Kliknięcie w chevron -> toggle `isOpen`.
    *   Kliknięcie w tytuł -> nawigacja do odpowiedniego widoku.
*   **Propsy:** `node: HierarchyTreeNode`, `level: number`.

## 5. Typy

Należy rozszerzyć `src/types.ts`.

### `HierarchyTreeNode`
Struktura ujednoliconego węzła drzewa dla UI.

```typescript
export type NodeType = 'plan' | 'goal' | 'milestone' | 'weekly_goal' | 'task' | 'ad_hoc_group';

export interface HierarchyTreeNode {
  id: string;
  type: NodeType;
  title: string;
  status?: string; // PlanStatus | TaskStatus | boolean (dla milestone)
  isCompleted: boolean;
  progress?: number; // Dla celów
  weekNumber?: number; // Dla zadań/celów tygodniowych
  children: HierarchyTreeNode[];
  metadata: {
    originalId: string;
    linkUrl: string; // URL do przekierowania
    priority?: string; // Dla zadań
    date?: string; // Dla zadań z datą
  };
}
```

### `DashboardFilterState`
```typescript
export interface DashboardFilterState {
  showCompleted: boolean;
  showAllWeeks: boolean; // false = current week only
}
```

## 6. Zarządzanie stanem

Stan będzie zarządzany lokalnie w komponencie `DashboardContainer` oraz `HierarchySection`.

1.  **Stan Danych:** Przechowywany w custom hooku `usePlanDashboard`. Użycie `useEffect` do pobrania danych z endpointu.
2.  **Stan Filtrów:** `useState` w `HierarchySection` (`showCompleted`, `showAllWeeks`).
3.  **Stan Drzewa:**
    *   Transformacja danych ("memoizowana" przy użyciu `useMemo`) z płaskiej struktury API (`PlanDashboardResponse`) na `HierarchyTreeNode[]` w zależności od filtrów.
    *   Stan zwinięcia/rozwiniecia węzłów może być trzymany wewnątrz każdego `HierarchyNode` (prostsze) lub globalnie w `HierarchyTree` (jeśli potrzebujemy "Collapse All"). Dla MVP wystarczy stan lokalny węzła.

## 7. Integracja API

*   **Endpoint:** `GET /api/v1/plans/[id]/dashboard`
*   **Parametry:**
    *   Sugerowane użycie: `?week_view=all&status_view=all` przy pierwszym ładowaniu.
    *   **Uzasadnienie:** Pobranie wszystkich danych pozwala na błyskawiczne filtrowanie po stronie klienta (Client-Side Filtering) bez konieczności ponownego odpytywania API przy przełączaniu "Show completed" czy "Show all weeks". Ilość danych tekstowych dla jednego planera jest relatywnie mała.
*   **Odpowiedź:** `PlanDashboardResponse` (zdefiniowane w `types.ts`).

## 8. Interakcje użytkownika

1.  **Otwarcie Dashboardu:** Ładowanie danych, spinner loadingowy, następnie wyświetlenie widoku.
2.  **Toggle "Show Completed":**
    *   Domyślnie **wyłączony** (widoczne tylko aktywne).
    *   Po włączeniu: Drzewo przelicza się, pokazując zakończone zadania i cele.
3.  **Toggle "Show All Weeks":**
    *   Domyślnie **wyłączony** (widoczne tylko elementy bieżącego tygodnia + nadrzędne cele).
    *   Po włączeniu: Pokazuje całą historię i przyszłe plany.
4.  **Nawigacja z Drzewa:**
    *   Kliknięcie w **Goal** -> Przenosi do `/plans/[id]/goals` (scroll do celu).
    *   Kliknięcie w **Milestone** -> Przenosi do `/plans/[id]/goals`.
    *   Kliknięcie w **Weekly Goal** -> Przenosi do `/plans/[id]/week` (ustawia odpowiedni tydzień).
    *   Kliknięcie w **Task** -> Przenosi do widoku dnia (jeśli przypisany do dnia) lub tygodnia.
5.  **Expand/Collapse:** Kliknięcie strzałki przy węźle pokazuje/ukrywa dzieci.

## 9. Warunki i walidacja

1.  **Brak danych:** Jeśli API zwróci puste tablice (nowy planer), wyświetl "Empty State" z zachętą do stworzenia pierwszego celu (link do kreatora/widoku celów).
2.  **Statusy:**
    *   Mapowanie statusów API (`active`, `completed`, `cancelled`) na odpowiednie kolory i ikony w UI.
    *   Wyróżnienie kolorystyczne dla węzłów z różnymi statusami (completed: ciemnozielony, cancelled: szary/przekreślony, in progress - niebieski, to do - czarny, postponed - brązowy)
3.  **Ad-hoc:** Zadania bez powiązań (`weekly_goal_id`, `milestone_id`, `long_term_goal_id` są null) muszą trafić do sekcji "Other Tasks" na samym dole drzewa.

## 10. Obsługa błędów

*   **Błąd 404:** Jeśli plan nie istnieje -> Przekierowanie do listy planerów lub komunikat błędu.
*   **Błąd 500/Network:** Wyświetlenie komponentu `ErrorMessage` z przyciskiem "Try again" (ponowne wywołanie funkcji fetch).
*   **Błędy spójności:** Jeśli zadanie wskazuje na nieistniejący cel (błąd bazy), zadanie powinno zostać wyświetlone w sekcji awaryjnej (np. w Ad-hoc) zamiast powodować crash UI.

## 11. Kroki implementacji

1.  **Przygotowanie Typów i Hooków:**
    *   Stworzenie `HierarchyTreeNode` interface.
    *   Implementacja `usePlanDashboard` (fetcher).
    *   Implementacja funkcji narzędziowej `buildHierarchyTree(data, filters)` w `src/lib/dashboard-utils.ts`. To jest najbardziej złożona logika (mapowanie ID, budowanie zagnieżdżeń).

2.  **Budowa Komponentów UI (Atomic):**
    *   Stworzenie `HierarchyNode` (wygląd wiersza, wcięcia, ikony).
    *   Stworzenie `GoalProgressCard` dla sekcji przeglądu.
    *   Stworzenie `QuickActionsPanel`.

3.  **Składanie Widoku (DashboardContainer):**
    *   Złożenie komponentów w całość.
    *   Podpięcie danych z hooka.
    *   Implementacja filtrów.

4.  **Integracja ze stroną Astro:**
    *   Dodanie `client:load` do komponentu React w pliku `.astro`.

5.  **Stylowanie i UX:**
    *   Dopracowanie wcięć w drzewie.
    *   Kolorystyka statusów (Tailwind).
    *   Dodanie animacji rozwijania (opcjonalnie, np. `AnimateHeight`).

6.  **Testy Manualne:**
    *   Weryfikacja poprawności hierarchii (czy zadanie milestone'a jest pod milestone'em).
    *   Weryfikacja filtrów (czy ukrywa zakończone).
    *   Weryfikacja linków (czy prowadzą w dobre miejsca).
