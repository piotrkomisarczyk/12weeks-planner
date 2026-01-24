# Specyfikacja Techniczna Modułu Autentykacji

## 1. Architektura Interfejsu Użytkownika (Frontend)

Moduł autentykacji wprowadza dedykowane widoki i komponenty, które są oddzielone od głównej części aplikacji (Dashboardu).

### 1.1. Struktura Stron (Astro Pages)
W katalogu `src/pages` zostaną dodane/zmodyfikowane następujące ścieżki:

| Ścieżka | Typ | Dostęp | Opis |
|---------|-----|--------|------|
| `/login` | Astro (SSR) | Public | Strona logowania. Jeśli użytkownik jest zalogowany -> przekierowanie do `/`. |
| `/register` | Astro (SSR) | Public | Strona rejestracji. Jeśli zalogowany -> przekierowanie do `/`. |
| `/forgot-password` | Astro (SSR) | Public | Formularz proszący o email do resetu hasła. |
| `/update-password` | Astro (SSR) | Public/Protected | Formularz zmiany hasła. Dostępny z linku resetującego (token w URL) lub dla zalogowanego użytkownika (zmiana hasła). |
| `/auth/callback` | API Route | Public | Endpoint do obsługi przekierowań OAuth/Magic Link i wymiany kodu na sesję (PKCE). |

### 1.2. Komponenty React (`src/components/auth`)
Nowe komponenty wykorzystujące `react-hook-form` oraz `zod` do walidacji, stylowane za pomocą Shadcn UI:

1.  **`LoginForm`**:
    *   Pola: Email, Hasło.
    *   Akcje: Logowanie (`supabase.auth.signInWithPassword`), link do "Forgot Password", link do "Register".
    *   Walidacja: Poprawność formatu email, wymagalność pól.
2.  **`RegisterForm`**:
    *   Pola: Email, Hasło (min. 8 znaków), Potwierdź hasło.
    *   Akcje: Rejestracja (`supabase.auth.signUp`), przekierowanie na ekran sukcesu (prośba o weryfikację email).
    *   Walidacja: Zgodność haseł, siła hasła.
3.  **`ForgotPasswordForm`**:
    *   Pola: Email.
    *   Akcje: Wysłanie linku (`supabase.auth.resetPasswordForEmail`).
4.  **`UpdatePasswordForm`**:
    *   Pola: Nowe hasło, Potwierdź nowe hasło.
    *   Akcje: Aktualizacja (`supabase.auth.updateUser`).

### 1.3. Layouty
*   **`AuthLayout.astro`**: Nowy layout dla stron autentykacji. Minimalistyczny, wycentrowany kontener na formularze, brak głównej nawigacji (sidebar/topbar), jedynie logo i powrót do strony głównej.
*   **`Layout.astro`** (Główny): Zostanie zaktualizowany o warunkowe wyświetlanie elementów nawigacji (np. `UserMenu`) tylko dla zalogowanych użytkowników.

### 1.4. Integracja z UX
*   **UserMenu**: Rozszerzenie istniejącego komponentu o obsługę wylogowania, która wywoła funkcję `supabase.auth.signOut()` i przekieruje na stronę logowania, oraz opcję zmiany hasła.
*   **Obsługa Błędów**: Wykorzystanie komponentu `Sonner` (Toast) do wyświetlania błędów autentykacji (np. "Nieprawidłowe dane logowania", "Użytkownik już istnieje").

---

## 2. Logika Backendowa (Astro SSR + Supabase)

Z uwagi na konfigurację `output: "server"` w `astro.config.mjs`, aplikacja będzie wykorzystywać pełny Server-Side Rendering (SSR). Wymaga to migracji sposobu inicjalizacji klienta Supabase.

### 2.1. Refaktoryzacja Klienta Supabase
Obecny singelton w `src/db/supabase.client.ts` jest niewystarczający dla SSR (ryzyko wycieku danych między sesjami). Należy wdrożyć bibliotekę `@supabase/ssr`:

1.  **Browser Client (`src/lib/supabase/client.ts`)**:
    *   Singleton tworzony przez `createBrowserClient`.
    *   Używany w komponentach React (Client Components) do interakcji (login, register).
2.  **Server Client (`src/lib/supabase/server.ts`)**:
    *   Funkcja tworząca klienta per request za pomocą `createServerClient`.
    *   Wykorzystuje `context.cookies` z Astro do odczytu i zapisu tokenów sesji.

### 2.2. Middleware (`src/middleware/index.ts`)
Middleware będzie pełnić rolę "Strażnika" (Auth Guard).

*   **Zadania Middleware**:
    1.  Tworzenie instancji klienta Supabase (Server Client) i przypisanie jej do `context.locals.supabase`.
    2.  Pobranie sesji użytkownika (`supabase.auth.getUser()`). Przypisanie użytkownika do `context.locals.user`.
    3.  **Ochrona tras**:
        *   Jeśli ścieżka zaczyna się od `/plans`, `/dashboard`, `/settings` i brak sesji -> Przekierowanie (`302`) do `/login`.
    4.  **Ochrona tras gościa**:
        *   Jeśli ścieżka to `/login` lub `/register` i istnieje sesja -> Przekierowanie (`302`) do `/`.

---

## 3. System Autentykacji (Przepływy)

