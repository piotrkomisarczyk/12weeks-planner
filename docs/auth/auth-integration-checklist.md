# Authentication Backend Integration Checklist

Use this checklist to track progress when integrating the authentication UI with Supabase backend.

## Phase 1: Setup & Configuration

### Dependencies
- [ ] Install `@supabase/ssr` package
- [ ] Install `@supabase/supabase-js` package (if not already installed)
- [ ] Verify package versions are compatible

### Environment Variables
- [ ] Create `.env` file (if not exists)
- [ ] Add `PUBLIC_SUPABASE_URL` variable
- [ ] Add `PUBLIC_SUPABASE_ANON_KEY` variable
- [ ] Verify variables are loaded correctly
- [ ] Add `.env` to `.gitignore`

### Supabase Project Configuration
- [ ] Create Supabase project (if not exists)
- [ ] Enable email authentication
- [ ] Configure site URL
- [ ] Add redirect URLs for auth callbacks
- [ ] Configure email rate limiting (optional)

## Phase 2: Client Helpers

### Browser Client
- [ ] Create `src/lib/supabase/` directory
- [ ] Create `src/lib/supabase/client.ts`
- [ ] Implement `createClient()` function using `createBrowserClient`
- [ ] Test browser client initialization
- [ ] Verify environment variables are accessible

### Server Client
- [ ] Create `src/lib/supabase/server.ts`
- [ ] Implement `createClient(cookies)` function using `createServerClient`
- [ ] Implement cookie handlers (get, set, remove)
- [ ] Test server client initialization
- [ ] Verify cookie operations work correctly

### TypeScript Types
- [ ] Update `src/env.d.ts`
- [ ] Add `Locals` interface with `supabase` and `user` properties
- [ ] Import Supabase types
- [ ] Verify TypeScript compilation

## Phase 3: Middleware

### Implementation
- [ ] Update `src/middleware/index.ts`
- [ ] Create Supabase server client in middleware
- [ ] Attach client to `context.locals.supabase`
- [ ] Get user session with `getUser()`
- [ ] Attach user to `context.locals.user`

### Route Protection
- [ ] Define protected routes array
- [ ] Implement redirect to `/login` for unauthenticated access
- [ ] Define guest routes array
- [ ] Implement redirect to `/` for authenticated access
- [ ] Test protected route access without auth
- [ ] Test guest route access with auth

## Phase 4: Form Integration

### LoginForm.tsx
- [ ] Import `createClient` from `@/lib/supabase/client`
- [ ] Replace placeholder logic in `handleSubmit`
- [ ] Call `supabase.auth.signInWithPassword()`
- [ ] Handle success case (redirect to `/`)
- [ ] Handle error case (display error message)
- [ ] Test with valid credentials
- [ ] Test with invalid credentials
- [ ] Test error messages

### RegisterForm.tsx
- [ ] Import `createClient` from `@/lib/supabase/client`
- [ ] Replace placeholder logic in `handleSubmit`
- [ ] Call `supabase.auth.signUp()` with email redirect
- [ ] Handle success case (show success screen)
- [ ] Handle error case (display error message)
- [ ] Test with valid data
- [ ] Test with existing email
- [ ] Test email verification flow

### ForgotPasswordForm.tsx
- [ ] Import `createClient` from `@/lib/supabase/client`
- [ ] Replace placeholder logic in `handleSubmit`
- [ ] Call `supabase.auth.resetPasswordForEmail()` with redirect URL
- [ ] Handle success case (show success screen)
- [ ] Handle error case (display error message)
- [ ] Test with valid email
- [ ] Test with non-existent email
- [ ] Test email delivery

### UpdatePasswordForm.tsx
- [ ] Import `createClient` from `@/lib/supabase/client`
- [ ] Replace placeholder logic in `handleSubmit`
- [ ] Call `supabase.auth.updateUser()` with new password
- [ ] Handle success case (redirect based on `isLoggedIn`)
- [ ] Handle error case (display error message)
- [ ] Test password reset flow
- [ ] Test logged-in user flow
- [ ] Test password validation

