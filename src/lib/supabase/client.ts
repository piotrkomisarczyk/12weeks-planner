import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/db/database.types";

/**
 * Browser client for Supabase
 * Used in React components (client-side)
 * Singleton pattern - creates client only once
 */
let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (client) {
    return client;
  }

  // PUBLIC_* vars are embedded at build time in Cloudflare Pages
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  const last6 = (str: string | undefined) => str?.slice(-6) ?? "undefined";
  const last12 = (str: string | undefined) => str?.slice(-12) ?? "undefined";
  console.log("[createBrowserClient] URL:", last12(supabaseUrl), "KEY:", last6(supabaseKey));

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase public environment variables. Please check your configuration.\n" +
        `PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✓" : "✗"}, PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? "✓" : "✗"}`
    );
  }

  client = createBrowserClient<Database>(supabaseUrl, supabaseKey);

  return client;
}
