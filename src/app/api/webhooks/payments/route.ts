import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifySignature } from "@/lib/hmac";

export const dynamic = "force-dynamic";

/**
 * Inbound payment webhook.
 *
 * Order of operations is deliberate:
 *   1. read the RAW body (never req.json() first — re-serialising breaks the hash)
 *   2. verify the signature
 *   3. record the event id; a duplicate is a no-op, not a second grant
 *   4. only then act on it
 *
 * Skipping step 2 turns this URL into a free-product button for anyone who
 * learns it. Skipping step 3 means a provider retry grants access twice.
 */
export async function POST(req: Request) {
  try {
    return await run(req);
  } catch (e) {
    return NextResponse.json(
      { accepted: false, reason: e instanceof Error ? e.message : "unexpected server error" },
      { status: 500 }
    );
  }
}

async function run(req: Request) {
  const raw = await req.text();
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "server not configured" }, { status: 500 });
  }

  const check = verifySignature(raw, req.headers.get("x-signature"), secret);
  if (!check.ok) {
    // 400, not 401: the caller is not a user, and we do not want retries.
    return NextResponse.json({ accepted: false, reason: check.reason }, { status: 400 });
  }

  let event: { id?: string; type?: string };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ accepted: false, reason: "body is not JSON" }, { status: 400 });
  }
  if (!event.id || !event.type) {
    return NextResponse.json({ accepted: false, reason: "id and type are required" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { error } = await db.from("webhook_events").insert({
    provider: "demo-payments",
    external_id: event.id,
    event_type: event.type,
    payload: event,
  });

  if (error) {
    // 23505 is unique_violation: we have seen this delivery already.
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({
        accepted: true,
        duplicate: true,
        note: "Already processed. Nothing was granted a second time.",
      });
    }
    return NextResponse.json({ accepted: false, reason: error.message }, { status: 500 });
  }

  return NextResponse.json({
    accepted: true,
    duplicate: false,
    note: "Signature verified and event recorded. Entitlement would be granted here.",
  });
}
