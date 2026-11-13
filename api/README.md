# MealMate API

Local Express API for MealMate Prototype 2. This server is the **only**
component that talks to Supabase — it uses the service role key, while
the client app calls this API over HTTP and never touches the database.

## Environment variables

Create `api/.env` (already covered by `.gitignore`):

| Variable | Required | Purpose |
|---|---|---|
| `SUPABASE_SECRET_KEY` | yes | Supabase **service role** key (bypasses RLS — keep server-side only) |
| `SUPABASE_URL` | yes* | Your project URL, e.g. `https://xyz.supabase.co` |
| `PORT` | no | API port (default `3001`) |

\* If `SUPABASE_URL` is absent, the server falls back to
`VITE_SUPABASE_URL` from the repo-root `.env`.

> Never put the secret key in the client bundle or a `VITE_`-prefixed
> variable — anything prefixed `VITE_` ships to the browser.

## Run locally

```bash
cd api
npm install
npm run dev     # node --watch, restarts on changes
# or
npm start
```

The API listens on `http://localhost:3001`. The Vite dev server proxies
`/api/*` to it, so the client can be started separately with
`cd client && npm run dev`.

## Database

Schema and seed data live in `db/`:

```text
db/01_schema.sql   # tables, PKs/FKs, constraints
db/02_seed.sql     # realistic seed data
db/03_policies.sql # optional RLS (default deny for anon key)
```

Run them in order in the Supabase SQL editor on a clean project.

## Endpoint map

See `openapi.yaml` for the full contract (params, bodies, schemas,
examples). Summary:

- `GET  /api/health` — liveness
- `GET  /api/profile`, `PUT /api/profile/:id` — settings
- `GET  /api/recipes`, `GET /api/recipes/:id` — list/detail
- `GET  /api/recipes/search` — ingredient matching (staple bypass)
- `GET|POST|DELETE /api/pantry`, `DELETE /api/pantry/:id` — inventory
  (POST merges duplicate names)
- `GET|POST /api/grocery-list`, `PATCH|DELETE /api/grocery-list/:id`,
  `POST /api/grocery-list/checkout` — checklist + "Done Shopping"
- `GET  /api/deals` — mock store deals

## Smoke test

From the repo root (Windows):

```bat
set BASE_URL=http://localhost:3001
tests\smoke.bat
```

Exercises 4+ endpoints (3 reads + 1 write) and exits non-zero on failure.
