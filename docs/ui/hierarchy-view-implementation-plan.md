# Plan implementacji widoku Hierarchii Planu

## 1. Przegląd
Widok Hierarchii (`HierarchyView`) to dedykowana strona prezentująca pełną strukturę planu w formacie drzewa "tylko do odczytu". Pozwala użytkownikowi na przeglądanie zależności między Celami Długoterminowymi, Kamieniami Milowymi, Celami Tygodniowymi i Zadaniami. Widok oferuje zaawansowane filtrowanie (ukrywanie zakończonych, widok wszystkich tygodni) oraz nawigację do odpowiednich widoków edycji (Cele, Tydzień, Dzień) po kliknięciu w element.

## 2. Routing widoku
- **Ścieżka:** `/plans/[id]/hierarchy`
- **Dostęp:** Wymaga zalogowania.
- **Menu:** Dostępny z górnego menu nawigacyjnego (jako dodatkowa zakładka lub ikona).

## 3. Struktura komponentów

```text
src/pages/plans/[id]/hierarchy.astro (Page Shell)
└── Layout
    └── HierarchyViewContainer (React, client:load)
        ├── HierarchyControls (Toolbar)
        │   ├── FilterToggle (Show Completed)
        │   └── WeekScopeToggle (Current Week / All Weeks)
        └── HierarchyTree (Recursive Tree)
            ├── EmptyState (Placeholder)
            └── HierarchyNode (Tree Item)
                ├── NodeExpander (Chevron)
                ├── NodeIcon (Type specific)
                ├── NodeContent (Title + Status Badge)
                └── NodeChildren (Recursive)
```

## 4. Szczegóły komponentów

### 1. `HierarchyViewContainer`
- **Opis:** Główny kontener zarządzający stanem widoku. Pobiera dane (lub przyjmuje je z propsów jeśli pobrane przez Astro) i wykorzystuje `hierarchy-builder` do przetworzenia płaskich danych w drzewo.
- **Lokalizacja:** `src/components/plans/hierarchy/HierarchyViewContainer.tsx`
- **Główne elementy:**
  - `div` (kontener z paddingiem)
  - `HierarchyControls`
  - `HierarchyTree`
- **Obsługiwane interakcje:**
  - Zmiana filtrów (przekazywana do `HierarchyControls`).
  - Toggle węzłów (zarządzanie stanem `expandedIds`).
- **Obsługiwana walidacja:** Sprawdzenie czy dane planu istnieją, w przeciwnym razie wyświetlenie błędu lub redirect.
- **Typy:**
  - `Props`: `{ initialData?: PlanDashboardDTO, planId: string }`
- **Stan:**
  - `data`: `PlanDashboardDTO`
  - `filters`: `{ showCompleted: boolean, showAllWeeks: boolean }`
  - `expandedIds`: `Set<string>`

### 2. `HierarchyControls`
- **Opis:** Pasek narzędziowy nad drzewem zawierający filtry.
- **Główne elementy:**
  - `div` (flex row)
  - `Switch` (Shadcn UI) dla "Show completed".
  - `ToggleGroup` lub `Tabs` (Shadcn UI) dla wyboru zakresu tygodni ("Current Week" / "All Weeks").
- **Obsługiwane interakcje:**
  - `onFilterChange`: wywoływane przy zmianie dowolnego przełącznika.
- **Typy:**
  - `Props`: `{ filters: HierarchyViewFilters, onFilterChange: (filters: HierarchyViewFilters) => void }`

### 3. `HierarchyTree`
- **Opis:** Komponent prezentacyjny renderujący listę węzłów korzenia.
- **Główne elementy:**
  - `div` lub `ul` z rolą `tree`.
  - Iteracja po `nodes` i renderowanie `HierarchyNode`.
  - `EmptyState` jeśli lista węzłów jest pusta.
- **Typy:**
  - `Props`: `{ nodes: HierarchyTreeNode[], level?: number, onToggle: (id: string) => void, expandedIds: Set<string> }`

### 4. `HierarchyNode` (Refaktoryzacja i rozbudowa istniejącego)
- **Opis:** Pojedynczy wiersz w drzewie reprezentujący węzeł. Należy go przenieść z `src/components/plans/dashboard/` do `src/components/plans/hierarchy/` i rozbudować.
- **Główne elementy:**
  - `div` (wiersz flex) z wcięciem zależnym od `level`.
  - `Button` (variant ghost/icon) dla chevronu (expand/collapse) - widoczny tylko jeśli `hasChildren`.
  - `Icon` (zależna od `type`).
  - `span` lub `Link` (tytuł) - nawigacja do widoku szczegółowego.
  - `Badge` lub kolor tekstu dla statusu.
- **Obsługiwane interakcje:**
  - Kliknięcie w chevron -> `onToggle`.
  - Kliknięcie w treść -> nawigacja (Router push lub `a href`).
- **Warunki walidacji:**
  - Wyświetlanie odpowiedniej ikony i koloru w zależności od statusu (np. przekreślenie dla `cancelled`, zielony dla `completed`).
- **Typy:**
  - `Props`: `{ node: HierarchyTreeNode, isExpanded: boolean, onToggle: () => void }`

## 5. Typy

Należy zaktualizować `src/types.ts` o nowe typy pomocnicze oraz rozszerzyć istniejące.

### Rozszerzenie `NodeType`
```typescript
export type NodeType = 
  | 'plan' 
  | 'goal' 
  | 'milestone' 
  | 'weekly_goal' 
  | 'task' 
  | 'ad_hoc_group';  // NOWE: dla grupowania zadań po dniach
```

