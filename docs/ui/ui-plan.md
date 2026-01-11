# Architektura UI dla 12 Weeks Planner

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika "12 Weeks Planner" została zaprojektowana zgodnie z podejściem **Desktop First**, kładąc nacisk na czytelność, szybką nawigację i minimalizację kliknięć potrzebnych do wykonania kluczowych akcji (planowanie, oznaczanie zadań).

System opiera się na **Astro 5** (Server-Side Rendering) dla szybkiego ładowania szkieletu aplikacji i SEO, oraz **React 19** w architekturze "Islands" dla interaktywnych elementów (zarządzanie zadaniami, formularze). Stan aplikacji jest zarządzany hybrydowo: stan serwera przez **TanStack Query** (z optymistycznymi aktualizacjami), a stan lokalny UI przez **Nano Stores**. Stylizacja wykorzystuje **Tailwind CSS v4** oraz bibliotekę komponentów **Shadcn/ui**.

### Główne założenia:
*   **Separacja kontekstów:** Wyraźny podział na widoki publiczne, listę planerów i kontekst aktywnego planera.
*   **Hierarchia informacji:** Od ogółu (Dashboard/Cele) do szczegółu (Tydzień/Dzień).
*   **Elastyczna hierarchia zadań:** Wsparcie dla wielu wzorców organizacji:
    *   Cel długoterminowy → Kamień milowy → Zadanie
    *   Cel długoterminowy → Zadanie (bez milestones)
    *   Cel tygodniowy → Podzadania (dziedziczące powiązania z celu)
    *   Zadania ad-hoc (bez powiązań z celami, ale z możliwością dodania takich powiązań do celów i do kamieni milowych)
*   **Feedback natychmiastowy:** Optymistyczne UI dla statusów zadań, pasków postępu i zmian powiązań.
*   **Bezpieczeństwo danych:** Auto-save dla formularzy tekstowych (refleksje) i edycji zadań z debouncingiem.
*   **Intuicyjne linkowanie:** Menu 2-stopniowe (cel → milestone) dla łatwego zarządzania powiązaniami między celami a zadaniami.
*   **Limity:** 1-6 celów na planer, do 5 kamieni milowych na cel, 0-3 celów tygodniowych na tydzień, do 15 podzadań na cel tygodniowy, do 100 zadań ad-hoc na tydzień, do 10 zadań dziennie.

## 2. Lista widoków

### 2.1. Strefa Publiczna (Auth)

#### 2.1.1. Logowanie / Rejestracja
*   **Ścieżka:** `/login`, `/register`
*   **Cel:** Uwierzytelnienie użytkownika.
*   **Kluczowe informacje:** Formularz email/hasło, linki do resetu hasła i rejestracji.
*   **Komponenty:** `AuthForm`, `SocialLoginButtons` (przyszłość), `ErrorAlert`.
*   **UX/Bezpieczeństwo:** Walidacja formatu email po stronie klienta. Obsługa błędów autentykacji (złe hasło, nieistniejący user). Przekierowanie zalogowanych użytkowników na `/plans` lub `/active`.

#### 2.1.2. Reset Hasła
*   **Ścieżka:** `/forgot-password`, `/reset-password`
*   **Cel:** Odzyskiwanie dostępu do konta.
*   **Komponenty:** Formularz email, Formularz nowego hasła.

### 2.2. Strefa Aplikacji (Globalna)

#### 2.2.1. Lista Planerów
*   **Ścieżka:** `/plans`
*   **Cel:** Zarządzanie planerami (wybór, tworzenie, przegląd historii).
*   **Kluczowe informacje:** Karta aktywnego planera (wyróżniona), lista planerów archiwalnych, przycisk "Create New".
*   **Komponenty:** `PlanCard` (status, daty, progress), `CreatePlanButton`.
*   **UX:** Jeśli użytkownik nie ma planerów, widok zachęca do utworzenia pierwszego (Empty State).

#### 2.2.2. Kreator Planera (Wizard)
*   **Ścieżka:** `/plans/new`
*   **Cel:** Utworzenie nowego 12-tygodniowego planera.
*   **Kluczowe informacje:** Krok 1: Nazwa i Data Startu (wymuszony poniedziałek). Krok 2: Definicja Celów (1-6).
*   **Komponenty:** `PlanWizardStepper`, `DatePicker` (z blokadą dni innych niż poniedziałek), `GoalInputList`.
*   **UX:** Walidacja na żywo (min. 1 cel). Blokada przejścia dalej bez poprawnych danych.

#### 2.2.3. Profil Użytkownika
*   **Ścieżka:** `/profile`
*   **Cel:** Ustawienia konta i danych.
*   **Kluczowe informacje:** Zmiana hasła, Eksport danych (GDPR), Metryki sukcesu (User Metrics).
*   **Komponenty:** `MetricsCard`, `ExportDataButton`, `LanguageSwitcher`.

### 2.3. Kontekst Planera
*Dostępne dla ścieżek `/plans/[id]/*` oraz aliasu `/active/*`.*

#### 2.3.1. Dashboard Planera
*   **Ścieżka:** `/plans/[id]/dashboard` (lub `/active`)
*   **Cel:** "Perspektywa z lotu ptaka" - szybki dostęp do bieżących akcji i podgląd postępów.
*   **Kluczowe informacje:** Quick Links (Current Week, Today), Goals Overview (lista celów z postępem), info o bieżącym tygodniu.
*   **Komponenty:** `QuickActionsPanel`, `GoalsOverviewList` (tytuł + progress bar), `WeeklyReviewReminder` (jeśli niedziela).

