import type { APIRoute } from "astro";

import { RegisterBodySchema } from "@/lib/validation/auth.validation";

export const prerender = false;

/**
 * POST /api/auth/register
 * Registers a new user with email and password
 *
 * Flow:
 * 1. Validates request body (email, password, confirmPassword)
 * 2. Creates user account in Supabase Auth
 * 3. Supabase sends email verification link (if enabled in project settings)
 * 4. Returns success response
 *
 * @returns 200 with user data on success (user must verify email before login)
 * @returns 400 on validation error or registration failure
 * @returns 500 on unexpected error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = RegisterBodySchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { email, password } = validationResult.data;

    // Attempt to sign up with Supabase
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        // Email redirect URL after verification
        // Supabase will append token_hash and type parameters
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
      },
    });

    // Important: Sign out immediately after registration
    // This prevents the user from being logged in before email verification
    if (data.user) {
      await locals.supabase.auth.signOut();
    }

    if (error) {
      // Handle specific Supabase errors
      let errorMessage = "Registration failed. Please try again.";

      if (error.message.includes("already registered")) {
        errorMessage = "An account with this email already exists.";
      } else if (error.message.includes("password")) {
        errorMessage = "Password does not meet requirements.";
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          details: error.message,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Return success response
    // Note: User needs to verify email before they can log in
    return new Response(
      JSON.stringify({
        success: true,
        message: "Registration successful. Please check your email to verify your account.",
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        // Indicate if email confirmation is required
        emailConfirmationRequired: data.user?.email_confirmed_at === null,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred. Please try again.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
