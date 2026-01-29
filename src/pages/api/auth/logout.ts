import type { APIRoute } from "astro";

export const prerender = false;

/**
 * POST /api/auth/logout
 * Logs out the current user by clearing their session
 *
 * @returns 200 on success
 * @returns 400 on Supabase error
 * @returns 500 on unexpected error
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    // Sign out using Supabase server client from middleware
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      return new Response(
        JSON.stringify({
          error: "Failed to log out",
          message: error.message,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Success - cookies will be cleared by Supabase
    return new Response(
      JSON.stringify({
        success: true,
        message: "Logged out successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred",
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
