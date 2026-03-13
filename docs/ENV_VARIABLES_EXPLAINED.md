# Environment Variables Explained

This guide explains what each environment variable does and where to get it.

---

## Quick Copy-Paste Template

```bash
# 1. Go to Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_JWT_SECRET=your-jwt-secret

# 2. Go to Supabase Dashboard → Settings → Database
POSTGRES_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
POSTGRES_PRISMA_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
POSTGRES_URL_NON_POOLING=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# 3. Database credentials (from Database Settings)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_HOST=db.your-project-id.supabase.co
POSTGRES_DATABASE=postgres
POSTGRES_PORT=5432

# 4. Alternate Supabase keys (same as above)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Detailed Variable Guide

### 1. Supabase Authentication Keys

#### `NEXT_PUBLIC_SUPABASE_URL` (Required)
- **What it is**: Your Supabase project URL
- **Where to find**: Supabase Dashboard → Settings → API → Project URL
- **Example**: `https://abcdefgh.supabase.co`
- **Where used**: Browser & Server
- **Security**: ✅ Safe to expose (public)

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Required)
- **What it is**: Public anonymous key for browser authentication
- **Where to find**: Supabase Dashboard → Settings → API → Anon Key
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where used**: Browser (client-side authentication)
- **Security**: ✅ Safe to expose
- **What it does**: Allows users to sign up, sign in, and access public data

#### `SUPABASE_SERVICE_ROLE_KEY` (Required)
- **What it is**: Server-side admin key with full database access
- **Where to find**: Supabase Dashboard → Settings → API → Service Role Key
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (longer than Anon Key)
- **Where used**: Server-side ONLY (API routes, server components)
- **Security**: 🔒 KEEP SECRET - Never expose in browser
- **What it does**: Bypasses RLS for server operations

#### `SUPABASE_JWT_SECRET` (Required)
- **What it is**: Secret key for signing JWT tokens
- **Where to find**: Supabase Dashboard → Settings → API → JWT Secret
- **Example**: `super-secret-jwt-signing-secret-key-base64-encoded`
- **Where used**: Middleware for session validation
- **Security**: 🔒 KEEP SECRET
- **What it does**: Validates user sessions

---

### 2. Database Connection Strings

#### `POSTGRES_URL` (Required)
- **What it is**: Full PostgreSQL connection string with connection pooling
- **Where to find**: Supabase Dashboard → Settings → Database → Connection String (Pooled)
- **Format**: `postgresql://[user]:[password]@[host]:[port]/[database]`
- **Example**: `postgresql://postgres:MyPassword123@db.abcdefgh.supabase.co:6543/postgres`
- **Where used**: Server-side database operations
- **Security**: 🔒 KEEP SECRET
- **What it does**: Connects to your PostgreSQL database

#### `POSTGRES_PRISMA_URL` (Required)
- **What it is**: Same as POSTGRES_URL (for Prisma ORM if used)
- **Where to find**: Same as POSTGRES_URL
- **Example**: Same as POSTGRES_URL
- **Where used**: ORM connections
- **Security**: 🔒 KEEP SECRET

#### `POSTGRES_URL_NON_POOLING` (Required)
- **What it is**: PostgreSQL connection string without connection pooling
- **Where to find**: Supabase Dashboard → Settings → Database → Connection String (Transaction)
- **Format**: Same as POSTGRES_URL
- **Example**: `postgresql://postgres:MyPassword123@db.abcdefgh.supabase.co:5432/postgres`
- **Where used**: Operations that don't need pooling
- **Security**: 🔒 KEEP SECRET
- **Note**: Port is usually 5432 (vs 6543 for pooled)

---

### 3. Individual Database Credentials

#### `POSTGRES_USER` (Required)
- **What it is**: PostgreSQL username
- **Where to find**: Supabase Dashboard → Settings → Database → Connection Info
- **Default Value**: `postgres`
- **Example**: `postgres`
- **Where used**: Database connection
- **Security**: 🔒 KEEP SECRET

#### `POSTGRES_PASSWORD` (Required)
- **What it is**: PostgreSQL password
- **Where to find**: You set this when creating Supabase project
- **Example**: `MySecurePassword123!`
- **Where used**: Database connection
- **Security**: 🔒 KEEP SECRET

#### `POSTGRES_HOST` (Required)
- **What it is**: Database server hostname
- **Where to find**: Supabase Dashboard → Settings → Database → Host
- **Example**: `db.abcdefgh.supabase.co`
- **Where used**: Database connection
- **Security**: ✅ Generally safe (identifies server but not credentials)

#### `POSTGRES_DATABASE` (Required)
- **What it is**: Database name
- **Where to find**: Supabase Dashboard → Settings → Database → Database
- **Default Value**: `postgres`
- **Example**: `postgres`
- **Where used**: Database connection
- **Security**: ✅ Safe to expose

#### `POSTGRES_PORT` (Required)
- **What it is**: Database port number
- **Where to find**: Supabase Dashboard → Settings → Database → Port
- **Default Value for Pooling**: `6543`
- **Default Value without Pooling**: `5432`
- **Example**: `6543` or `5432`
- **Where used**: Database connection
- **Security**: ✅ Safe to expose

