# Pre-Setup Checklist

Complete this checklist before you start setting up the project locally.

---

## Prerequisites Check

### System Requirements
- [ ] Computer running (macOS, Windows, or Linux)
- [ ] At least 2GB RAM available (4GB+ recommended)
- [ ] At least 500MB free disk space
- [ ] Stable internet connection

---

## Software Installation Check

### Node.js
- [ ] Node.js v18 or higher installed
- [ ] Verify with: `node --version`
- [ ] npm installed (comes with Node.js)
- [ ] Verify with: `npm --version`

**Install Node.js**: https://nodejs.org/

### Git
- [ ] Git installed
- [ ] Verify with: `git --version`
- [ ] GitHub account created (if cloning from GitHub)

**Install Git**: https://git-scm.com/

### Code Editor (Optional but Recommended)
- [ ] VS Code installed (or other editor)
- [ ] VS Code Git extension installed (comes by default)

**Install VS Code**: https://code.visualstudio.com/

---

## Supabase Account Setup

### Supabase Registration
- [ ] Visit https://supabase.com
- [ ] Create account (email signup)
- [ ] Verify email address
- [ ] Can login to https://supabase.com/dashboard

### Supabase Project
- [ ] Created new project
- [ ] Project is initialized and ready (status shows "Healthy")
- [ ] Can access project dashboard

### Gather Credentials
From Supabase Dashboard → Settings → API, have these ready:
- [ ] **Project URL** - Example: `https://abcdefgh.supabase.co`
- [ ] **Anon Key** - Long string starting with `eyJ...`
- [ ] **Service Role Key** - Long string (longer than Anon Key)

From Supabase Dashboard → Settings → Database, have these ready:
- [ ] **Host** - Example: `db.abcdefgh.supabase.co`
- [ ] **Database** - Usually `postgres`
- [ ] **User** - Usually `postgres`
- [ ] **Password** - You set this when creating project
- [ ] **Port** - Usually `5432` or `6543` (for pooling)

---

## Local Environment Setup

### Create Workspace Directory
- [ ] Created directory for projects (e.g., `~/Projects/`)
- [ ] Directory is accessible and writable
- [ ] Terminal/Command Prompt can navigate to it

### Clone Repository
- [ ] Have repository URL ready
- [ ] Can clone with: `git clone <url>`
- [ ] OR have project files available locally

---

## Knowledge Check

### Basic Understanding
- [ ] Know what Node.js is
- [ ] Know what npm is
- [ ] Know what a database is
- [ ] Know what environment variables are

### Don't worry if you don't know all of this - documentation will help!

---

## Internet & Network

### Connectivity
- [ ] Has reliable internet connection
- [ ] Can access https://supabase.com
- [ ] Can access https://npmjs.com (for package downloads)
- [ ] Can access https://github.com (if using GitHub)

### Firewall/VPN
- [ ] No firewall blocking npm.js connections
- [ ] No VPN required (or VPN configured if needed)
- [ ] Port 3000 available locally (for dev server)

---

## Files & Permissions

### Project Location
- [ ] Can create directories
- [ ] Can write files in chosen location
- [ ] Have enough disk space (500MB+)
- [ ] Path doesn't have spaces or special characters (recommended)

---

## Documentation Ready

### Have Access To:
- [ ] This file (PRE_SETUP_CHECKLIST.md)
- [ ] START_HERE.md
- [ ] QUICK_START_LOCAL.md
- [ ] .env.local.example
- [ ] LOCAL_DEVELOPMENT_SETUP.md

---

## Ready to Start?

If you've checked all boxes above, you're ready!

### Next Steps:
1. Go to [START_HERE.md](START_HERE.md)
2. Choose your setup path
3. Follow the instructions
4. Run the project

---

## If Something is Missing

### Missing Node.js?
- Install from: https://nodejs.org/
- Choose LTS version (v18 or higher)

### Missing Git?
- Install from: https://git-scm.com/
- Use default installation settings

### Missing Supabase Account?
- Create at: https://supabase.com
- It's free for basic usage

### Don't have project files?
- Clone from GitHub: `git clone <repository-url>`
- OR download as ZIP and extract

### Don't have credentials?
- Get them from Supabase Dashboard
- Settings → API (for keys)
- Settings → Database (for connection info)

---

## Still Have Questions?

### Before You Start:
1. Read [START_HERE.md](START_HERE.md) - Navigation guide
2. Choose your path:
   - Fast: [QUICK_START_LOCAL.md](QUICK_START_LOCAL.md)
   - Complete: [LOCAL_DEVELOPMENT_SETUP.md](LOCAL_DEVELOPMENT_SETUP.md)

### During Setup:
1. Check [LOCAL_DEVELOPMENT_SETUP.md](LOCAL_DEVELOPMENT_SETUP.md) → Troubleshooting
2. Check [ENV_VARIABLES_EXPLAINED.md](ENV_VARIABLES_EXPLAINED.md)

### Can't Find Something?
1. Check [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
2. Use Ctrl+F (or Cmd+F) to search files

---

## Estimated Time

| Task | Time |
|------|------|
| Check prerequisites | 5 min |
| Install Node.js (if needed) | 10 min |
| Install Git (if needed) | 5 min |
| Create Supabase account (if needed) | 10 min |
| Get Supabase credentials | 5 min |
| **Total Pre-Setup** | **~35 min** |
| Actual Project Setup | 5-30 min |
| **Total Time to Running** | **40-65 min** |

---

## Security Reminder

Before you start, remember:
- ✓ Never commit `.env.local` to version control
- ✓ Never share your Supabase credentials
- ✓ Keep service role key secret
- ✓ Never expose POSTGRES_PASSWORD in code

---

## Ready?

✅ All prerequisites met?  
✅ All software installed?  
✅ Supabase account with credentials?  

**Then go to: [START_HERE.md](START_HERE.md)**

Let's get your church management system running locally! 🚀
