# Authentication UI Implementation

This document describes the authentication UI components and pages that have been implemented for the 12 Weeks Planner application.

## Overview

The authentication UI provides a complete user interface for:

- User login
- User registration
- Password reset request
- Password update (both for reset flow and logged-in users)

All components follow the existing design patterns from the PlanWizardContainer and use Shadcn UI components for consistency.

## Implementation Status

✅ **Completed:**

- All authentication form components
- All authentication pages
- AuthLayout for minimal auth-focused layout
- Form validation with detailed error messages
- Success states and user feedback
- Responsive design
- Accessibility features (ARIA labels, error descriptions)

⏳ **Pending (Backend Integration):**

- Supabase client integration
- Actual authentication logic
- Middleware for route protection
- Session management
- OAuth callback handling

## File Structure

```
src/
├── layouts/
│   └── AuthLayout.astro              # Minimal layout for auth pages
├── components/
│   └── auth/
│       ├── LoginForm.tsx             # Login form component
│       ├── RegisterForm.tsx          # Registration form component
│       ├── ForgotPasswordForm.tsx    # Password reset request form
│       └── UpdatePasswordForm.tsx    # Password update form
└── pages/
    ├── login.astro                   # Login page
    ├── register.astro                # Registration page
    ├── forgot-password.astro         # Forgot password page
    └── update-password.astro         # Update password page
```

## Components

### 1. AuthLayout.astro

A minimal layout for authentication pages featuring:

- Simple header with logo and app name
- Centered content area (max-width: 28rem)
- Footer with copyright
- No navigation or sidebar
- Clean, distraction-free design

### 2. LoginForm.tsx

**Features:**

- Email and password fields
- Client-side validation (email format, required fields)
- "Forgot password?" link
- "Sign up" link for new users
- Loading state during submission
- Error handling with toast notifications

**Validation Rules:**

- Email: Required, valid email format
- Password: Required

### 3. RegisterForm.tsx

**Features:**

- Email, password, and confirm password fields
- Strong password validation
- Success screen with email verification instructions
- Links to login page
- Loading state during submission
- Error handling with toast notifications

**Validation Rules:**

- Email: Required, valid email format
- Password:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- Confirm Password: Must match password

**Success Flow:**
After successful registration, displays:

- Success icon
- Confirmation message
- Email address where verification was sent
- Instructions to check spam folder
- Option to try again
- Link back to login

### 4. ForgotPasswordForm.tsx

**Features:**

- Single email field
- Success screen with instructions
- Option to resend email
- Link back to login
- Loading state during submission
- Error handling with toast notifications

**Validation Rules:**

- Email: Required, valid email format

**Success Flow:**
After successful submission, displays:

- Email icon
- Confirmation message
- Email address where reset link was sent
- Expiration notice (1 hour)
- Option to send another email
- Link back to login

### 5. UpdatePasswordForm.tsx

**Features:**

- New password and confirm password fields
- Dual mode: password reset flow vs. logged-in user
- Strong password validation
- Different redirect behavior based on context
- Loading state during submission
- Error handling with toast notifications

**Props:**

- `isLoggedIn` (boolean, default: false): Determines UI text and redirect behavior

**Validation Rules:**

- Password:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- Confirm Password: Must match password

## Pages

### /login

- Uses AuthLayout
- Renders LoginForm
- Includes Toaster for notifications
- TODO: Add middleware check to redirect logged-in users

### /register

- Uses AuthLayout
- Renders RegisterForm
- Includes Toaster for notifications
- TODO: Add middleware check to redirect logged-in users

### /forgot-password

- Uses AuthLayout
- Renders ForgotPasswordForm
- Includes Toaster for notifications
- TODO: Add middleware check to redirect logged-in users

### /update-password

- Uses AuthLayout
- Renders UpdatePasswordForm
- Includes Toaster for notifications
- TODO: Determine if user is logged in to show appropriate UI

## Design Patterns

### Consistent with PlanWizardContainer

The authentication components follow the same patterns as the PlanWizardContainer:

1. **State Management:**
   - Local state with `useState`
   - Separate error state object
   - Loading/submitting state

