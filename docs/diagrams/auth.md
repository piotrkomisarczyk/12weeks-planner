# Diagram Autentykacji

<authentication_analysis>

1. **Przepływy autentykacji (wg docs/auth-spec.md):**
   - **Rejestracja (US-001):** Użytkownik podaje dane -> Supabase Auth (signUp) -> Email weryfikacyjny -> Link callback -> Utworzenie sesji.
   - **Logowanie (US-002):** Użytkownik podaje dane -> Supabase Auth (signInWithPassword) -> Ustawienie ciasteczek sesyjnych (via @supabase/ssr) -> Przekierowanie na Dashboard (jeśli ma planery) lub listę planerów.
   - **Ochrona Tras (Middleware):** Weryfikacja sesji przy każdym żądaniu do chronionych tras (/plans, /dashboard). Przekierowanie do /login przy braku sesji.
   - **Odświeżanie Tokenu:** Automatyczna obsługa przez bibliotekę Supabase (refresh token). Middleware weryfikuje ważność i odświeża w razie potrzeby.
   - **Wylogowanie (US-011):** Wywołanie signOut -> Wyczyszczenie ciasteczek -> Przekierowanie do /login.

2. **Główni Aktorzy:**
   - **Przeglądarka (Browser):** Klient, formularze logowania/rejestracji (React Components).
   - **Middleware (Astro):** `src/middleware/index.ts` - "Strażnik", weryfikuje ciasteczka i sesję.
   - **Astro Server:** Renderowanie stron (SSR), API Routes.
   - **Supabase Client:** Helpery `client.ts` (browser) i `server.ts` (server).
   - **Supabase Auth:** Zewnętrzna usługa (Baza Danych/Auth Service).

3. **Weryfikacja i Odświeżanie:**
   - Tokeny przechowywane są w ciasteczkach (`sb-access-token`, `sb-refresh-token`).
   - Middleware używa `createServerClient` do odczytu ciasteczek i weryfikacji użytkownika (`getUser()`).
   - Jeśli token wygasł, Supabase Client wewnątrz middleware próbuje go odświeżyć używając refresh tokena i aktualizuje ciasteczka w odpowiedzi (Response).

4. **Opis kroków (skrócony):**
   - Żądanie strony -> Middleware sprawdza sesję.
   - Logowanie -> Strzał do Supabase -> Zwrot sesji -> Zapis ciasteczek -> Przeładowanie.
     </authentication_analysis>

<mermaid_diagram>

```mermaid
sequenceDiagram
    autonumber

    participant Browser as Przeglądarka<br/>(Client)
    participant Middleware as Middleware<br/>(src/middleware/index.ts)
    participant Server as Astro Server<br/>(SSR Pages & API)
    participant SB_Client as Supabase Client<br/>(@supabase/ssr)
    participant SB_Auth as Supabase Auth<br/>(External Service)

    Note over Browser, SB_Auth: Scenariusz 1: Dostęp do trasy chronionej (np. /dashboard)

    Browser->>Middleware: GET /dashboard
    activate Middleware

    Middleware->>SB_Client: Utwórz klienta serwerowego
    SB_Client->>Middleware: Instancja z kontekstem ciasteczek

    Middleware->>SB_Client: auth.getUser()
    activate SB_Client
    SB_Client-->>Middleware: Wynik weryfikacji (User lub Error)
    deactivate SB_Client

    alt Brak sesji lub błąd
        Middleware-->>Browser: Redirect (302) do /login
    else Sesja ważna
        Middleware->>Server: Przekaż żądanie (next)
        activate Server
        Server->>Browser: Renderuj Dashboard (HTML)
        deactivate Server
    end
    deactivate Middleware

    Note over Browser, SB_Auth: Scenariusz 2: Proces Logowania (US-002)

    Browser->>Browser: Wypełnienie formularza (Login Page)
    Browser->>SB_Auth: signInWithPassword(email, pass)
    activate SB_Auth

    alt Dane niepoprawne
        SB_Auth-->>Browser: Error (400/401)
        Browser->>Browser: Wyświetl błąd (Toast)
    else Dane poprawne
        SB_Auth-->>Browser: Session (Access & Refresh Token)
    end
    deactivate SB_Auth

    Note right of Browser: Biblioteka @supabase/ssr po stronie klienta<br/>automatycznie synchronizuje ciasteczka<br/>lub następuje przeładowanie.

    Browser->>Middleware: GET / (lub callback po loginie)
    activate Middleware
    Middleware->>SB_Client: auth.getUser() (weryfikacja nowych ciasteczek)

    alt Użytkownik zweryfikowany
        Middleware->>Server: Sprawdź stan użytkownika (czy ma planery?)
        activate Server
        Server->>Browser: Przekieruj na odpowiedni widok (Dashboard/Lista)
        deactivate Server
    end
    deactivate Middleware

    Note over Browser, SB_Auth: Scenariusz 3: Odświeżanie Tokenu (W tle)

    Browser->>Middleware: Request (z wygasającym Access Token)
    activate Middleware
    Middleware->>SB_Client: getUser() -> Token Expired?
    activate SB_Client
    SB_Client->>SB_Auth: Wymiana Refresh Token na nowy Access Token
    SB_Auth-->>SB_Client: Nowe Tokeny
    SB_Client-->>Middleware: Zaktualizowana Sesja
    deactivate SB_Client

    Middleware->>Browser: Response + Set-Cookie (Nowe Tokeny)
    deactivate Middleware

    Note over Browser, SB_Auth: Scenariusz 4: Wylogowanie (US-011)

    Browser->>SB_Auth: signOut()
    activate SB_Auth
    SB_Auth-->>Browser: Success
    deactivate SB_Auth
    Browser->>Browser: Wyczyść lokalny stan
    Browser->>Middleware: Refresh / Redirect
    activate Middleware
    Middleware-->>Browser: Redirect do /login (brak sesji)
    deactivate Middleware
```

</mermaid_diagram>