---

### 4. Alternate Supabase Keys

#### `SUPABASE_URL`
- **What it is**: Duplicate of NEXT_PUBLIC_SUPABASE_URL
- **Where to find**: Same as NEXT_PUBLIC_SUPABASE_URL
- **Example**: `https://abcdefgh.supabase.co`
- **Where used**: Some libraries expect this variable
- **Security**: ✅ Safe to expose

#### `SUPABASE_ANON_KEY`
- **What it is**: Duplicate of NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Where to find**: Same as NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where used**: Some libraries expect this variable
- **Security**: ✅ Safe to expose

---

## How to Get These Values from Supabase

### Step 1: Go to API Settings
1. Visit [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Settings** (gear icon, bottom left)
4. Click **API**

### Step 2: Copy API Keys
- `Project URL` → Use for `NEXT_PUBLIC_SUPABASE_URL`
- `Anon Key` (public) → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `Service Role Key` (secret) → Use for `SUPABASE_SERVICE_ROLE_KEY`
- `JWT Secret` → Use for `SUPABASE_JWT_SECRET`

### Step 3: Get Database Connection Info
1. Go to **Settings → Database**
2. Under "Connection Info":
   - `Host` → `POSTGRES_HOST`
   - `Port` → `POSTGRES_PORT` (6543 for pooled, 5432 for transaction)
   - `Database` → `POSTGRES_DATABASE` (usually `postgres`)
   - `User` → `POSTGRES_USER`
   - `Password` → `POSTGRES_PASSWORD`

### Step 4: Get Full Connection Strings
1. Go to **Settings → Database → Connection Strings**
2. Select "Pooled" connection
3. Copy the entire URL → `POSTGRES_URL` and `POSTGRES_PRISMA_URL`
4. Select "Transaction" connection
5. Copy the entire URL → `POSTGRES_URL_NON_POOLING`

---

## Variable Categories

### Public Variables (Safe to expose)
These can be in `.env`, `.env.local`, or the codebase:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
POSTGRES_HOST
POSTGRES_DATABASE
POSTGRES_PORT
```

### Secret Variables (NEVER expose)
Keep these in `.env.local` ONLY and add `.env.local` to `.gitignore`:
```
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET
POSTGRES_URL
POSTGRES_PRISMA_URL
POSTGRES_URL_NON_POOLING
POSTGRES_USER
POSTGRES_PASSWORD
```

---

## Verification Checklist

After setting environment variables:

- [ ] `.env.local` file exists
- [ ] All required variables are filled in
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT in browser DevTools Network tab
- [ ] `POSTGRES_PASSWORD` is NOT in client-side code
- [ ] `.env.local` is in `.gitignore`
- [ ] Can sign in to app
- [ ] Can load members from database
- [ ] Console shows no "undefined variable" errors

---

## Testing Your Setup

### Check if variables are loaded:
```bash
# On server (Node.js)
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)

# In browser (React)
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

### Test Supabase connection:
```bash
# Try to sign in
curl -X POST https://your-project.supabase.co/auth/v1/token \
  -H "apikey: your-anon-key" \
  -d '{"email":"user@example.com","password":"password"}'
```

---

## Troubleshooting

### "Variable is undefined"
- Check `.env.local` exists
- Verify spelling matches exactly
- Restart dev server: `npm run dev`
- Check DevTools Console

### "Cannot connect to database"
- Verify `POSTGRES_URL` is correct
- Check database is running
- Verify `POSTGRES_PASSWORD` is correct
- Try non-pooled connection

### "Unauthorized" errors
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Verify database RLS policies
- Check user is authenticated

### Variables in browser showing secrets
- Move variables to `.env.local`
- Add `.env.local` to `.gitignore`
- Never use `SUPABASE_SERVICE_ROLE_KEY` on client-side
- Restart dev server

---

## Variable Usage by File

| File | Variables Used | Type |
|------|---|---|
| `lib/supabase/client.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public |
| `lib/supabase/server.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Server |
| `app/api/*/route.ts` | All (server-side) | Secret |
| `middleware.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET` | Mixed |
| `components/*.tsx` | `NEXT_PUBLIC_*` only | Public |

---

## Security Best Practices

1. **Never commit `.env.local`** - Add to `.gitignore`
2. **Rotate keys regularly** - Generate new keys in Supabase dashboard
3. **Use environment-specific secrets** - Different keys for dev/staging/production
4. **Limit service role key usage** - Only use on server-side
5. **Monitor API usage** - Check Supabase Dashboard → Logs
6. **Audit database access** - Set up RLS policies

---

## Need Help?

1. Verify all variables in Supabase Dashboard
2. Check variable formatting (no extra spaces)
3. Ensure `.env.local` is in project root
4. Restart `npm run dev`
5. Check network tab for 401/403 errors
6. Read [SUPABASE_INTEGRATION.md](SUPABASE_INTEGRATION.md)
