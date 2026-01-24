# Diagram Architektury UI - Autentykacja

Poniższy diagram przedstawia architekturę interfejsu użytkownika dla modułu autentykacji, uwzględniając podział na renderowanie po stronie serwera (Astro SSR) oraz komponenty klienckie (React).

<mermaid_diagram>
```mermaid
flowchart LR
    %% Definicje stylów
    classDef page fill:#f9f,stroke:#333,stroke-width:2px;
    classDef component fill:#9cf,stroke:#333,stroke-width:2px;
    classDef layout fill:#fa0,stroke:#333,stroke-width:2px;
    classDef logic fill:#ada,stroke:#333,stroke-width:2px;
    classDef external fill:#ddd,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5;

    subgraph "Astro Server-Side (SSR)"
        Middleware["Middleware\n(Ochrona Tras)"]:::logic
        
        subgraph Layouts
            MainLayout["Layout Główny\n(Layout.astro)"]:::layout
            AuthLayout["Layout Autentykacji\n(AuthLayout.astro)"]:::layout
        end

        subgraph "Strony (Pages)"
            HomePage["Strona Główna\n(/index.astro)"]:::page
            Dashboard["Dashboard\n(/plans/[id])"]:::page
            
            subgraph "Strony Autentykacji"
                LoginPage["Logowanie\n(/login)"]:::page
                RegisterPage["Rejestracja\n(/register)"]:::page
                ForgotPassPage["Reset Hasła\n(/forgot-password)"]:::page
                UpdatePassPage["Zmiana Hasła\n(/update-password)"]:::page
            end
        end
        
        API["API Callback\n(/auth/callback)"]:::logic
    end

    subgraph "React Client-Side"
        subgraph "Komponenty Autentykacji (src/components/auth)"
            LoginForm["Formularz Logowania\n(LoginForm.tsx)"]:::component
            RegisterForm["Formularz Rejestracji\n(RegisterForm.tsx)"]:::component
            ForgotPassForm["Formularz Resetu\n(ForgotPasswordForm.tsx)"]:::component
            UpdatePassForm["Formularz Zmiany\n(UpdatePasswordForm.tsx)"]:::component
        end

        subgraph "Komponenty Nawigacji"
            UserMenu["Menu Użytkownika\n(UserMenu.tsx)"]:::component
            LogoutAction[[Akcja Wylogowania]]:::logic
        end
        
        SupabaseClient["Klient Supabase\n(Browser Client)"]:::logic
    end

    subgraph "Backend / Baza Danych"
        SupabaseAuth[(Supabase Auth)]:::external
    end

    %% Połączenia - Przepływ Sterowania
    Middleware -->|Brak Sesji| LoginPage
    Middleware -->|Sesja Aktywna| Dashboard
    Middleware -->|Weryfikacja| HomePage

    %% Połączenia - Struktura UI
    AuthLayout --> LoginPage
    AuthLayout --> RegisterPage
    AuthLayout --> ForgotPassPage
    AuthLayout --> UpdatePassPage
    
    MainLayout --> HomePage
    MainLayout --> Dashboard
    
    %% Połączenia - Hydratacja Komponentów
    LoginPage --> LoginForm
    RegisterPage --> RegisterForm
    ForgotPassPage --> ForgotPassForm
    UpdatePassPage --> UpdatePassForm
    MainLayout -.-> UserMenu

    %% Połączenia - Akcje i Dane
    LoginForm -->|signInWithPassword| SupabaseClient
    RegisterForm -->|signUp| SupabaseClient
    ForgotPassForm -->|resetPasswordForEmail| SupabaseClient
    UpdatePassForm -->|updateUser| SupabaseClient
    
    UserMenu --> LogoutAction
    LogoutAction -->|signOut| SupabaseClient

    %% Połączenia Zewnętrzne
    SupabaseClient <==> SupabaseAuth
    API <==> SupabaseAuth
```
</mermaid_diagram>
