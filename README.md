<div align="center">

# LendTrack

### Neighborhood Lending Tracker

Track the items you lend and borrow — with reminders, linked contacts, realtime messaging, and premium plans.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

<br/>

[![Live Demo](https://img.shields.io/badge/Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://lend-track-psi.vercel.app/)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Security & Data Integrity](#security--data-integrity)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Deploy on Vercel](#deploy-on-vercel)
- [Skills Demonstrated](#skills-demonstrated)
- [Status & Roadmap](#status--roadmap)

---

## Overview

LendTrack solves a common real-world problem: people lose track of the items they lend and borrow.
It pairs a friendly product experience with a secure, multi-user backend built on Supabase.

> Add screenshots or a short demo GIF here — for example `docs/images/dashboard.png` — to make the repo instantly credible.

---

## Features

| Area | What it does |
| :--- | :--- |
| Loan lifecycle | Track loans through `active`, `returned`, `overdue`, and `lost` states |
| Contacts & items | Manage the people you lend to and the items you own |
| Realtime messaging | Message linked users with realtime updates |
| Reminders | Email pipeline for due-soon, overdue, and digest notifications |
| Billing | Premium plan flow with Stripe Checkout and webhooks |

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Framework | Next.js (App Router) |
| UI | React, Tailwind CSS, shadcn/ui |
| Data fetching | TanStack Query |
| Backend | Supabase (Postgres + Auth + Row Level Security) |
| Server ops | Next.js API routes (billing, cron, email) |
| Billing | Stripe Checkout + Webhooks |
| Language | TypeScript |

---

## Architecture

- **Frontend:** Next.js App Router under `apps/web/src/app`, with TanStack Query for data fetching and caching.
- **Backend:** Supabase Postgres with Auth and Row Level Security so each user only accesses their own data.
- **Server operations:** Sensitive work (billing, cron, email) runs through Next.js API routes using the service role key.
- **Billing:** Stripe Checkout with webhook processing that keeps subscription state in sync.

---

## Security & Data Integrity

- Row Level Security policies isolate every user's data at the database layer.
- The service role key is used only on secure server routes, never in the browser.
- Sensitive API endpoints validate authentication before running.
- Cron reminders require `Authorization: Bearer <CRON_SECRET>`.

---

## Project Structure

```text
lendtrack/
├── apps/web/                 # Next.js app (UI + API routes in src/app)
├── packages/shared-types/    # Shared TypeScript interfaces
├── supabase/migrations/      # SQL schema and migrations (source of truth)
└── vercel.json               # Vercel Cron schedule (repo root)
```

---

## Getting Started

**Prerequisites:** Node.js 20+ and a Supabase project.

```bash
# 1. Install dependencies (monorepo root)
npm install

# 2. Configure environment
cp .env.example .env    # fill in Supabase, Stripe, and SMTP values

# 3. Apply database migrations
npm run db:push

# 4. Run the app
npm run dev
```

Open http://localhost:3000

---

## Deploy on Vercel

This repo is an **npm workspaces monorepo**. Configure the Vercel project as follows:

| Setting | Value |
| :--- | :--- |
| Root Directory | Repository root (`.`) |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Framework | Next.js |

### Environment variables (Vercel dashboard)

Set these for **Production** (names match `.env.example` — never commit secret values):

| Variable | Notes |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Hosted Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only |
| `NEXT_PUBLIC_APP_URL` | `https://lend-track-psi.vercel.app` (or custom domain) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | Email delivery |
| `EMAIL_FROM` | From header |
| `CRON_SECRET` | Must match Bearer token used by Vercel Cron |
| `STRIPE_SECRET_KEY` | Server only |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook endpoint |
| `STRIPE_PRICE_ID_PREMIUM` | Premium price ID |

### External dashboard checklist

1. **Supabase Auth** — add the production site URL and redirect allowlist (including `/auth/reset-password`).
2. **Stripe** — webhook endpoint: `https://<your-domain>/api/billing/webhook`.
3. **Vercel Cron** — defined in root `vercel.json` as daily `GET /api/cron/loan-reminders` (requires `CRON_SECRET`).

Live demo: [https://lend-track-psi.vercel.app/](https://lend-track-psi.vercel.app/)

---

## Skills Demonstrated

`Next.js` · `TypeScript` · `Supabase` · `PostgreSQL` · `Authentication` · `Authorization` · `Row Level Security` · `Realtime` · `Stripe Integration` · `API Route Design`

---

## Status & Roadmap

Active and evolving — core product architecture and flows are implemented.

Planned improvements:
- Screenshots for the README
- Broader automated test coverage
- Distributed rate limiting for API routes