#### 2.3.2. Hierarchia (Tree View)
*   **Ścieżka:** `/plans/[id]/hierarchy`
*   **Cel:** Wizualizacja pełnej struktury celów, kamieni milowych i zadań z elastyczną hierarchią.
*   **Kluczowe informacje:** 
    *   Drzewo hierarchiczne z możliwością expand/collapse dla każdego poziomu:
    *   **Root** nazwa planera
        *   **Long-term Goals** (cele główne)
            *   **Milestones** (kamienie milowe celu)
                *   **Weekly Goals** (cele tygodniowe powiązane z celem głównym oraz z kamieniem milowym)
                    *   **Weekly tasks** (podzadania celu tygodniowego powiązanego z kamieniem milowym)
                *   **Milestone Tasks** (zadania powiązane z milestone oraz z celem głównym, ale niepowiązane z celem tygodniowym)
            *   **Weekly Goals** (cele tygodniowe powiązane z celem głównym i niepowiązane z kamieniem milowym)
                *   **Weekly tasks** (podzadania celu tygodniowego, powiązane z celem głównym i niepowiązane z kamieniem milowym)
            *   **Tasks** (zadania powiązane bezpośrednio z celem głównym, bez milestone i bez celu tygodniowego)
        *   **Weekly Goals** (cele tygodniowe niepowiązane z celem głównym i niepowiązane z kamieniem milowym)
            *   **Weekly tasks** (podzadania celu tygodniowego niepowiązane z celem głównym i niepowiązane z kamieniem milowym)
        *   **Other Tasks** (sekcja osobna dla zadań bez powiązań z celami długoterminowymi ani kamieniami milowymi ani celami tygodniowymi)
    *   Zadania w sekcjach **Tasks**,  **Weekly tasks**, oraz **Other Tasks** pokazuj w następujący sposób (Przykład dla **Tasks**):
        *   **Tasks**
            *   **Week <number>**
                *   **Monday**
                    *  **status icon** **Task 1 title**
    *   2-stanowy przełącznik nad hierarchią "Show all / uncompleted" (domyślnie ukryte zadania i milestones ze statusem completed/cancelled - przycisk w stanie "Show uncompleted").
    *   2-stanowy przełącznik nad hierarchią "Show current week / all weeks" (domyślnie ustawiony na Show current week - pokazuje hierarchię zadań powiązanych z bieżącym tygodniem)
    *   
*   **Komponenty:** 
    *   `HierarchyTree` (komponent drzewa z expand/collapse, lazy loading dla dużych struktur).
    *   `HierarchyNode` (węzeł drzewa: goal, milestone, weekly goal, task).
    *   `TaskStatusIcon` (ikona statusu zadania).
    *   `ProgressBadge` (badge z procentem postępu dla celów).
    *   `MilestoneCompletionIcon` (checkbox/checkmark dla milestones).
*   **UX:** 
    *   Domyślnie zwinięte elementy zakończone (controlled przez checkbox "Show completed").
    *   Kliknięcie na nazwę węzła:
        *   Goal -> otwiera widok Goals.
        *   Milestone -> otwiera widok Goals z focus na tym milestone.
        *   Weekly Goal -> przenosi do widoku Tygodnia (week_number z weekly goal).
        *   Task -> przenosi do widoku Dnia (due_day i week_number z task), otwiera TaskSheet dla tego zadania.
    *   Ikona expand/collapse (chevron) obok każdego węzła z children.
    *   Sekcja "Ad-hoc Tasks" zawsze na dole drzewa, osobno od hierarchii celów.
    *   Wyróżnienie kolorystyczne dla węzłów z różnymi statusami (completed: zielony, cancelled: granatowy/przekreślony, in progress - niebieski, to do - czarny).
*   **Dostępność:**
    *   ARIA tree role dla struktury drzewa.
    *   Keyboard navigation: strzałki do nawigacji, Spacja do expand/collapse, Enter do otwarcia widoku.
    *   Screen reader friendly: ogłaszanie poziomu zagnieżdżenia i liczby children.
*   **Bezpieczeństwo:**
    *   Read-only widok (brak edycji bezpośrednio w drzewie, tylko nawigacja do widoków edycji).

#### 2.3.3. Edycja Celów
*   **Ścieżka:** `/plans/[id]/goals`
*   **Cel:** Zarządzanie celami długoterminowymi i ich kamieniami milowymi.
*   **Kluczowe informacje:** Szczegółowa lista celów, edycja treści, dodawanie kamieni milowych.
*   **Komponenty:** `GoalEditor` (formularz), `MilestoneList` (z datami), `ProgressSlider`, `Confetti` (przy ustawieniu progresu celu na 100 %).
*   **UX:** Limit 6 celów. Walidacja dat kamieni milowych (muszą mieścić się w 12 tygodniach).

#### 2.3.4. Widok Tygodnia
*   **Ścieżka:** `/plans/[id]/week/[nr]`
*   **Nawigacja:** Użytkownik klika w pasku nawigacji "Weeks" -> Wybiera bieżący 
tydzień.
*   **Cel:** Planowanie taktyczne na dany tydzień z powiązaniem zadań do celów długoterminowych i kamieni milowych.
*   **Kluczowe informacje:** 
    *   Numer tygodnia (wyświetlany jako "Week X"), zakres dat (data startu - data końca).
    *   Dwie główne sekcje zadań:
    *   **Weekly Goals** (0-3 celów tygodniowych, każdy z listą podzadań 0-15)
    *   **Other Tasks** (zadania ad-hoc, 0-100 zadań niezwiązanych z celami tygodniowymi)
*   **Komponenty:** 
    *   `WeekNavigator` (przycisk poprzedni/następny + dropdown wyboru tygodnia 1-12)
    *   `WeeklyGoalCard` (karta z tytułem celu tygodniowego, badge z powiązaniem do celu długoterminowego/milestone, lista podzadań)
    *   `TaskItem` (zadanie z ikoną statusu, priorytetem, ikoną drag-handle, menu "..." kontekstowe)
    *   `AddWeeklyGoalButton` (+ Add Weekly Goal, nieaktywny po osiągnięciu limitu 3)
    *   `AddTaskButton` (+ Add Task, dedykowany dla każdej sekcji)
    *   `GoalMilestonePicker` (menu 2-stopniowe: wybór celu długoterminowego -> wybór kamienia milowego lub brak)
    *   `PriorityBadge` (A/B/C, klikalne do cyklicznej zmiany)
    *   `DragHandle` (ikona "=" aktywująca tryb drag-and-drop)
