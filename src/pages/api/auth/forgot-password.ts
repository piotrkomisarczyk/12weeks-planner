import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

/**
 * Forgot password request schema
 * Validates email format
 */
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

/**
 * POST /api/auth/forgot-password
 * Sends password reset email to user
 * 
 * @returns 200 with success message (even if email doesn't exist for security)
 * @returns 400 on validation error
 * @returns 500 on server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = forgotPasswordSchema.safeParse(body);

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

    const { email } = validationResult.data;

    // Get origin from request headers for redirect URL
    const origin = new URL(request.url).origin;
    const redirectTo = `${origin}/update-password`;

    // Send password reset email
    const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    // For security reasons, always return success even if email doesn't exist
    // This prevents email enumeration attacks
    if (error) {
      console.error('Password reset email error:', error);
      // Still return success to user
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Forgot password error:', error);
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
