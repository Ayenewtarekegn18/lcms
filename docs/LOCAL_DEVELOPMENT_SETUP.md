# Local Development Setup Guide

## Prerequisites

Before you start, ensure you have the following installed:
- **Node.js** (v18.17 or later) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- **A code editor** (VS Code recommended) - [Download](https://code.visualstudio.com/)

---

## Step 1: Clone the Repository

```bash
# Clone the project
git clone <your-repository-url>

# Navigate to project directory
cd church-management-system
```

---

## Step 2: Install Dependencies

```bash
# Using npm
npm install

# OR using yarn
yarn install

# OR using pnpm
pnpm install
```

---

## Step 3: Set Up Environment Variables

### 3.1 Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings → API**
4. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY`
   - **JWT Secret** → `SUPABASE_JWT_SECRET`

5. Go to **Settings → Database** to find:
   - **Host** → `POSTGRES_HOST`
   - **User** → `POSTGRES_USER`
   - **Password** → `POSTGRES_PASSWORD`
   - **Database** → `POSTGRES_DATABASE`

### 3.2 Create `.env.local` File

Create a file named `.env.local` in the root directory:

```bash
# Supabase - REQUIRED
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Database Connection - REQUIRED
POSTGRES_URL=postgresql://user:password@host:5432/database
POSTGRES_PRISMA_URL=postgresql://user:password@host:5432/database
POSTGRES_URL_NON_POOLING=postgresql://user:password@host:5432/database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_HOST=db.your-project.supabase.co
POSTGRES_DATABASE=postgres

# Supabase URL
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

---

## Step 4: Set Up Supabase Locally (Optional but Recommended)

### Using Supabase Local Development

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase (first time)
supabase login

# Initialize Supabase in your project
supabase init

# Start local Supabase stack
supabase start

# The CLI will output your local connection details
```

### Or Use Remote Supabase (Easiest for Testing)

Just use the credentials from your cloud project in the `.env.local` file above.

---

## Step 5: Database Schema Setup

### 5.1 Create Tables in Supabase

Go to your Supabase project dashboard and run these SQL commands:

```sql
-- Profiles (Members)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Information
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  middle_name VARCHAR(100),
  father_name VARCHAR(100),
  grandfather_name VARCHAR(100),
  mother_first_name VARCHAR(100),
  mother_father_name VARCHAR(100),
  mother_grandfather_name VARCHAR(100),
  
  -- Demographics
  gender VARCHAR(20),
  nationality VARCHAR(100),
  language VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  
  -- Birth Information
  birth_date DATE,
  birth_country VARCHAR(100),
  birth_region VARCHAR(100),
  birth_zone VARCHAR(100),
  birth_city VARCHAR(100),
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  region VARCHAR(100),
  postal_code VARCHAR(20),
  
  -- ID Information
  id_type VARCHAR(50),
  id_number VARCHAR(50),
  id_photo_url VARCHAR(500),
  profile_photo_url VARCHAR(500),
  
  -- Academic & Employment
  academic_status VARCHAR(100),
  field_of_study VARCHAR(100),
  employment_status VARCHAR(100),
  profession VARCHAR(100),
  company VARCHAR(100),
  monthly_income_range VARCHAR(100),
  
  -- Marital Status
  marital_status VARCHAR(50),
  spouse_name VARCHAR(100),
  spouse_phone VARCHAR(20),
  
  -- Family
  children_count INT DEFAULT 0,
  has_dependents BOOLEAN DEFAULT false,
  
  -- Church Membership
  is_transferred BOOLEAN DEFAULT false,
  transfer_from_church VARCHAR(255),
  transfer_date DATE,
  previous_belief_system VARCHAR(255),
  
  -- Spiritual Information
  baptism_status BOOLEAN DEFAULT false,
  baptism_date DATE,
  salvation_date DATE,
  how_accepted_jesus TEXT,
  membership_date DATE,
  cell_group_participation BOOLEAN DEFAULT false,
  
  -- Ministry
  primary_ministry VARCHAR(100),
  ministry_role VARCHAR(100),
  ministry_start_date DATE,
  gifts_and_talents TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  
  -- Metadata
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

-- Communications/Announcements
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

-- Create RLS (Row Level Security) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
```

### 5.2 Enable Authentication

In Supabase Dashboard:
1. Go to **Authentication → Providers**
2. Enable **Email** provider
3. Configure email settings as needed

---

## Step 6: Run the Development Server

```bash
# Start the development server
npm run dev

# The app will be available at http://localhost:3000
```

---

## Step 7: Access the Application

1. Open [http://localhost:3000](http://localhost:3000)
2. You should see the login page
3. Create an account or sign in

---

## Supabase Client Usage

### In Client Components (Browser)

```typescript
import { createClient } from '@/lib/supabase/client'

export function MyComponent() {
  const supabase = createClient()
  
  // Use Supabase client
  const { data: user } = await supabase.auth.getUser()
}
```

### In Server Components

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  
  // Use Supabase client
  const { data: members } = await supabase.from('profiles').select('*')
}
```

### In API Routes

```typescript
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Query database
  const { data } = await supabase.from('profiles').select('*')
  
  return Response.json(data)
}
```

---

## Key Environment Variables Explained

| Variable | Type | Description |
|----------|------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Anonymous key for browser authentication |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Server-side admin operations |
| `SUPABASE_JWT_SECRET` | Secret | JWT secret for session management |
| `POSTGRES_URL` | Secret | Database connection string |
| `POSTGRES_USER` | Secret | Database username |
| `POSTGRES_PASSWORD` | Secret | Database password |
| `POSTGRES_HOST` | Secret | Database host |
| `POSTGRES_DATABASE` | Secret | Database name |

---

## Project Structure

```
church-management/
├── app/
│   ├── api/                    # API routes
│   ├── auth/                   # Authentication pages
│   ├── dashboard/              # Main dashboard pages
│   │   ├── members/
│   │   ├── financial/
│   │   ├── calendar/
│   │   ├── communications/
│   │   ├── documents/
│   │   ├── ministry/
│   │   └── reports/
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/
│   ├── ui/                     # Shadcn UI components
│   ├── modals/                 # Dialog modals
│   └── sidebar.tsx             # Navigation sidebar
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   └── proxy.ts            # Middleware proxy
│   └── utils.ts                # Utility functions
├── middleware.ts               # Next.js middleware
├── .env.local                  # Environment variables (LOCAL ONLY)
├── package.json                # Dependencies
└── tsconfig.json               # TypeScript config
```

---

## Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm build

# Start production server
npm start

# Lint code
npm run lint

# With Supabase CLI - start local database
supabase start

# With Supabase CLI - stop local database
supabase stop

# Reset Supabase local data
supabase reset
```

---

## Troubleshooting

### "SUPABASE_URL is not defined"
- Check `.env.local` file exists in root directory
- Verify all environment variables are set
- Restart development server

### "Cannot connect to database"
- Verify `POSTGRES_URL` is correct
- Check database credentials
- Ensure database is running (if using local Supabase)

### "Unauthorized" errors
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Verify user is logged in
- Check RLS policies in Supabase dashboard

### "Module not found: @/lib/supabase/client"
- Run `npm install` to ensure all dependencies installed
- Check file paths match

### Port 3000 already in use
```bash
# Use different port
npm run dev -- -p 3001
```

---

## Development Tips

1. **Hot Reload**: Changes to files are automatically reflected
2. **Console Logs**: Check browser dev tools (F12) and terminal for server logs
3. **Database Queries**: Test in Supabase Dashboard → SQL Editor
4. **API Testing**: Use Postman or Thunder Client VS Code extension
5. **Debug Mode**: Add `debugger` in code, then use `npm run dev`

---

## Next Steps

1. Create a test user account
2. Register a member using the form at `/dashboard/members/register`
3. Test the financial, calendar, and communications features
4. Review the DOCUMENTATION_INDEX.md for more details

---

## Support

For issues or questions:
1. Check TROUBLESHOOTING section above
2. Review Supabase documentation: [docs.supabase.com](https://docs.supabase.com)
3. Check Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)
