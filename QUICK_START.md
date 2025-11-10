# 🚀 Quick Start (No Database Setup)

If you just want to test the frontend and see if the app builds correctly without setting up Supabase:

## Step 1: Install Dependencies

```bash
cd apps/web
npm install
```

## Step 2: Create Minimal Environment File

```bash
# Create .env.local in apps/web directory
echo "NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder_key" >> .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=placeholder_service_key" >> .env.local
```

## Step 3: Start Development Server

```bash
npm run dev
```

## Expected Behavior

- ✅ **Build Success**: The app should compile without errors
- ✅ **Home Page**: You can view the landing page at http://localhost:3000
- ⚠️ **Auth Issues**: Login/signup won't work (needs real Supabase)
- ⚠️ **Dashboard Issues**: Dashboard pages will show loading/error states

## What You Can Test

- Landing page UI and design
- Navigation structure
- Component styling and responsiveness
- Basic page routing

## Common Build Errors & Fixes

### Error: "Cannot find module 'autoprefixer'"
**Fix**: Run `npm install` to install missing dependencies

### Error: "NEXT_PUBLIC_SUPABASE_URL is required"
**Fix**: Create the `.env.local` file as shown above

### Error: "Module not found: Can't resolve..."
**Fix**: Make sure you're in the `apps/web` directory when running `npm install`

## Next Steps

Once you verify the build works:
1. Follow the full `INSTRUCTIONS.md` to set up Supabase
2. Test the complete functionality with real database
3. See `NEXT_STEPS.md` for deployment and roadmap

---

**This quick start is just for verifying the build process. For full functionality, you'll need to set up Supabase as described in `INSTRUCTIONS.md`.**