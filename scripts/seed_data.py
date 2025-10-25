#!/usr/bin/env python3
"""
Seed script for PlugCU database with demo data
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
    """Create demo users and return their IDs"""
    demo_users = [
        {
            "id": str(uuid.uuid4()),
            "email": "columbia.debate@columbia.edu",
            "role": "student_org",
            "full_name": "Columbia Debate Society"
        },
        {
            "id": str(uuid.uuid4()),
            "email": "nyu.entrepreneurship@nyu.edu", 
            "role": "student_org",
            "full_name": "NYU Entrepreneurship Club"
        },
        {
            "id": str(uuid.uuid4()),
            "email": "partnerships@redbull.com",
            "role": "brand",
            "full_name": "Red Bull Marketing Team"
        },
        {
            "id": str(uuid.uuid4()),
            "email": "campus@spotify.com",
            "role": "brand",
            "full_name": "Spotify Campus Partnerships"
        },
        {
            "id": str(uuid.uuid4()),
            "email": "admin@plugcu.com",
            "role": "admin",
            "full_name": "PlugCU Admin"
        }
    ]
    
    # Insert users
    result = supabase.table('users').insert(demo_users).execute()
    print(f"Created {len(demo_users)} demo users")
    
    # Return mapping of email to user_id for reference
    return {user["email"]: user["id"] for user in demo_users}

def create_demo_orgs(supabase: Client, user_ids: Dict[str, str]) -> Dict[str, str]:
    """Create demo organizations"""
    demo_orgs = [
        {
            "id": str(uuid.uuid4()),
            "user_id": user_ids["columbia.debate@columbia.edu"],
            "name": "Columbia Debate Society",
            "description": "Premier collegiate debate organization fostering critical thinking and public speaking skills",
            "university": "Columbia University",
            "website_url": "https://www.columbia.edu/cu/debate",
            "contact_email": "columbia.debate@columbia.edu",
            "member_count": 45,
            "founded_year": 1895,
            "category": "Academic",
            "status": "verified",
            "tags": ["debate", "public speaking", "academic", "competition", "policy"]
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": user_ids["nyu.entrepreneurship@nyu.edu"],
            "name": "NYU Entrepreneurship & Innovation Club",
            "description": "Connecting aspiring entrepreneurs with resources, mentorship, and networking opportunities",
            "university": "New York University",
            "website_url": "https://www.nyu.edu/students/student-information-and-resources/student-community-and-activities/student-clubs-and-organizations.html",
            "contact_email": "nyu.entrepreneurship@nyu.edu",
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
            "user_id": user_ids["partnerships@redbull.com"],
            "company_name": "Red Bull",
            "description": "Energy drink company focusing on extreme sports, music, and youth culture",
            "website_url": "https://www.redbull.com",
            "contact_email": "partnerships@redbull.com",
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
            "user_id": user_ids["campus@spotify.com"],
            "company_name": "Spotify",
            "description": "Music streaming platform connecting artists with audiences worldwide",
            "website_url": "https://www.spotify.com",
            "contact_email": "campus@spotify.com",
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

You can now:
1. Log in with demo accounts (emails listed above)
2. Test the matching algorithm
3. Explore the platform functionality

Demo Accounts:
- Org 1: columbia.debate@columbia.edu
- Org 2: nyu.entrepreneurship@nyu.edu
- Brand 1: partnerships@redbull.com
- Brand 2: campus@spotify.com
- Admin: admin@plugcu.com

Note: You'll need to set up authentication for these accounts in Supabase Auth
or use magic link/OTP signin.
        """)
        
    except Exception as e:
        print(f"Error during seeding: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()