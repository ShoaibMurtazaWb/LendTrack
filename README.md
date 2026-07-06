# LendTrack

Neighborhood Tool & Item Lending Tracker — track items you lend to and borrow from friends, family, and neighbors.

## Stack

- **Frontend:** Next.js (App Router) + TanStack Query + Tailwind CSS
- **Backend:** Supabase (Postgres + Auth + Row Level Security)
- **Billing:** Stripe (Next.js API routes)
- **Email:** Gmail SMTP via Nodemailer (for future reminder cron)

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project

## Quick Start

1. **Install dependencies**

```bash
npm install
```

2. **Configure environment**

```bash
cp .env.example .env
```

Fill in your Supabase keys and optional Stripe / SMTP settings.

3. **Apply database migrations**

```bash
npm run db:push
```

4. **Run the app**

```bash
npm run dev
```

Open http://localhost:3000

## Project Structure

```
lendtrack/
├── apps/web/           # Next.js app (UI + Supabase client + API routes)
├── packages/
│   └── shared-types/   # Shared TypeScript types
└── supabase/
    └── migrations/     # SQL schema (source of truth)
```

## Architecture

- **Auth & CRUD** — Supabase client in the browser; RLS ensures users only access their own data
- **Stripe** — Next.js API routes at `/api/billing/*` (needs `SUPABASE_SERVICE_ROLE_KEY`)
- **Plan limits** — Enforced by a Postgres trigger (5 active loans on Free tier)

## Plans

| Tier    | Active Loans | Features                          |
| ------- | ------------ | --------------------------------- |
| Free    | 5            | Email reminders                   |
| Premium | Unlimited    | Weekly digest, priority reminders |
