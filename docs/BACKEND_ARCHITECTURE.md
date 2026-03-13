# How the Backend Works in This Project

## Short answer

- **Backend = Next.js API routes (in this repo) + Supabase (hosted elsewhere).**
- There is **no separate backend repo or server**. The “backend” is **inside this same project** as API routes that run on the same deployment as the frontend.

---

## 1. Where is the backend?

| Part | Where it lives | What it does |
|------|----------------|--------------|
| **API (your “backend” logic)** | This project, in `app/api/` | Handles HTTP requests (GET/POST/PATCH/DELETE), checks auth, talks to Supabase, returns JSON. |
| **Database + Auth** | **Supabase** (cloud) | PostgreSQL database, Row Level Security (RLS), user sign-in, sessions. |
| **Frontend** | This project, in `app/` and `components/` | React/Next.js UI; calls your API routes or Supabase from the browser. |

So when people say “the backend” here, they usually mean:

1. The **API routes** under `app/api/` (this repo).
2. Plus **Supabase** (database and auth), which is a separate product but configured via env vars in this repo.

---

## 2. How a request flows (e.g. “Add member”)

```
Browser (React)
    → fetch('/api/members', { method: 'POST', body: ... })
    → Next.js server (same app)
        → app/api/members/route.ts runs
        → createClient() from lib/supabase/server.ts (uses your cookies/session)
        → supabase.auth.getUser() to see who is logged in
        → supabase.from('profiles').insert(...) to write to Supabase
    → Supabase (over the internet)
        → Checks RLS policies, writes to PostgreSQL
        → Returns result
    → API route returns NextResponse.json(...)
    → Browser gets JSON and updates UI
```

- **Backend code** = the code in `app/api/**/route.ts` and `lib/supabase/server.ts` (all in this repo).
- **Backend runtime** = the same Node.js process that serves your Next.js app (e.g. `npm run dev` or Vercel). No separate “backend server” or separate repo.

---

## 3. Two ways this app talks to Supabase

| Context | File | Used for |
|--------|------|----------|
| **Server** (API routes, Server Components, layout) | `lib/supabase/server.ts` | Uses cookies to get the current user’s session; safe for secret keys if you ever add them. |
| **Browser** (client components, client-side fetch) | `lib/supabase/client.ts` | Uses `NEXT_PUBLIC_SUPABASE_*` env vars; runs in the user’s browser. |

- **API routes** always use **server** Supabase (`createClient()` from `@/lib/supabase/server`). That way auth is consistent and you can add checks (e.g. “only admin can create members”) in one place.
- **Client** code can either call your **API routes** (e.g. `fetch('/api/members')`) or use the **client** Supabase when you want to query directly from the browser (e.g. some lists, realtime). Both are “allowed” by design; this project uses a mix.

---

## 4. Why is the backend in this project (and not a standalone app)?

This project is a **full‑stack Next.js app** (sometimes called a “monolith”): one codebase that includes both UI and API.

**Reasons this is done:**

1. **One repo, one deploy** – You run `npm run dev` or deploy to Vercel once; both the site and the API are served from the same app. No need to run or deploy a second “backend” service.
2. **Next.js API routes** – Next.js gives you `app/api/**/route.ts` as a built-in way to define HTTP endpoints. Those routes *are* your backend; they run on the server and can use env vars, Supabase, etc.
3. **Supabase does the heavy backend work** – Database, auth, RLS, and storage are handled by Supabase. Your “backend” in this repo is mostly: “check who’s logged in, then call Supabase and return the result.” So you don’t need a separate Express/Django server.
4. **Simpler for this size** – For a church management app, a single Next.js app with API routes + Supabase is simpler to develop and deploy than splitting into a separate backend repo and server.

**When you might split it out:**

- You want a **standalone backend** (e.g. Express, Fastify, Django) that multiple clients (web, mobile, third‑party) call.
- You need **different scaling or security** for the API (e.g. API on one set of servers, frontend on another).
- Different teams own “frontend” and “backend” and want separate repos/deploys.

For this project, the choice is: **backend = API routes in this repo + Supabase**, not a separate backend project.

---

## 5. Quick map of “backend” in this repo

- **`app/api/`** – All HTTP API endpoints (members, financial, events, ministries, etc.). This is your backend surface.
- **`lib/supabase/server.ts`** – Server-side Supabase client (used by API routes and server components).
- **`lib/supabase/client.ts`** – Browser Supabase client (used by client components when they talk to Supabase directly).
- **`scripts/`** – SQL migrations and seed data for Supabase (schema, RLS). They are applied in the Supabase dashboard or CLI; they are not “running” inside Next.js, but they define the backend data model and security.

So: **“Backend” = `app/api/` + Supabase (DB + auth), and it’s available in this project because the API is implemented as part of the same Next.js app, not as a separate standalone project.**
