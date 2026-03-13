# Setup .env.local - Step by Step Visual Guide

## Overview

You need to fill in your `.env.local` file with credentials from Supabase. This guide shows exactly where to find each one.

---

## Complete Setup Map

```
Your Local Machine
    ↓
    cd lkhc/
    ↓
    Create .env.local file
    ↓
    Fill from Supabase Dashboard
    ↓
    npm install
    ↓
    npm run dev
    ↓
    http://localhost:3000 ✓
```

---

## PART 1: Get API Keys from Supabase

### Step 1.1: Open Supabase Dashboard

- Go to https://supabase.com
- Log in with your account
- Click on your project "Church Management" (or the name you gave it)

### Step 1.2: Navigate to Settings → API

In the left sidebar:
```
┌─ Dashboard
├─ SQL Editor
├─ Database
├─ Storage
├─ Realtime
├─ Vector
├─ Auth
├─ Extensions
├─ Webhooks
└─ Settings ← CLICK HERE
   └─ API ← Then click this
```

### Step 1.3: Copy Project URL

You'll see:

```
╔════════════════════════════════════════╗
║ Project URL                            ║
║ https://abc123xyz789.supabase.co       ║
║ [Copy button]                          ║
╚════════════════════════════════════════╝
```

**Action:** Copy this URL

**Paste into `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abc123xyz789.supabase.co
SUPABASE_URL=https://abc123xyz789.supabase.co
```

---

### Step 1.4: Copy API Keys

Scroll down in the same Settings → API page. You'll see:

```
╔════════════════════════════════════════════════╗
║ Project API Keys                               ║
║                                                ║
║ Your API keys                                  ║
║ ⚠️ DO NOT share the secret key outside the  ║
║    app. Some features in your project might   ║
║    not work if your API key is compromised.   ║
║                                                ║
║ ─────────────────────────────────────────────  ║
║ anon [public]                                  ║
║ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...     ║
║ [Copy] [Visibility toggle]                     ║
║                                                ║
║ ─────────────────────────────────────────────  ║
║ service_role [secret]                          ║
║ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...     ║
║ [Copy] [Visibility toggle]                     ║
║                                                ║
╚════════════════════════════════════════════════╝
```

**Action 1:** Click on "anon" row's copy button (or click the eye to reveal and select all)

**Paste into `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Action 2:** Click on "service_role" row's copy button

**Paste into `.env.local`:**
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Step 1.5: Copy JWT Secret

Still on Settings → API page, scroll down more to find:

```
╔════════════════════════════════════════════════╗
║ JWT Settings                                   ║
║                                                ║
║ JWT Secret                                     ║
║ super-secret-jwt-xxxxxxxx-xxxxxxxx-xxxx      ║
║ [Copy]                                         ║
║                                                ║
╚════════════════════════════════════════════════╝
```

**Action:** Click copy button

**Paste into `.env.local`:**
```env
SUPABASE_JWT_SECRET=super-secret-jwt-xxxxxxxx-xxxxxxxx-xxxx
```

---

## PART 2: Get Database Credentials

### Step 2.1: Navigate to Settings → Database

In the same Settings menu:
```
Settings
  └─ General (currently here)
  └─ API
  └─ Database ← CLICK HERE
  └─ Auth
  └─ Storage
  └─ CDN
