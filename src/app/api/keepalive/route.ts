import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { publicSupabaseConfig } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Daily keep-alive, called by the Vercel cron in vercel.json.
 *
 * Free Supabase projects pause after a period of inactivity, and a paused
 * database turns this demo into an error page exactly when someone finally
 * opens the link. One cheap query a day prevents that.
 *
 * It deliberately uses the public key, not the service role: the endpoint is
 * reachable by anyone, so it must not be able to do anything a visitor
 * couldn't. Row level security still applies, so it reads nothing.
 */
export async function GET() {
  try {
    const { url, key } = publicSupabaseConfig();
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await db.from("orgs").select("id", { head: true, count: "exact" });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 502 });
    }
    return NextResponse.json({ ok: true, at: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unexpected server error" },
      { status: 500 }
    );
  }
}
