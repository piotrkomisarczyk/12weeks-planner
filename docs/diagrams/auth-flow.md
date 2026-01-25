# Authentication Flow Diagrams

This document contains visual diagrams of the authentication flows implemented in the 12 Weeks Planner application.

## Registration Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant RegisterForm
    participant Supabase
    participant Email

    User->>Browser: Navigate to /register
    Browser->>RegisterForm: Render form
    User->>RegisterForm: Fill email, password, confirm
    User->>RegisterForm: Click "Create account"
    RegisterForm->>RegisterForm: Validate form
    RegisterForm->>Supabase: signUp(email, password)
    Supabase->>Email: Send verification email
    Supabase-->>RegisterForm: Success
    RegisterForm->>Browser: Show success screen
    User->>Email: Check inbox
    User->>Email: Click verification link
    Email->>Browser: Navigate to /auth/callback?code=xxx
    Browser->>Supabase: exchangeCodeForSession(code)
    Supabase-->>Browser: Session established
    Browser->>Browser: Redirect to /
```

## Login Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant LoginForm
    participant Supabase
    participant Middleware

    User->>Browser: Navigate to /login
    Browser->>Middleware: Check session
    Middleware-->>Browser: No session, allow access
    Browser->>LoginForm: Render form
    User->>LoginForm: Enter email, password
    User->>LoginForm: Click "Sign in"
    LoginForm->>LoginForm: Validate form
    LoginForm->>Supabase: signInWithPassword(email, password)
    Supabase-->>LoginForm: Session + User
    Supabase->>Browser: Set session cookies
    LoginForm->>Browser: Redirect to /
    Browser->>Middleware: Check session
    Middleware-->>Browser: Session valid, allow access
```

## Password Reset Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant ForgotForm
    participant Supabase
    participant Email
    participant UpdateForm

    User->>Browser: Navigate to /forgot-password
    Browser->>ForgotForm: Render form
    User->>ForgotForm: Enter email
    User->>ForgotForm: Click "Send reset link"
    ForgotForm->>ForgotForm: Validate email
    ForgotForm->>Supabase: resetPasswordForEmail(email)
    Supabase->>Email: Send reset email
    Supabase-->>ForgotForm: Success
    ForgotForm->>Browser: Show success screen
    User->>Email: Check inbox
    User->>Email: Click reset link
    Email->>Browser: Navigate to /auth/callback?code=xxx&next=/update-password
    Browser->>Supabase: exchangeCodeForSession(code)
    Supabase-->>Browser: Temporary session
    Browser->>Browser: Redirect to /update-password
    Browser->>UpdateForm: Render form
    User->>UpdateForm: Enter new password
    User->>UpdateForm: Click "Update password"
    UpdateForm->>UpdateForm: Validate password
    UpdateForm->>Supabase: updateUser({ password })
    Supabase-->>UpdateForm: Success
    UpdateForm->>Browser: Redirect to /login
```

## Password Change Flow (Logged-in User)

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant UpdateForm
    participant Supabase

    User->>Browser: Click "Change Password" in menu
    Browser->>Browser: Navigate to /update-password
    Browser->>UpdateForm: Render form (isLoggedIn=true)
    User->>UpdateForm: Enter new password
    User->>UpdateForm: Click "Update password"
    UpdateForm->>UpdateForm: Validate password
    UpdateForm->>Supabase: updateUser({ password })
    Supabase-->>UpdateForm: Success
    UpdateForm->>Browser: Show success toast
    UpdateForm->>Browser: Redirect to /
```

## Logout Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant UserMenu
    participant Supabase

    User->>UserMenu: Click "Logout"
    UserMenu->>Supabase: signOut()
    Supabase->>Browser: Clear session cookies
    Supabase-->>UserMenu: Success
    UserMenu->>Browser: Redirect to /login
```

## Middleware Flow (Route Protection)

```mermaid
flowchart TD
    A[User requests page] --> B[Middleware intercepts]
    B --> C[Create Supabase client]
    C --> D[Get user session]
    D --> E{Session exists?}
    
    E -->|Yes| F{Is protected route?}
    E -->|No| G{Is guest route?}
    
    F -->|Yes| H[Allow access]
    F -->|No| I{Is guest route?}
    
    I -->|Yes| J[Redirect to /]
    I -->|No| H
    
    G -->|Yes| K[Redirect to /login]
    G -->|No| H
    
    H --> L[Attach user to locals]
    L --> M[Continue to page]
    
    J --> N[User sees dashboard]
    K --> O[User sees login]
```

## Session Management Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Supabase
    participant Server

    Note over Browser,Server: Initial Login
    Browser->>Supabase: signInWithPassword()
    Supabase-->>Browser: Access Token + Refresh Token
    Browser->>Browser: Store in cookies
    
    Note over Browser,Server: Subsequent Requests
    Browser->>Server: Request with cookies
    Server->>Server: Read tokens from cookies
    Server->>Supabase: Validate access token
    Supabase-->>Server: Valid/Invalid
    
    Note over Browser,Server: Token Refresh
    Server->>Supabase: Access token expired?
    Supabase-->>Server: Yes
    Server->>Supabase: Use refresh token
    Supabase-->>Server: New access token
    Server->>Browser: Update cookies
    
    Note over Browser,Server: Session Expiry
    Server->>Supabase: Refresh token expired?
    Supabase-->>Server: Yes
    Server->>Browser: Redirect to /login
```

