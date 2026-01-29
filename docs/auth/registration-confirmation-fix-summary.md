# Registration Email Confirmation Fix - Summary

## Issue Description

When users registered for a new account, they would click the email confirmation link and be incorrectly redirected to the `/update-password` page instead of a confirmation page followed by a redirect to `/plans`.

## Root Cause

The authentication callback handler (`/auth/callback`) was treating all PKCE code exchanges the same way, redirecting to `/update-password` regardless of whether the flow was:

1. **Password reset** (forgot password flow)
2. **Email confirmation** (registration flow)

Both flows use PKCE (Proof Key for Code Exchange) and result in a `code` parameter being passed to the callback, making them indistinguishable without additional context.

## Solution

### 1. Added Query Parameter Differentiation

Modified the registration flow to include a `next=email-confirmed` query parameter in the email redirect URL:

**File: `src/pages/api/auth/register.ts`**

```typescript
emailRedirectTo: `${new URL(request.url).origin}/auth/callback?next=email-confirmed`;
```

The forgot-password flow continues to use the callback URL without the `next` parameter:

**File: `src/pages/api/auth/forgot-password.ts`**

```typescript
redirectTo: `${origin}/auth/callback`;
```

### 2. Updated Callback Handler

Modified the callback handler to check for the `next` parameter and route accordingly:

**File: `src/pages/auth/callback.ts`**

- If `next=email-confirmed` is present → redirect to `/email-confirmed`
- Otherwise (password reset flow) → redirect to `/update-password`

### 3. Created Email Confirmation Page

**File: `src/pages/email-confirmed.astro`**

- New page that displays a success message after email verification
- Shows a countdown timer (3 seconds)
- Automatically redirects to `/plans`
- Provides a button for immediate navigation

**File: `src/components/auth/EmailConfirmedMessage.tsx`**

- React component that renders the confirmation UI
- Includes success icon, message, countdown, and action button
- Handles automatic redirect after 3 seconds

## Updated Authentication Flows

### Registration Flow (Fixed)

1. User fills out registration form at `/register`
2. User submits form → POST to `/api/auth/register`
3. Supabase creates account and sends confirmation email
4. Email contains link: `http://127.0.0.1:54321/auth/v1/verify?token=...&type=signup&redirect_to=http://localhost:3000/auth/callback?next=email-confirmed`
5. User clicks link → Supabase processes verification
6. Supabase redirects to: `http://localhost:3000/auth/callback?code=...&next=email-confirmed`
7. Callback handler exchanges code for session
8. Callback handler checks `next` parameter → redirects to `/email-confirmed`
9. Email confirmed page shows success message
10. After 3 seconds → automatic redirect to `/plans`

### Password Reset Flow (Unchanged)

1. User clicks "Forgot password" at `/forgot-password`
2. User enters email → POST to `/api/auth/forgot-password`
3. Supabase sends password reset email
4. Email contains link: `http://127.0.0.1:54321/auth/v1/recover?token=...&type=recovery&redirect_to=http://localhost:3000/auth/callback`
5. User clicks link → Supabase processes verification
6. Supabase redirects to: `http://localhost:3000/auth/callback?code=...`
7. Callback handler exchanges code for session
8. Callback handler (no `next` parameter) → redirects to `/update-password`
9. User enters new password
10. After password update → redirect to `/plans`

## Files Modified

1. **`src/pages/api/auth/register.ts`** - Added `next` parameter to emailRedirectTo
2. **`src/pages/auth/callback.ts`** - Added logic to check `next` parameter and route accordingly

## Files Created

1. **`src/pages/email-confirmed.astro`** - Email confirmation success page
2. **`src/components/auth/EmailConfirmedMessage.tsx`** - Confirmation UI component

## Testing Checklist

- [x] Registration flow redirects to `/email-confirmed` after email verification
- [x] Email confirmed page displays success message
- [x] Automatic redirect to `/plans` after 3 seconds
- [x] Manual "Go to Plans Now" button works
- [x] Forgot password flow still redirects to `/update-password`
- [x] Password reset functionality unchanged
- [x] No linter errors introduced

## Technical Details

### Why PKCE is Used for Both Flows

Supabase uses PKCE (Proof Key for Code Exchange) for secure authentication flows. When a user clicks an email link:

1. Supabase validates the token
2. Redirects to the specified `redirect_to` URL with a `code` parameter
3. The application exchanges the code for a session using `exchangeCodeForSession()`

This is the same mechanism for both password reset and email confirmation, which is why we need the `next` parameter to differentiate between them.

### Alternative Solutions Considered

1. **Check user metadata** - Could inspect session metadata to determine flow type, but this is less explicit and harder to maintain
2. **Separate callback endpoints** - Could create `/auth/callback-signup` and `/auth/callback-recovery`, but this duplicates code
3. **Use different auth methods** - Could use OTP flow for one and PKCE for another, but this is inconsistent

The chosen solution (query parameter) is simple, explicit, and maintainable.

## Conclusion

The fix successfully distinguishes between registration confirmation and password reset flows by using a query parameter (`next`). This ensures users are redirected to the appropriate page after clicking email links, providing a better user experience without breaking existing functionality.
