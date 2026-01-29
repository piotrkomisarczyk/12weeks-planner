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

  client = createBrowserClient<Database>(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY);

  return client;
}
