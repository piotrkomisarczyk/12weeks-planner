import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types.ts";

// Use public env vars for client-side, private env vars for server-side
const supabaseUrl = typeof window !== "undefined" ? import.meta.env.PUBLIC_SUPABASE_URL : import.meta.env.SUPABASE_URL;

const supabaseAnonKey =
  typeof window !== "undefined" ? import.meta.env.PUBLIC_SUPABASE_ANON_KEY : import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export SupabaseClient type with Database typing
export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = "dac44a9c-c1a0-4c6b-bed0-127e367a4fe3";
