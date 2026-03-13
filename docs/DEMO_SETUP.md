# Demo Account Setup Guide

## Overview

This guide explains how to set up demo accounts and populate the Lebbu Kale Heywet Church Digital Management Platform with sample data for testing.

## Demo Accounts

The system includes 9 pre-configured demo accounts with different roles:

### Admin Account
- **Email**: admin@church.local
- **Password**: Admin123!
- **Role**: System Administrator (full access to all features)

### Ministry Leader
- **Email**: leader@church.local
- **Password**: Leader123!
- **Role**: Ministry Leader (can manage ministries and members)

### Regular Member
- **Email**: member@church.local
- **Password**: Member123!
- **Role**: Regular Member (view-only access to most features)

### Counselor
- **Email**: counselor@church.local
- **Password**: Counselor123!
- **Role**: Counselor (manages counseling records)

### Youth Leader
- **Email**: youth@church.local
- **Password**: Youth123!
- **Role**: Youth Ministry Leader

### Treasurer
- **Email**: treasurer@church.local
- **Password**: Treasurer123!
- **Role**: Financial Manager (manages donations and expenses)

### Additional Members
- **almaz@church.local** / Almaz123!
- **getnet@church.local** / Getnet123!
- **marta@church.local** / Marta123!

## Setup Instructions

### Step 1: Deploy the Application

First, deploy the application to Vercel or your chosen hosting platform.

### Step 2: Create Demo Accounts

#### Option A: Using the Node.js Script (Recommended)

1. Make sure you have Node.js installed (v16 or higher)

2. Set up your environment variables:
   ```bash
   # Copy your Supabase credentials
   export NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
   export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
   ```

3. Run the demo setup script:
   ```bash
   node scripts/setup-demo-accounts.js
   ```

   The script will:
   - Create 9 auth users in Supabase
   - Create corresponding user profiles
   - Set admin flags where appropriate
   - Auto-confirm all email addresses

#### Option B: Manual Setup in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication → Users**
3. Click "Add user" for each demo account
4. Use the credentials provided above
5. Check "Auto confirm user" option
6. Set email confirmed at to today's date

Then manually insert profiles using the SQL from `/scripts/005_demo_accounts.sql` (replacing the placeholder UUIDs with actual user IDs).

### Step 3: Load Sample Data (Optional)

The sample data includes:
- 10 Church Ministries
- 10 Ministry Members relationships
- 5 Events
- 8 Financial Transactions
- 8 Attendance Records

To load sample data:

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `/scripts/006_demo_sample_data.sql`
3. Paste and execute the SQL

Or use the `psql` command line:
```bash
psql -h your_host -U your_user -d your_database -f scripts/006_demo_sample_data.sql
```

## Features You Can Test

With the demo accounts and sample data loaded, you can test:

### Admin Features
- Full dashboard access with all modules
- Create new members
- Manage all ministries
- View financial reports
- Manage attendance records
- Create events

### Ministry Leader Features
- View and manage their ministry
- Add/remove ministry members
- View ministry attendance
- Record counseling sessions

### Member Features
- View their profile
- See ministry information
- Check event schedules
- View their attendance records

### Treasurer Features
- Record donations and tithes
- Log expenses
- View financial reports
- Manage financial transactions

## Common Testing Scenarios

### 1. Testing Authentication
- Login with admin@church.local / Admin123!
- Verify email confirmation requirement
- Test password reset functionality

### 2. Testing Member Management
- Add new members as admin
- Assign members to ministries
- Update member information

### 3. Testing Financial Features
- Record a tithe/donation as treasurer
- View financial dashboard
- Filter transactions by type

### 4. Testing Attendance
- Record attendance for a service
- Mark members as present/absent/late
- View attendance reports

### 5. Testing Multi-Language
- Use the language switcher in the sidebar
- Switch between English and Amharic
- Verify all UI elements translate

### 6. Testing Ministry Modules
- Create a spiritual service record
- Add counseling session notes
- Schedule a youth event
- Log a community service activity

## Database Overview

### Key Tables

| Table | Records | Purpose |
|-------|---------|---------|
| profiles | 9 | User accounts and profiles |
| ministries | 10 | Church ministries |
| ministry_members | 10 | Ministry memberships |
| events | 5 | Church events |
| financial_transactions | 8 | Income and expenses |
| attendance_records | 8 | Service attendance |

## Resetting Demo Data

To reset and start over:

### Option 1: Keep Only Accounts
```sql
-- Keep accounts but clear all data
DELETE FROM attendance_records;
DELETE FROM financial_transactions;
DELETE FROM events;
DELETE FROM ministry_members;
DELETE FROM ministries;
```

### Option 2: Full Reset
Delete all users from Supabase Authentication dashboard and re-run the setup.

## Troubleshooting

### "Service Role Key not found" error
- Make sure you've set the `SUPABASE_SERVICE_ROLE_KEY` environment variable
- Don't use the anonymous key; use the service role key

### "User already exists" error
- The user already exists; skip or delete the user first from Supabase dashboard

### Email confirmation not working
- The script auto-confirms emails for demo purposes
- If manual setup, check the "Auto confirm user" option

### Profiles not created
- Make sure the profiles table exists (run migration scripts first)
- Verify the UUID format is correct

## Security Note

⚠️ **These demo credentials are for testing only!**

Before deploying to production:
1. Delete all demo accounts from the authentication system
2. Create real admin account(s) with secure passwords
3. Remove demo data from the database
4. Implement proper user invitation/registration workflow

## Next Steps

After demo setup, you can:
1. Test all features thoroughly
2. Customize branding and settings
3. Configure payment gateways for Phase 3
4. Set up mobile app
5. Prepare for production deployment

---

For more information, see the main README or contact support.