*   **UX/Interakcje:**
    *   **Tworzenie Weekly Goal:** Kliknięcie "+ Add Weekly Goal" otwiera inline form lub Sheet z polami: tytuł, opcjonalnie powiązanie z celem długoterminowym i milestone (via `GoalMilestonePicker`). Po zapisaniu, nowy cel tygodniowy pojawia się jako karta z możliwością dodawania podzadań.
    *   **Dodawanie podzadań do celu tygodniowego:** Każda karta `WeeklyGoalCard` ma przycisk "+ Add Task". Nowe zadanie automatycznie dziedziczy powiązania (`long_term_goal_id`, `milestone_id`) z celu tygodniowego. Domyślny priorytet: A.
    *   **Dodawanie zadań ad-hoc:** Przycisk "+ Add Task" w sekcji "Other Tasks" tworzy zadanie bez powiązań. Możliwość ręcznego linkowania poprzez menu kontekstowe.
    *   **Menu kontekstowe (...) przy zadaniu:**
        *   "Link to goal" -> otwiera `GoalMilestonePicker` (wybór celu -> opcjonalnie milestone)
        *   "Unlink from goal" (jeśli zadanie ma powiązanie)
        *   "Assign to weekly goal" (dla zadań ad-hoc) -> pokazuje listę celów tygodniowych z bieżącego tygodnia
        *   "Unassign from weekly goal" (dla podzadań) -> przenosi zadanie do sekcji Other Tasks
        *   "Assign to day" -> pokazuje mini kalendarz z dniami 1-7 (pon-niedz)
        *   "Change priority" -> submenu z A/B/C
        *   "Copy to..." -> otwiera dialog wyboru tygodnia/dnia
        *   "Delete"
    *   **Drag-and-drop:** Kliknięcie na ikonę "=" przy zadaniu aktywuje drag-handle. Sortowanie możliwe tylko w ramach listy (podzadania w obrębie jednego celu tygodniowego, ad-hoc w obrębie sekcji Other Tasks). Brak przenoszenia między sekcjami przez D&D - tylko przez menu kontekstowe.
    *   **Zmiana priorytetu:** Kliknięcie na badge priorytetu (A/B/C) cyklicznie zmienia wartość (A->B->C->A). Alternatywnie przez menu kontekstowe.
    *   **Linkowanie celu tygodniowego do goal/milestone:** Kliknięcie na badge powiązania (lub placeholder "Not linked") w `WeeklyGoalCard` otwiera `GoalMilestonePicker`. Zmiana powiązania aktualizuje wszystkie podzadania.
    *   **Limity i walidacja:**
        *   Maksymalnie 3 cele tygodniowe (przycisk "+ Add Weekly Goal" wyłączony po osiągnięciu).
        *   Maksymalnie 15 podzadań na cel tygodniowy (przycisk "+ Add Task" w karcie wyłączony).
        *   Maksymalnie 100 zadań ad-hoc na tydzień (przycisk "+ Add Task" w sekcji Other Tasks wyłączony).
        *   Maksymalnie 10 zadań dziennie (suma wszystkich priorytetów).
        *   Toast z informacją o limicie przy próbie przekroczenia.
*   **Dostępność:**
    *   Drag-handle dostępny z klawiatury (Enter aktywuje, strzałki przesuwają, Enter zatwierdza).
    *   Menu kontekstowe otwierane przez Shift+F10 lub klawisz Menu.
    *   ARIA labels dla przycisków dodawania, drag-handles, menu kontekstowych.
*   **Bezpieczeństwo:**
    *   Walidacja limitów po stronie klienta przed wysłaniem żądania POST/PATCH.
    *   Optymistyczne UI z rollbackiem w przypadku błędu API (np. konflikt wersji, przekroczenie limitu po stronie serwera).

#### 2.3.5. Widok Dnia
*   **Ścieżka:** `/plans/[id]/week/[nr]/day/[date]`
*   **Cel:** Egzekucja - lista "To-Do" na dziś oraz możliwość dodawania, przesuwania i kopiowania zadań na inne dni.
*   **Kluczowe informacje:** Data, dzień tygodnia. Sekcje: Most Important (1), Secondary (2), Others (7).
*   **Komponenty:** `DayNavigator` (Week Strip), `DailyTaskSlot`, `TaskItem` (pełna interakcja), `Confetti` (przy ukończeniu wszystkich), `AddTaskButton`.
*   **UX:** Wyraźne wizualne rozróżnienie sekcji priorytetów. . Drag-and-drop do ustalania kolejności zadań w widoku dnia. Możliwość przesuwania zadań pomiędzy sekcjami priorytetów o ile dostępne są limity (odbywa się poprzez zmianę priorytetu zadania A/B/C).
*   **Szczegóły zachowania:**
    * Segreguj zadania po priorytetach (A > B > C) i po pozycjach. Uzyskaną listę umieść odpowiednio na listach
    * Jeśli w zadaniach na dany dzień jest więcej niż jedno zadanie (A), to wybierz pierwsze z najwyższą pozycją i pokaż je na liście najważniejszych. Kolejne zadania (A) wyświetl na liście drugorzędne, a kolejne na liście dodatkowe.
    * Jeśli w zadaniach na dany dzień jest więcej niż dwa zadania (B), to wybierz pierwsze dwa z najwyższą pozycją i pokaż je na liście drugorzędnych (o ile jest tam miejsce - nie są przekroczone limity). Jeśli brakuje miejsca kolejne zadania (B) wyświetl na liście dodatkowe.
    * Zadania (C) pokazuj na liście dodatkowe (chyba że są miejsca na pierwszych dwóch listach - wtedy decyduje kolejność wg position)
    * Pozwalaj na zmianę priorytetu zadania w widoku dnia i odświeżaj aktualną listę zadań na wszystkich 3 listach. Użyj debounce 1000ms do odświeżania.
    * Pozwalaj na zmianę kolejności zadań na liście przez drag-and-drop. Upewnij się czy jest to możliwe przy aktualnej implementacji api oraz bazy danych (tasks posiadają jedno pole position w bazie danych). Zaproponuj rozwiązanie by użyć pola position tak by przechowywało pozycje dla widoku tygodnia i dnia.
    * Możliwość kopiowania zadania na kolejne dni. (W danych historii zadania powinna być przechowana informacja z datami i stanami w jakich zadanie się znajdowało przed przekopiowaniem).
    * Zmiana stanu zadania prze kliknięcie na ikonie stanu oraz przez chevron (zastosuj implementację zadania z widoku tygodnia)
    * Dla widoku dnia nie wyświetlaj na zadaniach badga z dniem. Zamiast tego dodaj informacje o przypisanym celu tygodniowym (o ile został przypisany).
    * W widoku dnia na każdym zadaniu wyświetlaj badge: 
    kategoria celu > cel > milestone > cel tygodniowy (o ile są dostępne)
    * Pozwól dodawać zadania w widoku dnia. Automatycznie ustaw due day na dzień używany w aktualnym widoku (to nie musi być bieżący dzień według aktualnej daty - tylko dzień wyświetlany w widoku dnia)
    * Przycisk dodawania zadań umieść pod listą analogicznie jak w widoku tygodnia
    * Pozwól na przypisywanie zadań do celów i milestone'ów zgodnie z aktualną implementacją (tak jak w widoku tygodnia)
    * Edge case: zadanie wielodniowe. Pozwól użytkownikowi wybrać jeden z dwóch sposobów obsługi takich zadań:
      * przenieść zadanie na kolejny lub wybrany tydzień/dzień (oraz zaktualizować historię zadania)
      * skopiować zadanie na kolejny lub wybrany dzień (skopiować istniejącą historie zadania i zaktualizować ją - o ile to możliwe).
      * obie opcje mają być dostępne z menu kontekstowego zadania (...) tylko w widoku dnia
 

