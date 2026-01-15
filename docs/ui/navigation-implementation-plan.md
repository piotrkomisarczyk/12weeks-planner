# Plan implementacji widoku Nawigacji (Top Bar)

## 1. Przegląd
Celem tego planu jest wdrożenie głównego komponentu nawigacyjnego aplikacji (`TopNavigation`). Jest to element typu "Sticky Top Bar", który składa się z dwóch poziomów:
1.  **Global Top Bar**: Dostępny w całej aplikacji, zawierający logo, ścieżkę nawigacji (Breadcrumbs) oraz menu użytkownika i ustawienia.
2.  **Plan Context Navigation**: Pasek widoczny tylko w kontekście konkretnego planu (`/plans/[id]/...`), zapewniający szybki dostęp do kluczowych widoków planera (Dashboard, Hierarchia, Cele, Tydzień, Dzień, Przeglądy).

## 2. Routing widoku
Komponent nawigacji jest częścią głównego layoutu (`Layout.astro`), więc jest widoczny na wszystkich podstronach.
Jego stan i widoczność paska kontekstowego zależą od aktualnej ścieżki URL:
-   Globalny pasek: Wszystkie ścieżki.
-   Pasek kontekstowy: Ścieżki rozpoczynające się od `/plans/[id]`.

## 3. Struktura komponentów

Pliki powinny zostać utworzone w katalogu `src/components/navigation`.

```text
src/components/navigation/
├── TopNavigation.astro       (Główny kontener, Sticky)
├── GlobalBar.astro           (Górny pasek)
├── PlanContextBar.astro      (Dolny pasek kontekstowy)
├── Breadcrumbs.tsx           (Komponent ścieżki - React/Shadcn)
├── UserMenu.tsx              (Menu użytkownika - React/Shadcn)
├── ThemeToggle.tsx           (Przełącznik motywu - React)
└── NavLink.astro             (Pojedynczy link nawigacyjny z logiką active)
```

## 4. Szczegóły komponentów

### TopNavigation (Astro)
-   **Opis**: Główny kontener `header`, który jest przyklejony do góry ekranu (`sticky top-0 z-50`).
-   **Główne elementy**: Wrapper `header` z tłem (background/blur), wewnątrz którego renderowane są `GlobalBar` i opcjonalnie `PlanContextBar`.
-   **Propsy**:
    -   `plan`: `PlanSummary | null` (obiekt planu przekazany z Layoutu, jeśli dostępny).

### GlobalBar (Astro)
-   **Opis**: Pasek zawierający elementy globalne.
-   **Główne elementy**:
    -   Lewa strona: Logo aplikacji (Link do `/plans`), `Breadcrumbs`.
    -   Prawa strona: `ThemeToggle`, `UserMenu`.
-   **Propsy**:
    -   `plan`: `PlanSummary | null` (do przekazania do Breadcrumbs).

### Breadcrumbs (React)
-   **Opis**: Wyświetla ścieżkę nawigacji w oparciu o URL i przekazany obiekt planu. Używa komponentu `Breadcrumb` z `shadcn/ui`.
-   **Główne elementy**: `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbSeparator`.
-   **Logika**:
    -   Analiza URL.
    -   Mapowanie segmentów URL na nazwy (np. `dashboard` -> "Dashboard", `[id]` -> `plan.title`).
-   **Propsy**:
    -   `planTitle`: `string | undefined`.
    -   `currentPath`: `string` (ścieżka z `Astro.url.pathname`).

### PlanContextBar (Astro)
-   **Opis**: Pasek z linkami do widoków wewnątrz planu. Renderowany tylko, gdy prop `plan` jest obecny.
-   **Główne elementy**: Lista linków (`NavLink`).
-   **Linki**:
    1.  **Dashboard** (`/plans/[id]/dashboard`) - ikona `Home`.
    2.  **Hierarchy** (`/plans/[id]/hierarchy`) - ikona `ListTree`.
    3.  **Goals** (`/plans/[id]/goals`) - ikona `Target`.
    4.  **Weeks** (`/plans/[id]/week/[currentWeek]`) - ikona `Calendar`. Link dynamiczny.
    5.  **Days** (`/plans/[id]/week/[currentWeek]/day/[today]`) - ikona `Sun` lub `CalendarCheck`. Link dynamiczny.
    6.  **Reviews** (`/plans/[id]/review/[currentWeek]`) - ikona `ClipboardList`.
-   **Propsy**:
    -   `plan`: `PlanSummary` (wymagane: id, startDate).

### NavLink (Astro)
-   **Opis**: Komponent linku. Jeśli jest aktywny, zmienia styl (np. inny kolor tekstu, podkreślenie).
-   **Propsy**:
    -   `href`: `string`.
    -   `icon`: `LucideIcon` (nazwa lub komponent).
    -   `label`: `string`.
    -   `isActive`: `boolean`.

