# 🚀 PlugCU MVP Setup & Testing Instructions

Follow these step-by-step instructions to set up and test the PlugCU platform locally.

## Prerequisites

Ensure you have the following installed:
- **Node.js 18+** and npm
- **Python 3.9+** and pip
- **Git**
- A **Supabase account** (free tier works)

## Step 1: Clone and Install Dependencies

```bash
#use a venv probably a good idea
#mac/linux: 
# python3 -m venv .venv
# source .venv/bin/activate
# pip install --upgrade pip
# pip install -r requirements.txt

# Clone the repository
git clone <your-repo-url>
cd plugcu-mvp

# Install frontend dependencies
cd apps/web
npm install

# Install backend dependencies
cd ../api
pip install -r requirements.txt

# Return to root directory
cd ../..
```

## Step 2: Set Up Supabase Database

### 2.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization, enter project name: `plugcu-mvp`
4. Choose a database password (save it!)
5. Select a region close to you
6. Click "Create new project"

### 2.2 Get Your Supabase Credentials
Once your project is ready:
1. Go to **Settings > API** in your Supabase dashboard
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJhbGc...`)
   - **service_role key** (starts with `eyJhbGc...` - keep this secret!)

### 2.3 Run Database Migration
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `db/schema.sql`
3. Paste it into the SQL Editor and click **Run**
4. You should see "Success. No rows returned" - this is expected!

### 2.4 Add Data Collection Schema (Optional - for ML features)
1. In the **SQL Editor**, copy the contents of `db/data_collection_schema.sql`
2. Paste and run to enable advanced analytics and ML data collection
3. This adds tables for user interactions, match feedback, and deal tracking

## Step 3: Configure Environment Variables

### 3.1 Frontend Environment
```bash
# In the root directory
cp .env.example .env.local

# Edit .env.local with your Supabase credentials:
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3.2 Backend Environment
```bash
# In apps/api directory
cd apps/api
cp .env.example .env

# Edit .env with your Supabase credentials:
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 4: Seed Demo Data

```bash
# From the root directory
cd scripts
python seed_data.py
```

You should see output like:
```
Starting PlugCU database seeding...
Created 5 demo users
Created 2 demo organizations
Created 2 demo brands
Created 3 demo events
Seeding completed successfully!
```

## Step 5: Start Development Servers

Open **two terminal windows**:

### Terminal 1: Frontend (Next.js)
```bash
cd apps/web
npm run dev
```

### Terminal 2: Backend (FastAPI)
```bash
cd apps/api

# Option 1: Using uvicorn directly
python -m uvicorn main:app --reload

# Option 2: Using the run script (if Option 1 doesn't work)
python run.py
```

## Step 6: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Step 7: Test the Platform

### 7.1 Test Organization Flow
1. Go to http://localhost:3000
2. Click "Get Started" → "Sign up"
3. Create account with:
   - **Account Type**: Student Organization
   - **Name**: Test Org User
   - **Email**: testorg@columbia.edu
   - **Password**: password123

4. After signup, you'll be redirected to create org profile
5. Fill out the organization profile form
6. Navigate to **Events** → **Create New Event**
7. Create a test event with sponsorship details

### 7.2 Test Brand Flow
1. Open a new incognito/private browser window
2. Go to http://localhost:3000
3. Sign up with:
   - **Account Type**: Brand/Company
   - **Name**: Test Brand User
   - **Email**: testbrand@company.com
   - **Password**: password123

4. Complete the brand profile with budget preferences
5. Navigate to **Discover** to see events
6. Test the filtering functionality
7. Click "Contact Organization" on an event
8. Send a message to test the messaging system

### 7.3 Test Demo Accounts

You can also login with pre-seeded demo accounts:

**Organizations:**
- Email: `columbia.debate@columbia.edu`
- Email: `nyu.entrepreneurship@nyu.edu`

**Brands:**
- Email: `partnerships@redbull.com`
- Email: `campus@spotify.com`

*Note: For demo accounts, use the "Send magic link" option or set up passwords in Supabase Auth dashboard.*

### 7.4 Test Matching Algorithm
1. Login as a brand
2. Go to **Matches** (if profile is complete)
3. The FastAPI backend will compute compatibility scores
4. View detailed matching reasoning

## Step 8: Verify Features

✅ **Authentication**: Signup/login for both org and brand roles  
✅ **Profiles**: Create and edit organization/brand profiles  
✅ **Events**: Post sponsorship opportunities  
✅ **Discovery**: Browse and filter events  
✅ **Messaging**: Send messages between brands and orgs  
✅ **Matching**: AI-powered compatibility scoring  

## Troubleshooting

### Common Issues

**"Not authenticated" errors:**
- Check that your Supabase credentials are correct in `.env.local`
- Verify RLS policies are applied in Supabase

**Seeding script fails:**
- Ensure you've run the database migration first
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly

**Frontend won't start:**
- Run `npm install` in `apps/web` directory
- Check Node.js version (needs 18+)

**Backend API errors:**
- Run `pip install -r requirements.txt` in `apps/api`
- Check Python version (needs 3.9+)

**"ImportError: attempted relative import with no known parent package":**
- Use `python -m uvicorn main:app --reload` instead of `uvicorn main:app --reload`
- Or use `python run.py` from the `apps/api` directory

**Can't login with demo accounts:**
- Demo accounts need passwords set in Supabase Auth dashboard
- Or use "Send magic link" option

### Database Verification

To verify your database setup:
1. Go to Supabase **Table Editor**
2. You should see tables: `users`, `orgs`, `brands`, `events`, `matches`, `threads`, `messages`
3. Check that demo data exists in these tables

### API Testing

Test the matching API directly:
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","service":"matching-api"}
```

## Next Steps

Once everything is working:
1. **Customize** the platform for your specific needs
2. **Deploy** to production (see README.md deployment section)
3. **Scale** by adding more organizations and brands
4. **Enhance** with additional features

## Support

If you encounter issues:
1. Check the console logs in your browser
2. Check terminal output for error messages
3. Verify all environment variables are set correctly
4. Ensure Supabase project is active and accessible

---

**🎉 Congratulations!** You now have a fully functional sponsorship matching platform running locally.