#### 2.3.6. Podsumowanie Tygodnia (Review)
*   **Ścieżka:** `/plans/[id]/review/[nr]`
*   **Cel:** Refleksja i aktualizacja postępów.
*   **Kluczowe informacje:** 3 pytania (Co wyszło? Co nie? Co poprawić?), Lista celów do aktualizacji postępu.
*   **Komponenty:** `ReflectionForm` (Auto-save textareas), `GoalsProgressUpdater` (Sliders).
*   **UX:** Sugerowane w niedzielę. Możliwość edycji wstecznej.

## 3. Mapa podróży użytkownika

### Scenariusz Główny: Codzienna praca z planerem
1.  **Start:** Użytkownik wchodzi na stronę główną. Jeśli sesja aktywna -> Redirect na `/active`.
2.  **Dashboard:** Użytkownik widzi status celów (progress bars). Klika w "Today" (Quick Link).
3.  **Widok Dnia:** Użytkownik widzi zadania na dziś podzielone na sekcje (Most Important, Secondary, Additional).
    *   *Interakcja:* Klika w ikonę statusu przy zadaniu "Setup Supabase client" (z sekcji Most Important) -> Status zmienia się na "In Progress" (gradient icon).
    *   *Interakcja:* Po skończeniu pracy klika ponownie ikonę statusu -> Status "Completed" (checkmark icon).
    *   *Interakcja:* Zadanie miało badge "🎯 Launch MVP >  🚩API Design" - użytkownik wie, że przyczynia się do kamienia milowego.
    *   *Interakcja:* Dodaje nagłe zadanie do sekcji "Additional" (kliknięcie "+ Add Task") -> wpisuje "Call client" -> zadanie bez powiązań (ad-hoc).
4.  **Koniec:** Użytkownik zamyka aplikację. Wszystkie zmiany statusów zapisane automatycznie (optimistic UI + auto-save).

### Scenariusz Poboczny: Planowanie Tygodnia
1.  **Nawigacja:** Użytkownik klika w pasku nawigacji "Weeks" -> Przekierowanie do bieżącego tygodnia (lub wybiera konkretny tydzień w pasku nawigacji "Weeks").
2.  **Widok Tygodnia - Tworzenie Celu Tygodniowego:** 
    *   Użytkownik klika "+ Add Weekly Goal".
    *   Wpisuje tytuł: "Complete authentication system".
    *   Klika na badge "🔗 Not linked" -> otwiera się `GoalMilestonePicker`.
    *   Wybiera cel "Launch MVP" -> pojawia się submenu z milestones.
    *   Wybiera milestone "API Design".
    *   Zatwierdza - nowa karta `WeeklyGoalCard` pojawia się z powiązaniem "🎯 Launch MVP >  🚩API Design".
3.  **Dodawanie Podzadań:**
    *   W karcie "Complete authentication system" klika "+ Add Task".
    *   Wpisuje: "Setup Supabase client".
    *   Zadanie automatycznie dziedziczy powiązania z celu tygodniowego (`long_term_goal_id` = Launch MVP, `milestone_id` = API Design).
    *   Na zadaniach przypisanych do celu tygodniowego nie mozna manualnie zmieniać powiązania do celu długoterminowego i do kamienia milowego (zawsze odzwierciedla to powiązanie celu tygodniowego).
    *   Priorytet domyślnie ustawiony na A.
    *   Dodaje kolejne 2 zadania: "Implement login endpoint", "Add JWT middleware".
4.  **Dodawanie Zadań Ad-hoc:**
    *   W sekcji "Other Tasks" klika "+ Add Task".
    *   Wpisuje: "Review design mockups" (zadanie bez powiązań z celami).
    *   Zmienia priorytet na C (kliknięcie na badge).
5.  **Linkowanie Zadania Ad-hoc:**
    *   Klika menu "..." przy zadaniu "Review design mockups".
    *   Wybiera "Link to goal" -> `GoalMilestonePicker`.
    *   Wybiera cel "Launch MVP", bez milestone.
    *   Zadanie teraz ma badge "🎯 Launch MVP".
6.  **Scheduling:**
    *   Klika prawym przyciskiem na zadanie "Setup Supabase client" -> menu kontekstowe.
    *   Wybiera "Assign to day" -> mini kalendarz z dniami pon-niedz.
    *   Wybiera Tuesday (day 2) -> zadanie zapisane z `due_day = 2`.
7.  **Sortowanie:**
    *   Klika ikonę "=" przy zadaniu "Add JWT middleware".
    *   Przeciąga zadanie na pierwszą pozycję w liście podzadań.
    *   Zwalnia - zadanie zapisane z nową pozycją (`position = 1`).
8.  **Koniec:** Użytkownik przechodzi do widoku Dnia (Tuesday) -> widzi zaplanowane zadanie "Setup Supabase client" w sekcji priorytetów.