2. **Validation:**
   - Client-side validation before submission
   - Error messages stored in state object
   - Errors cleared when user starts typing

3. **Form Handling:**
   - `useCallback` for event handlers
   - Controlled inputs
   - Proper accessibility attributes

4. **UI Components:**
   - Shadcn UI components (Card, Input, Label, Button, Alert)
   - Consistent spacing and layout
   - Proper error display

5. **User Feedback:**
   - Toast notifications for success/error
   - Loading states on buttons
   - Clear error messages

### Accessibility

All forms include:

- Proper label associations
- ARIA attributes (`aria-invalid`, `aria-describedby`)
- Required field indicators
- Descriptive error messages
- Keyboard navigation support
- Focus management

### Responsive Design

- Mobile-first approach
- Centered layout on all screen sizes
- Proper spacing and padding
- Touch-friendly button sizes

## Validation Rules Summary

### Email Validation

- Required field
- Must match email format: `[text]@[domain].[tld]`

### Password Validation (Registration & Update)

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

### Password Confirmation

- Must exactly match the password field

## User Flows

### Registration Flow

1. User fills out registration form
2. Client-side validation
3. Form submission (TODO: Supabase integration)
4. Success screen with email verification instructions
5. User checks email and clicks verification link
6. User redirected to login

### Login Flow

1. User fills out login form
2. Client-side validation
3. Form submission (TODO: Supabase integration)
4. Success notification
5. Redirect to dashboard or plans list

### Password Reset Flow

1. User clicks "Forgot password?" on login page
2. User enters email on forgot password page
3. Success screen with instructions
4. User checks email and clicks reset link
5. User redirected to update password page
6. User sets new password
7. Success notification
8. Redirect to login page

### Password Change Flow (Logged-in User)

1. User navigates to update password page (from settings/menu)
2. User enters new password and confirmation
3. Form submission
4. Success notification
5. User remains logged in

## Next Steps (Backend Integration)

To complete the authentication implementation, the following backend work is needed:

1. **Supabase Client Setup:**
   - Install `@supabase/ssr`
   - Create browser client (`src/lib/supabase/client.ts`)
   - Create server client (`src/lib/supabase/server.ts`)

2. **Form Integration:**
   - Replace placeholder logic with actual Supabase calls
   - `LoginForm`: `supabase.auth.signInWithPassword()`
   - `RegisterForm`: `supabase.auth.signUp()`
   - `ForgotPasswordForm`: `supabase.auth.resetPasswordForEmail()`
   - `UpdatePasswordForm`: `supabase.auth.updateUser()`

3. **Middleware:**
   - Implement auth guard in `src/middleware/index.ts`
   - Protect authenticated routes
   - Redirect logged-in users from auth pages
   - Handle session management

4. **OAuth Callback:**
   - Create `/auth/callback` endpoint
   - Handle PKCE code exchange
   - Set up session cookies
   - Redirect to appropriate page

5. **User Menu:**
   - Add logout functionality
   - Add "Change Password" option
   - Display user information

6. **Database:**
   - Re-enable RLS policies
   - Verify user_metrics triggers
   - Test row-level security

## Testing Checklist

Once backend integration is complete, test the following:

- [ ] Registration with valid data
- [ ] Registration with invalid email
- [ ] Registration with weak password
- [ ] Registration with mismatched passwords
- [ ] Email verification flow
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Login redirect to dashboard/plans
- [ ] Forgot password flow
- [ ] Password reset email delivery
- [ ] Password reset link expiration
- [ ] Update password (reset flow)
- [ ] Update password (logged-in user)
- [ ] Logout functionality
- [ ] Session persistence
- [ ] Auto-logout on token expiration
- [ ] Protected route access without auth
- [ ] Auth page access when logged in
- [ ] Mobile responsiveness
- [ ] Keyboard navigation
- [ ] Screen reader compatibility

## Notes

- All TODO comments in the code indicate where backend integration is needed
- Forms use placeholder delays to simulate async operations
- Toast notifications are configured but need real error messages from Supabase
- The `isLoggedIn` prop in UpdatePasswordForm will need to be determined from `Astro.locals.user`