## Phase 5: Auth Pages

### login.astro
- [ ] Remove TODO comment
- [ ] Get user from `Astro.locals.user`
- [ ] Implement redirect if user is logged in
- [ ] Test page access when logged out
- [ ] Test redirect when logged in

### register.astro
- [ ] Remove TODO comment
- [ ] Get user from `Astro.locals.user`
- [ ] Implement redirect if user is logged in
- [ ] Test page access when logged out
- [ ] Test redirect when logged in

### forgot-password.astro
- [ ] Remove TODO comment
- [ ] Get user from `Astro.locals.user`
- [ ] Implement redirect if user is logged in
- [ ] Test page access when logged out
- [ ] Test redirect when logged in

### update-password.astro
- [ ] Remove TODO comment
- [ ] Get user from `Astro.locals.user`
- [ ] Set `isLoggedIn` prop based on user
- [ ] Test page with logged-in user
- [ ] Test page with password reset token

## Phase 6: Auth Callback

### Endpoint Creation
- [ ] Create `src/pages/auth/` directory
- [ ] Create `src/pages/auth/callback.ts`
- [ ] Implement `GET` handler
- [ ] Extract `code` from URL params
- [ ] Extract `next` from URL params (default to `/`)
- [ ] Create Supabase server client
- [ ] Call `exchangeCodeForSession()`
- [ ] Handle success (redirect to `next`)
- [ ] Handle error (redirect to login with error)
- [ ] Set `prerender = false`

### Testing
- [ ] Test email verification callback
- [ ] Test password reset callback
- [ ] Test magic link callback (if implemented)
- [ ] Test error handling
- [ ] Verify session is established

## Phase 7: Email Configuration

### Supabase Dashboard
- [ ] Navigate to Authentication > Email Templates
- [ ] Configure "Confirm Signup" template
  - [ ] Update subject line
  - [ ] Update redirect URL to callback
  - [ ] Test template variables
- [ ] Configure "Reset Password" template
  - [ ] Update subject line
  - [ ] Update redirect URL to callback with `next=/update-password`
  - [ ] Test template variables
- [ ] Configure "Magic Link" template (optional)
  - [ ] Update subject line
  - [ ] Update redirect URL to callback
  - [ ] Test template variables

### Email Testing
- [ ] Test registration email delivery
- [ ] Test password reset email delivery
- [ ] Test email formatting
- [ ] Test links work correctly
- [ ] Check spam folder handling

## Phase 8: Database Security

### Migration Creation
- [ ] Create new migration file
- [ ] Add SQL to enable RLS on all tables
- [ ] Add policies for `plans` table
- [ ] Add policies for `goals` table
- [ ] Add policies for `milestones` table
- [ ] Add policies for `tasks` table
- [ ] Add policies for `weekly_goals` table
- [ ] Add policies for `weekly_reviews` table
- [ ] Add policies for `user_metrics` table

### Policy Testing
- [ ] Run migration
- [ ] Test SELECT policies (users can only see own data)
- [ ] Test INSERT policies (users can only create own data)
- [ ] Test UPDATE policies (users can only update own data)
- [ ] Test DELETE policies (users can only delete own data)
- [ ] Verify cross-user data isolation

### Triggers & Functions
- [ ] Verify `user_metrics` trigger exists
- [ ] Test trigger on user registration
- [ ] Verify metrics are initialized correctly

## Phase 9: User Menu Integration

### Logout Functionality
- [ ] Locate or create UserMenu component
- [ ] Import `createClient` from `@/lib/supabase/client`
- [ ] Add logout handler
- [ ] Call `supabase.auth.signOut()`
- [ ] Redirect to `/login`
- [ ] Test logout functionality
- [ ] Verify session is cleared

### Change Password
- [ ] Add "Change Password" menu item
- [ ] Link to `/update-password`
- [ ] Test navigation
- [ ] Verify `isLoggedIn` prop is true