### Scenariusz Zaawansowany: Zarządzanie Powiązaniami i Restrukturyzacja Zadań
1.  **Kontekst:** Użytkownik jest w widoku Tygodnia 3. Ma cel tygodniowy "Complete authentication system" z 3 podzadaniami.
2.  **Przenoszenie podzadania do ad-hoc:**
    *   Użytkownik decyduje, że zadanie "Add JWT middleware" nie jest związane z tym celem tygodniowym.
    *   Klika menu "..." przy zadaniu -> wybiera "Unassign from weekly goal".
    *   Zadanie znika z karty `WeeklyGoalCard` i pojawia się w sekcji "Other Tasks" (staje się ad-hoc).
    *   Zadanie zachowuje powiązania `long_term_goal_id` i `milestone_id` (badge "🎯 Launch MVP >  🚩API Design" nadal widoczny).
3.  **Przypisywanie zadania ad-hoc do celu tygodniowego:**
    *   Użytkownik ma w sekcji "Other Tasks" zadanie "Test login flow".
    *   Klika menu "..." -> wybiera "Assign to weekly goal".
    *   Pojawia się lista z tytułami celów tygodniowych: "Complete authentication system", "Design database schema".
    *   Wybiera "Complete authentication system".
    *   Zadanie przenosi się do karty tego celu jako podzadanie (dziedziczy `long_term_goal_id` i `milestone_id` z celu tygodniowego).
4.  **Zmiana powiązania celu tygodniowego:**
    *   Użytkownik klika na badge powiązania w nagłówku karty "Complete authentication system" ("🎯 Launch MVP >  🚩API Design").
    *   Otwiera się `GoalMilestonePicker`.
    *   Użytkownik zmienia powiązanie na inny milestone: "User Management".
    *   Po zatwierdzeniu, wszystkie podzadania tego celu tygodniowego automatycznie aktualizują swoje powiązania (`milestone_id` zmienia się na "User Management").
    *   Badge w nagłówku i przy wszystkich podzadaniach aktualizuje się na "🎯 Launch MVP > 🚩 User Management".
5.  **Koniec:** Użytkownik przechodzi do widoku Hierarchii -> widzi zaktualizowaną strukturę z nowymi powiązaniami.

## 4. Układ i struktura nawigacji

System wykorzystuje układ **Sticky Top Bar** dla zapewnienia maksymalnej przestrzeni roboczej przy zachowaniu dostępności nawigacji.

### 4.1. Global Top Bar (Zawsze widoczny)
*   **Lewa strona:** Logo aplikacji, Breadcrumbs (Ścieżka okruszków: `Planers > [Nazwa Planu] > [Nazwa Widoku]`).
*   **Prawa strona:**
    *   Language Flag (PL/EN).
    *   User Menu (Avatar z dropdownem: Settings, Export data, Logout).
    *   Theme Toggle (Sun/Moon).

### 4.2. Plan Context Navigation (Widoczny wewnątrz planera)
Umieszczony bezpośrednio pod Global Top Bar lub zintegrowany z nagłówkiem widoku. Linki tekstowe lub zakładki:
*   **Dashboard** (Ikona Home)
*   **Hierarchy** (Ikona Tree)
*   **Goals** (Ikona Target)
*   **Weeks** (link do obecnego tygodnia)
*   **Days** (link do Today)
*   **Reviews** (Ikona Clipboard)

### 4.3. Nawigacja lokalna (Wewnątrz widoków)
*   **Week/Day Views:** Paski nawigacji "Poprzedni / Następny" oraz "Week Strip" (pasek z dniami pon-niedz) w widoku dnia.
*   **Mobile:** Na urządzeniach mobilnych menu kontekstowe zamienia się w "Hamburger Menu", a `WeekStrip` jest przewijalny poziomo.

## 5. Kluczowe komponenty

### 5.1. TaskItem (Komponent Zadania)
Fundamentalny element UI, używany w widokach Tygodnia, Dnia i Hierarchii.
*   **Wygląd:** 
    *   Wiersz składający się z (od lewej): ikona statusu, tytuł zadania, badge priorytetu (A/B/C), opcjonalnie badge powiązania (jeśli ma `long_term_goal_id` lub `milestone_id`), ikona drag-handle ("="), ikona menu kontekstowego ("...").
    *   Badge powiązania wyświetla nazwę celu długoterminowego lub kamienia milowego (np. 
        *   cel: "🎯 Launch MVP" 
        *   cel z kamieniem milowym: "🎯 Launch MVP / 🚩 Milestone: API Design").

*   **Status Icon:** Customowy element SVG. Pusty kwadrat (Todo), Częściowo wypełniony/Gradient (od górnego lewego rogu do przekątnej) (In Progress), Kwadrat z ptaszkiem (Completed), Przekreślony X (Cancelled), Strzałka w prawo wychodząca ze środka obramowanego kwadratu (Postponed).
*   **Interakcje:**
    *   *Click na Status Icon:* Cykliczna zmiana statusu Todo -> In Progress -> Completed -> Todo.
    *   *Click na Chevron (⌄) obok Status Icon:* Otwiera dropdown z wszystkimi 5 statusami (Todo, In Progress, Completed, Cancelled, Postponed) do bezpośredniego wyboru.
    *   *Click na Priority Badge:* Cykliczna zmiana priorytetu A -> B -> C -> A (tylko w widoku Tygodnia i Dnia).
    *   *Click na Badge Powiązania:* Otwiera `GoalMilestonePicker` do edycji linkowania (tylko w widoku Tygodnia).
    *   *Click na Drag-handle (=):* Aktywuje tryb drag-and-drop dla sortowania pozycji w liście.
    *   *Click na Menu (...):* Otwiera menu kontekstowe z opcjami (szczegóły w sekcji 2.3.4 Widok Tygodnia).
    *   *Right Click / Long Press:* Otwiera menu kontekstowe (alternatywa do kliknięcia na "...").
    *   *Double Click na tytuł:* Otwiera `TaskSheet` (edycja szczegółów).
*   **Stany:**
    *   *Dragging:* Zadanie podświetlone, cursor zmieniony, ghost element podczas przeciągania.
    *   *Disabled:* Szare tło, brak interakcji (np. w widoku Hierarchii dla zadań zakończonych, jeśli ukryte domyślnie).
*   **Dostępność:**
    *   Ikona statusu jako `<button>` z ARIA label "Change status" + obecny status.
    *   Badge priorytetu jako `<button>` z ARIA label "Change priority" + obecny priorytet.
    *   Menu kontekstowe z ARIA role="menu", dostępne przez Shift+F10.
    *   Drag-handle z ARIA label "Reorder task", obsługa klawiatury (Enter aktywuje, strzałki przesuwają).

