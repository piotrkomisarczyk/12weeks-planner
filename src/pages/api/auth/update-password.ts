import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

/**
 * Update password request schema
 * Validates password strength requirements
 */
const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

/**
 * POST /api/auth/update-password
 * Updates user password (for both password reset flow and logged-in users)
 *
 * @returns 200 with success message
 * @returns 400 on validation error
 * @returns 401 if no valid session
 * @returns 500 on server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check if user has a valid session
    const {
      data: { session },
      error: sessionError,
    } = await locals.supabase.auth.getSession();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({
          error: "No active session. Please request a new password reset link.",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updatePasswordSchema.safeParse(body);

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

    const { password } = validationResult.data;

    // Update user password
    const { error } = await locals.supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error("Password update error:", error);
      return new Response(
        JSON.stringify({
          error: error.message || "Failed to update password. Please try again.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password updated successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Update password error:", error);
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