```

Click **Database**

### Step 2.2: Find Connection String

You'll see a section like:

```
╔════════════════════════════════════════════════╗
║ Connection String                              ║
║                                                ║
║ Status: PostgreSQL is running ✓               ║
║                                                ║
║ Connection info                                ║
║ ┌─ URI                                         ║
║ │ postgresql://postgres:YOUR_PASSWORD@       ║
║ │ db.abc123xyz789.supabase.co:5432/postgres  ║
║ │ [Copy]                                       ║
║ │                                              ║
║ ├─ Host                                        ║
║ │ db.abc123xyz789.supabase.co                 ║
║ │ [Copy]                                       ║
║ │                                              ║
║ ├─ Database                                    ║
║ │ postgres                                     ║
║ │ [Copy]                                       ║
║ │                                              ║
║ ├─ User                                        ║
║ │ postgres                                     ║
║ │ [Copy]                                       ║
║ │                                              ║
║ ├─ Password                                    ║
║ │ ••••••••••••                                 ║
║ │ [Show]                                       ║
║ │ [Copy]                                       ║
║ │                                              ║
║ └─ Port                                        ║
║   5432                                         ║
║   [Copy]                                       ║
║                                                ║
╚════════════════════════════════════════════════╝
```

### Step 2.3: Copy Each Value

**Action 1: Copy the full URI**

Click copy button next to "URI"

**Paste into `.env.local`:**
```env
POSTGRES_URL=postgresql://postgres:YOUR_PASSWORD@db.abc123xyz789.supabase.co:5432/postgres
POSTGRES_PRISMA_URL=postgresql://postgres:YOUR_PASSWORD@db.abc123xyz789.supabase.co:5432/postgres
POSTGRES_URL_NON_POOLING=postgresql://postgres:YOUR_PASSWORD@db.abc123xyz789.supabase.co:5432/postgres
```

**Action 2: Copy Host**

**Paste into `.env.local`:**
```env
POSTGRES_HOST=db.abc123xyz789.supabase.co
```

**Action 3: Copy Database**

**Paste into `.env.local`:**
```env
POSTGRES_DATABASE=postgres
```

**Action 4: Copy User**

**Paste into `.env.local`:**
```env
POSTGRES_USER=postgres
```

**Action 5: Click Show next to Password, then Copy**

**Paste into `.env.local`:**
```env
POSTGRES_PASSWORD=YOUR_ACTUAL_PASSWORD_HERE
```

**Action 6: Copy Port**

**Paste into `.env.local`:**
```env
POSTGRES_PORT=5432
```

---

## PART 3: Complete `.env.local` File

Your completed `.env.local` file should look like this:

```env
# SUPABASE CONFIG - from Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://abc123xyz789.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYzEyM3h5ejc4OSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjc4OTAxMjAwLCJleHAiOjE5OTQ0NzcyMDB9.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYzEyM3h5ejc4OSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2Nzg5MDEyMDAsImV4cCI6MTk5NDQ3NzIwMH0.YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
SUPABASE_JWT_SECRET=super-secret-jwt-xxxxxxxx-xxxxxxxx-xxxx
SUPABASE_URL=https://abc123xyz789.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYzEyM3h5ejc4OSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjc4OTAxMjAwLCJleHAiOjE5OTQ0NzcyMDB9.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# DATABASE CONFIG - from Settings → Database
POSTGRES_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.abc123xyz789.supabase.co:5432/postgres
POSTGRES_PRISMA_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.abc123xyz789.supabase.co:5432/postgres
POSTGRES_URL_NON_POOLING=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.abc123xyz789.supabase.co:5432/postgres
POSTGRES_HOST=db.abc123xyz789.supabase.co
POSTGRES_DATABASE=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_ACTUAL_PASSWORD
POSTGRES_PORT=5432
```

---

## PART 4: Verify Your File

Before running npm start, verify:

**Checklist:**
```
□ File is named .env.local (in the lkhc/ directory)
□ NEXT_PUBLIC_SUPABASE_URL starts with "https://"
□ All keys/tokens start with "eyJ" or "super-secret"
□ POSTGRES_PASSWORD is filled in (not YOUR_PASSWORD)
□ POSTGRES_HOST matches your project
□ All values are filled in (no "your-..." placeholders)
□ File has no extra quotes around values
□ File is in .gitignore (shouldn't be committed)
```

---

## PART 5: Run Your Project

Open terminal in the project directory:

```bash
# Navigate to project
cd lkhc

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit: **http://localhost:3000**

---

## Troubleshooting

### Error: "Cannot connect to database"
- Check POSTGRES_URL has correct password
- Verify POSTGRES_HOST matches your project ID
- Make sure POSTGRES_PASSWORD is not empty

### Error: "Supabase credentials invalid"
- Verify NEXT_PUBLIC_SUPABASE_URL is correct
- Check NEXT_PUBLIC_SUPABASE_ANON_KEY starts with "eyJ"
- Make sure keys weren't accidentally edited

### Can't find values in Supabase Dashboard
- Make sure you're in the correct project
- Check you're logged into the right account
- Go to supabase.com/dashboard to access projects

---

## Next: Create Database Tables

See `LOCAL_DEVELOPMENT_SETUP.md` for SQL to create tables.

Copy the SQL code and paste in **Supabase Dashboard → SQL Editor** to create your database structure.
