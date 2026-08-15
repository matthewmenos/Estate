import { createClient } from "@supabase/supabase-js";

// Safe to use in the browser — respects Row Level Security policies.
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ⚠️ SECURITY WARNING: NEXT_PUBLIC_ prefix exposes this env var to the browser.
// The service role key bypasses ALL Row Level Security (RLS) policies.
// Anyone viewing page source can extract it and access/modify all data.
// Only use NEXT_PUBLIC_ prefix in development/trusted environments.
export function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
