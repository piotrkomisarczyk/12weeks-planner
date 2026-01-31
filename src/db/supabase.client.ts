import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types.ts";

// Get environment variables with fallbacks
// Client-side: use PUBLIC_* vars (embedded at build time)
// Server-side: use private vars (from runtime or build time)
const getSupabaseUrl = () => {
  if (typeof window !== "undefined") {
    // Client-side: PUBLIC vars are embedded at build time
    return import.meta.env.PUBLIC_SUPABASE_URL;
  }
  // Server-side: try runtime first, fallback to build-time
  return import.meta.env.SUPABASE_URL;
};

const getSupabaseKey = () => {
  if (typeof window !== "undefined") {
    // Client-side: PUBLIC vars are embedded at build time
    return import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  }
  // Server-side: try runtime first, fallback to build-time
  return import.meta.env.SUPABASE_KEY;
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseKey();

const last6 = (str: string | undefined) => str?.slice(-6) ?? "undefined";
const last12 = (str: string | undefined) => str?.slice(-12) ?? "undefined";
console.log("[supabase.client.ts] URL:", last12(supabaseUrl), "KEY:", last6(supabaseAnonKey));

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your configuration.\n" +
      `URL: ${supabaseUrl ? "✓" : "✗"}, KEY: ${supabaseAnonKey ? "✓" : "✗"}`
  );
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export SupabaseClient type with Database typing
export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = "dac44a9c-c1a0-4c6b-bed0-127e367a4fe3";
