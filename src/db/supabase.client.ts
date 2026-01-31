import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types.ts";

// Client-side Supabase client MUST use PUBLIC_ prefixed environment variables
// These are embedded at build time and available in the browser
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

const last6 = (str: string | undefined) => str?.slice(-6) ?? "undefined";
const last12 = (str: string | undefined) => str?.slice(-12) ?? "undefined";
console.log("[supabase.client.ts] URL:", last12(supabaseUrl), "KEY:", last6(supabaseAnonKey));

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase PUBLIC environment variables for client.\n" +
      `PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✓" : "✗"}\n` +
      `PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "✓" : "✗"}\n` +
      "These must be set as build-time environment variables in Cloudflare Pages."
  );
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export SupabaseClient type with Database typing
export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = "dac44a9c-c1a0-4c6b-bed0-127e367a4fe3";
