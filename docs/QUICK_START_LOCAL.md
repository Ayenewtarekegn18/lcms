# Quick Start - Local Development (5 minutes)

## Prerequisites Installed?
- ✅ Node.js v18+
- ✅ npm or yarn
- ✅ Git

---

## Step 1: Clone & Install (2 min)

```bash
# Clone repo
git clone <your-repo-url>
cd church-management-system

# Install dependencies
npm install
```

---

## Step 2: Get Supabase Credentials (2 min)

Go to [Supabase Dashboard](https://supabase.com/dashboard)

1. **Copy these values:**
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

2. **Go to Settings → Database:**
   - Copy connection string → `POSTGRES_URL`

---

## Step 3: Setup Environment (1 min)

```bash
# Copy template
cp .env.local.example .env.local

# Edit with your credentials
nano .env.local
# Or use VS Code:
code .env.local
```

**Add these values:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
POSTGRES_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

---

## Step 4: Create Database Tables (1 min)

Go to Supabase Dashboard → SQL Editor and paste:

```sql
-- Profiles (Members)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  gender VARCHAR(20),
  nationality VARCHAR(100),
  birthday DATE,
  address TEXT,
  city VARCHAR(100),
  marital_status VARCHAR(50),
  academic_status VARCHAR(100),
  employment_status VARCHAR(100),
  baptism_status BOOLEAN,
  primary_ministry VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Emergency Contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100),
  relationship VARCHAR(50),
  phone VARCHAR(20)
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
  created_at TIMESTAMP DEFAULT NOW()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title VARCHAR(255),
  event_date DATE,
  event_time TIME,
  location VARCHAR(255),
  ministry VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title VARCHAR(255),
  description TEXT,
  channels VARCHAR(100),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title VARCHAR(255),
  category VARCHAR(100),
  file_url VARCHAR(500),
  access_level VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
```

Click "Run" ✅

---

## Step 5: Start Development Server

```bash
npm run dev
```

**Open:** [http://localhost:3000](http://localhost:3000)

---

## Test It!

1. **Sign up** with email/password
2. **Go to Dashboard** → `/dashboard`
3. **Add a Member** → `/dashboard/members/register`
4. **Test Financial** → `/dashboard/financial`
5. **Test Calendar** → `/dashboard/calendar`

---

## File Locations

| What | Where |
|------|-------|
| Environment vars | `.env.local` |
| Supabase client | `lib/supabase/client.ts` |
| Supabase server | `lib/supabase/server.ts` |
| API routes | `app/api/` |
| Pages | `app/dashboard/` |
| Components | `components/` |

---

## Troubleshooting

**"Cannot find module '@/lib/supabase'"**
→ Run `npm install` again

**"NEXT_PUBLIC_SUPABASE_URL is undefined"**
→ Check `.env.local` exists and has values

**"Unauthorized error"**
→ Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct

**"Cannot connect to database"**
→ Check `POSTGRES_URL` is correct

**Port 3000 in use?**
```bash
npm run dev -- -p 3001
```

---

## More Info

- Full setup: `LOCAL_DEVELOPMENT_SETUP.md`
- Database schema: `MEMBER_REGISTRATION_FORM_STRUCTURE.md`
- All features: `README.md`

---

**You're ready!** 🚀
