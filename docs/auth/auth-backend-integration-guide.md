# Authentication Backend Integration Guide

This guide provides step-by-step instructions for integrating the authentication UI with Supabase backend.

## Prerequisites

- ✅ Authentication UI components implemented
- ✅ Authentication pages created
- ⏳ Supabase project configured
- ⏳ Environment variables set up

## Step 1: Install Dependencies

```bash
npm install @supabase/ssr @supabase/supabase-js
```

## Step 2: Environment Variables

Ensure these variables are set in `.env`:

```env
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 3: Create Supabase Clients

### 3.1 Browser Client

Create `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### 3.2 Server Client

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

export function createClient(cookies: AstroCookies) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) {
          return cookies.get(key)?.value;
        },
        set(key: string, value: string, options: any) {
          cookies.set(key, value, options);
        },
        remove(key: string, options: any) {
          cookies.delete(key, options);
        },
      },
    }
  );
}
```

## Step 4: Update Middleware

Update `src/middleware/index.ts`:

```typescript
import { defineMiddleware } from 'astro:middleware';
import { createClient } from '@/lib/supabase/server';

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client
  const supabase = createClient(context.cookies);
  context.locals.supabase = supabase;

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();
  context.locals.user = user;

  // Protected routes - require authentication
  const protectedRoutes = ['/plans', '/dashboard', '/settings'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    context.url.pathname.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    return context.redirect('/login');
  }

  // Guest routes - redirect if already logged in
  const guestRoutes = ['/login', '/register', '/forgot-password'];
  const isGuestRoute = guestRoutes.some((route) =>
    context.url.pathname === route
  );

  if (isGuestRoute && user) {
    return context.redirect('/');
  }

  return next();
});
```

### 4.1 Update TypeScript Types

Update `src/env.d.ts` to include locals types:

```typescript
/// <reference types="astro/client" />

import type { SupabaseClient, User } from '@supabase/supabase-js';

declare namespace App {
  interface Locals {
    supabase: SupabaseClient;
    user: User | null;
  }
}
```

## Step 5: Integrate Forms with Supabase

### 5.1 LoginForm.tsx

Replace the placeholder logic in `handleSubmit`:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validate()) {
    return;
  }

  setIsSubmitting(true);

  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      throw error;
    }

    toast.success('Login successful');
    window.location.href = '/';
  } catch (error: any) {
    console.error('Login error:', error);
    toast.error(error.message || 'Invalid email or password. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

Add import:
```typescript
import { createClient } from '@/lib/supabase/client';
```

### 5.2 RegisterForm.tsx

Replace the placeholder logic in `handleSubmit`:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validate()) {
    return;
  }

  setIsSubmitting(true);

  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }

    setShowSuccess(true);
    toast.success('Registration successful! Please check your email to verify your account.');
  } catch (error: any) {
    console.error('Registration error:', error);
    toast.error(error.message || 'Registration failed. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

Add import:
```typescript
import { createClient } from '@/lib/supabase/client';
```

### 5.3 ForgotPasswordForm.tsx

Replace the placeholder logic in `handleSubmit`:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validate()) {
    return;
  }

  setIsSubmitting(true);

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      throw error;
    }

    setShowSuccess(true);
    toast.success('Password reset email sent');
  } catch (error: any) {
    console.error('Password reset error:', error);
    toast.error(error.message || 'Failed to send reset email. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

Add import:
```typescript
import { createClient } from '@/lib/supabase/client';
```

### 5.4 UpdatePasswordForm.tsx

Replace the placeholder logic in `handleSubmit`:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validate()) {
    return;
  }

  setIsSubmitting(true);

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: formData.password,
    });

    if (error) {
      throw error;
    }

    toast.success('Password updated successfully');

    // Redirect based on context
    if (isLoggedIn) {
      window.location.href = '/';
    } else {
      window.location.href = '/login';
    }
  } catch (error: any) {
    console.error('Password update error:', error);
    toast.error(error.message || 'Failed to update password. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

Add import:
```typescript
import { createClient } from '@/lib/supabase/client';
```

## Step 6: Create Auth Callback Endpoint

Create `src/pages/auth/callback.ts`:

```typescript
import type { APIRoute } from 'astro';
import { createClient } from '@/lib/supabase/server';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/';

  if (code) {
    const supabase = createClient(cookies);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);
      return redirect('/login?error=auth_callback_failed');
    }
  }

  return redirect(next);
};

export const prerender = false;
```

## Step 7: Update Auth Pages with Middleware Check

### 7.1 login.astro

```astro
---
import AuthLayout from '@/layouts/AuthLayout.astro';
import { LoginForm } from '@/components/auth/LoginForm';
import { Toaster } from '@/components/ui/sonner';

const user = Astro.locals.user;
if (user) {
  return Astro.redirect('/');
}
---

<AuthLayout title="Sign In" description="Sign in to your 12 Weeks Planner account">
  <LoginForm client:load />
  <Toaster client:load />
</AuthLayout>
```

### 7.2 register.astro

```astro
---
import AuthLayout from '@/layouts/AuthLayout.astro';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Toaster } from '@/components/ui/sonner';

