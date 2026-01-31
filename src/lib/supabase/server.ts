import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";

import type { Database } from "@/db/database.types";

/**
 * Cookie options for Supabase server client
 * Used for session management
 */
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

/**
 * Parse cookie header string into array of name-value pairs
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Create Supabase server client for SSR
 * Must be called per-request with fresh context
 *
 * @param context - Astro context with headers and cookies
 * @param runtime - Optional runtime environment (for Cloudflare)
 * @returns Supabase server client instance
 */
export const createServerSupabaseClient = (
  context: { headers: Headers; cookies: AstroCookies },
  runtime?: { env?: Record<string, unknown> }
) => {
  // Priority order for environment variables:
  // 1. Runtime env (Cloudflare Pages) - preferred for server-side
  // 2. Build-time env (import.meta.env) - fallback for local dev

  // For Cloudflare Pages, environment variables should be set as:
  // - SUPABASE_URL (or PUBLIC_SUPABASE_URL)
  // - SUPABASE_KEY (or SUPABASE_ANON_KEY or PUBLIC_SUPABASE_ANON_KEY)

  // Helper to safely get string value from runtime env
  const getEnvString = (key: string): string | undefined => {
    const value = runtime?.env?.[key];
    return typeof value === "string" ? value : undefined;
  };

  const supabaseUrl =
    getEnvString("SUPABASE_URL") ??
    getEnvString("PUBLIC_SUPABASE_URL") ??
    import.meta.env.SUPABASE_URL ??
    import.meta.env.PUBLIC_SUPABASE_URL;

  const supabaseKey =
    getEnvString("SUPABASE_KEY") ??
    getEnvString("SUPABASE_ANON_KEY") ??
    getEnvString("PUBLIC_SUPABASE_ANON_KEY") ??
    import.meta.env.SUPABASE_KEY ??
    import.meta.env.SUPABASE_ANON_KEY ??
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  // Debug logging (only show last few characters for security)
  const last6 = (str: string | undefined) => str?.slice(-6) ?? "undefined";
  const lastUrl = (str: string | undefined) => str?.slice(-16) ?? "undefined";
  console.log("[createServerSupabaseClient] URL:", lastUrl(supabaseUrl), "KEY:", last6(supabaseKey));

  // Validate that we have the required environment variables
  if (!supabaseUrl || !supabaseKey) {
    const debugInfo = {
      runtime_SUPABASE_URL: getEnvString("SUPABASE_URL") ? "✓" : "✗",
      runtime_PUBLIC_SUPABASE_URL: getEnvString("PUBLIC_SUPABASE_URL") ? "✓" : "✗",
      runtime_SUPABASE_KEY: getEnvString("SUPABASE_KEY") ? "✓" : "✗",
      runtime_SUPABASE_ANON_KEY: getEnvString("SUPABASE_ANON_KEY") ? "✓" : "✗",
      runtime_PUBLIC_SUPABASE_ANON_KEY: getEnvString("PUBLIC_SUPABASE_ANON_KEY") ? "✓" : "✗",
    };

    console.error("[createServerSupabaseClient] Environment variables check:", debugInfo);

    throw new Error(
      "Missing Supabase environment variables for server client.\n" +
        `SUPABASE_URL: ${supabaseUrl ? "✓" : "✗"}\n` +
        `SUPABASE_KEY: ${supabaseKey ? "✓" : "✗"}\n` +
        "For Cloudflare Pages, set these in your project settings:\n" +
        "- SUPABASE_URL (or PUBLIC_SUPABASE_URL)\n" +
        "- SUPABASE_KEY (or SUPABASE_ANON_KEY or PUBLIC_SUPABASE_ANON_KEY)\n" +
        JSON.stringify(debugInfo, null, 2)
    );
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  console.log("[createServerSupabaseClient] Supabase client created successfully");
  return supabase;
};
