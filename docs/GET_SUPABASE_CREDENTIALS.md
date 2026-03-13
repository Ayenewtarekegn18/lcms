# How to Get Your Supabase Credentials

This guide shows you **exactly where to find** each environment variable you need for your `.env.local` file.

---

## Step 1: Open Your Supabase Dashboard

1. Go to **[supabase.com](https://supabase.com)** and log in
2. Click on your **Church Management Project** (or create one if you haven't)
3. You should see your project dashboard

---

## Step 2: Get Supabase API Keys

### Location: Settings → API

1. In your Supabase dashboard, click **Settings** (gear icon, bottom left)
2. Click **API** tab
3. You'll see this information:

```
┌─────────────────────────────────────────────────┐
│ Project URL                                     │
│ https://your-project-id.supabase.co             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Project API Keys                                │
│ (You may need to show keys/click "Show")         │
│                                                  │
│ anon public                                      │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9......     │
│                                                  │
│ service_role secret                             │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9......     │
└─────────────────────────────────────────────────┘
```

**Copy these values to `.env.local`:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9......
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9......
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9......
SUPABASE_URL=https://your-project-id.supabase.co
```

---

## Step 3: Get JWT Secret

**Still in Settings → API tab**, scroll down to find:

```
┌─────────────────────────────────────────────────┐
│ JWT Settings                                    │
│                                                  │
│ JWT Secret: super-secret-jwt-value-here        │
└─────────────────────────────────────────────────┘
```

**Copy this to `.env.local`:**

```env
SUPABASE_JWT_SECRET=super-secret-jwt-value-here
```

---

## Step 4: Get Database Credentials

### Location: Settings → Database

1. Go to **Settings** (same gear icon)
2. Click **Database** tab
3. Look for **Database Settings** section

You'll see:

```
┌─────────────────────────────────────────────────┐
│ Connection String                               │
│                                                  │
│ PostgreSQL URI                                  │
│ postgresql://postgres:YourPassword@db.your-    │
│ project-id.supabase.co:5432/postgres           │
│                                                  │
│ Host: db.your-project-id.supabase.co            │
│ Database: postgres                              │
│ User: postgres                                  │
│ Port: 5432                                      │
│ Password: YourActualPassword                    │
└─────────────────────────────────────────────────┘
```

**Copy these values to `.env.local`:**

```env
POSTGRES_URL=postgresql://postgres:YourPassword@db.your-project-id.supabase.co:5432/postgres
POSTGRES_PRISMA_URL=postgresql://postgres:YourPassword@db.your-project-id.supabase.co:5432/postgres
POSTGRES_URL_NON_POOLING=postgresql://postgres:YourPassword@db.your-project-id.supabase.co:5432/postgres
POSTGRES_HOST=db.your-project-id.supabase.co
POSTGRES_DATABASE=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YourActualPassword
POSTGRES_PORT=5432
```

---

## Step 5: Complete `.env.local` File

After gathering all credentials, your `.env.local` should look like this:

```env
# ========================================
# SUPABASE CONFIGURATION
# ========================================
NEXT_PUBLIC_SUPABASE_URL=https://abc123def456.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYzEyM2RlZjQ1NiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjc4OTAxMjAwLCJleHAiOjE5OTQ0NzcyMDB9.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYzEyM2RlZjQ1NiIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2Nzg5MDEyMDAsImV4cCI6MTk5NDQ3NzIwMH0.YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
SUPABASE_JWT_SECRET=your-jwt-secret-key-from-database-settings
SUPABASE_URL=https://abc123def456.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYzEyM2RlZjQ1NiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjc4OTAxMjAwLCJleHAiOjE5OTQ0NzcyMDB9.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ========================================
# DATABASE CONFIGURATION
# ========================================
POSTGRES_URL=postgresql://postgres:YOUR_PASSWORD_HERE@db.abc123def456.supabase.co:5432/postgres
POSTGRES_PRISMA_URL=postgresql://postgres:YOUR_PASSWORD_HERE@db.abc123def456.supabase.co:5432/postgres
POSTGRES_URL_NON_POOLING=postgresql://postgres:YOUR_PASSWORD_HERE@db.abc123def456.supabase.co:5432/postgres
POSTGRES_HOST=db.abc123def456.supabase.co
POSTGRES_DATABASE=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_PASSWORD_HERE
POSTGRES_PORT=5432
```

---

## Troubleshooting

### "I don't see these values in my Supabase Dashboard"

**Solution 1: Check Project is Selected**
- Make sure you're in the correct Supabase project
- Projects are listed on the left sidebar

**Solution 2: Need to Create Project**
If you don't have a Supabase project yet:
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project name (e.g., "Church Management")
4. Create new password for postgres user
5. Choose region closest to you
6. Click "Create new project"
7. Wait 2-3 minutes for it to initialize
8. Then follow steps 1-4 above

**Solution 3: Keys are Hidden**
- Click the eye icon next to keys to reveal them
- Some keys are only visible once

---

## Security Notes

⚠️ **IMPORTANT:**

1. **Never commit `.env.local` to Git** - it contains secrets
2. **`.env.local` is in `.gitignore`** - it won't be committed
3. **Only share `.env.local.example`** - which has placeholder values
4. **Keep your service role key secret** - don't share it
5. **Rotate keys periodically** in Supabase dashboard for security

---

## Next Steps

After filling in `.env.local`:

1. Save the file
2. Make sure you're in the project directory: `cd lkhc`
3. Install dependencies: `npm install`
4. Create database tables: See `LOCAL_DEVELOPMENT_SETUP.md`
5. Start dev server: `npm run dev`
6. Open http://localhost:3000

---

## Quick Copy-Paste Template

Use this template and fill in your actual values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
SUPABASE_URL=
SUPABASE_ANON_KEY=
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_HOST=
POSTGRES_DATABASE=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=
POSTGRES_PORT=5432
```

---

## Still Need Help?

If you're stuck:
1. Go to [supabase.com/docs](https://supabase.com/docs)
2. Check [supabase.com/docs/guides/getting-started](https://supabase.com/docs/guides/getting-started)
3. Read the screenshots in this guide again
4. Make sure you're logged into the right Supabase account
