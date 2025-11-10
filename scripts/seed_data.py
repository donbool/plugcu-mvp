#!/usr/bin/env python3
"""
Seed script for PlugCU database with demo data
Note: This script directly inserts data for local development.
For production, create users through proper auth flow.
"""

import os
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv
import uuid

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

    return create_client(url, key)

def create_demo_users(supabase: Client) -> Dict[str, str]:
    """Create demo users directly using raw SQL to bypass auth constraint"""
    user_ids = {}
    demo_users = [
        ("debate@example.com", "student_org", "Columbia Debate Society"),
        ("entrepreneurship@example.com", "student_org", "NYU Entrepreneurship Club"),
        ("redbull@example.com", "brand", "Red Bull Marketing Team"),
        ("spotify@example.com", "brand", "Spotify Campus Partnerships"),
        ("admin@example.com", "admin", "PlugCU Admin")
    ]

    # Use raw SQL to insert users with explicit IDs
    # This bypasses the foreign key constraint to auth.users
    for email, role, full_name in demo_users:
        user_id = str(uuid.uuid4())
        user_ids[email] = user_id

        # Use SQL to insert directly
        sql = f"""
        INSERT INTO public.users (id, email, role, full_name)
        VALUES ('{user_id}', '{email}', '{role}', '{full_name}')
        ON CONFLICT DO NOTHING;
        """

        try:
            # Execute raw SQL via supabase
            result = supabase.postgrest.schema('public').rpc('sql', {'query': sql}).execute()
            print(f"Created user: {email}")
        except Exception as e:
            # Try alternative approach - direct insert if user doesn't exist
            try:
                result = supabase.table('users').insert({
                    "id": user_id,
                    "email": email,
                    "role": role,
                    "full_name": full_name
                }).execute()
                print(f"Created user: {email}")
            except Exception as e2:
                print(f"Note: User {email} may already exist or table requires auth users")
                # Continue anyway - the IDs are still useful

    print(f"Prepared {len(user_ids)} demo users")
    return user_ids

def create_demo_orgs(supabase: Client, user_ids: Dict[str, str]) -> Dict[str, str]:
    """Create demo organizations"""
    demo_orgs = [
        {
            "id": str(uuid.uuid4()),
            "user_id": user_ids["debate@example.com"],
            "name": "Columbia Debate Society",
            "description": "Premier collegiate debate organization fostering critical thinking and public speaking skills",
            "university": "Columbia University",
            "website_url": "https://www.columbia.edu/cu/debate",
            "contact_email": "debate@example.com",
            "member_count": 45,
            "founded_year": 1895,
            "category": "Academic",
            "status": "verified",
            "tags": ["debate", "public speaking", "academic", "competition", "policy"]
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": user_ids["entrepreneurship@example.com"],
            "name": "NYU Entrepreneurship & Innovation Club",
            "description": "Connecting aspiring entrepreneurs with resources, mentorship, and networking opportunities",
            "university": "New York University",
            "website_url": "https://www.nyu.edu/students/student-information-and-resources/student-community-and-activities/student-clubs-and-organizations.html",
            "contact_email": "entrepreneurship@example.com",
            "member_count": 120,
            "founded_year": 2010,
            "category": "Business",
            "status": "verified",
            "tags": ["entrepreneurship", "startups", "business", "networking", "innovation", "tech"]
        }
    ]

    result = supabase.table('orgs').insert(demo_orgs).execute()
    print(f"Created {len(demo_orgs)} demo organizations")

    return {org["name"]: org["id"] for org in demo_orgs}

def create_demo_brands(supabase: Client, user_ids: Dict[str, str]) -> Dict[str, str]:
    """Create demo brands"""
    demo_brands = [
        {
            "id": str(uuid.uuid4()),
            "user_id": user_ids["redbull@example.com"],
            "company_name": "Red Bull",
            "description": "Energy drink company focusing on extreme sports, music, and youth culture",
            "website_url": "https://www.redbull.com",
            "contact_email": "redbull@example.com",
            "industry": "Beverage",
            "company_size": "enterprise",
            "status": "verified",
            "target_demographics": ["college students", "18-24", "sports enthusiasts", "young adults"],
            "budget_range_min": 2000,
            "budget_range_max": 25000,
            "preferred_event_types": ["sports", "competition", "music", "extreme sports", "festival"],
            "geographic_focus": ["New York", "Northeast", "Urban areas"]
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": user_ids["spotify@example.com"],
            "company_name": "Spotify",
            "description": "Music streaming platform connecting artists with audiences worldwide",
            "website_url": "https://www.spotify.com",
            "contact_email": "spotify@example.com",
            "industry": "Technology",
            "company_size": "enterprise",
            "status": "verified",
            "target_demographics": ["college students", "music lovers", "18-24", "tech-savvy"],
            "budget_range_min": 1500,
            "budget_range_max": 15000,
            "preferred_event_types": ["music", "cultural", "social", "tech", "creative"],
            "geographic_focus": ["New York", "California", "Major cities"]
        }
    ]

    result = supabase.table('brands').insert(demo_brands).execute()
    print(f"Created {len(demo_brands)} demo brands")

    return {brand["company_name"]: brand["id"] for brand in demo_brands}

