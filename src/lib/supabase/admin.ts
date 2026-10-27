import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses row level security entirely.
 *
 * It is used in exactly two places in this codebase: the feed importer and
 * the webhook handler, plus the proof endpoint that deliberately contrasts
 * it with a normal user. All of them run server-side only. It is never
 * imported into a client component, and the key is never sent to the browser.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Name the missing variable. A deployment that is simply misconfigured
  // should say so, rather than failing somewhere deep in a client library
  // and reaching the browser as an empty response.
  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !key && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);
  if (missing.length > 0) {
    throw new Error(`Missing environment variable(s): ${missing.join(", ")}`);
  }

  return createClient(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** The public pair, validated the same way. */
export function publicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !key && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter(Boolean);
  if (missing.length > 0) {
    throw new Error(`Missing environment variable(s): ${missing.join(", ")}`);
  }
  return { url: url!, key: key! };
}