### User Display
- [ ] Display user email or name
- [ ] Add user avatar (optional)
- [ ] Show account status

## Phase 10: Testing & Validation

### Registration Flow
- [ ] Register with valid data
- [ ] Verify success screen appears
- [ ] Check email inbox
- [ ] Click verification link
- [ ] Verify redirect to callback
- [ ] Verify session is established
- [ ] Verify redirect to dashboard

### Login Flow
- [ ] Login with valid credentials
- [ ] Verify success toast
- [ ] Verify redirect to dashboard
- [ ] Verify session persists on refresh
- [ ] Test logout
- [ ] Test login again

### Password Reset Flow
- [ ] Request password reset
- [ ] Verify success screen
- [ ] Check email inbox
- [ ] Click reset link
- [ ] Verify redirect to update password page
- [ ] Enter new password
- [ ] Verify success
- [ ] Login with new password

### Password Change Flow (Logged-in)
- [ ] Login
- [ ] Navigate to change password
- [ ] Enter new password
- [ ] Verify success
- [ ] Verify still logged in
- [ ] Logout and login with new password

### Route Protection
- [ ] Logout
- [ ] Try to access `/plans`
- [ ] Verify redirect to `/login`
- [ ] Login
- [ ] Try to access `/login`
- [ ] Verify redirect to `/`

### Error Handling
- [ ] Test login with wrong password
- [ ] Test login with non-existent email
- [ ] Test registration with existing email
- [ ] Test registration with weak password
- [ ] Test password reset with non-existent email
- [ ] Test expired password reset link
- [ ] Test invalid auth callback code

### Session Management
- [ ] Test session persistence across page refreshes
- [ ] Test session expiration (wait for token expiry)
- [ ] Test session refresh (active user)
- [ ] Test concurrent sessions (multiple tabs)

### Accessibility
- [ ] Test keyboard navigation on all forms
- [ ] Test screen reader on all forms
- [ ] Verify focus indicators
- [ ] Test error announcements

### Responsive Design
- [ ] Test on mobile devices
- [ ] Test on tablets
- [ ] Test on desktop
- [ ] Verify touch targets on mobile

## Phase 11: Production Readiness

### Security
- [ ] Verify environment variables are not committed
- [ ] Check for exposed secrets
- [ ] Verify HTTPS is used in production
- [ ] Test CORS settings
- [ ] Review RLS policies
- [ ] Test rate limiting

### Performance
- [ ] Test form submission speed
- [ ] Test page load times
- [ ] Verify no unnecessary re-renders
- [ ] Check bundle size

### Monitoring
- [ ] Set up error logging
- [ ] Monitor authentication failures
- [ ] Track registration conversions
- [ ] Monitor email delivery rates

### Documentation
- [ ] Update README with auth setup instructions
- [ ] Document environment variables
- [ ] Document deployment steps
- [ ] Create troubleshooting guide

## Phase 12: Optional Enhancements

### OAuth Providers
- [ ] Configure Google OAuth
- [ ] Configure GitHub OAuth
- [ ] Add OAuth buttons to login/register
- [ ] Test OAuth flows
- [ ] Handle OAuth errors

### Multi-Factor Authentication
- [ ] Enable MFA in Supabase
- [ ] Add MFA setup UI
- [ ] Add MFA verification UI
- [ ] Test MFA flow

### Advanced Features
- [ ] Implement "Remember Me" functionality
- [ ] Add session timeout warnings
- [ ] Implement account deletion
- [ ] Add email change functionality
- [ ] Add profile management

## Completion Checklist

- [ ] All forms are integrated with Supabase
- [ ] All auth flows work end-to-end
- [ ] All tests pass
- [ ] No linter errors
- [ ] No TypeScript errors
- [ ] Documentation is updated
- [ ] Security is verified
- [ ] Performance is acceptable
- [ ] Ready for production deployment

---

**Progress**: _____ / _____ tasks completed

**Last Updated**: ___________

**Notes**:
