# .env.local Setup Checklist

Use this checklist to ensure you have all credentials filled in correctly.

---

## Before You Start

- [ ] You have access to your Supabase project
- [ ] You're logged into Supabase Dashboard (supabase.com)
- [ ] Your project is visible in the dashboard
- [ ] You have a code editor open with your project (VS Code, etc.)

---

## Gathering Credentials

### From Supabase Dashboard → Settings → API

Location: Click ⚙️ Settings → API

- [ ] **NEXT_PUBLIC_SUPABASE_URL** - Copy "Project URL"
  - Should look like: `https://abc123xyz789.supabase.co`
  - Status: ✓ Copied

- [ ] **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Copy "anon" key from "Project API Keys"
  - Should start with: `eyJ`
  - Status: ✓ Copied

- [ ] **SUPABASE_SERVICE_ROLE_KEY** - Copy "service_role" key
  - Should start with: `eyJ`
  - Status: ✓ Copied

- [ ] **SUPABASE_JWT_SECRET** - Copy "JWT Secret"
  - Should start with: Something like `super-secret-`
  - Status: ✓ Copied

- [ ] **SUPABASE_URL** - Same as NEXT_PUBLIC_SUPABASE_URL
  - Should look like: `https://abc123xyz789.supabase.co`
  - Status: ✓ Copied

- [ ] **SUPABASE_ANON_KEY** - Same as NEXT_PUBLIC_SUPABASE_ANON_KEY
  - Should start with: `eyJ`
  - Status: ✓ Copied

### From Supabase Dashboard → Settings → Database

Location: Click ⚙️ Settings → Database

- [ ] **POSTGRES_URL** - Copy "Connection String" URI
  - Should look like: `postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres`
  - Status: ✓ Copied

- [ ] **POSTGRES_PRISMA_URL** - Same as POSTGRES_URL
  - Should look like: `postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres`
  - Status: ✓ Copied

- [ ] **POSTGRES_URL_NON_POOLING** - Same as POSTGRES_URL
  - Should look like: `postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres`
  - Status: ✓ Copied

- [ ] **POSTGRES_HOST** - Copy "Host"
  - Should look like: `db.abc123xyz789.supabase.co`
  - Status: ✓ Copied

- [ ] **POSTGRES_DATABASE** - Copy "Database"
  - Should be: `postgres`
  - Status: ✓ Copied

- [ ] **POSTGRES_USER** - Copy "User"
  - Should be: `postgres`
  - Status: ✓ Copied

- [ ] **POSTGRES_PASSWORD** - Click "Show" next to Password, then Copy
  - Should be: Your actual database password
  - Status: ✓ Copied

- [ ] **POSTGRES_PORT** - Copy "Port"
  - Should be: `5432`
  - Status: ✓ Copied

---

## Creating .env.local File

- [ ] Open terminal in your project: `cd lkhc`
- [ ] Create new file named `.env.local` (with the dot at start)
- [ ] Copy the template from `.env.local.example`
- [ ] Paste all your values into the file
- [ ] Save the file

---

## Verification

Before running the project, verify:

```
File Location: lkhc/.env.local

□ NEXT_PUBLIC_SUPABASE_URL
  Value: https://abc123xyz789.supabase.co ✓
  Format: Starts with https:// ✓
  Empty: No ✓

□ NEXT_PUBLIC_SUPABASE_ANON_KEY
  Value: eyJhbGciOiJIUzI1NiIsI... ✓
  Format: Starts with eyJ ✓
  Empty: No ✓

□ SUPABASE_SERVICE_ROLE_KEY
  Value: eyJhbGciOiJIUzI1NiIsI... ✓
  Format: Starts with eyJ ✓
  Empty: No ✓

□ SUPABASE_JWT_SECRET
  Value: super-secret-... ✓
  Format: Has content ✓
  Empty: No ✓

□ POSTGRES_URL
  Value: postgresql://postgres:... ✓
  Format: Starts with postgresql:// ✓
  Empty: No ✓
  Password: Included in URL ✓

□ POSTGRES_PASSWORD
  Value: Your_Actual_Password ✓
  Format: Not empty ✓
  Empty: No ✓

□ POSTGRES_HOST
  Value: db.abc123xyz789.supabase.co ✓
  Format: Matches your project ✓
  Empty: No ✓

□ All other values filled ✓
```

---

## Common Mistakes to Avoid

- [ ] Don't add extra quotes: `NEXT_PUBLIC_SUPABASE_URL="https://..."` ✗
  - Should be: `NEXT_PUBLIC_SUPABASE_URL=https://...` ✓

- [ ] Don't leave placeholders: `POSTGRES_PASSWORD=your_password` ✗
  - Should be: `POSTGRES_PASSWORD=actual_password_123` ✓

- [ ] Don't edit keys: `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJabc...` ✓ (Correct)

- [ ] Don't forget to save file after editing

- [ ] Don't commit this file to Git (it's in .gitignore)

---

## Ready to Run

Once all checklist items are done:

```bash
# Terminal commands
cd lkhc
npm install
npm run dev
```

Then open: **http://localhost:3000**

---

## Need Help?

### If something doesn't work:

1. Re-read the values from Supabase Dashboard
2. Check they're pasted exactly (no extra spaces)
3. Make sure password is correct (check with "Show" button)
4. Delete .env.local and try again
5. Check project ID matches in URLs

### File location wrong?

```
Correct:   lkhc/.env.local
Wrong:     .env.local
Wrong:     lkhc/src/.env.local
Wrong:     lkhc/.env
```

Your .env.local file should be in the **root of lkhc folder**.

---

## Credentials Reference

Save this for later reference:

```
Project URL: ___________________________
Anon Key: ____________________________
Service Role Key: ____________________________
JWT Secret: ____________________________
Database Host: ____________________________
Database Password: ____________________________
```
