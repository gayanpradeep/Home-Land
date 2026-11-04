# Home Lands – Centralized Customer Rating Management System

Customer feedback and emoji rating management system for Home Lands Holding (Pvt) Ltd.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- MongoDB (native driver, no ODM)
- Argon2id password hashing, server-side sessions
- TanStack Query, Recharts, Zod
- Playwright for e2e tests

## Setup

1. Copy `.env.local.example` to `.env.local` and fill in:
   - `MONGODB_URI` — your MongoDB Atlas connection string (rotate any credential that was ever shared in plaintext before using it here)
   - `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` — used once by `db:create-admin`

2. Install dependencies:

   ```
   npm install
   ```

3. Create database indexes:

   ```
   npm run db:create-indexes
   ```

4. Seed the 20 branches and their default departments:

   ```
   npm run db:seed-branches
   npm run db:seed-departments
   ```

5. Create the first Head Office Admin user:

   ```
   npm run db:create-admin
   ```

6. Run the dev server:

   ```
   npm run dev
   ```

## Project structure

- `src/app` — route groups: `(auth)`, `(customer)` kiosk rating screen, `(admin)` dashboard, `api/*` route handlers
- `src/lib` — MongoDB connection, auth, session, permissions, validation, constants
- `src/repositories` — data access per collection
- `src/services` — business logic consumed by route handlers
- `src/types` — shared TypeScript interfaces for all MongoDB collections
- `scripts` — one-off seed/admin scripts, run with `tsx`
- `tests` — Playwright e2e specs

## Status

Phase 1 complete: project scaffolding, MongoDB connection, collection schemas/indexes, seed scripts.
Next: Phase 2 — authentication and RBAC.
