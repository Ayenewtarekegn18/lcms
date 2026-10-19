// Creates demo accounts for local development / demos only.
// Run: node --env-file=.env.local scripts/setup-demo-accounts.js
// Passwords are never stored in the repo: set DEMO_ADMIN_PASSWORD and DEMO_USER_PASSWORD in .env.local.
// NEVER run this against a production project: it creates a confirmed admin account.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD;
const DEMO_USER_PASSWORD = process.env.DEMO_USER_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  process.exit(1);
}

if (process.env.ALLOW_DEMO_SEED !== 'true') {
  console.error('❌ Refusing to run: set ALLOW_DEMO_SEED=true to confirm this is a development/demo project (never production).');
  process.exit(1);
}

if (!DEMO_ADMIN_PASSWORD || !DEMO_USER_PASSWORD || DEMO_ADMIN_PASSWORD.length < 12 || DEMO_USER_PASSWORD.length < 12) {
  console.error('❌ Error: DEMO_ADMIN_PASSWORD and DEMO_USER_PASSWORD must be set (12+ characters) in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const DEMO_ACCOUNTS = [
  {
    email: 'admin@church.local',
    role: 'admin',
    password: DEMO_ADMIN_PASSWORD,
    first_name: 'Admin',
    last_name: 'Church',
    is_admin: true,
    phone: '+251911234567',
    date_of_birth: '1985-01-15',
    gender: 'Male',
    address: '123 Church St',
    city: 'Addis Ababa',
    country: 'Ethiopia'
  },
  {
    email: 'leader@church.local',
    role: 'ministry_leader',
    password: DEMO_USER_PASSWORD,
    first_name: 'David',
    last_name: 'Bekele',
    is_admin: false,
    phone: '+251922345678',
    date_of_birth: '1980-03-20',
    gender: 'Male',
    address: '456 Ministry Ave',
    city: 'Addis Ababa',
    country: 'Ethiopia'
  },
  {
    email: 'member@church.local',
    role: 'member',
    password: DEMO_USER_PASSWORD,
    first_name: 'Hiwot',
    last_name: 'Hailu',
    is_admin: false,
    phone: '+251933456789',
    date_of_birth: '1990-07-10',
    gender: 'Female',
    address: '789 Community Ln',
    city: 'Addis Ababa',
    country: 'Ethiopia'
  },
  {
    email: 'counselor@church.local',
    role: 'ministry_leader',
    password: DEMO_USER_PASSWORD,
    first_name: 'Yohannes',
    last_name: 'Tamrat',
    is_admin: false,
    phone: '+251944567890',
    date_of_birth: '1982-05-25',
    gender: 'Male',
    address: '321 Care St',
    city: 'Addis Ababa',
    country: 'Ethiopia'
  },
  {
    email: 'youth@church.local',
    role: 'ministry_leader',
    password: DEMO_USER_PASSWORD,
    first_name: 'Abeba',
    last_name: 'Solomon',
    is_admin: false,
    phone: '+251955678901',
    date_of_birth: '1992-11-08',
    gender: 'Female',
    address: '654 Youth Way',
    city: 'Addis Ababa',
    country: 'Ethiopia'
  },
  {
    email: 'treasurer@church.local',
    role: 'finance',
    password: DEMO_USER_PASSWORD,
    first_name: 'Tadesse',
    last_name: 'Mengistu',
    is_admin: false,
    phone: '+251966789012',
    date_of_birth: '1975-09-30',
    gender: 'Male',
    address: '987 Finance Dr',
    city: 'Addis Ababa',
    country: 'Ethiopia'
  },
  {
    email: 'almaz@church.local',
    role: 'member',
    password: DEMO_USER_PASSWORD,
    first_name: 'Almaz',
    last_name: 'Tekle',
    is_admin: false,
    phone: '+251977890123',
    date_of_birth: '1988-02-14',
    gender: 'Female',
    address: '111 Hope St',
    city: 'Addis Ababa',
    country: 'Ethiopia'
  },
  {
    email: 'getnet@church.local',
    role: 'member',
    password: DEMO_USER_PASSWORD,
    first_name: 'Getnet',
    last_name: 'Abebe',
    is_admin: false,
    phone: '+251988901234',
    date_of_birth: '1995-08-22',
    gender: 'Male',
    address: '222 Grace Ave',
    city: 'Addis Ababa',
    country: 'Ethiopia'
  },
  {
    email: 'marta@church.local',
    role: 'member',
    password: DEMO_USER_PASSWORD,
    first_name: 'Marta',
    last_name: 'Yilma',
    is_admin: false,
    phone: '+251999012345',
    date_of_birth: '1991-04-16',
    gender: 'Female',
    address: '333 Blessing Ln',
    city: 'Addis Ababa',
    country: 'Ethiopia'
  }
];

async function createDemoAccounts() {
  console.log('🚀 Starting demo account setup...\n');

  for (let i = 0; i < DEMO_ACCOUNTS.length; i++) {
    const account = DEMO_ACCOUNTS[i];
    try {
      console.log(`[${i + 1}/${DEMO_ACCOUNTS.length}] Creating account: ${account.email}`);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true, // Auto-confirm email for demo purposes
        user_metadata: {
          first_name: account.first_name,
          last_name: account.last_name,
          is_admin: account.is_admin
        }
      });

      if (authError) {
        console.error(`   ❌ Auth Error: ${authError.message}`);
        continue;
      }

      const userId = authData.user.id;
      console.log(`   ✓ Auth user created with ID: ${userId}`);

      // Fill in the profile (the on_auth_user_created trigger already inserted the row)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([
          {
            id: userId,
            first_name: account.first_name,
            last_name: account.last_name,
            email: account.email,
            phone: account.phone,
            date_of_birth: account.date_of_birth,
            gender: account.gender,
            address: account.address,
            city: account.city,
            country: account.country,
            is_admin: account.is_admin,
            role: account.role, // needs profiles.role (docs/remediation/sql/01_emergency_lockdown.sql)
            is_active: true
          }
        ], { onConflict: 'id' });

      if (profileError) {
        console.error(`   ❌ Profile Error: ${profileError.message}`);
        continue;
      }

      console.log(`   ✓ Profile created successfully\n`);
    } catch (error) {
      console.error(`   ❌ Unexpected Error: ${error.message}\n`);
    }
  }

  console.log('\n✅ Demo account setup completed!');
  console.log('\nDemo Accounts Summary:');
  console.log('════════════════════════════════════════');
  DEMO_ACCOUNTS.forEach((account, index) => {
    console.log(`${index + 1}. ${account.email}`);
    console.log(`   Password: ${account.is_admin ? 'DEMO_ADMIN_PASSWORD' : 'DEMO_USER_PASSWORD'} (from .env.local)`);
    console.log(`   Role: ${account.role}\n`);
  });
}

createDemoAccounts().catch(error => {
  console.error('❌ Fatal Error:', error);
  process.exit(1);
});
