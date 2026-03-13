# Supabase Integration Guide

## Overview

This project uses **Supabase** as the backend for:
- **Authentication** (Email/Password, OAuth)
- **Database** (PostgreSQL)
- **Real-time** updates
- **File Storage** (for documents & photos)

---

## Architecture

```
┌─────────────────────────────────────────┐
│        Browser / Next.js Client         │
│  (app/dashboard/*, components/*)        │
└────────────┬────────────────────────────┘
             │
             ├──► lib/supabase/client.ts ◄──── Browser Client
             │
┌────────────┼────────────────────────────┐
│   Next.js Server (API Routes)           │
│  (app/api/*, middleware.ts)             │
│            │                            │
│            └──► lib/supabase/server.ts ◄──── Server Client
└────────────┬────────────────────────────┘
             │
             └──► Supabase Cloud
                  ├─ Authentication
                  ├─ PostgreSQL Database
                  ├─ Real-time Subscriptions
                  └─ Storage
```

---

## Configuration

### Environment Variables

**Public variables (safe in browser):**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Secret variables (server-side only):**
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_JWT_SECRET=your-jwt-secret
POSTGRES_URL=postgresql://...
```

---

## Database Schema

### Tables Structure

#### `profiles` - Member Information
```typescript
interface Profile {
  id: string                    // UUID from auth.users
  
  // Personal
  first_name: string
  last_name: string
  middle_name?: string
  gender: 'Male' | 'Female'
  nationality: string
  language: string
  email: string
  phone: string
  
  // Birth
  birth_date: Date
  birth_country: string
  birth_region: string
  birth_zone: string
  birth_city: string
  
  // Address
  address: string
  city: string
  region: string
  postal_code: string
  
  // ID
  id_type: 'Passport' | 'License' | 'National ID'
  id_number: string
  id_photo_url?: string
  profile_photo_url?: string
  
  // Academic & Work
  academic_status: 'Elementary' | 'High School' | 'Diploma' | 'Bachelor' | 'Master' | 'PhD'
  field_of_study?: string
  employment_status: 'Student' | 'Employed' | 'Unemployed' | 'Retired'
  profession?: string
  company?: string
  monthly_income_range?: string
  
  // Family
  marital_status: 'Single' | 'Married' | 'Divorced' | 'Widowed'
  spouse_name?: string
  children_count: number
  has_dependents: boolean
  
  // Church
  is_transferred: boolean
  transfer_from_church?: string
  transfer_date?: Date
  previous_belief_system?: string
  
  // Spiritual
  baptism_status: boolean
  baptism_date?: Date
  salvation_date?: Date
  how_accepted_jesus?: string
  membership_date?: Date
  cell_group_participation: boolean
  
  // Ministry
  primary_ministry?: string
  ministry_role?: string
  ministry_start_date?: Date
  gifts_and_talents?: string
  
  // Status
  is_active: boolean
  is_deleted: boolean
  created_at: Timestamp
  updated_at: Timestamp
}
```

#### `emergency_contacts` - Emergency Information
```typescript
interface EmergencyContact {
  id: string
  profile_id: string        // FK to profiles
  contact_type: 'Spouse' | 'Parent' | 'Sibling' | 'Friend' | 'Other'
  name: string
  relationship: string
  phone: string
  email?: string
  created_at: Timestamp
}
```

#### `family_members` - Family Details
```typescript
interface FamilyMember {
  id: string
  profile_id: string        // FK to profiles
  name: string
  relationship: 'Spouse' | 'Child' | 'Parent' | 'Sibling' | 'Other'
  phone?: string
  address?: string
  created_at: Timestamp
}
```

#### `financial_transactions` - Financial Records
```typescript
interface FinancialTransaction {
  id: string
  user_id?: string
  transaction_type: 'Income' | 'Expense'
  category: 'Offering' | 'Donation' | 'Tithe' | 'Operations' | 'Maintenance' | 'Staff' | 'Outreach'
  amount: number
  description: string
  transaction_date: Date
  created_at: Timestamp
}
```

#### `events` - Church Events
```typescript
interface Event {
  id: string
  user_id?: string
  title: string
  description?: string
  event_date: Date
  event_time: Time
  location: string
  ministry: string
  created_at: Timestamp
}
```

#### `announcements` - Communications
```typescript
interface Announcement {
  id: string
  user_id?: string
  title: string
  description: string
  channels: 'Email' | 'SMS' | 'App' | 'All'
  target_audience: string
  is_published: boolean
  publish_date?: Timestamp
  created_at: Timestamp
}
```

#### `documents` - Document Management
```typescript
interface Document {
  id: string
  user_id?: string
  title: string
  description?: string
  category: 'Meetings' | 'Policies' | 'Reports' | 'Financial' | 'Other'
  file_url: string
  access_level: 'Public' | 'Staff Only' | 'Leadership Only'
  created_at: Timestamp
}
```

---

## Client-Side Usage

### Browser Client (`lib/supabase/client.ts`)

```typescript
import { createClient } from '@/lib/supabase/client'

