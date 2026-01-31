import { createClient, type SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";

import type { Database } from "./database.types.ts";

// Lazy initialization - only create client when actually used (not during module import)
// This prevents errors during SSR/build when the module is imported just for types
let _supabaseClient: SupabaseClientType<Database> | undefined;

function initializeClient(): SupabaseClientType<Database> {
  if (_supabaseClient) {
    return _supabaseClient;
  }

  // Client-side Supabase client MUST use PUBLIC_ prefixed environment variables
  // These are embedded at build time and available in the browser
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  const last6 = (str: string | undefined) => str?.slice(-6) ?? "undefined";
  const last12 = (str: string | undefined) => str?.slice(-12) ?? "undefined";
  console.log("[supabase.client.ts] Initializing client - URL:", last12(supabaseUrl), "KEY:", last6(supabaseAnonKey));

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase PUBLIC environment variables for client.\n" +
        `PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✓" : "✗"}\n` +
        `PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "✓" : "✗"}\n\n` +
        "IMPORTANT: These must be set as BUILD-TIME environment variables in Cloudflare Pages.\n" +
        "Steps to fix:\n" +
        "1. Go to Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables\n" +
        "2. Add PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY\n" +
        "3. REDEPLOY your application (environment variables are embedded at build time)\n\n" +
        "Note: Just setting variables is not enough - you MUST redeploy after setting them!"
    );
  }

  _supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  console.log("[supabase.client.ts] Client initialized successfully");
  return _supabaseClient;
}

// Export a getter function instead of the client directly
// This ensures the client is only created when actually used
export const getSupabaseClient = initializeClient;

// For backward compatibility, export a property that lazily initializes
export const supabaseClient = new Proxy({} as SupabaseClientType<Database>, {
  get(_target, prop) {
    const client = initializeClient();
    return client[prop as keyof SupabaseClientType<Database>];
  },
});

// Export SupabaseClient type with Database typing
export type SupabaseClient = SupabaseClientType<Database>;

export const DEFAULT_USER_ID = "dac44a9c-c1a0-4c6b-bed0-127e367a4fe3";
