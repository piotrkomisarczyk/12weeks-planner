# Login Flow - Diagram Przepływu

## Pełny Przepływ Logowania

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant LoginForm
    participant API as /api/auth/login
    participant Middleware
    participant Supabase
    participant IndexPage as /index.astro
    participant DB as Database

    User->>Browser: Navigate to /login
    Browser->>Middleware: GET /login
    Middleware->>Supabase: auth.getUser()
    Supabase-->>Middleware: No session
    Middleware->>LoginForm: Render page
    LoginForm-->>Browser: Display form
    
    User->>LoginForm: Enter email & password
    User->>LoginForm: Click "Sign in"
    LoginForm->>LoginForm: Validate form (client-side)
    
    alt Validation fails
        LoginForm-->>Browser: Show error under field
    else Validation passes
        LoginForm->>API: POST /api/auth/login<br/>{email, password}
        API->>API: Validate with Zod
        
        alt Zod validation fails
            API-->>LoginForm: 400 + validation errors
            LoginForm-->>Browser: Show field errors
        else Zod validation passes
            API->>Supabase: signInWithPassword(email, password)
            
            alt Invalid credentials
                Supabase-->>API: Error
                API-->>LoginForm: 401 + generic error
                LoginForm-->>Browser: Toast "Invalid email or password"
            else Valid credentials
                Supabase->>Supabase: Set auth cookies
                Supabase-->>API: Success + user data
                API-->>LoginForm: 200 + user
                LoginForm-->>Browser: Toast "Login successful"
                LoginForm->>Browser: window.location.href = '/'
                
                Browser->>Middleware: GET /
                Middleware->>Supabase: auth.getUser() (reads cookies)
                Supabase-->>Middleware: User session
                Middleware->>Middleware: Set locals.user
                Middleware->>IndexPage: Continue
                
                IndexPage->>DB: Check active planner<br/>WHERE user_id = ? AND status = 'active'
                
                alt Has active planner
                    DB-->>IndexPage: Planner found
                    IndexPage->>Browser: Redirect to /plans/{id}
                    Browser-->>User: Dashboard view
                else No active planner
                    DB-->>IndexPage: No planner
                    IndexPage->>Browser: Redirect to /plans
                    Browser-->>User: Planners list view
                end
            end
        end
    end
```

## Middleware Flow (Każdy Request)

```mermaid
flowchart TD
    Start([Request]) --> CreateClient[Create Supabase Server Client]
    CreateClient --> AttachClient[Attach to locals.supabase]
    AttachClient --> GetUser[auth.getUser from cookies]
    GetUser --> HasUser{User exists?}
    
    HasUser -->|Yes| AttachUser[Set locals.user]
    HasUser -->|No| SetNull[Set locals.user = null]
    
    AttachUser --> CheckPath{Check path}
    SetNull --> CheckPath
    
    CheckPath -->|Public path<br/>/login, /register| IsLoggedIn{User logged in?}
    CheckPath -->|Protected path<br/>/plans, /dashboard| RequiresAuth{User logged in?}
    
    IsLoggedIn -->|Yes| RedirectHome[Redirect to /]
    IsLoggedIn -->|No| Continue[Continue to page]
    
    RequiresAuth -->|Yes| Continue
    RequiresAuth -->|No| RedirectLogin[Redirect to /login]
    
    RedirectHome --> End([Response])
    RedirectLogin --> End
    Continue --> End
```

## Smart Redirect Logic (index.astro)

```mermaid
flowchart TD
    Start([GET /]) --> CheckAuth{User<br/>authenticated?}
    
    CheckAuth -->|No| Login[Redirect to /login]
    CheckAuth -->|Yes| QueryDB[Query database:<br/>SELECT id FROM plans<br/>WHERE user_id = ?<br/>AND status = 'active']
    
    QueryDB --> HasActive{Active<br/>planner exists?}
    
    HasActive -->|Yes| Dashboard[Redirect to<br/>/plans/:id<br/>Dashboard view]
    HasActive -->|No| PlannersList[Redirect to<br/>/plans<br/>List view]
    
    Login --> End([Response])
    Dashboard --> End
    PlannersList --> End
```

## Error Handling Flow

```mermaid
flowchart TD
    Start([Form Submit]) --> ClientValidation{Client-side<br/>validation}
    
    ClientValidation -->|Fail| ShowFieldError[Show error<br/>under field]
    ClientValidation -->|Pass| SendAPI[POST /api/auth/login]
    
    SendAPI --> ServerValidation{Zod<br/>validation}
    
    ServerValidation -->|Fail| Return400[Return 400<br/>+ field details]
    ServerValidation -->|Pass| CallSupabase[Call Supabase<br/>signInWithPassword]
    
    CallSupabase --> AuthCheck{Auth<br/>successful?}
    
    AuthCheck -->|Fail| Return401[Return 401<br/>Generic message]
    AuthCheck -->|Pass| Return200[Return 200<br/>+ user data]
    
    Return400 --> DisplayFieldErrors[Display errors<br/>under fields]
    Return401 --> DisplayToast[Display toast<br/>"Invalid email or password"]
    Return200 --> Success[Toast + Redirect]
    
    ShowFieldError --> End([User can retry])
    DisplayFieldErrors --> End
    DisplayToast --> End
    Success --> End2([Redirect to /])