### Nowe interfejsy
```typescript
export interface HierarchyViewFilters {
  showCompleted: boolean; // Domyślnie false (ukryj zakończone)
  showAllWeeks: boolean;  // Domyślnie false (tylko bieżący tydzień)
}

// HierarchyTreeNode jest już zdefiniowany w types.ts, ale upewnić się, że obsługuje nowe typy node'ów.
```

## 6. Zarządzanie stanem

Stan jest zarządzany lokalnie w komponencie `HierarchyViewContainer` przy użyciu hooka `useState` (dla filtrów i rozwiniętych węzłów) oraz customowego hooka/funkcji memoizowanej do transformacji danych.

### Custom Logic: `buildHierarchyTree`
Funkcja (utilities) w `src/lib/hierarchy-utils.ts`.
- **Wejście:** `data: PlanDashboardDTO`, `filters: HierarchyViewFilters`.
- **Wyjście:** `HierarchyTreeNode[]`.
- **Działanie:**
  1. Filtruje elementy źródłowe (cele, zadania) zgodnie z filtrami `showCompleted` i `showAllWeeks` (z uwzględnieniem `plan.current_week`).
  2. Buduje strukturę drzewiastą obsługując 7 ścieżek powiązań zdefiniowanych w PRD (np. Goal -> Milestone -> WeeklyGoal -> Task).
  

## 7. Integracja API

**Endpoint:** `GET /api/v1/plans/[id]/dashboard`

- **Request:** Brak parametrów query (wszystkie dane są zwracane zawsze).
- **Response:** `PlanDashboardResponse` (zawiera płaskie tablice: `goals`, `milestones`, `weekly_goals`, `tasks`).
- **Integracja:**
  - Pobranie danych następuje w `src/pages/plans/[id]/hierarchy.astro` (SSR) i przekazanie ich jako prop do `HierarchyViewContainer`.
  - Alternatywnie: Pobranie w `useEffect` wewnątrz `HierarchyViewContainer` przy użyciu `PlanService` lub `fetch`.

## 8. Interakcje użytkownika

1. **Wejście na stronę:** Ładowanie danych, wyświetlenie spinnera, następnie drzewa. Domyślne filtry: Ukryj zakończone, Pokaż tylko bieżący tydzień.
2. **Przełączenie "Show completed":** Natychmiastowe przeliczenie drzewa. Zakończone cele i zadania pojawiają się/znikają.
3. **Przełączenie "All Weeks":** Natychmiastowe przeliczenie drzewa. Zadania z przyszłych/przeszłych tygodni pojawiają się/znikają.
4. **Rozwijanie gałęzi:** Kliknięcie w strzałkę obok folderu/celu rozwija go, pokazując dzieci. Stan jest zachowywany.
5. **Kliknięcie w element:**
   - **Plan/Goal:** Przekierowanie do `/plans/[id]` (widok celów).
   - **Weekly Goal:** Przekierowanie do `/plans/[id]/week/[nr]`.
   - **Task:** Przekierowanie do `/plans/[id]/week/[nr]/day/[nr]`.

## 9. Warunki i walidacja

- **Show Current Week:**
  - Jeśli `showAllWeeks === false`:
    - `weekly_goals` są filtrowane po `week_number === current_week`.
    - `tasks` są filtrowane po `week_number === current_week`.
    - Cele główne i kamienie milowe są zawsze widoczne (chyba że ukryte przez filtr statusu), ale ich dzieci są filtrowane.
- **Show Completed:**
  - Jeśli `showCompleted === false`:
    - Ukryj `goals` gdzie `progress_percentage === 100`.
    - Ukryj `milestones` gdzie `is_completed === true`.
    - Ukryj `weekly_goals` (status determinowany przez podzadania - jeśli wszystkie completed?). *Uwaga: WeeklyGoal nie ma wprost flagi completed w DTO, trzeba wyliczyć lub założyć, że pokazujemy zawsze chyba że rodzic ukryty.*
    - Ukryj `tasks` gdzie `status` to `completed` lub `cancelled`.

## 10. Obsługa błędów

- **Błąd pobierania danych:** Wyświetlenie komunikatu o błędzie z przyciskiem "Reload".
- **Brak danych (Pusty plan):** Wyświetlenie `EmptyState` z zachętą do stworzenia pierwszego celu (link do wizarda lub dashboardu).

## 11. Kroki implementacji

1.  **Przygotowanie struktury:**
    - Utworzyć katalog `src/components/plans/hierarchy`.
    - Przenieść tam komponenty hierarchii z `dashboard` (`HierarchyNode.tsx`, etc.) - *uwaga na refaktoryzację importów w istniejącym Dashboardzie*.
2.  **Implementacja Logiki (`hierarchy-utils.ts`):**
    - Napisać funkcję `buildHierarchyTree` obsługującą wszystkie przypadki zagnieżdżeń i grupowania. Jest to najbardziej skomplikowana część logiki biznesowej.
3.  **Implementacja Komponentów Widoku:**
    - Stworzyć `HierarchyControls.tsx`.
    - Zaktualizować `HierarchyNode.tsx` o obsługę linkowania i nowych typów węzłów.
    - Stworzyć `HierarchyViewContainer.tsx` łączący logikę i UI.
4.  **Strona Astro:**
    - Dodać trasę `src/pages/plans/[id]/hierarchy.astro`.
    - Zaimplementować pobieranie danych i renderowanie kontenera.
5.  **Testy:**
    - Sprawdzić poprawność generowanego drzewa dla skomplikowanych planów.
    - Zweryfikować poprawność linków nawigacyjnych.
    - Sprawdzić działanie filtrów.
