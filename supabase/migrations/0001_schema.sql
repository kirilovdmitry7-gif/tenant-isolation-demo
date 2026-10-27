-- 0001_schema.sql
-- Core tables for a multi-tenant client portal.
-- Every row that belongs to a customer carries org_id. That column is the
-- only thing the access policies in 0002 ever look at.

create extension if not exists "pgcrypto";

create table public.orgs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

-- Links an authenticated user to an org and gives them a role inside it.
create table public.memberships (
  user_id     uuid not null references auth.users(id) on delete cascade,
  org_id      uuid not null references public.orgs(id) on delete cascade,
  role        text not null check (role in ('admin','client')),
  created_at  timestamptz not null default now(),
  primary key (user_id, org_id)
);

create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  name        text not null,
  status      text not null default 'in_progress'
              check (status in ('in_progress','in_review','delivered')),
  created_at  timestamptz not null default now()
);
create index projects_org_id_idx on public.projects (org_id);

create table public.deliverables (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  org_id       uuid not null references public.orgs(id) on delete cascade,
  label        text not null,
  storage_path text not null,
  size_bytes   bigint not null default 0,
  created_at   timestamptz not null default now()
);
create index deliverables_org_id_idx on public.deliverables (org_id);

-- Idempotency ledger for inbound webhooks. The unique constraint is what
-- makes a replayed delivery a no-op instead of a double grant.
create table public.webhook_events (
  id            bigserial primary key,
  provider      text not null,
  external_id   text not null,
  event_type    text not null,
  payload       jsonb not null,
  received_at   timestamptz not null default now(),
  unique (provider, external_id)
);

-- Audit of feed imports so a re-run can be proven to change nothing.
create table public.import_runs (
  id           bigserial primary key,
  source       text not null,
  inserted     int not null default 0,
  updated      int not null default 0,
  unchanged    int not null default 0,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz
);

-- Catalogue rows arriving from an external feed. external_id is the natural
-- key the feed owns; the unique index is what makes the upsert idempotent.
create table public.listings (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.orgs(id) on delete cascade,
  external_id   text not null,
  title         text not null,
  price_cents   bigint not null,
  content_hash  text not null,
  updated_at    timestamptz not null default now()
);
create unique index listings_org_external_idx on public.listings (org_id, external_id);