### 5.2. TaskSheet (Arkusz Edycji)
Wysuwany panel boczny (Shadcn Sheet) nakładający się na widok. Otwierany przez double-click na zadaniu lub opcję "Edit" w menu kontekstowym.
*   **Zawartość:** 
    *   **Nagłówek:** Ikona statusu (klikalna, działa jak w TaskItem) + tytuł zadania (inline editable).
    *   **Sekcja Podstawowe:**
        *   Description (Textarea, opcjonalne).
        *   Priority (Dropdown A/B/C).
        *   Status (Dropdown z wszystkimi 5 statusami).
    *   **Sekcja Scheduling:**
        *   Week Number (Dropdown 1-12 lub "Unassigned").
        *   Due Day (Dropdown Mon-Sun lub "No specific day").
    *   **Sekcja Relationships (Powiązania):**
        *   Linked to Weekly Goal (Read-only, jeśli `weekly_goal_id` != null; przycisk "Unassign" przenosi do ad-hoc).
        *   Linked to Long-term Goal (Picker z listą celów z bieżącego planera + opcja "None"). (disabled gdy zadanie jest przypisane do weekly goal)
        *   Linked to Milestone (Picker z listą milestones dla wybranego celu + opcja "None"; disabled, jeśli brak wybranego celu lub jeśli zadanie jest przypisane do weekly goal).
        *   Info box: "Tasks linked to a weekly goal automatically inherit its goal and milestone links and cannot be edited."
    *   **Sekcja Activity Log (Historia Zmian):**
        *   Read-only lista z timestampami i zmianami statusu (z task_history).
        *   Format: "2025-01-20 14:00 - Status changed to In Progress (Day 1). Używaj czasu local".
    *   **Footer:**
        *   Przycisk "Delete Task" (czerwony, po lewej).
        *   Przycisk "Copy to..." (otwiera dialog wyboru tygodnia/dnia).
        *   Przycisk "Close" (lub "X" w nagłówku).
*   **Zachowanie:** 
    *   Auto-save z debouncingiem (1500ms dla opisu, natychmiast dla statusu/priorytetu/linków).
    *   Optimistic UI - zmiany widoczne od razu, rollback w przypadku błędu API.
    *   Po zamknięciu lub kliknięciu poza obszar - auto-save pending changes.
    *   Na mobile: pełna szerokość ekranu (100%).
*   **Walidacja:**
    *   Tytuł zadania wymagany (min. 1 znak).
    *   Jeśli wybrano milestone, cel długoterminowy musi być wybrany (milestone należy do celu).
    *   Toast z błędem walidacji, blokada zapisu do poprawy.
*   **UX:**
    *   Loading indicator podczas zapisu zmian.
    *   Toast "Task updated" po sukcesie.
    *   Toast z przyciskiem "Retry" w przypadku błędu API.

### 5.3. GoalCard (Karta Celu)
Używana na Dashboardzie i w widoku Celów.
*   **Wygląd:** Tytuł celu, kategoria (ikona/kolor), Slider postępu.
*   **Interakcja:** Slider jest interaktywny tylko w widoku "Goals" i "Review". Na Dashboardzie jest read-only.

### 5.4. WeekStrip (Pasek Dni)
Komponent nawigacyjny w widoku Dnia.
*   **Wygląd:** 7 kafelków reprezentujących dni tygodnia.
*   **Stany:**
    *   *Active:* Podświetlony dzień bieżący w widoku.
    *   *Today:* Obramowany ramką i pogrubiony.
    *   *Has Tasks:* Delikatny wskaźnik, że na ten dzień są zaplanowane zadania (mała ikona checkbox).

### 5.5. WeeklyGoalCard (Karta Celu Tygodniowego)
Komponent używany w widoku Tygodnia do prezentacji celu tygodniowego i jego podzadań.
*   **Wygląd:**
    *   Nagłówek karty: Tytuł celu tygodniowego (inline editable), badge powiązania (klikalne, pokazuje cel długoterminowy i/lub milestone), ikona menu ("...").
    *   Lista podzadań (0-15 zadań typu `weekly_sub`) z komponentami `TaskItem`.
    *   Przycisk "+ Add Task" na dole karty (disabled po osiągnięciu limitu 15 zadań).
*   **Badge Powiązania:**
    *   Jeśli cel tygodniowy ma `long_term_goal_id` i `milestone_id`: wyświetla "🎯 [Nazwa Celu] > 🚩 [Nazwa Milestone]".
    *   Jeśli tylko `long_term_goal_id`: wyświetla "🎯 [Nazwa Celu]".
    *   Jeśli brak powiązań: wyświetla "🔗 Not linked" (placeholder).
    *   Click na badge otwiera `GoalMilestonePicker`.
*   **Menu Kontekstowe (... w nagłówku):**
    *   "Edit title" (inline editing).
    *   "Link to goal" -> otwiera `GoalMilestonePicker`.
    *   "Unlink from goal" (jeśli ma powiązanie).
    *   "Delete weekly goal" (kaskadowe usunięcie z potwierdzeniem; podzadania stają się ad-hoc lub są usuwane - wybór użytkownika w dialogu).
*   **Interakcje:**
    *   Kliknięcie "+ Add Task" tworzy nowe zadanie dziedziczące `long_term_goal_id` i `milestone_id` z celu tygodniowego. Priorytet domyślnie A.
    *   Drag-and-drop podzadań w ramach karty (sortowanie pozycji).
*   **Walidacja:**
    *   Limit 15 podzadań - przycisk "+ Add Task" disabled, tooltip "Maximum 15 tasks per weekly goal".
*   **UX:**
    *   Karta zwijana/rozwijana (collapse/expand) - ikona chevron w nagłówku.
    *   Minimalistyczny design - wyraźne oddzielenie od sekcji Other Tasks.
    *   Skeleton loading dla listy podzadań podczas ładowania.