```

## Cookie Management

```mermaid
flowchart LR
    subgraph Browser
        A[User logs in]
    end
    
    subgraph Supabase
        B[signInWithPassword]
        C[Generate JWT tokens]
        D[Return tokens]
    end
    
    subgraph Server
        E[Receive tokens]
        F[Set cookies via<br/>setAll method]
    end
    
    subgraph Cookies
        G[sb-xxx-auth-token<br/>httpOnly, secure, sameSite]
        H[sb-xxx-auth-token.0<br/>refresh token]
    end
    
    subgraph NextRequest
        I[Browser sends cookies]
        J[Middleware reads<br/>via getAll]
        K[Supabase validates]
        L[User session restored]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    F --> H
    G --> I
    H --> I
    I --> J
    J --> K
    K --> L
```

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    
    Unauthenticated --> LoginPage: Navigate to /login
    LoginPage --> Authenticating: Submit form
    
    Authenticating --> LoginPage: Invalid credentials
    Authenticating --> Authenticated: Success
    
    Authenticated --> CheckingPlanner: Redirect to /
    
    CheckingPlanner --> Dashboard: Has active planner
    CheckingPlanner --> PlannersList: No active planner
    
    Dashboard --> [*]
    PlannersList --> [*]
    
    Authenticated --> Unauthenticated: Logout/Session expire
    
    note right of Authenticating
        - Client validation
        - API call
        - Server validation
        - Supabase auth
    end note
    
    note right of CheckingPlanner
        Query database for
        active planner
    end note
```

## Component Interaction

```mermaid
graph TB
    subgraph Client["Client-Side (Browser)"]
        LoginForm[LoginForm.tsx<br/>React Component]
        Toast[Sonner Toast]
    end
    
    subgraph Server["Server-Side (Astro SSR)"]
        LoginPage[login.astro]
        IndexPage[index.astro]
        API[/api/auth/login.ts]
        MW[middleware/index.ts]
    end
    
    subgraph Supabase["Supabase Services"]
        Auth[Auth Service]
        DB[(Database)]
    end
    
    subgraph Helpers["Helpers"]
        BrowserClient[lib/supabase/client.ts]
        ServerClient[lib/supabase/server.ts]
    end
    
    LoginPage -->|Renders| LoginForm
    LoginForm -->|POST| API
    API -->|Uses| ServerClient
    ServerClient -->|Calls| Auth
    Auth -->|Sets| Cookies[HTTP Cookies]
    
    LoginForm -->|Redirect| IndexPage
    IndexPage -->|Uses| MW
    MW -->|Uses| ServerClient
    ServerClient -->|Reads| Cookies
    ServerClient -->|Validates| Auth
    
    IndexPage -->|Queries| DB
    
    LoginForm -->|Shows| Toast
    
    style LoginForm fill:#e1f5ff
    style API fill:#fff4e1
    style MW fill:#fff4e1
    style Auth fill:#e8f5e9
    style DB fill:#e8f5e9
```

## Security Flow

```mermaid
flowchart TD
    Start([User Input]) --> ClientVal[Client Validation<br/>Email format, required fields]
    
    ClientVal --> HTTPS{HTTPS?}
    HTTPS -->|No| Warn[⚠️ Insecure in production]
    HTTPS -->|Yes| SendData[Send to API]
    
    SendData --> ZodVal[Zod Validation<br/>Server-side]
    ZodVal --> RateLimit{Rate Limit<br/>Future}
    
    RateLimit -->|Exceeded| Block[Block request]
    RateLimit -->|OK| Supabase[Supabase Auth]
    
    Supabase --> CheckCreds{Valid<br/>credentials?}
    
    CheckCreds -->|No| Generic[Return generic error<br/>No user enumeration]
    CheckCreds -->|Yes| SetCookies[Set secure cookies<br/>httpOnly, secure, sameSite]
    
    SetCookies --> JWT[Generate JWT tokens<br/>Access + Refresh]
    JWT --> Success[Return success]
    
    Generic --> End([User retries])
    Block --> End
    Success --> Authenticated([Authenticated state])
    
    style Generic fill:#ffe0e0
    style SetCookies fill:#e0ffe0
    style JWT fill:#e0ffe0
```

---

## Legenda

- **🟦 Niebieski**: Client-side components
- **🟨 Żółty**: Server-side components  
- **🟩 Zielony**: External services (Supabase)
- **🟥 Czerwony**: Error states
- **⬜ Biały**: Neutral/Flow

## Notatki

1. **Cookies są ustawiane automatycznie** przez Supabase po udanym logowaniu
2. **Middleware działa na każdym request** - sprawdza sesję z cookies
3. **Smart redirect** w index.astro decyduje gdzie przekierować użytkownika
4. **Błędy są generyczne** dla bezpieczeństwa (no user enumeration)
5. **Walidacja działa na 2 poziomach**: client (UX) + server (security)