const user = Astro.locals.user;
if (user) {
  return Astro.redirect('/');
}
---

<AuthLayout title="Sign Up" description="Create your 12 Weeks Planner account">
  <RegisterForm client:load />
  <Toaster client:load />
</AuthLayout>
```

### 7.3 forgot-password.astro

```astro
---
import AuthLayout from '@/layouts/AuthLayout.astro';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Toaster } from '@/components/ui/sonner';

const user = Astro.locals.user;
if (user) {
  return Astro.redirect('/');
}
---

<AuthLayout title="Forgot Password" description="Reset your 12 Weeks Planner password">
  <ForgotPasswordForm client:load />
  <Toaster client:load />
</AuthLayout>
```

### 7.4 update-password.astro

```astro
---
import AuthLayout from '@/layouts/AuthLayout.astro';
import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm';
import { Toaster } from '@/components/ui/sonner';

const user = Astro.locals.user;
const isLoggedIn = !!user;
---

<AuthLayout title="Update Password" description="Update your 12 Weeks Planner password">
  <UpdatePasswordForm client:load isLoggedIn={isLoggedIn} />
  <Toaster client:load />
</AuthLayout>
```

## Step 8: Configure Supabase Email Templates

In your Supabase dashboard:

1. Go to **Authentication** > **Email Templates**
2. Configure the following templates:

### Confirm Signup
- Subject: `Confirm your email`
- Redirect URL: `{{ .SiteURL }}/auth/callback`

### Reset Password
- Subject: `Reset your password`
- Redirect URL: `{{ .SiteURL }}/auth/callback?next=/update-password`

### Magic Link
- Subject: `Your magic link`
- Redirect URL: `{{ .SiteURL }}/auth/callback`

## Step 9: Update User Menu (Optional)

If you have a UserMenu component, add logout and change password options:

```typescript
import { createClient } from '@/lib/supabase/client';

const handleLogout = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = '/login';
};

// In your menu JSX:
<DropdownMenuItem onClick={handleLogout}>
  Logout
</DropdownMenuItem>
<DropdownMenuItem>
  <a href="/update-password">Change Password</a>
</DropdownMenuItem>
```

## Step 10: Test the Integration

### 10.1 Registration Flow
1. Navigate to `/register`
2. Fill out the form with valid data
3. Submit and check for success screen
4. Check email inbox for verification link
5. Click verification link
6. Verify redirect to dashboard

### 10.2 Login Flow
1. Navigate to `/login`
2. Enter valid credentials
3. Submit and verify redirect to dashboard
4. Check that session persists on page refresh

### 10.3 Password Reset Flow
1. Navigate to `/forgot-password`
2. Enter email address
3. Check email for reset link
4. Click reset link
5. Enter new password on `/update-password`
6. Verify redirect to login
7. Login with new password

### 10.4 Protected Routes
1. Logout
2. Try to access `/plans` directly
3. Verify redirect to `/login`
4. Login
5. Verify redirect back to `/plans`

### 10.5 Guest Routes
1. Login
2. Try to access `/login` directly
3. Verify redirect to `/`

## Step 11: Database Security (RLS)

Create a new migration to re-enable RLS:

```sql
-- Enable RLS on all tables
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_metrics ENABLE ROW LEVEL SECURITY;

-- Plans policies
CREATE POLICY "Users can view own plans"
  ON plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own plans"
  ON plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
  ON plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans"
  ON plans FOR DELETE
  USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = goals.plan_id
    AND plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own goals"
  ON goals FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = goals.plan_id
    AND plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = goals.plan_id
    AND plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = goals.plan_id
    AND plans.user_id = auth.uid()
  ));

-- Repeat similar patterns for milestones, tasks, weekly_goals, weekly_reviews

-- User metrics policies
CREATE POLICY "Users can view own metrics"
  ON user_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own metrics"
  ON user_metrics FOR UPDATE
  USING (auth.uid() = user_id);
```

## Troubleshooting

### Issue: "Invalid API key"
- Check environment variables are set correctly
- Verify Supabase project URL and anon key

### Issue: "Email not confirmed"
- Check Supabase email settings
- Verify email templates are configured
- Check spam folder

### Issue: "Session not persisting"
- Verify cookies are being set correctly
- Check middleware is creating server client properly
- Verify cookie domain settings

### Issue: "PKCE flow failed"
- Check callback URL is configured in Supabase
- Verify redirect URLs in email templates
- Check for CORS issues

### Issue: "RLS policy violation"
- Verify policies are created correctly
- Check `auth.uid()` is returning user ID
- Test policies in Supabase SQL editor

## Next Steps

After successful integration:

1. ✅ Add user profile management
2. ✅ Implement OAuth providers (Google, GitHub)
3. ✅ Add session timeout handling
4. ✅ Implement remember me functionality
5. ✅ Add account deletion
6. ✅ Add email change functionality
7. ✅ Add multi-factor authentication (MFA)

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Astro Middleware Docs](https://docs.astro.build/en/guides/middleware/)
