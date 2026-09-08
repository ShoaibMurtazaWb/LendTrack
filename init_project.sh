#!/usr/bin/env bash
# =============================================================================
# LendTrack :: Phase 1 Bootstrap Script
#
# Run this once to create the full folder structure and write every Phase 1
# file with its real, complete content. No manual copy-pasting required.
#
# Usage:
#   chmod +x init_project.sh
#   ./init_project.sh
#
# This creates a new "lendtrack/" directory in your current working
# directory. If it already exists, the script will refuse to overwrite it.
# =============================================================================

set -euo pipefail

if [ -d "lendtrack" ]; then
  echo "ERROR: ./lendtrack already exists. Remove it or run this script"
  echo "from a different directory, then re-run."
  exit 1
fi

echo "Creating LendTrack project structure..."

mkdir -p lendtrack/apps/web
mkdir -p lendtrack/apps/api
mkdir -p lendtrack/packages/shared-types
mkdir -p lendtrack/supabase/migrations

cd lendtrack

# -----------------------------------------------------------------------
# root package.json
# -----------------------------------------------------------------------
cat > package.json << 'EOF'
{
  "name": "lendtrack",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "engines": {
    "node": ">=18.18.0",
    "npm": ">=9.0.0"
  },
  "scripts": {
    "dev": "concurrently -n SUPABASE,API,WEB -c blue,green,magenta \"npm run dev:supabase\" \"npm run dev:api\" \"npm run dev:web\"",
    "dev:supabase": "supabase start",
    "dev:api": "npm run dev --workspace=apps/api",
    "dev:web": "npm run dev --workspace=apps/web",
    "build": "npm run build --workspace=apps/api && npm run build --workspace=apps/web",
    "build:api": "npm run build --workspace=apps/api",
    "build:web": "npm run build --workspace=apps/web",
    "start:api": "npm run start --workspace=apps/api",
    "start:web": "npm run start --workspace=apps/web",
    "lint": "npm run lint --workspace=apps/api && npm run lint --workspace=apps/web",
    "typecheck": "npm run typecheck --workspace=apps/api && npm run typecheck --workspace=apps/web",
    "test": "npm run test --workspace=apps/api && npm run test --workspace=apps/web",
    "clean": "npm run clean --workspaces --if-present && rimraf node_modules apps/*/node_modules packages/*/node_modules apps/*/dist apps/*/.next",
    "supabase:stop": "supabase stop",
    "db:migrate": "supabase migration up",
    "db:new": "supabase migration new",
    "db:reset": "supabase db reset",
    "db:push": "supabase db push",
    "db:diff": "supabase db diff",
    "prepare": "husky install || true"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "rimraf": "^5.0.5",
    "husky": "^9.0.11",
    "typescript": "^5.4.5"
  }
}
EOF
echo "  ✓ package.json"

# -----------------------------------------------------------------------
# .env.example
# -----------------------------------------------------------------------
cat > .env.example << 'EOF'
# =============================================================================
# LendTrack :: Environment Variables Template
# Copy this file to .env (root) and/or apps/api/.env and apps/web/.env.local
# as appropriate for your setup. NEVER commit real secrets.
# =============================================================================

# --- Supabase -----------------------------------------------------------
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# --- Express API ----------------------------------------------------------
PORT=4000
NODE_ENV=development
JWT_SECRET=
API_BASE_PATH=/api/v1
CORS_ORIGIN=http://localhost:3000

# --- Nodemailer -------------------------------------------------------------
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@lendtrack.app

# --- Reminder Scheduler (node-cron) ------------------------------------
REMINDER_CRON_SCHEDULE="0 8 * * *"
REMINDER_PRE_DUE_DAYS=2

# --- Stripe -----------------------------------------------------------------
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_PREMIUM=

# --- Next.js (public, exposed to browser) ------------------------------
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
EOF
echo "  ✓ .env.example"

