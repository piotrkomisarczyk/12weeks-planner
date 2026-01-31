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
  runtime?: { env?: Record<string, string> }
) => {
  // Try runtime env first (Cloudflare), fallback to import.meta.env (local dev)
  const supabaseUrl = runtime?.env?.SUPABASE_URL ?? import.meta.env.SUPABASE_URL;
  const supabaseKey = runtime?.env?.SUPABASE_KEY ?? import.meta.env.SUPABASE_KEY;

  const last6 = (str: string | undefined) => str?.slice(-6) ?? "undefined";
  const lastUrl = (str: string | undefined) => str?.slice(-16) ?? "undefined";
  console.log("[createServerSupabaseClient] URL:", lastUrl(supabaseUrl), "KEY:", last6(supabaseKey));
  
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

  return supabase;
};
