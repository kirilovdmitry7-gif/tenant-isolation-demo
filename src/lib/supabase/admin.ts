import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses row level security entirely.
 *
 * It is used in exactly two places in this codebase: the feed importer and
 * the webhook handler. Both run server-side only. It is never imported into
 * a client component, and the key is never sent to the browser.
 */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