### 5.6. GoalMilestonePicker (Picker 2-stopniowy)
Komponent do wyboru celu długoterminowego i opcjonalnie kamienia milowego. Używany w widoku Tygodnia i w TaskSheet.
*   **Wygląd:**
    *   Jeśli wyświetlany jako menu kontekstowe: Submenu wielopoziomowe (Shadcn DropdownMenu z nested submenu).
    *   Jeśli wyświetlany jako standalone picker: Dialog z dwoma kolumnami (Goals | Milestones).
*   **Struktura (menu kontekstowe):**
    *   Poziom 1: Lista celów długoterminowych z bieżącego planera + opcja "None" (unlink).
    *   Poziom 2 (po najechaniu/kliknięciu na cel): Lista kamieni milowych dla wybranego celu + opcja "Link to goal only" (bez milestone).
*   **Struktura (dialog):**
    *   Lewa kolumna: Lista celów (selectable, highlightowane po kliknięciu).
    *   Prawa kolumna: Lista milestones dla wybranego celu + opcja "No milestone" (checkbox).
    *   Przyciski "Cancel" i "Apply".
*   **Interakcje:**
    *   Wybór celu -> highlightuje cel, wyświetla milestones w prawej kolumnie.
    *   Wybór milestone -> zaznaczenie.
    *   Kliknięcie "Apply" -> zapisuje `long_term_goal_id` i `milestone_id` (lub null dla milestone, jeśli zaznaczono "No milestone").
    *   Kliknięcie "None" (w menu kontekstowym) lub cancel -> usuwa powiązania.
*   **UX:**
    *   Dla celów bez milestones: prawa kolumna pokazuje "No milestones for this goal" + opcja "Link to goal only" (auto-selected).
    *   Dla planera bez celów: komunikat "No goals defined. Go to Goals view to create one."
*   **Dostępność:**
    *   Keyboard navigation: Tab przełącza między kolumnami, strzałki nawigują po listach, Enter wybiera.
    *   ARIA labels dla opcji.

### 5.7. ErrorBoundary & LoadingStates
*   **Skeletony:** Zamiast spinnerów, widoki ładują szkielety list zadań ("shimmer effect").
*   **Retry Button:** W przypadku błędu API, komponent wyświetla komunikat z przyciskiem "Spróbuj ponownie".
*   **Offline Indicator:** Dyskretny badge, gdy brak połączenia sieciowego.

## 6. Integracja z API

### 6.1. Mapowanie Widoków na Endpointy API

#### Dashboard Planera
*   **GET** `/api/v1/plans/:id/dashboard` - Pobieranie agregowanych danych z hierarchią celów, milestones, weekly goals i tasks.
*   **GET** `/api/v1/plans/active` - Pobieranie aktywnego planera dla przekierowania `/active`.

#### Hierarchia (Tree View)
*   **GET** `/api/v1/plans/:id/goals` - Lista celów długoterminowych.
*   **GET** `/api/v1/goals/:goalId/milestones` - Milestones dla każdego celu.
*   **GET** `/api/v1/goals/:goalId/weekly-goals` - Weekly goals powiązane z celem.
*   **GET** `/api/v1/goals/:goalId/tasks` - Zadania powiązane z celem (bezpośrednio i poprzez milestones).
*   **GET** `/api/v1/milestones/:milestoneId/tasks` - Zadania powiązane z milestone.
*   **GET** `/api/v1/tasks?plan_id=:id&task_type=ad_hoc` - Zadania ad-hoc (bez powiązań).

#### Widok Tygodnia
*   **GET** `/api/v1/weekly-goals?plan_id=:id&week_number=:nr` - Cele tygodniowe dla danego tygodnia.
*   **GET** `/api/v1/weekly-goals/:id` - Szczegóły celu tygodniowego z subtasks.
*   **GET** `/api/v1/tasks?plan_id=:id&week_number=:nr&task_type=ad_hoc` - Zadania ad-hoc dla tygodnia.
*   **POST** `/api/v1/weekly-goals` - Tworzenie nowego celu tygodniowego z opcjonalnymi `long_term_goal_id` i `milestone_id`.
*   **PATCH** `/api/v1/weekly-goals/:id` - Aktualizacja tytułu, powiązań (goal/milestone) celu tygodniowego.
*   **DELETE** `/api/v1/weekly-goals/:id` - Usunięcie celu tygodniowego (kaskadowe do podzadań).
*   **POST** `/api/v1/tasks` - Tworzenie zadania (podzadania celu tygodniowego lub ad-hoc) z polami:
    *   `weekly_goal_id` (dla podzadań)
    *   `long_term_goal_id` (opcjonalnie, dziedziczy z weekly goal lub ustawiane ręcznie)
    *   `milestone_id` (opcjonalnie, dziedziczy z weekly goal lub ustawiane ręcznie)
    *   `priority` (domyślnie A)
    *   `task_type` (weekly_sub lub ad_hoc)
*   **PATCH** `/api/v1/tasks/:id` - Aktualizacja zadania (status, priorytet, powiązania, weekly_goal_id).
*   **DELETE** `/api/v1/tasks/:id` - Usunięcie zadania.

#### Widok Dnia
*   **GET** `/api/v1/tasks/daily?plan_id=:id&week_number=:nr&due_day=:day` - Zadania na konkretny dzień z kategoryzacją (most_important, secondary, additional).
*   **PATCH** `/api/v1/tasks/:id` - Aktualizacja statusu zadania (optimistic UI).
*   **POST** `/api/v1/tasks/:id/copy` - Kopiowanie zadania na inny dzień/tydzień.

#### Edycja Celów
*   **GET** `/api/v1/plans/:planId/goals` - Lista celów planera.
*   **GET** `/api/v1/goals/:id` - Szczegóły celu z milestones.
*   **POST** `/api/v1/goals` - Tworzenie celu.
*   **PATCH** `/api/v1/goals/:id` - Aktualizacja celu (tytuł, opis, progress, kategoria).
*   **DELETE** `/api/v1/goals/:id` - Usunięcie celu (kaskadowe do milestones, ustawia null w weekly_goals/tasks).
*   **POST** `/api/v1/milestones` - Tworzenie kamienia milowego.
*   **PATCH** `/api/v1/milestones/:id` - Aktualizacja milestone (tytuł, data, is_completed).
*   **DELETE** `/api/v1/milestones/:id` - Usunięcie milestone (ustawia null w weekly_goals/tasks).

