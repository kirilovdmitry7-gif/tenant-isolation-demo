import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin, publicSupabaseConfig } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const IDENTITIES: Record<string, { email: string; label: string; org: string }> = {
  northwind: {
    email: "northwind@demo.local",
    label: "Client — Northwind Studio",
    org: "11111111-1111-1111-1111-111111111111",
  },
  acme: {
    email: "acme@demo.local",
    label: "Client — Acme Coffee Co",
    org: "22222222-2222-2222-2222-222222222222",
  },
  admin: {
    email: "admin@demo.local",
    label: "Admin — Northwind Studio",
    org: "11111111-1111-1111-1111-111111111111",
  },
};

const TARGETS: Record<string, { label: string; org: string }> = {
  northwind: { label: "Northwind Studio", org: "11111111-1111-1111-1111-111111111111" },
  acme: { label: "Acme Coffee Co", org: "22222222-2222-2222-2222-222222222222" },
};

/**
 * Runs one query twice and returns both answers.
 *
 * Once as the chosen signed-in user, through the public anon key — the same
 * path the browser uses, and the same path anyone poking at the REST API
 * would use. Once with the service role, which bypasses row level security.
 *
 * If the first returns nothing and the second returns rows, the isolation is
 * coming from the database, not from the page.
 */
export async function POST(req: Request) {
  try {
    return await run(req);
  } catch (e) {
    // Any failure answers in JSON. A page that cannot explain its own
    // breakage is worse than one that breaks loudly.
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unexpected server error" },
      { status: 500 }
    );
  }
}

async function run(req: Request) {
  const { identity, target } = (await req.json()) as {
    identity: string;
    target: string;
  };

  const who = IDENTITIES[identity];
  const what = TARGETS[target];
  if (!who || !what) {
    return NextResponse.json({ error: "unknown identity or target" }, { status: 400 });
  }

  const sql = `select id, name, status from projects where org_id = '${what.org}'`;

  const pub = publicSupabaseConfig();
  const asUser = createClient(pub.url, pub.key, {
    auth: { persistSession: false },
  });

  const { error: signInError } = await asUser.auth.signInWithPassword({
    email: who.email,
    password: process.env.DEMO_USER_PASSWORD ?? "demo-password",
  });
  if (signInError) {
    return NextResponse.json({ error: signInError.message }, { status: 500 });
  }

  const userQuery = await asUser
    .from("projects")
    .select("id, name, status")
    .eq("org_id", what.org);

  const adminQuery = await supabaseAdmin()
    .from("projects")
    .select("id, name, status")
    .eq("org_id", what.org);

  await asUser.auth.signOut();

  const sameOrg = who.org === what.org;
  return NextResponse.json({
    sql,
    identity: who.label,
    target: what.label,
    sameOrg,
    asUser: {
      rows: userQuery.data ?? [],
      count: userQuery.data?.length ?? 0,
      error: userQuery.error?.message ?? null,
    },
    asServiceRole: {
      count: adminQuery.data?.length ?? 0,
      error: adminQuery.error?.message ?? null,
    },
    verdict: sameOrg
      ? "Same tenant: the rows are returned, as they should be."
      : userQuery.data?.length === 0
      ? "Different tenant: the database returned nothing. The service role sees the rows, so they exist — the policy is what withheld them."
      : "UNEXPECTED: rows leaked across tenants. This demo would be failing its own test.",
  });
}