// Create client instance
const supabase = createClient()

// Authenticate
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
})

// Query
const { data: members } = await supabase
  .from('profiles')
  .select('*')
  .eq('is_deleted', false)

// Insert
await supabase.from('profiles').insert({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
})

// Update
await supabase
  .from('profiles')
  .update({ is_active: false })
  .eq('id', userId)

// Delete (soft delete)
await supabase
  .from('profiles')
  .update({ is_deleted: true })
  .eq('id', userId)

// Real-time subscription
const subscription = supabase
  .channel('profiles')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'profiles' },
    (payload) => console.log('Change:', payload)
  )
  .subscribe()
```

---

## Server-Side Usage

### Server Client (`lib/supabase/server.ts`)

```typescript
import { createClient } from '@/lib/supabase/server'

export async function getData() {
  const supabase = await createClient()
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Query database
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
  
  return data
}
```

---

## API Routes

### Example: Get Members (`app/api/members/route.ts`)

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  
  // Check auth
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Get query parameters
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const ministry = searchParams.get('ministry')
  
  // Build query
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
  
  // Apply filters
  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
    )
  }
  
  if (ministry) {
    query = query.eq('primary_ministry', ministry)
  }
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  
  return NextResponse.json(data)
}
```

---

## Authentication Flow

### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword123',
  options: {
    emailRedirectTo: `${location.origin}/auth/callback`,
  },
})
```

### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword123',
})
```

### Sign Out
```typescript
await supabase.auth.signOut()
```

### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser()
```

---

## Row Level Security (RLS)

All tables have RLS enabled. Example policies:

```sql
-- Users can see their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Admins can see all profiles
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (auth.jwt() ->> 'role' = 'admin');
```

---

## Real-Time Subscriptions

```typescript
// Subscribe to profile changes
const subscription = supabase
  .channel('profiles')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'profiles' },
    (payload) => {
      console.log('New member:', payload.new)
    }
  )
  .subscribe()

// Cleanup
subscription.unsubscribe()
```

---

## File Storage

### Upload Photo
```typescript
const { data, error } = await supabase.storage
  .from('member-photos')
  .upload(`${userId}/profile.jpg`, file)

const url = supabase.storage
  .from('member-photos')
  .getPublicUrl(`${userId}/profile.jpg`)
```

---

## Deployment

### Environment Variables on Vercel

1. Go to Vercel → Project Settings → Environment Variables
2. Add all variables from `.env.local`
3. Redeploy

```bash
vercel env pull
```

---

## Debugging

### Check Supabase Logs
- Dashboard → Logs → API logs
- See all requests and errors

### Enable Debug Logging
```typescript
const supabase = createClient({
  options: {
    debug: true,
  },
})
```

---

## Best Practices

1. **Never expose SERVICE_ROLE_KEY** in browser
2. **Always use RLS** for security
3. **Validate inputs** server-side
4. **Use transactions** for multi-table updates
5. **Cache frequently accessed data**
6. **Monitor RLS policies** to prevent data leaks

---

## Common Errors

| Error | Solution |
|-------|----------|
| `Unauthorized` | Check user is authenticated |
| `NEXT_PUBLIC_SUPABASE_URL not defined` | Add to `.env.local` |
| `RLS violation` | Check RLS policies match query |
| `Connection timeout` | Check database is running |
| `JWT expired` | User session expired, sign in again |

---

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Next.js SSR](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
