# Working agreement

This file is read by Claude Code at the start of every session in this repo.
It is short on purpose: rules that are never enforced get ignored, so each one
here is either checked by a hook or by a subagent.

## Non-negotiables

1. **Every customer-owned table has `org_id` and RLS enabled in the same
   migration that creates it.** A table shipped without a policy is a leak
   waiting for traffic. The pre-commit hook rejects migrations that violate
   this, so there is no "I'll add it later".
2. **The service-role key never leaves the server.** It is permitted in
   `src/app/api/**` and `src/lib/supabase/admin.ts` only. Never in a
   component, never in anything marked `"use client"`.
3. **Webhook handlers read the raw body before parsing.** Signature
   verification happens on the bytes that arrived. If you find yourself
   calling `req.json()` first, stop.
4. **Anything that can be delivered twice needs an idempotency key.** Feed
   imports key on `(org_id, external_id)`; webhooks key on the provider's
   event id with a unique constraint carrying the weight.

## How to work here

- Migrations are append-only. Never edit a file in `supabase/migrations/`
  that has already been applied; add a new one.
- Before writing a migration, run the `migration-reviewer` subagent on it.
- Before claiming an access-control change is done, run the `rls-auditor`
  subagent. "I added a policy" is not evidence; a query that returns zero
  rows from the wrong tenant is.
- Prefer a failing demonstration over a reassuring sentence. The `/proof`
  page exists because a customer should be able to check the claim rather
  than trust it.

## Conventions

- TypeScript strict. No `any` in committed code.
- Server Components by default; `"use client"` only where there is state.
- Comments explain *why*, not *what*. If a line needs a comment to say what
  it does, rename things instead.
