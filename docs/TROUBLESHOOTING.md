# Troubleshooting

## `getaddrinfo ENOTFOUND ... .supabase.co` (fetch failed)

**Error in terminal:**
```text
TypeError: fetch failed
[cause]: Error: getaddrinfo ENOTFOUND zbkcuarjhwprebpfgtvl.supabase.co
```

**Meaning:** The app cannot resolve or reach your Supabase project URL. The hostname in your env doesn’t exist or isn’t reachable.

### What to do

1. **Check your Supabase project**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard) and open your project.
   - If the project is **paused** (free tier), click **Restore project**.
   - If the project was **deleted**, create a new project and use its new URL and keys.

2. **Use the correct URL and keys**
   - In the dashboard: **Project Settings** → **API**.
   - Copy **Project URL** (e.g. `https://abcdefghijk.supabase.co`).
   - Copy **anon public** key.
   - In your project, open **`.env.local`** and set:
     - `NEXT_PUBLIC_SUPABASE_URL=` **Project URL** (no trailing slash)
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY=` **anon public** key
   - The hostname in the error (e.g. `zbkcuarjhwprebpfgtvl`) must match the hostname in **Project URL**. If it doesn’t, you’re still using an old or wrong URL.

3. **Check internet and DNS**
   - Ensure the machine has internet access.
   - Try in a browser: open your Project URL (e.g. `https://YOUR-PROJECT-REF.supabase.co`) and see if it loads.
   - If it doesn’t, the problem is network/DNS or the project is down.

4. **Restart the dev server**
   - Stop the app (Ctrl+C), then run `npm run dev` again so it picks up any `.env.local` changes.

### Quick checklist

- [ ] Supabase project is **active** (not paused or deleted).
- [ ] `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` is exactly the **Project URL** from the dashboard (same hostname as in the API settings).
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the **anon public** key from the same project.
- [ ] No typos or extra spaces in `.env.local` (no quotes around the values).
- [ ] Dev server restarted after changing `.env.local`.
