import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

/**
 * Login request schema
 * Validates email format and password presence
 */
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/login
 * Authenticates user with email and password
 * 
 * @returns 200 with user data on success
 * @returns 400 on validation error
 * @returns 401 on authentication failure
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    const { email, password } = validationResult.data;

    // Attempt to sign in with Supabase
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Return generic error message for security
      // Don't reveal whether email exists or password is wrong
      return new Response(
        JSON.stringify({
          error: 'Invalid email or password. Please try again.',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // Check if email is verified
    if (!data.user.email_confirmed_at) {
      // Sign out the user immediately
      await locals.supabase.auth.signOut();
      
      return new Response(
        JSON.stringify({
          error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
          code: 'EMAIL_NOT_VERIFIED',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // Return success with user data
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({
        error: 'An unexpected error occurred. Please try again.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
};
