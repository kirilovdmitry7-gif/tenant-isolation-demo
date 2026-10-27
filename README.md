# Tenant Isolation Demo

A small Next.js + Supabase application that **demonstrates** its own access
control rather than claiming it.

Open `/proof`, choose an identity, aim a query at another tenant's data and
press run. The same query executes twice: once as that signed-in user through
the public key, and once with the service role that bypasses row level
security. The first returns nothing; the second returns the rows. That
difference is the evidence — the rows exist, and the database is what
withheld them.

This repository exists as a public work sample. There is no real customer
data in it, and it is not connected to any production system.

---

## What it shows

**Isolation enforced in the database.** Row level security on every
customer-owned table, with policies keyed on `auth.uid()` through a
membership table. Changing an id in the URL, or calling the REST API
directly with the public key, produces the same answer as the UI: zero rows.
See `supabase/migrations/0002_rls.sql`.

**An import that is safe to run twice.** The feed importer keys on
`(org_id, external_id)` and compares a content hash before writing. Run it on
an unchanged feed and the second run performs zero writes, which is what makes
`updated_at` and any "what changed today" query mean anything.
See `src/app/api/import/route.ts`.

**A webhook that cannot be forged or replayed.** HMAC computed over the raw
request body, constant-time comparison, a timestamp window, and a unique
event ledger so a provider retry is a no-op rather than a second grant.
See `src/lib/hmac.ts` and `src/app/api/webhooks/payments/route.ts`.

**Large file delivery.** Deliverables are handed out as short-lived signed
URLs; files never pass through the application server, which is what keeps a
2–3 GB video from timing out a serverless function.

---

## How it was built

With Claude Code, under a checked-in working agreement:

- [`CLAUDE.md`](./CLAUDE.md) — four non-negotiable rules, each one backed by
  either a hook or a subagent, because a rule nothing enforces is decoration.
- [`.claude/agents/rls-auditor.md`](./.claude/agents/rls-auditor.md) — an
  adversarial access-control audit that is required to produce a query
  proving a leak, not an opinion that there isn't one.
- [`.claude/agents/migration-reviewer.md`](./.claude/agents/migration-reviewer.md)
  — reviews a migration before it is applied, and must state the rollback.
- [`.claude/hooks/check-rls.sh`](./.claude/hooks/check-rls.sh) — a pre-commit
  hook that blocks any migration creating a table with `org_id` while never
  enabling row level security on it.

---

## Running it

```bash
cp .env.example .env.local      # fill in your Supabase project values
npm install
npm run dev
```

Apply the schema in order:

```
supabase/migrations/0001_schema.sql
supabase/migrations/0002_rls.sql
supabase/seed.sql
```

Then create the three demo users (`northwind@`, `acme@`, `admin@demo.local`)
and their memberships with `scripts/seed-users.mjs`.

## Layout

```
supabase/migrations/   schema, then the access policies, separately
src/lib/supabase/      two clients: one that obeys RLS, one that bypasses it
src/lib/hmac.ts        signature verification, commented with the three traps
src/app/api/           import, webhook, and the proof runner
src/app/proof/         the page that tries to break the isolation
.claude/               the agents and hook that enforce CLAUDE.md
```

Licensed MIT.
