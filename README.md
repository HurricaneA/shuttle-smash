# Shuttle Smash Championship 2026

A single-page web app for a church community girls' doubles badminton tournament. It does two
things:

1. **Presents the event and its rules** — on-brand with the tournament's navy-and-gold identity.
2. **Shows a live single-elimination bracket** that everyone can read, which **one organizer**
   logs in to update as matches finish.

Built as **one Vercel project**: a Vite + React + Tailwind SPA plus serverless API functions in
`/api`, backed by **Prisma Postgres**. Public visitors read the bracket; only the authenticated
admin can change it. The repo can stay **public** — no secret ever lives in the code.

---

## Tech stack

- **Frontend:** Vite, React, TypeScript, Tailwind CSS, React Router
- **Backend:** Vercel serverless functions (`/api/*.ts`)
- **Database:** Prisma ORM + Prisma Postgres
- **Auth:** HMAC-signed session cookie (no JWT), verified server-side

## Project structure

```
api/            serverless functions + _lib/ (bracket logic, auth, prisma, store)
prisma/         schema.prisma + seed.ts
src/            React app (pages/, components/, content/, types/, hooks/, api/)
public/         logo.png, favicon
PRODUCT.md      brand/strategy context (for impeccable design passes)
DESIGN.md       visual system context
```

The bracket "engine" lives in [`api/_lib/bracket.ts`](api/_lib/bracket.ts): match results are
stored minimally (`{ seededTeamIds, results }`) and the full tree is **derived on read**, so
fixing an earlier result automatically clears any now-invalid later matches.

---

## Before you start — two things to add

1. **Logo:** save the tournament logo as **`public/logo.png`** (until then the app shows a
   text badge fallback).
2. **Rules:** the tournament rules live in one plain file,
   [`src/content/rules.ts`](src/content/rules.ts) — replace the sample text with your real
   rules. Event facts are in [`src/content/event.ts`](src/content/event.ts). Brand colors are in
   [`src/index.css`](src/index.css).

---

## Local development

### 1. Install

```bash
npm install
```

### 2. Configure secrets

Copy the example and fill it in (this file is gitignored — never commit it):

```bash
cp .env.example .env
```

- `DATABASE_URL` — your Prisma Postgres connection string (see "Database" below).
- `ADMIN_PASSWORD` — the single password the organizer uses to log in.
- `ADMIN_SESSION_SECRET` — random signing key: `openssl rand -hex 32`.

### 3. Database (Prisma Postgres)

Provision a Prisma Postgres database (via the [Prisma Data Platform](https://console.prisma.io)
or the Vercel Storage marketplace) and put its `prisma+postgres://…?api_key=…` string in
`DATABASE_URL`. Then create the tables:

```bash
npm run db:migrate      # prisma migrate dev — creates Team + Tournament tables
npm run db:seed         # optional: 10 placeholder teams so you can try it immediately
```

### 4. Run

```bash
npm run dev:full        # vercel dev — serves the SPA AND /api on one origin (recommended)
# or
npm run dev             # vite only (frontend). Run `vercel dev` too for the API.
```

> `dev:full` needs the Vercel CLI: `npm i -g vercel` (first run links the project).

Open the printed URL. Go to **/admin**, log in with `ADMIN_PASSWORD`, add your 10 teams in the
**Teams & Seeding** tab, then switch to **Update Results** and tap winners to advance them.

---

## How updating the bracket works

- **/admin** → log in (server checks `ADMIN_PASSWORD`, sets an 8-hour session cookie).
- **Teams & Seeding** — enter all 10 teams in seed order (1 = top seed). Seeds 1–6 get a
  first-round bye; seeds 7–10 play the two play-in matches (8v9, 7v10). Saving generates the
  bracket and resets results.
- **Update Results** — tap the winning team in a match; they advance instantly. Tap a winner
  again to undo. Correcting an earlier round automatically clears invalidated later matches.
- **Everyone else** sees the read-only bracket at **/bracket**, which auto-refreshes every 15s.

---

## Deploy to Vercel

1. Push this repo to GitHub and **Import** it in Vercel (framework preset auto-detects **Vite**).
2. Add a **Prisma Postgres** store (Vercel → Storage) — it injects `DATABASE_URL` for you — or
   paste your own.
3. Add the other env vars in **Project → Settings → Environment Variables** (Production +
   Preview): `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`.
4. Apply the schema to the production database once:
   ```bash
   # locally, with the production DATABASE_URL in your environment:
   npm run db:deploy       # prisma migrate deploy
   ```
5. Deploy. Seed teams through **/admin** (or run `npm run db:seed` against prod).

The build command is `prisma generate --no-engine && vite build` and output dir is `dist`
(already set in `package.json`). SPA routing is handled by [`vercel.json`](vercel.json), which
rewrites unknown client routes to `index.html` while leaving `/api/*` alone.

### Public repo, no exposed secrets

`DATABASE_URL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` live **only** in Vercel env vars
and your gitignored `.env`. None are `VITE_`-prefixed, so Vite never bundles them into the
browser. The admin password is verified on the server; the browser only ever gets a signed
session cookie. Reading 100% of the public code reveals nothing sensitive.

---

## Verifying it works

Already verified in this repo:

- `npm run typecheck` — no type errors.
- `npm test` — 12 unit tests on the bracket engine (play-in placement, bye seeding, winner
  propagation, 3rd-place routing, and self-healing on corrections).
- `npm run build` — production build succeeds.

End-to-end (needs a live `DATABASE_URL`):

1. `npm run dev:full`, then `curl localhost:3000/api/bracket` → `{ "bracket": … }`.
2. **/admin** — wrong password → stays logged out; correct → editor appears; refresh stays
   signed in.
3. Add 10 teams → confirm play-ins **8v9** and **7v10** and seeds 1–6 pre-placed in the QFs.
4. Tap winners QF → SF → Final → champion banner shows on **/bracket**.
5. Open **/bracket** in a private window (no cookie) → sees the same live state; an
   unauthenticated write (`curl -X PATCH .../api/result`) returns **401**.
6. Change a QF winner → the dependent SF/Final slots clear automatically.

---

## Scripts

| Script | Does |
|--------|------|
| `npm run dev` | Vite dev server (frontend only) |
| `npm run dev:full` | `vercel dev` — SPA + `/api` on one origin |
| `npm run build` | Prisma generate + production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run db:migrate` | Create/update tables (dev) |
| `npm run db:deploy` | Apply migrations (prod) |
| `npm run db:seed` | Seed 10 placeholder teams |
| `npm run db:studio` | Prisma Studio (browse the DB) |

---

## Design notes

`PRODUCT.md` and `DESIGN.md` capture the brand and visual system. They're the context files the
[impeccable](https://github.com/pbakaus/impeccable) design skill reads — after a session reload
you can run `/impeccable polish src/` or `/impeccable audit` to refine the UI. The
navy-and-gold palette is the tournament's committed logo identity.