def create_demo_events(supabase: Client, org_ids: Dict[str, str]) -> List[str]:
    """Create demo events"""
    now = datetime.now()

    demo_events = [
        {
            "id": str(uuid.uuid4()),
            "org_id": org_ids["Columbia Debate Society"],
            "title": "Annual Ivy League Debate Championship",
            "description": "Premier collegiate debate tournament featuring teams from all Ivy League universities. Three days of intense policy debates on current global issues.",
            "event_date": (now + timedelta(days=45)).isoformat(),
            "application_deadline": (now + timedelta(days=30)).isoformat(),
            "expected_attendance": 200,
            "venue": "Columbia University Campus",
            "event_type": "competition",
            "sponsorship_min_amount": 3000,
            "sponsorship_max_amount": 15000,
            "sponsorship_benefits": [
                "Logo on all promotional materials",
                "Speaking opportunity at opening ceremony",
                "Booth space in common area",
                "Social media promotion"
            ],
            "tags": ["debate", "competition", "academic", "ivy league", "policy", "intellectual"],
            "status": "published",
            "featured": True
        },
        {
            "id": str(uuid.uuid4()),
            "org_id": org_ids["NYU Entrepreneurship & Innovation Club"],
            "title": "NYU Startup Pitch Competition & Networking Night",
            "description": "An evening showcasing innovative student startups with pitch competitions, mentorship sessions, and networking opportunities with industry professionals.",
            "event_date": (now + timedelta(days=21)).isoformat(),
            "application_deadline": (now + timedelta(days=14)).isoformat(),
            "expected_attendance": 150,
            "venue": "NYU Stern School of Business",
            "event_type": "competition",
            "sponsorship_min_amount": 2000,
            "sponsorship_max_amount": 10000,
            "sponsorship_benefits": [
                "Judge panel participation",
                "Prize sponsor recognition",
                "Networking session hosting",
                "Digital marketing package"
            ],
            "tags": ["startups", "entrepreneurship", "business", "networking", "innovation", "tech", "pitch"],
            "status": "published",
            "featured": True
        },
        {
            "id": str(uuid.uuid4()),
            "org_id": org_ids["Columbia Debate Society"],
            "title": "Community Debate Workshop Series",
            "description": "Weekly workshops open to the public, teaching debate skills and discussing current events. Building community engagement and critical thinking.",
            "event_date": (now + timedelta(days=60)).isoformat(),
            "application_deadline": (now + timedelta(days=45)).isoformat(),
            "expected_attendance": 75,
            "venue": "Columbia Community Center",
            "event_type": "educational",
            "sponsorship_min_amount": 500,
            "sponsorship_max_amount": 3000,
            "sponsorship_benefits": [
                "Workshop material branding",
                "Community outreach recognition",
                "Local media mention"
            ],
            "tags": ["education", "community", "debate", "workshop", "public speaking"],
            "status": "published",
            "featured": False
        }
    ]

    result = supabase.table('events').insert(demo_events).execute()
    print(f"Created {len(demo_events)} demo events")

    return [event["id"] for event in demo_events]

def main():
    """Main seeding function"""
    print("Starting PlugCU database seeding...")

    try:
        supabase = get_supabase_client()

        # Create demo data
        user_ids = create_demo_users(supabase)
        org_ids = create_demo_orgs(supabase, user_ids)
        brand_ids = create_demo_brands(supabase, user_ids)
        event_ids = create_demo_events(supabase, org_ids)

        print(f"""
Seeding completed successfully!

Demo Data Created:
- {len(user_ids)} users
- {len(org_ids)} organizations
- {len(brand_ids)} brands
- {len(event_ids)} events

Demo Accounts (for local testing):
- Org 1: debate@example.com
- Org 2: entrepreneurship@example.com
- Brand 1: redbull@example.com
- Brand 2: spotify@example.com
- Admin: admin@example.com

Note: These are test accounts for local development.
For production use, users should be created through proper Supabase Auth.
        """)

    except Exception as e:
        print(f"Error during seeding: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