### 3.1. Rejestracja (US-001)
1.  Użytkownik wypełnia formularz na `/register`.
2.  Frontend wywołuje `supabase.auth.signUp()`.
3.  Supabase wysyła email weryfikacyjny (konfiguracja projektu Supabase).
4.  Użytkownik klika link w emailu -> trafia na `/auth/callback` -> sesja jest ustanawiana -> przekierowanie do Dashboardu.

### 3.2. Logowanie (US-002)
1.  Użytkownik wypełnia formularz na `/login`.
2.  Frontend wywołuje `supabase.auth.signInWithPassword()`.
3.  Biblioteka Supabase automatycznie ustawia ciasteczka sesyjne.
4.  Frontend przekierowuje na stronę główną (`/`) lub dedykowany endpoint dashboardu.
5.  **Logika przekierowania (zgodnie z US-002):** Aplikacja (strona główna lub middleware) sprawdza, czy użytkownik posiada aktywny planer.
    *   Jeśli **tak**: Użytkownik trafia na Dashboard aktywnego planera.
    *   Jeśli **nie**: Użytkownik trafia na widok listy planerów (lub kreatora nowego planera).

### 3.3. Odzyskiwanie Hasła (US-003)
1.  Użytkownik podaje email na `/forgot-password`.
2.  Frontend wywołuje `supabase.auth.resetPasswordForEmail()` z `redirectTo: '/update-password'`.
3.  Użytkownik otrzymuje email z linkiem.
4.  Kliknięcie przenosi na `/auth/callback` (loguje użytkownika tymczasowo) i przekierowuje na `/update-password`.
5.  Użytkownik ustawia nowe hasło (`supabase.auth.updateUser`).

### 3.4. Wylogowanie i Bezpieczeństwo (US-011)
1.  Kliknięcie "Logout" w `UserMenu`.
2.  Wywołanie `supabase.auth.signOut()`.
3.  Usunięcie ciasteczek po stronie klienta i serwera.
4.  Przekierowanie na `/login`.
5.  **Auto-logout**: Tokeny Supabase mają czas życia (domyślnie 1h dla access token). Mechanizm refresh token (obsługiwany przez `@supabase/ssr`) odnawia sesję, dopóki użytkownik jest aktywny. Przy braku aktywności i wygaśnięciu refresh tokena, middleware przekieruje do logowania.

### 3.5. Zmiana Hasła - Zalogowany Użytkownik (US-003)
1.  Zalogowany użytkownik wybiera opcję zmiany hasła z `UserMenu`.
2.  Przekierowanie na `/update-password` (lub dedykowany widok w ustawieniach).
3.  Użytkownik wprowadza nowe hasło i potwierdzenie.
4.  Frontend wywołuje `supabase.auth.updateUser({ password: newPassword })`.
5.  Po sukcesie wyświetlany jest komunikat (Toast) o zmianie hasła; użytkownik pozostaje zalogowany.

---

## 4. Baza Danych i RLS

Analiza pliku `docs/db-plan.md` oraz migracji wskazuje, że RLS został wdrożony, ale następnie wyłączony (`disable_all_policies.sql`). Należy przywrócić bezpieczeństwo na poziomie bazy danych.

### 4.1. Tabele Użytkowników
Aplikacja korzysta bezpośrednio z tabeli `auth.users` w relacjach kluczy obcych (np. `plans.user_id`).
*   **Nie jest wymagana** osobna tabela `public.users` dla MVP.
*   **Flagi i metryki**: Tabela `user_metrics` (relacja 1:1 z `auth.users`) przechowuje dodatkowe dane użytkownika, takie jak flagi (np. `first_planner_completed` wymagane przez US-001/Metryki).

### 4.2. Wdrożenie RLS (Row Level Security)
Należy utworzyć nową migrację SQL, która:
1.  Włączy RLS na wszystkich tabelach (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
2.  Zaaplikuje polityki zdefiniowane w `docs/db-plan.md` (sekcja 4), które opierają się na funkcji `auth.uid()`.

**Przykład kluczowej polityki (Dla Planów):**
```sql
CREATE POLICY "Users can view own plans" 
ON plans FOR SELECT 
USING (auth.uid() = user_id);
```

### 4.3. Migracje
Należy sprawdzić, czy triggery do `user_metrics` (opisane w planie DB) są wdrożone. Jeśli nie, należy je dodać, aby przy rejestracji/tworzeniu planera metryki się inicjalizowały.

## 5. Plan Wdrożenia (Kroki)

1.  **Setup Bibliotek**: Instalacja `@supabase/ssr`, konfiguracja zmiennych środowiskowych.
2.  **Helpers & Middleware**: Implementacja `client.ts`, `server.ts` i aktualizacja `middleware/index.ts`.
3.  **UI Auth**: Stworzenie layoutu i stron `/login`, `/register`, `/forgot-password`, `/update-password`.
4.  **Komponenty Formularzy**: Implementacja formularzy w React (`LoginForm`, `RegisterForm`, etc.).
5.  **Database**: Utworzenie migracji "Re-enable RLS" oraz weryfikacja triggerów `user_metrics`.
6.  **Integration**: Podpięcie formularzy React pod logikę Supabase.
7.  **User Menu**: Aktualizacja logiki wylogowania i dodanie opcji zmiany hasła.
