import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { contentHash, sampleFeed } from "@/lib/feed";

export const dynamic = "force-dynamic";

const DEMO_ORG = "11111111-1111-1111-1111-111111111111";

/**
 * Idempotent feed import.
 *
 * The point of this endpoint is the second run. A feed that has not changed
 * must produce zero writes, not four identical updates: without that, every
 * nightly run rewrites the table, every updated_at is meaningless, and any
 * downstream "what changed today" query is noise.
 *
 * Idempotency is bought with two things: a unique key the feed owns
 * (org_id, external_id), and a content hash so an unchanged row is skipped
 * before it is written.
 */
export async function POST() {
  const db = supabaseAdmin();
  const items = sampleFeed();

  const { data: run, error: runErr } = await db
    .from("import_runs")
    .insert({ source: "sample-feed" })
    .select()
    .single();
  if (runErr) {
    return NextResponse.json({ error: runErr.message }, { status: 500 });
  }

  const { data: existing, error: readErr } = await db
    .from("listings")
    .select("external_id, content_hash")
    .eq("org_id", DEMO_ORG);
  if (readErr) {
    return NextResponse.json({ error: readErr.message }, { status: 500 });
  }

  const known = new Map(
    (existing ?? []).map((r) => [r.external_id as string, r.content_hash as string])
  );

  let inserted = 0;
  let updated = 0;
  let unchanged = 0;
  const changed: { org_id: string; external_id: string; title: string; price_cents: number; content_hash: string; updated_at: string }[] = [];

  for (const item of items) {
    const hash = contentHash(item);
    const prev = known.get(item.externalId);
    if (prev === hash) {
      unchanged++;
      continue;
    }
    if (prev === undefined) inserted++;
    else updated++;
    changed.push({
      org_id: DEMO_ORG,
      external_id: item.externalId,
      title: item.title,
      price_cents: item.priceCents,
      content_hash: hash,
      updated_at: new Date().toISOString(),
    });
  }

  if (changed.length > 0) {
    const { error: upErr } = await db
      .from("listings")
      .upsert(changed, { onConflict: "org_id,external_id" });
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }
  }

  await db
    .from("import_runs")
    .update({ inserted, updated, unchanged, finished_at: new Date().toISOString() })
    .eq("id", run.id);

  return NextResponse.json({
    runId: run.id,
    received: items.length,
    inserted,
    updated,
    unchanged,
    writes: changed.length,
    note:
      changed.length === 0
        ? "Nothing changed in the feed, so nothing was written."
        : `${changed.length} row(s) written.`,
  });
}
