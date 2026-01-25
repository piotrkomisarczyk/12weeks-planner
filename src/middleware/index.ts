import { defineMiddleware } from 'astro:middleware';

import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Public paths that don't require authentication
 * Includes auth pages and API endpoints
 */
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/update-password',
  '/auth/callback',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/update-password',
];

/**
 * Auth middleware
 * - Creates Supabase server client per request
 * - Checks user session
 * - Protects routes requiring authentication
 * - Redirects logged-in users from auth pages
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, cookies, url, request, redirect } = context;

  // Create Supabase server client
  const supabase = createServerSupabaseClient({
    cookies,
    headers: request.headers,
  });

  // Attach supabase client to locals for use in pages/endpoints
  locals.supabase = supabase;

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if email is verified (required for access)
  const isEmailVerified = user?.email_confirmed_at !== null;

  // Attach user to locals only if email is verified
  locals.user = user && isEmailVerified
    ? {
        id: user.id,
        email: user.email,
      }
    : null;

  const isPublicPath = PUBLIC_PATHS.includes(url.pathname);

  // Auth pages that logged-in users should not access
  const AUTH_ONLY_PAGES = ['/login', '/register', '/forgot-password'];

  // Redirect logged-in users with verified email away from auth-only pages
  if (locals.user && AUTH_ONLY_PAGES.includes(url.pathname)) {
    return redirect('/plans');
  }

  // Redirect non-authenticated users to login
  // Note: Users with unverified emails are treated as non-authenticated
  if (!locals.user && !isPublicPath) {
    return redirect('/login');
  }

  return next();
});

