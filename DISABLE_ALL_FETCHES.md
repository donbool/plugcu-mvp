# NETWORK CALLS DISABLED

All useEffect hooks that make Supabase database calls have been disabled.
This includes:

- Org Dashboard (org/page.tsx)
- Brand Dashboard (brand/page.tsx) 
- Org Messages (org/messages/page.tsx)
- Brand Messages (brand/messages/page.tsx)
- Org Events List (org/events/page.tsx)
- Org Profile (org/profile/page.tsx)
- Brand Discover (brand/discover/page.tsx)
- Brand Matches (brand/matches/page.tsx)
- Brand Profile (brand/profile/page.tsx)
- New Event (org/events/new/page.tsx)

The app will now load with minimal network activity.
To re-enable, search for "// DISABLED:" comments and uncomment.
