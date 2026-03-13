# Master Local Development Setup Guide

**Complete reference for everything you need to work on this project locally.**

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Installation Steps](#installation-steps)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Running the Project](#running-the-project)
7. [Supabase Integration](#supabase-integration)
8. [Development Workflow](#development-workflow)
9. [Troubleshooting](#troubleshooting)
10. [Project Structure](#project-structure)

---

## Quick Start

**For the impatient:** 5 minutes to running code

```bash
# 1. Clone and install
git clone <repo-url>
cd church-management-system
npm install

# 2. Setup environment (see below for credentials)
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Create database tables (in Supabase Dashboard SQL Editor)
# Copy SQL from LOCAL_DEVELOPMENT_SETUP.md

# 4. Run
npm run dev

# 5. Open browser
# http://localhost:3000
```

---

## Prerequisites

### System Requirements
- **OS**: macOS, Windows, or Linux
- **RAM**: 2GB+ (4GB+ recommended)
- **Disk**: 500MB+ free space
- **Internet**: Required

### Software Required
- **Node.js** v18+ ([https://nodejs.org](https://nodejs.org))
- **Git** ([https://git-scm.com](https://git-scm.com))
- **npm** (comes with Node.js)

### Verify Installation
```bash
node --version    # Should be v18 or higher
npm --version     # Should exist
git --version     # Should exist
```

### Services Required
- **Supabase Account** ([https://supabase.com](https://supabase.com))
- **Supabase Project** (free tier is fine)

---

## Installation Steps

### Step 1: Clone Repository
```bash
# Clone the project
git clone <your-repository-url>

# Navigate to project
cd church-management-system

# Verify you're in the right place
ls -la    # Should see: app/, lib/, components/, package.json, etc.
```

### Step 2: Install Dependencies
```bash
# Install all npm packages
npm install

# This creates: node_modules/ directory (takes 2-3 minutes)
```

### Step 3: Verify Installation
```bash
# Check if everything installed correctly
npm list

# Should show no errors (warnings are OK)
```

---

## Environment Configuration

### Get Your Credentials

#### From Supabase Dashboard:

**For API Keys** (Settings → API):
1. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
2. Copy **Anon Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Copy **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY`
4. Copy **JWT Secret** → `SUPABASE_JWT_SECRET`

**For Database Connection** (Settings → Database):
1. Copy **Host** → `POSTGRES_HOST`
2. Copy **Port** → `POSTGRES_PORT`
3. Copy **Database** → `POSTGRES_DATABASE`
4. Copy **User** → `POSTGRES_USER`
5. Copy **Password** → `POSTGRES_PASSWORD`

**For Connection Strings** (Settings → Database → Connection Strings):
1. Copy Pooled connection → `POSTGRES_URL`
2. Copy Pooled connection → `POSTGRES_PRISMA_URL`
3. Copy Transaction connection → `POSTGRES_URL_NON_POOLING`

### Create .env.local File

```bash
# In project root, create .env.local
cp .env.local.example .env.local
```

### Edit .env.local

Open `.env.local` and fill in your Supabase credentials:

```env
# SUPABASE (from Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-here

# DATABASE (from Settings → Database)
POSTGRES_URL=postgresql://postgres:password@db.abc.supabase.co:6543/postgres
POSTGRES_PRISMA_URL=postgresql://postgres:password@db.abc.supabase.co:6543/postgres
POSTGRES_URL_NON_POOLING=postgresql://postgres:password@db.abc.supabase.co:5432/postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password-here
POSTGRES_HOST=db.abc.supabase.co
POSTGRES_DATABASE=postgres
POSTGRES_PORT=6543

# ALTERNATE (same values)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Verify Configuration

```bash
# Check if .env.local exists
ls -la .env.local

# Should output: -rw-r--r-- ... .env.local
```

---

## Database Setup

### Create Tables in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (Members)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  middle_name VARCHAR(100),
  father_name VARCHAR(100),
  grandfather_name VARCHAR(100),
  mother_first_name VARCHAR(100),
  mother_father_name VARCHAR(100),
  mother_grandfather_name VARCHAR(100),
  gender VARCHAR(20),
  nationality VARCHAR(100),
  language VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  birth_date DATE,
  birth_country VARCHAR(100),
  birth_region VARCHAR(100),
  birth_zone VARCHAR(100),
  birth_city VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  region VARCHAR(100),
  postal_code VARCHAR(20),
  id_type VARCHAR(50),
  id_number VARCHAR(50),
  id_photo_url VARCHAR(500),
  profile_photo_url VARCHAR(500),
  academic_status VARCHAR(100),
  field_of_study VARCHAR(100),
  employment_status VARCHAR(100),
  profession VARCHAR(100),
  company VARCHAR(100),
  monthly_income_range VARCHAR(100),
  marital_status VARCHAR(50),
  spouse_name VARCHAR(100),
  spouse_phone VARCHAR(20),
  children_count INT DEFAULT 0,
  has_dependents BOOLEAN DEFAULT false,
  is_transferred BOOLEAN DEFAULT false,
  transfer_from_church VARCHAR(255),
  transfer_date DATE,
  previous_belief_system VARCHAR(255),
  baptism_status BOOLEAN DEFAULT false,
  baptism_date DATE,
  salvation_date DATE,
  how_accepted_jesus TEXT,
  membership_date DATE,
  cell_group_participation BOOLEAN DEFAULT false,
  primary_ministry VARCHAR(100),
  ministry_role VARCHAR(100),
  ministry_start_date DATE,
  gifts_and_talents TEXT,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency Contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_type VARCHAR(100),
  name VARCHAR(100),
  relationship VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family Members
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100),
  relationship VARCHAR(50),
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Transactions
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  transaction_type VARCHAR(50),
  category VARCHAR(100),
  amount DECIMAL(10, 2),
  description TEXT,
  transaction_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title VARCHAR(255),
  description TEXT,
  event_date DATE,
  event_time TIME,
  location VARCHAR(255),
  ministry VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title VARCHAR(255),
  description TEXT,
  channels VARCHAR(100),
  target_audience VARCHAR(100),
  publish_date TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title VARCHAR(255),
  description TEXT,
  category VARCHAR(100),
  file_url VARCHAR(500),
  access_level VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
```

6. Click **Run** button
7. Wait for confirmation "Success" ✓

---

## Running the Project

### Start Development Server

```bash
npm run dev
```

**Expected output:**
```
> next dev
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Open in Browser

Go to: **http://localhost:3000**

You should see the login page.

### Stop the Server

Press **Ctrl+C** (or **Cmd+C** on Mac) in the terminal

---

## Supabase Integration

### How It Works

```
Your App (Browser)
    ↓
Client Library: @supabase/ssr
    ↓
Supabase Cloud
    ├─ Authentication (login/signup)
    ├─ PostgreSQL Database
    ├─ Real-time Updates
    └─ Storage (files/photos)
```

### Key Files

- **`lib/supabase/client.ts`** - Browser client (for components)
- **`lib/supabase/server.ts`** - Server client (for API routes)
- **`lib/supabase/proxy.ts`** - Middleware for authentication
- **`middleware.ts`** - Route protection

### Using Supabase in Code

**In Components (Browser):**
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data: user } = await supabase.auth.getUser()
```

**In API Routes (Server):**
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data } = await supabase.from('profiles').select('*')
```

---

## Development Workflow

### Typical Development Day

```bash
# 1. Start development server
npm run dev

# 2. Open http://localhost:3000 in browser

# 3. Make changes to code
#    - Files auto-reload (hot reload)
#    - See changes instantly

# 4. Check console for errors
#    - Browser: F12 → Console
#    - Terminal: Check for error messages

# 5. Stop server when done
#    - Press Ctrl+C in terminal
```

### Development Tips

1. **Hot Reload**: Changes appear instantly
2. **Console Logs**: 
   - Browser: Press F12 → Console tab
   - Server: Check terminal output
3. **Debug**: Add `debugger` statement, use browser dev tools
4. **Database**: Test queries in Supabase Dashboard → SQL Editor
5. **API Testing**: Use Postman or Thunder Client

---

## Troubleshooting

### Problem: "Cannot find module '@/lib/supabase'"

**Solution:**
```bash
npm install
npm run dev
```

### Problem: "NEXT_PUBLIC_SUPABASE_URL is undefined"

**Solution:**
1. Check `.env.local` exists in project root
2. Check file has all required variables
3. Restart dev server: `npm run dev`
4. Restart browser

### Problem: "Cannot connect to database"

**Solution:**
1. Verify `POSTGRES_URL` in `.env.local`
2. Check credentials are correct
3. Verify database is running (in Supabase)
4. Check internet connection

### Problem: "Unauthorized" errors

**Solution:**
1. Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
2. Verify user is signed in
3. Check RLS policies in Supabase

### Problem: "Port 3000 already in use"

**Solution:**
```bash
npm run dev -- -p 3001
# Now access at http://localhost:3001
```

### Problem: "npm install" takes too long

**Solution:**
```bash
npm install --prefer-offline
# Or try yarn:
yarn install
```

---

## Project Structure

```
church-management-system/
├── app/                           # Pages & Routes
│   ├── api/                       # Backend API routes
│   │   ├── members/route.ts
│   │   ├── financial/route.ts
│   │   └── ... (more routes)
│   ├── auth/                      # Authentication pages
│   │   ├── login/page.tsx
│   │   └── sign-up/page.tsx
│   ├── dashboard/                 # Main application pages
│   │   ├── members/page.tsx
│   │   ├── financial/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── communications/page.tsx
│   │   ├── documents/page.tsx
│   │   ├── ministry/page.tsx
│   │   ├── reports/page.tsx
│   │   └── page.tsx (main dashboard)
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Global styles
│
├── lib/                           # Utilities & Libraries
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   ├── server.ts              # Server client
│   │   └── proxy.ts               # Middleware
│   └── utils.ts                   # Helper functions
│
├── components/                    # Reusable Components
│   ├── ui/                        # Shadcn UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ... (more components)
│   ├── modals/                    # Dialog forms
│   │   ├── member-modal.tsx
│   │   └── ... (more modals)
│   └── sidebar.tsx                # Navigation
│
├── middleware.ts                  # Auth middleware
├── next.config.mjs                # Next.js config
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── .env.local                     # Environment variables (create this)
├── .env.local.example             # Template for .env.local
│
└── Documentation Files:
    ├── START_HERE.md
    ├── QUICK_START_LOCAL.md
    ├── LOCAL_DEVELOPMENT_SETUP.md
    ├── SUPABASE_INTEGRATION.md
    ├── ENV_VARIABLES_EXPLAINED.md
    └── ... (more docs)
```

---

## Common Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Check for lint errors
npm run lint

# View Node version
node --version

# View npm version
npm --version

# Update npm
npm install -g npm@latest

# Clear npm cache
npm cache clean --force

# Reinstall node_modules
rm -rf node_modules package-lock.json
npm install
```

---

## Key URLs

**Local Development:**
- App: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard
- Members: http://localhost:3000/dashboard/members
- Financial: http://localhost:3000/dashboard/financial

**External Services:**
- Supabase Dashboard: https://supabase.com/dashboard
- npm Packages: https://www.npmjs.com/
- Next.js Docs: https://nextjs.org/docs

---

## Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 |
| **Language** | TypeScript |
| **Frontend** | React 19 |
| **Styling** | Tailwind CSS |
| **Components** | Shadcn/ui |
| **Database** | PostgreSQL (via Supabase) |
| **Auth** | Supabase Auth |
| **Runtime** | Node.js |

---

## Security Notes

### Public Variables (OK to expose)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Secret Variables (KEEP PRIVATE)
- `SUPABASE_SERVICE_ROLE_KEY`
- `POSTGRES_URL`
- `POSTGRES_PASSWORD`
- All credentials

### Best Practices
✓ Never commit `.env.local` to git
✓ Add `.env.local` to `.gitignore`
✓ Never share credentials
✓ Rotate keys periodically
✓ Use separate credentials per environment

---

## Getting Help

1. **Quick questions**: [QUICK_START_LOCAL.md](QUICK_START_LOCAL.md)
2. **Setup issues**: [LOCAL_DEVELOPMENT_SETUP.md](LOCAL_DEVELOPMENT_SETUP.md)
3. **Environment help**: [ENV_VARIABLES_EXPLAINED.md](ENV_VARIABLES_EXPLAINED.md)
4. **Technical questions**: [SUPABASE_INTEGRATION.md](SUPABASE_INTEGRATION.md)
5. **All documentation**: [START_HERE.md](START_HERE.md)

---

## You're Ready!

✅ Prerequisites installed?  
✅ .env.local created?  
✅ Database tables created?  

**Run:** `npm run dev`

**Visit:** http://localhost:3000

**Enjoy!** 🚀