#### Podsumowanie Tygodnia (Review)
*   **GET** `/api/v1/weekly-reviews/week/:weekNumber?plan_id=:id` - Pobieranie review dla tygodnia.
*   **POST** `/api/v1/weekly-reviews` - Tworzenie nowego review.
*   **PATCH** `/api/v1/weekly-reviews/:id` - Aktualizacja review (auto-save z debouncingiem).
*   **PATCH** `/api/v1/goals/:id` - Aktualizacja progress_percentage celów w ramach review.

### 6.2. Strategie Zarządzania Stanem

#### TanStack Query (React Query)
*   **Query Keys:** Hierarchiczne klucze dla efektywnego cache invalidation:
    *   `['plans', planId]`
    *   `['plans', planId, 'dashboard']`
    *   `['plans', planId, 'goals']`
    *   `['goals', goalId]`
    *   `['goals', goalId, 'milestones']`
    *   `['goals', goalId, 'weekly-goals']`
    *   `['weekly-goals', weeklyGoalId]`
    *   `['weekly-goals', { planId, weekNumber }]`
    *   `['tasks', { planId, weekNumber, dueDay }]`
    *   `['tasks', taskId, 'history']`
*   **Mutacje z Optimistic Updates:**
    *   Zmiana statusu zadania: `useMutation` z `onMutate` (optimistic UI), `onError` (rollback), `onSettled` (invalidate queries).
    *   Aktualizacja powiązań: Invalidation cache dla `['goals', goalId]` i `['tasks']` po zmianie `long_term_goal_id`/`milestone_id`.
    *   Przenoszenie zadań między weekly goals: Invalidation cache dla obu `weekly-goals` queries.
*   **Prefetching:**
    *   Dashboard prefetchuje dane dla bieżącego tygodnia i dnia.
    *   Widok tygodnia prefetchuje dane dla poprzedniego/następnego tygodnia (on hover na przyciskach nawigacji).
*   **Stale Time:** 
    *   Dashboard/Hierarchia: 5 minut (rzadkie zmiany).
    *   Widok tygodnia/dnia: 1 minuta (częste interakcje).
    *   Task history: Infinity (nie zmienia się po utworzeniu entry).

#### Nano Stores
*   **Globalny stan UI:**
    *   `$activePlanId` - ID aktywnego planera (synchronized z session/localStorage).
    *   `$currentWeekNumber` - Bieżący tydzień planera (kalkulowany z start_date i today).
    *   `$showCompletedInHierarchy` - Boolean dla checkbox "Show completed" w hierarchii.
    *   `$selectedGoalId` - ID wybranego celu w `GoalMilestonePicker` (temporary state).
*   **Synchronizacja:** Nano Stores nie zastępuje TanStack Query, tylko uzupełnia o lokalny stan UI, który nie pochodzi z API.

### 6.3. Walidacja i Obsługa Błędów

#### Walidacja po stronie klienta (przed wysłaniem do API)
*   Limity biznesowe:
    *   Maksymalnie 6 celów na planer (wyłączenie przycisku "+ Add Goal").
    *   Maksymalnie 5 milestones na cel (wyłączenie przycisku "+ Add Milestone").
    *   Maksymalnie 3 cele tygodniowe na tydzień (wyłączenie przycisku "+ Add Weekly Goal").
    *   Maksymalnie 15 podzadań na cel tygodniowy (wyłączenie "+ Add Task" w karcie).
    *   Maksymalnie 100 zadań ad-hoc na tydzień (wyłączenie "+ Add Task" w sekcji Other Tasks).
    *   Maksymalnie 10 zadań na dzień (suma wszystkich priorytetów).
*   Wymagane pola:
    *   Tytuł zadania/celu (min. 1 znak).
    *   Plan ID, week_number dla weekly goals i tasks.
*   Relacje:
    *   Milestone musi należeć do wybranego celu (walidacja w `GoalMilestonePicker`).
    *   Start date planera musi być poniedziałkiem (walidacja w kreatorze).

#### Obsługa błędów API
*   **400 Bad Request (Validation Error):** Toast z szczegółami błędu (np. "Maximum 3 weekly goals exceeded"). Rollback optimistic update.
*   **401 Unauthorized:** Przekierowanie na `/login` z komunikatem "Session expired. Please log in again."
*   **404 Not Found:** Toast "Resource not found" + przekierowanie na Dashboard lub listę planerów.
*   **409 Conflict:** Toast "Conflict detected" (np. próba utworzenia drugiego review dla tego samego tygodnia). Odświeżenie danych.
*   **429 Too Many Requests:** Toast "Too many requests. Please wait" + disabled wszystkie przyciski akcji na X sekund (retry_after z response).
*   **500 Internal Server Error:** Toast "An error occurred. Please try again" z przyciskiem "Retry". Możliwość ręcznego odświeżenia.

#### Retry Logic
*   Automatyczne retry dla GET requests (3 próby z exponential backoff: 1s, 2s, 4s).
*   Brak automatycznego retry dla POST/PATCH/DELETE (użytkownik musi ręcznie kliknąć "Retry" w Toast).

### 6.4. Responsywność i Performance

#### Lazy Loading
*   Komponenty heavy (np. `TaskSheet`, `GoalMilestonePicker`) ładowane dynamicznie (React.lazy).
*   Widok hierarchii: lazy loading dla węzłów z dużą liczbą dzieci (render on expand).

#### Debouncing
*   Auto-save w `TaskSheet` (description): 1500ms.
*   Auto-save w Review (textareas): 1500ms.
*   Zmiana statusu/priorytetu: natychmiastowa (optimistic UI + debouncing wysyłki do API: 500ms dla batching multiple status changes).

#### Pagination
*   Hierarchia: Jeśli cel ma >50 zadań, wyświetla "Load more" zamiast renderować wszystkie.
*   Lista planerów: Paginacja po 20 planerów (przycisk "Load more").

#### Mobile Optimizations
*   `TaskSheet`: 100% szerokości ekranu na mobile.
*   `WeekStrip`: Horizontal scroll z snap points.
*   Menu kontekstowe: zamienia się w bottom sheet na mobile (łatwiejsza interakcja).
*   Drag-and-drop: na mobile zamieniony na "long press + visual feedback" z przyciskiem "Done" do potwierdzenia nowej pozycji.

