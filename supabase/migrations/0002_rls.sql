-- 0002_rls.sql
-- Access control lives here, in the database, not in page code.
--
-- The rule for every customer-owned table is the same: a row is visible only
-- if the current user holds a membership in that row's org. An admin holds a
-- membership with role 'admin'; that is the only difference between an admin
-- and a client, and it is data, not code.
--
-- Because this is enforced by Postgres, changing an id in a URL, calling the
-- REST API directly, or opening the browser console all produce the same
-- result: zero rows.

alter table public.orgs          enable row level security;
alter table public.memberships   enable row level security;
alter table public.projects      enable row level security;
alter table public.deliverables  enable row level security;
alter table public.listings      enable row level security;
alter table public.webhook_events enable row level security;
alter table public.import_runs   enable row level security;

-- Helper: is the caller a member of this org?
-- SECURITY DEFINER so the policy can read memberships without recursing into
-- the policy on memberships itself.
create or replace function public.is_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = target_org
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_admin(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = target_org
      and m.user_id = auth.uid()
      and m.role = 'admin'
  );
$$;

-- orgs: you see an org only if you belong to it.
create policy orgs_select on public.orgs
  for select using (public.is_member(id));

-- memberships: you see your own memberships; an admin sees the whole org.
create policy memberships_select on public.memberships
  for select using (user_id = auth.uid() or public.is_org_admin(org_id));

-- projects: read for any member, write for admins only.
create policy projects_select on public.projects
  for select using (public.is_member(org_id));
create policy projects_write on public.projects
  for all using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

-- deliverables: same shape. The file bytes live in Storage and are handed out
-- as short-lived signed URLs; this row-level check is what decides whether a
-- signed URL is ever minted at all.
create policy deliverables_select on public.deliverables
  for select using (public.is_member(org_id));
create policy deliverables_write on public.deliverables
  for all using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

-- listings: readable by members. Writes come from the importer, which runs
-- server-side with the service role and therefore bypasses RLS by design.
create policy listings_select on public.listings
  for select using (public.is_member(org_id));

-- webhook_events and import_runs are operational tables. No policy is created
-- for them, so with RLS enabled no client key can read them at all; only
-- server-side code holding the service role can.
