// Creates the three demo identities and their memberships.
// Demo-only credentials; this script is never run against anything real.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.DEMO_USER_PASSWORD ?? "demo-password";
if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");

const NORTHWIND = "11111111-1111-1111-1111-111111111111";
const ACME = "22222222-2222-2222-2222-222222222222";

const people = [
  { email: "northwind@demo.local", org: NORTHWIND, role: "client" },
  { email: "acme@demo.local", org: ACME, role: "client" },
  { email: "admin@demo.local", org: NORTHWIND, role: "admin" },
];

const db = createClient(url, key, { auth: { persistSession: false } });

for (const p of people) {
  const { data, error } = await db.auth.admin.createUser({
    email: p.email,
    password,
    email_confirm: true,
  });

  let userId = data?.user?.id;
  if (error) {
    if (!/already/i.test(error.message)) throw error;
    const { data: list } = await db.auth.admin.listUsers();
    userId = list.users.find((u) => u.email === p.email)?.id;
  }
  if (!userId) throw new Error(`could not resolve user for ${p.email}`);

  const { error: mErr } = await db
    .from("memberships")
    .upsert({ user_id: userId, org_id: p.org, role: p.role });
  if (mErr) throw mErr;

  console.log(`ok  ${p.email}  ${p.role}`);
}
console.log("done");