## Email Verification Flow

```mermaid
flowchart TD
    A[User registers] --> B[Supabase sends email]
    B --> C{Email delivered?}
    
    C -->|Yes| D[User receives email]
    C -->|No| E[Check spam folder]
    
    D --> F[User clicks link]
    E --> F
    
    F --> G[Navigate to /auth/callback]
    G --> H[Exchange code for session]
    H --> I{Code valid?}
    
    I -->|Yes| J[Establish session]
    I -->|No| K[Show error]
    
    J --> L[Redirect to dashboard]
    K --> M[Redirect to login]
```

## Complete User Journey

```mermaid
flowchart TD
    Start([New User]) --> Register[Register at /register]
    Register --> VerifyEmail[Verify email]
    VerifyEmail --> Login[Login at /login]
    Login --> Dashboard[Access Dashboard]
    
    Dashboard --> UsePlanner[Use Planner]
    UsePlanner --> Logout[Logout]
    Logout --> End1([Session Ended])
    
    Start2([Existing User]) --> Login2[Login at /login]
    Login2 --> Dashboard2[Access Dashboard]
    Dashboard2 --> UsePlanner2[Use Planner]
    
    UsePlanner2 --> ChangePassword{Change Password?}
    ChangePassword -->|Yes| UpdatePassword[Update Password]
    UpdatePassword --> UsePlanner2
    ChangePassword -->|No| Logout2[Logout]
    Logout2 --> End2([Session Ended])
    
    Start3([Forgot Password]) --> ForgotPassword[Request Reset]
    ForgotPassword --> ResetEmail[Check Email]
    ResetEmail --> ResetPassword[Set New Password]
    ResetPassword --> Login3[Login]
    Login3 --> Dashboard3[Access Dashboard]
```

## Error Handling Flow

```mermaid
flowchart TD
    A[User submits form] --> B{Form valid?}
    
    B -->|No| C[Show validation errors]
    C --> D[User corrects errors]
    D --> A
    
    B -->|Yes| E[Submit to Supabase]
    E --> F{Supabase success?}
    
    F -->|Yes| G[Show success message]
    G --> H[Redirect or update UI]
    
    F -->|No| I{Error type?}
    
    I -->|Auth Error| J[Show auth error toast]
    I -->|Network Error| K[Show network error toast]
    I -->|Unknown Error| L[Show generic error toast]
    
    J --> M[User can retry]
    K --> M
    L --> M
    M --> A
```

## Route Protection Matrix

```mermaid
flowchart LR
    subgraph Public Routes
        A1[/login]
        A2[/register]
        A3[/forgot-password]
    end
    
    subgraph Semi-Protected Routes
        B1[/update-password]
    end
    
    subgraph Protected Routes
        C1[/plans]
        C2[/dashboard]
        C3[/settings]
    end
    
    User{User Status}
    
    User -->|Not Logged In| Public Routes
    User -->|Not Logged In| B1
    User -->|Not Logged In| X[Redirect to /login]
    
    User -->|Logged In| Y[Redirect to /]
    User -->|Logged In| B1
    User -->|Logged In| Protected Routes
    
    X -.->|Blocks access to| Protected Routes
    Y -.->|Blocks access to| Public Routes
```

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Anonymous
    
    Anonymous --> Registering: Click Register
    Registering --> EmailVerification: Submit Form
    EmailVerification --> Anonymous: Verification Failed
    EmailVerification --> LoggingIn: Click Email Link
    
    Anonymous --> LoggingIn: Click Login
    LoggingIn --> Authenticated: Success
    LoggingIn --> Anonymous: Failed
    
    Anonymous --> PasswordReset: Click Forgot Password
    PasswordReset --> EmailSent: Submit Email
    EmailSent --> UpdatingPassword: Click Email Link
    UpdatingPassword --> LoggingIn: Password Updated
    UpdatingPassword --> EmailSent: Failed
    
    Authenticated --> UsingApp: Access Dashboard
    UsingApp --> ChangingPassword: Click Change Password
    ChangingPassword --> Authenticated: Password Updated
    ChangingPassword --> UsingApp: Cancel
    
    Authenticated --> Anonymous: Logout
    
    UsingApp --> [*]: Session Expired
```

---

## Legend

### Sequence Diagrams
- **Participant**: Actor or system component
- **Arrow (->)**: Synchronous call
- **Dashed Arrow (-->>)**: Response
- **Note**: Additional context

### Flowcharts
- **Rectangle**: Process/Action
- **Diamond**: Decision point
- **Rounded Rectangle**: Start/End
- **Dashed Arrow**: Conditional flow

### State Diagrams
- **State**: Current user state
- **Transition**: Action that changes state
- **[*]**: Initial/Final state

---

## Usage Notes

These diagrams illustrate:
1. **User flows**: How users interact with the system
2. **System flows**: How components communicate
3. **Error handling**: What happens when things go wrong
4. **Security**: How routes are protected
5. **Session management**: How sessions are maintained

Use these diagrams to:
- Understand the authentication system
- Debug issues
- Plan new features
- Onboard new developers
- Document the system