# -----------------------------------------------------------------------
# .gitignore
# -----------------------------------------------------------------------
cat > .gitignore << 'EOF'
# dependencies
node_modules/
.pnp
.pnp.js

# env
.env
.env.local
.env.*.local
!.env.example

# build output
apps/*/dist/
apps/web/.next/
apps/web/out/
.turbo/

# supabase local state
supabase/.branches/
supabase/.temp/

# logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.log

# OS / editor
.DS_Store
.vscode/
.idea/

# misc
coverage/
EOF
echo "  ✓ .gitignore"

# -----------------------------------------------------------------------
# supabase/migrations/20260701000000_init_schema.sql
# -----------------------------------------------------------------------
cat > supabase/migrations/20260701000000_init_schema.sql << 'EOF'
-- =============================================================================
-- LendTrack :: Initial Schema Migration
-- 20260701000000_init_schema.sql
--
-- Creates all core tables for LendTrack: profiles, contacts, items, loans,
-- reminder_logs, subscriptions. Defines explicit Postgres ENUM types,
-- primary/foreign keys, constraints, indexes, and updated_at triggers.
--
-- NOTE: RLS is enabled per-table here as a safety default, but the actual
-- policies are defined in 20260701000100_rls_policies.sql.
-- =============================================================================

-- Required extensions -------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'plan_type') then
    create type public.plan_type as enum ('free', 'premium');
  end if;

  if not exists (select 1 from pg_type where typname = 'loan_direction') then
    create type public.loan_direction as enum ('lent_out', 'borrowed');
  end if;

  if not exists (select 1 from pg_type where typname = 'loan_status') then
    create type public.loan_status as enum ('active', 'returned', 'overdue', 'lost');
  end if;

  if not exists (select 1 from pg_type where typname = 'reminder_type') then
    create type public.reminder_type as enum ('pre_due', 'overdue', 'weekly_digest');
  end if;

  if not exists (select 1 from pg_type where typname = 'reminder_status') then
    create type public.reminder_status as enum ('sent', 'failed');
  end if;

  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum ('active', 'canceled', 'past_due');
  end if;
end
$$;

-- =============================================================================
-- SHARED TRIGGER FUNCTION: auto-update updated_at columns
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- TABLE: profiles
-- Extends auth.users (1:1). id is both PK and FK to auth.users.
-- =============================================================================

create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  full_name            text,
  avatar_url           text,
  plan                 public.plan_type not null default 'free',
  stripe_customer_id   text,
  notification_prefs   jsonb not null default '{"email_reminders": true, "weekly_digest": false}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table public.profiles is 'One row per authenticated user, extends auth.users.';

create unique index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- =============================================================================
-- TABLE: contacts
-- Friends/family/neighbors items are lent to or borrowed from.
-- Soft-delete supported via deleted_at.
-- =============================================================================

create table if not exists public.contacts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  name         text not null check (char_length(trim(name)) > 0),
  email        text check (email is null or email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone        text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index if not exists contacts_user_id_idx on public.contacts (user_id);
create index if not exists contacts_user_id_active_idx on public.contacts (user_id) where deleted_at is null;

drop trigger if exists trg_contacts_updated_at on public.contacts;
create trigger trg_contacts_updated_at
  before update on public.contacts
  for each row
  execute function public.set_updated_at();

-- =============================================================================
-- TABLE: items
-- Physical items owned by the user that may be lent out or tracked as borrowed.
-- =============================================================================

create table if not exists public.items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null check (char_length(trim(name)) > 0),
  category      text,
  description   text,
  photo_url     text,
  archived      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists items_user_id_idx on public.items (user_id);
create index if not exists items_user_id_active_idx on public.items (user_id) where archived = false;

drop trigger if exists trg_items_updated_at on public.items;
create trigger trg_items_updated_at
  before update on public.items
  for each row
  execute function public.set_updated_at();

-- =============================================================================
-- TABLE: loans
-- The core lending/borrowing record linking a user, item, and contact.
-- =============================================================================

create table if not exists public.loans (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  item_id               uuid not null references public.items(id) on delete cascade,
  contact_id            uuid not null references public.contacts(id) on delete restrict,
  direction             public.loan_direction not null,
  loaned_at             date not null,
  expected_return_at    date,
  returned_at           date,
  status                public.loan_status not null default 'active',
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint loans_expected_return_after_loaned
    check (expected_return_at is null or expected_return_at >= loaned_at),

  constraint loans_returned_after_loaned
    check (returned_at is null or returned_at >= loaned_at),

  constraint loans_returned_requires_status
    check (
      (status = 'returned' and returned_at is not null)
      or (status <> 'returned')
    )
);

create index if not exists loans_user_id_idx on public.loans (user_id);
create index if not exists loans_item_id_idx on public.loans (item_id);
create index if not exists loans_contact_id_idx on public.loans (contact_id);
create index if not exists loans_status_idx on public.loans (status);
create index if not exists loans_direction_idx on public.loans (direction);
create index if not exists loans_user_status_idx on public.loans (user_id, status);
create index if not exists loans_expected_return_at_idx on public.loans (expected_return_at)
  where status in ('active', 'overdue');

drop trigger if exists trg_loans_updated_at on public.loans;
create trigger trg_loans_updated_at
  before update on public.loans
  for each row
  execute function public.set_updated_at();

-- =============================================================================
-- TABLE: reminder_logs
-- Audit trail of every reminder email attempt. Written only by the backend
-- (service_role) via the node-cron scheduler / mailer service.
-- =============================================================================

create table if not exists public.reminder_logs (
  id          uuid primary key default gen_random_uuid(),
  loan_id     uuid not null references public.loans(id) on delete cascade,
  type        public.reminder_type not null,
  sent_at     timestamptz not null default now(),
  status      public.reminder_status not null
);

create index if not exists reminder_logs_loan_id_idx on public.reminder_logs (loan_id);
create index if not exists reminder_logs_type_idx on public.reminder_logs (type);
create index if not exists reminder_logs_sent_at_idx on public.reminder_logs (sent_at);

-- =============================================================================
-- TABLE: subscriptions
-- Stripe subscription state per user, synced via billing webhook.
-- =============================================================================

create table if not exists public.subscriptions (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.profiles(id) on delete cascade,
  provider_subscription_id    text not null,
  status                      public.subscription_status not null default 'active',
  current_period_end          timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create unique index if not exists subscriptions_provider_subscription_id_idx
  on public.subscriptions (provider_subscription_id);
create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function public.set_updated_at();

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY (policies defined in the next migration)
-- =============================================================================

alter table public.profiles       enable row level security;
alter table public.contacts       enable row level security;
alter table public.items          enable row level security;
alter table public.loans          enable row level security;
alter table public.reminder_logs  enable row level security;
alter table public.subscriptions  enable row level security;
EOF
echo "  ✓ supabase/migrations/20260701000000_init_schema.sql"

# -----------------------------------------------------------------------
# supabase/migrations/20260701000100_rls_policies.sql
# -----------------------------------------------------------------------
cat > supabase/migrations/20260701000100_rls_policies.sql << 'EOF'
-- =============================================================================
-- LendTrack :: Row Level Security Policies
-- 20260701000100_rls_policies.sql
--
-- Enforces:
--   - Every authenticated user can only read/write rows where user_id = auth.uid()
--   - reminder_logs is fully locked to the backend service_role (no direct
--     end-user access, since it is only ever written/read by the Express
--     API's node-cron scheduler using the service_role key).
--   - subscriptions can be READ by the owning user, but only mutated by
--     service_role (Stripe webhook handling happens server-side only).
--
-- All tables already have RLS enabled from 20260701000000_init_schema.sql.
-- =============================================================================

-- =============================================================================
-- PROFILES
-- =============================================================================

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_service_role_all" on public.profiles;
create policy "profiles_service_role_all"
  on public.profiles
  for all
  to service_role
  using (true)
  with check (true);

-- =============================================================================
-- CONTACTS
-- =============================================================================

drop policy if exists "contacts_select_own" on public.contacts;
create policy "contacts_select_own"
  on public.contacts
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "contacts_insert_own" on public.contacts;
create policy "contacts_insert_own"
  on public.contacts
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "contacts_update_own" on public.contacts;
create policy "contacts_update_own"
  on public.contacts
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "contacts_delete_own" on public.contacts;
create policy "contacts_delete_own"
  on public.contacts
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "contacts_service_role_all" on public.contacts;
create policy "contacts_service_role_all"
  on public.contacts
  for all
  to service_role
  using (true)
  with check (true);

-- =============================================================================
-- ITEMS
-- =============================================================================

drop policy if exists "items_select_own" on public.items;
create policy "items_select_own"
  on public.items
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "items_insert_own" on public.items;
create policy "items_insert_own"
  on public.items
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "items_update_own" on public.items;
create policy "items_update_own"
  on public.items
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "items_delete_own" on public.items;
create policy "items_delete_own"
  on public.items
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "items_service_role_all" on public.items;
create policy "items_service_role_all"
  on public.items
  for all
  to service_role
  using (true)
  with check (true);

-- =============================================================================
-- LOANS
-- =============================================================================

drop policy if exists "loans_select_own" on public.loans;
create policy "loans_select_own"
  on public.loans
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "loans_insert_own" on public.loans;
create policy "loans_insert_own"
  on public.loans
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "loans_update_own" on public.loans;
create policy "loans_update_own"
  on public.loans
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "loans_delete_own" on public.loans;
create policy "loans_delete_own"
  on public.loans
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "loans_service_role_all" on public.loans;
create policy "loans_service_role_all"
  on public.loans
  for all
  to service_role
  using (true)
  with check (true);

-- =============================================================================
-- REMINDER_LOGS — locked to service_role only. No policies for
-- authenticated/anon are added, which means those roles get zero rows and
-- zero mutation rights under RLS by default.
-- =============================================================================

drop policy if exists "reminder_logs_service_role_all" on public.reminder_logs;
create policy "reminder_logs_service_role_all"
  on public.reminder_logs
  for all
  to service_role
  using (true)
  with check (true);

-- =============================================================================
-- SUBSCRIPTIONS — owner gets SELECT only; all writes via service_role
-- (Stripe webhook handler).
-- =============================================================================

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "subscriptions_service_role_all" on public.subscriptions;
create policy "subscriptions_service_role_all"
  on public.subscriptions
  for all
  to service_role
  using (true)
  with check (true);
EOF
echo "  ✓ supabase/migrations/20260701000100_rls_policies.sql"

# -----------------------------------------------------------------------
# placeholder README so empty dirs survive git + orient a new dev
# -----------------------------------------------------------------------
cat > README.md << 'EOF'
# LendTrack

Monorepo web app for tracking tools/items lent to and borrowed from
friends, family, and neighbors.

See `STEP_BY_STEP_GUIDE.md` (delivered alongside this script) for the full
setup and build-out process, and `HANDOFF_PROMPT.md` if you need to resume
work in a new AI chat session.

## Structure
- `apps/web` — Next.js frontend
- `apps/api` — Express.js backend
- `packages/shared-types` — shared TypeScript types
- `supabase/migrations` — SQL schema + RLS policies

## Quick start
```bash
cp .env.example .env      # fill in real values
supabase start
supabase migration up
npm install
npm run dev
```
EOF
echo "  ✓ README.md"

echo ""
echo "Done. Project created at ./lendtrack"
echo ""
echo "Next steps:"
echo "  cd lendtrack"
echo "  cp .env.example .env   # then fill in real Supabase/Stripe/SMTP values"
echo "  supabase start"
echo "  supabase migration up"
echo "  npm install"