### UserMenu (React)
-   **Opis**: Avatar użytkownika z menu rozwijanym.
-   **Główne elementy**: `DropdownMenu` (Shadcn), `Avatar` (Shadcn).
-   **Opcje menu**:
    -   Settings (Link/Modal - placeholder).
    -   Export data (Link/Action).
    -   Logout (Action).
-   **Interakcje**: Kliknięcie otwiera menu. Kliknięcie opcji wywołuje akcję.

## 5. Typy

Wymagane definicje typów (np. w `src/types.ts` lub lokalnie w komponencie):

```typescript
// Reprezentacja planu potrzebna do nawigacji
export interface PlanSummary {
  id: string;
  title: string;
  startDate: string; // ISO Date string
  endDate: string;   // ISO Date string
}

// Props dla komponentów nawigacyjnych
export interface NavigationProps {
  plan?: PlanSummary | null;
}
```

## 6. Zarządzanie stanem

-   **Stan aktywności linków**: Zarządzany przez Astro po stronie serwera (SSG/SSR) poprzez porównanie `Astro.url.pathname` z `href` linku.
-   **Stan menu i interakcji**: Komponenty React (`UserMenu`, `ThemeToggle`) zarządzają własnym stanem lokalnym.
-   **Obliczenia dat**: Logika obliczania "obecnego tygodnia" i "dnia" powinna być zaimplementowana w funkcji pomocniczej `src/lib/plan-utils.ts` i wykonywana w momencie renderowania `PlanContextBar`.

## 7. Integracja API

Komponent nawigacji **nie pobiera danych bezpośrednio**. Polega na danych przekazanych z góry (`Layout.astro`).
-   **Layout**: Powinien pobierać podstawowe dane planu (jeśli jesteśmy w kontekście planu) np. przy użyciu `planService.getPlanById` (lub lżejszej wersji `getPlanSummary`) i przekazywać je do `TopNavigation`.

**Logout**:
-   `UserMenu` będzie wywoływać funkcję `supabase.auth.signOut()` i przekierowywać na stronę logowania/home.

## 8. Interakcje użytkownika

1.  **Kliknięcie linku kontekstowego**: Przejście do widoku. Jeśli link jest dynamiczny (np. Weeks), system oblicza, który to jest tydzień na podstawie dzisiejszej daty.
2.  **Breadcrumbs**: Kliknięcie segmentu ścieżki cofa użytkownika do wyższego poziomu (np. z Task do Goal, z Goal do Plan Dashboard).
3.  **User Menu**:
    -   Kliknięcie avatara -> Otwarcie dropdownu.
    -   Kliknięcie "Logout" -> Wylogowanie i przekierowanie.

## 9. Warunki i walidacja

-   **Widoczność PlanContextBar**: Wyświetlany TYLKO, gdy `planId` jest obecne w URL i udało się pobrać dane planu.
-   **Obliczanie Tygodnia/Dnia**:
    -   Jeśli dzisiejsza data jest PRZED `startDate` planu -> Linki prowadzą do Tygodnia 1 / Dnia 1.
    -   Jeśli dzisiejsza data jest PO `endDate` planu -> Linki prowadzą do ostatniego Tygodnia / Dnia.
    -   Weryfikacja poprawności `plan.startDate` (musi być valid ISO string).

## 10. Obsługa błędów

-   **Brak danych planu**: Jeśli jesteśmy w URL `/plans/[id]`, ale `plan` jest `null` (błąd pobierania w Layout), `PlanContextBar` nie powinien się renderować lub powinien wyświetlić stan ładowania (szkielet). Breadcrumbs powinny obsłużyć brak tytułu planu (wyświetlić np. "Plan ...").
-   **Błędy w UserMenu**: Niepowodzenie wylogowania powinno wyświetlić toast z błędem (używając `sonner`).

## 11. Kroki implementacji

1.  **Przygotowanie utils**: Dodać funkcje `getCurrentWeekIndex(startDate, now)` i `getDayIndex(startDate, now)` do `src/lib/plan-utils.ts`.
2.  **UserMenu i ThemeToggle**: Stworzyć komponenty React w `src/components/navigation` wykorzystując komponenty UI Shadcn.
3.  **Breadcrumbs**: Zaimplementować komponent `Breadcrumbs.tsx` z logiką parsowania ścieżki.
4.  **NavLink i GlobalBar**: Stworzyć podstawowe komponenty Astro.
5.  **PlanContextBar**: Zaimplementować logikę renderowania listy linków i obliczania dynamicznych hrefów.
6.  **TopNavigation**: Złożyć wszystko w całość.
7.  **Integracja z Layout**: Zaktualizować `src/layouts/Layout.astro`, aby pobierał dane planu (jeśli `id` jest w params) i przekazywał je do nawigacji.
8.  **Dostosowanie styli**: Upewnić się, że `sticky` działa poprawnie i `z-index` jest odpowiednio wysoki.
