# Architektura UI dla 12 Weeks Planner

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika "12 Weeks Planner" została zaprojektowana zgodnie z podejściem **Desktop First**, kładąc nacisk na czytelność, szybką nawigację i minimalizację kliknięć potrzebnych do wykonania kluczowych akcji (planowanie, oznaczanie zadań).

System opiera się na **Astro 5** (Server-Side Rendering) dla szybkiego ładowania szkieletu aplikacji i SEO, oraz **React 19** w architekturze "Islands" dla interaktywnych elementów (zarządzanie zadaniami, formularze). Stan aplikacji jest zarządzany hybrydowo: stan serwera przez **TanStack Query** (z optymistycznymi aktualizacjami), a stan lokalny UI przez **Nano Stores**. Stylizacja wykorzystuje **Tailwind CSS v4** oraz bibliotekę komponentów **Shadcn/ui**.

### Główne założenia:
*   **Separacja kontekstów:** Wyraźny podział na widoki publiczne, listę planerów i kontekst aktywnego planera.
*   **Hierarchia informacji:** Od ogółu (Dashboard/Cele) do szczegółu (Tydzień/Dzień).
*   **Feedback natychmiastowy:** Optymistyczne UI dla statusów zadań i pasków postępu.
*   **Bezpieczeństwo danych:** Auto-save dla formularzy tekstowych (refleksje).

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
*   **Kluczowe informacje:** Krok 1: Nazwa i Data Startu (wymuszony poniedziałek). Krok 2: Definicja Celów (1-5).
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
*   **Cel:** Wizualizacja struktury celów i zadań.
*   **Kluczowe informacje:** Drzewo: Cel -> Kamienie Milowe -> Zadania. Sekcja oddzielna dla "Ad-hoc".
*   **Komponenty:** `HierarchyTree` (expand/collapse), `TaskStatusIcon`.
*   **UX:** Domyślnie zwinięte elementy zakończone.

#### 2.3.3. Edycja Celów
*   **Ścieżka:** `/plans/[id]/goals`
*   **Cel:** Zarządzanie celami długoterminowymi i ich kamieniami milowymi.
*   **Kluczowe informacje:** Szczegółowa lista celów, edycja treści, dodawanie kamieni milowych.
*   **Komponenty:** `GoalEditor` (formularz), `MilestoneList` (z datami), `ProgressSlider`, `Confetti` (przy ustawieniu progresu celu na 100 %).
*   **UX:** Limit 5 celów. Walidacja dat kamieni milowych (muszą mieścić się w 12 tygodniach).

#### 2.3.4. Widok Tygodnia
*   **Ścieżka:** `/plans/[id]/week/[nr]`
*   **Cel:** Planowanie taktyczne na dany tydzień.
*   **Kluczowe informacje:** Numer tygodnia, data startu-końca. Trzy sekcje: Main Goal Focus, Weekly Subtasks, Other/Ad-hoc.
*   **Komponenty:** `WeekNavigator` (poprzedni/następny), `WeeklyTaskColumn`, `AddTaskButton`, `PriorityBadge`.
*   **UX:** Drag-and-drop do ustalania kolejności. Menu kontekstowe do przypisywania zadań do konkretnych dni.

#### 2.3.5. Widok Dnia
*   **Ścieżka:** `/plans/[id]/week/[nr]/day/[date]`
*   **Cel:** Egzekucja - lista "To-Do" na dziś oraz możliwość dodawania, przesuwania i kopiowania zadań na inne dni.
*   **Kluczowe informacje:** Data, dzień tygodnia. Sekcje: Most Important (1), Secondary (2), Additional (7).
*   **Komponenty:** `DayNavigator` (Week Strip), `DailyTaskSlot`, `TaskItem` (pełna interakcja), `Confetti` (przy ukończeniu wszystkich), `AddTaskButton`.
*   **UX:** Wyraźne wizualne rozróżnienie sekcji priorytetów. Zadanie "Most Important" wyróżnione (np. złota ramka/tło). Drag-and-drop do ustalania kolejności zadań w widoku dnia. Możliwość przesuwania zadań pomiędzy sekcjami priorytetów o ile dostępne są limity.

#### 2.3.6. Podsumowanie Tygodnia (Review)
*   **Ścieżka:** `/plans/[id]/review/[nr]`
*   **Cel:** Refleksja i aktualizacja postępów.
*   **Kluczowe informacje:** 3 pytania (Co wyszło? Co nie? Co poprawić?), Lista celów do aktualizacji postępu.
*   **Komponenty:** `ReflectionForm` (Auto-save textareas), `GoalsProgressUpdater` (Sliders).
*   **UX:** Sugerowane w niedzielę. Możliwość edycji wstecznej.

## 3. Mapa podróży użytkownika

### Scenariusz Główny: Codzienna praca z planerem
1.  **Start:** Użytkownik wchodzi na stronę główną. Jeśli sesja aktywna -> Redirect na `/active`.
2.  **Dashboard:** Użytkownik widzi status celów. Klika w "Today" (Quick Link).
3.  **Widok Dnia:** Użytkownik widzi zadania na dziś.
    *   *Interakcja:* Klika w checkbox przy zadaniu "Przygotować raport" -> Status zmienia się na "In Progress".
    *   *Interakcja:* Po skończeniu pracy klika ponownie -> Status "Completed".
    *   *Interakcja:* Dodaje nagłe zadanie do sekcji "Additional".
4.  **Koniec:** Użytkownik zamyka aplikację. Stan zapisany.

### Scenariusz Poboczny: Planowanie Tygodnia
1.  **Nawigacja:** Użytkownik klika w pasku nawigacji "Weeks" -> Wybiera bieżący tydzień.
2.  **Widok Tygodnia:** Analizuje cele. Dodaje zadania wynikające z kamieni milowych.
3.  **Priorytetyzacja:** Przypisuje priorytety (A/B/C) zadaniom.
4.  **Scheduling:** Klika prawym przyciskiem na zadanie -> "Schedule for Tuesday".

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
Fundamentalny element UI.
*   **Wygląd:** Wiersz z ikoną statusu po lewej, tytułem i badge'm priorytetu.
*   **Status Icon:** Customowy element SVG. Pusty kwadrat (Todo), Częściowo wypełniony/Gradient (In Progress), Ptaszek (Completed), Przekreślony X (Cancelled), Strzałka w prawo(Postponed).
*   **Interakcje:**
    *   *Click:* Cykl Todo -> In Progress -> Completed.
    *   *Click* na "chevrons" otwiera dropdown z dostępem do wszystkich statusów zadania
    *   *Right Click / Long Press:* Menu kontekstowe (wszystkie statusy, edycja, usuwanie, kopiowanie).
    *   *Double Click:* Otwiera `TaskSheet` (edycja szczegółów).

### 5.2. TaskSheet (Arkusz Edycji)
Wysuwany panel boczny (Shadcn Sheet) nakładający się na widok.
*   **Zawartość:** Pełna edycja tytułu, opisu, zmiany dnia/tygodnia, podgląd historii zmian (Activity Log).
*   **Zachowanie:** Auto-save po zamknięciu lub kliknięciu poza obszar.

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

### 5.5. ErrorBoundary & LoadingStates
*   **Skeletony:** Zamiast spinnerów, widoki ładują szkielety list zadań ("shimmer effect").
*   **Retry Button:** W przypadku błędu API, komponent wyświetla komunikat z przyciskiem "Spróbuj ponownie".
*   **Offline Indicator:** Dyskretny badge, gdy brak połączenia sieciowego.

