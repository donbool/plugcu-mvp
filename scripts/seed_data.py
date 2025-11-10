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
    """Create or fetch demo users"""
    user_ids = {}
    demo_users = [
        ("debate@example.com", "student_org", "Columbia Debate Society"),
        ("entrepreneurship@example.com", "student_org", "NYU Entrepreneurship Club"),
        ("redbull@example.com", "brand", "Red Bull Marketing Team"),
        ("spotify@example.com", "brand", "Spotify Campus Partnerships"),
        ("admin@example.com", "admin", "PlugCU Admin")
    ]

    # First try to fetch existing users
    try:
        existing_users = supabase.table('users').select('id, email').execute()
        existing_map = {user['email']: user['id'] for user in existing_users.data or []}
    except:
        existing_map = {}

    # Create or fetch users
    for email, role, full_name in demo_users:
        if email in existing_map:
            user_ids[email] = existing_map[email]
            print(f"Found existing user: {email}")
        else:
            user_id = str(uuid.uuid4())
            user_ids[email] = user_id

            try:
                result = supabase.table('users').insert({
                    "id": user_id,
                    "email": email,
                    "role": role,
                    "full_name": full_name
                }).execute()
                print(f"Created user: {email}")
            except Exception as e:
                print(f"Note: User {email} could not be created: {str(e)}")
                # Still track the ID for relationships

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
    # Create or fetch test users for additional brands
    additional_brand_users = []

    # Fetch existing users to avoid duplicates
    try:
        existing_users = supabase.table('users').select('id, email').execute()
        existing_map = {user['email']: user['id'] for user in existing_users.data or []}
    except:
        existing_map = {}

    for i in range(3):
        email = f"brand{i+3}@example.com"
        if email in existing_map:
            user_id = existing_map[email]
            print(f"Found existing brand user: {email}")
        else:
            user_id = str(uuid.uuid4())
            try:
                supabase.table('users').insert({
                    "id": user_id,
                    "email": email,
                    "role": "brand",
                    "full_name": f"Brand {i+3} Team"
                }).execute()
                print(f"Created brand user: {email}")
            except Exception as e:
                print(f"Note: Brand user {email} could not be created: {str(e)}")

        additional_brand_users.append((email, user_id))

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
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": additional_brand_users[0][1],
            "company_name": "Google for Startups",
            "description": "Google's initiative supporting early-stage startups with funding, resources, and mentorship",
            "website_url": "https://startup.google.com",
            "contact_email": additional_brand_users[0][0],
            "industry": "Technology",
            "company_size": "enterprise",
            "status": "verified",
            "target_demographics": ["entrepreneurs", "tech founders", "students", "innovators"],
            "budget_range_min": 5000,
            "budget_range_max": 50000,
            "preferred_event_types": ["competition", "workshop", "networking", "hackathon", "tech"],
            "geographic_focus": ["New York", "California", "Chicago", "National"]
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": additional_brand_users[1][1],
            "company_name": "Nike",
            "description": "Global leader in athletic apparel and footwear sponsoring youth sports and culture",
            "website_url": "https://www.nike.com",
            "contact_email": additional_brand_users[1][0],
            "industry": "Sports & Apparel",
            "company_size": "enterprise",
            "status": "verified",
            "target_demographics": ["athletes", "college students", "sports enthusiasts", "18-35"],
            "budget_range_min": 3000,
            "budget_range_max": 30000,
            "preferred_event_types": ["sports", "competition", "festival", "social"],
            "geographic_focus": ["New York", "California", "Major cities"]
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": additional_brand_users[2][1],
            "company_name": "GitHub",
            "description": "Developer platform enabling collaboration and open source software development",
            "website_url": "https://github.com",
            "contact_email": additional_brand_users[2][0],
            "industry": "Technology",
            "company_size": "enterprise",
            "status": "verified",
            "target_demographics": ["developers", "students", "tech enthusiasts", "entrepreneurs"],
            "budget_range_min": 2500,
            "budget_range_max": 20000,
            "preferred_event_types": ["workshop", "hackathon", "networking", "tech"],
            "geographic_focus": ["New York", "Silicon Valley", "Boston"]
        }
    ]

    result = supabase.table('brands').insert(demo_brands).execute()
    print(f"Created {len(demo_brands)} demo brands")

    return {brand["company_name"]: brand["id"] for brand in demo_brands}

def create_demo_events(supabase: Client, org_ids: Dict[str, str]) -> List[str]:
    """Create demo events with comprehensive coverage"""
    now = datetime.now()

    demo_events = [
        # Columbia Debate Society Events
        {
            "id": str(uuid.uuid4()),
            "org_id": org_ids["Columbia Debate Society"],
            "title": "Annual Ivy League Debate Championship",
            "description": "Premier collegiate debate tournament featuring teams from all Ivy League universities. Three days of intense policy debates on current global issues. Winners receive prizes and recognition.",
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
                "Social media promotion",
                "VIP access",
                "Photography rights"
            ],
            "tags": ["debate", "competition", "academic", "ivy league", "policy", "intellectual"],
            "status": "published",
            "featured": True
        },
        {
            "id": str(uuid.uuid4()),
            "org_id": org_ids["Columbia Debate Society"],
            "title": "Community Debate Workshop Series",
            "description": "Weekly workshops open to the public, teaching debate skills and discussing current events. Building community engagement and critical thinking for all experience levels.",
            "event_date": (now + timedelta(days=60)).isoformat(),
            "application_deadline": (now + timedelta(days=45)).isoformat(),
            "expected_attendance": 75,
            "venue": "Columbia Community Center",
            "event_type": "workshop",
            "sponsorship_min_amount": 500,
            "sponsorship_max_amount": 3000,
            "sponsorship_benefits": [
                "Workshop material branding",
                "Community outreach recognition",
                "Local media mention",
                "Email marketing mention"
            ],
            "tags": ["education", "community", "debate", "workshop", "public speaking"],
            "status": "published",
            "featured": False
        },
        {
            "id": str(uuid.uuid4()),
            "org_id": org_ids["Columbia Debate Society"],
            "title": "High School Debate Invitational Tournament",
            "description": "Annual high school debate tournament attracting competitors from across the Northeast. Great opportunity for brand visibility with younger demographic.",
            "event_date": (now + timedelta(days=90)).isoformat(),
            "application_deadline": (now + timedelta(days=60)).isoformat(),
            "expected_attendance": 300,
            "venue": "Columbia University Morningside Heights",
            "event_type": "competition",
            "sponsorship_min_amount": 2500,
            "sponsorship_max_amount": 12000,
            "sponsorship_benefits": [
                "Logo on t-shirts",
                "Sponsor table",
                "Website listing",
                "Social media promotion",
                "Branded merchandise distribution"
            ],
            "tags": ["debate", "high school", "competition", "youth", "northeast"],
            "status": "published",
            "featured": False
        },
        # NYU Entrepreneurship & Innovation Club Events
        {
            "id": str(uuid.uuid4()),
            "org_id": org_ids["NYU Entrepreneurship & Innovation Club"],
            "title": "NYU Startup Pitch Competition & Networking Night",
            "description": "An evening showcasing innovative student startups with pitch competitions, mentorship sessions, and networking opportunities with industry professionals and investors.",
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
                "Digital marketing package",
                "Logo on promotional materials",
                "Speaking opportunity"
            ],
            "tags": ["startups", "entrepreneurship", "business", "networking", "innovation", "tech", "pitch"],
            "status": "published",
            "featured": True
        },
        {
            "id": str(uuid.uuid4()),
            "org_id": org_ids["NYU Entrepreneurship & Innovation Club"],
            "title": "AI & Machine Learning Workshop Series",
            "description": "Three-part workshop series introducing students to practical applications of AI and ML in startup environments. Led by industry experts.",
            "event_date": (now + timedelta(days=35)).isoformat(),
            "application_deadline": (now + timedelta(days=28)).isoformat(),
            "expected_attendance": 120,
            "venue": "NYU Manhattan Campus",
            "event_type": "workshop",
            "sponsorship_min_amount": 1500,
            "sponsorship_max_amount": 8000,
            "sponsorship_benefits": [
                "Branded workshop materials",
                "Speaking opportunity",
                "Social media promotion",
                "Website listing",
                "Email marketing mention"
            ],
            "tags": ["tech", "AI", "machine learning", "workshop", "innovation", "education"],
            "status": "published",
            "featured": True
        },
        {
            "id": str(uuid.uuid4()),
            "org_id": org_ids["NYU Entrepreneurship & Innovation Club"],
            "title": "Student Venture Showcase & Alumni Investor Panel",
            "description": "Meet successful NYU alumni entrepreneurs and investors who share their journey and provide feedback on student-led ventures. Great networking opportunity.",
            "event_date": (now + timedelta(days=50)).isoformat(),
            "application_deadline": (now + timedelta(days=40)).isoformat(),
            "expected_attendance": 200,
            "venue": "NYU Tisch Building",
            "event_type": "networking",
            "sponsorship_min_amount": 2500,
            "sponsorship_max_amount": 12000,
            "sponsorship_benefits": [
                "Panel participant slot",
                "VIP networking session",
                "Branded materials",
                "Social media promotion",
                "Exclusive sponsor recognition"
            ],
            "tags": ["networking", "entrepreneurship", "alumni", "investment", "business"],
            "status": "published",
            "featured": False
        },
        {
            "id": str(uuid.uuid4()),
            "org_id": org_ids["NYU Entrepreneurship & Innovation Club"],
            "title": "Hackathon 2025: Build the Future",
            "description": "24-hour hackathon focused on building solutions for social impact. Teams compete for prizes and investor connections. Food and beverages provided.",
            "event_date": (now + timedelta(days=75)).isoformat(),
            "application_deadline": (now + timedelta(days=60)).isoformat(),
            "expected_attendance": 250,
            "venue": "NYU Tandon School of Engineering",
            "event_type": "competition",
            "sponsorship_min_amount": 3000,
            "sponsorship_max_amount": 20000,
            "sponsorship_benefits": [
                "Title sponsor recognition",
                "Booth space",
                "Prize sponsor option",
                "Social media promotion",
                "Logo on all materials",
                "Branded merchandise distribution"
            ],
            "tags": ["hackathon", "tech", "innovation", "competition", "social impact", "engineering"],
            "status": "published",
            "featured": True
        }
    ]

    result = supabase.table('events').insert(demo_events).execute()
    print(f"Created {len(demo_events)} demo events")

    return [event["id"] for event in demo_events]

def create_demo_matches(supabase: Client, brand_ids: Dict[str, str], event_ids: List[str]) -> int:
    """Create AI-powered matches between brands and events"""
    matches = []

    # Define brand preferences for smart matching
    brand_preferences = {
        "Red Bull": {
            "preferred_tags": ["competition", "sports", "festival", "music", "extreme"],
            "min_attendance": 50
        },
        "Spotify": {
            "preferred_tags": ["music", "cultural", "social", "creative", "festival"],
            "min_attendance": 50
        },
        "Google for Startups": {
            "preferred_tags": ["tech", "entrepreneurship", "hackathon", "innovation", "competition"],
            "min_attendance": 50
        },
        "Nike": {
            "preferred_tags": ["sports", "competition", "athletic", "youth"],
            "min_attendance": 75
        },
        "GitHub": {
            "preferred_tags": ["tech", "hackathon", "workshop", "engineering", "innovation"],
            "min_attendance": 40
        }
    }

    # Fetch all events with their details
    try:
        events_response = supabase.table('events').select('*').execute()
        events_data = events_response.data or []
    except:
        events_data = []

    # Create matches for each brand
    for brand_name, preferences in brand_preferences.items():
        if brand_name not in brand_ids:
            continue

        brand_id = brand_ids[brand_name]

        # Match based on preferences
        for event in events_data:
            attendance = event.get('expected_attendance') or 0
            if attendance < preferences['min_attendance']:
                continue

            # Calculate match score based on tag overlap and budget alignment
            event_tags = event.get('tags', []) or []
            tag_overlap = len([t for t in event_tags if t in preferences['preferred_tags']])

            # Score from 0.3 to 1.0
            base_score = min(0.3 + (tag_overlap * 0.15), 1.0)

            # Slightly randomize scores for realism
            import random
            score = round(base_score + random.uniform(-0.05, 0.1), 2)
            score = min(score, 1.0)

            if score >= 0.5:  # Only create matches with reasonable scores
                matches.append({
                    "id": str(uuid.uuid4()),
                    "brand_id": brand_id,
                    "event_id": event['id'],
                    "score": score,
                    "reasoning": {
                        "tag_overlap_score": min(tag_overlap / len(preferences['preferred_tags']), 1.0),
                        "budget_alignment_score": 0.85,
                        "attendance_score": min(attendance / 200, 1.0),
                        "recency_score": 0.9,
                        "demographic_match_score": 0.8,
                        "explanation": f"Good match based on {tag_overlap} matching tags and appropriate budget range",
                        "matched_tags": [t for t in event_tags if t in preferences['preferred_tags']],
                        "budget_fit": "Suitable",
                        "attendance_category": "High" if attendance > 150 else "Medium"
                    }
                })

    if matches:
        try:
            supabase.table('matches').insert(matches).execute()
            print(f"Created {len(matches)} brand-event matches")
        except Exception as e:
            print(f"Note: Some matches may already exist or could not be created: {str(e)}")

    return len(matches)

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
        match_count = create_demo_matches(supabase, brand_ids, event_ids)

        print(f"""
Seeding completed successfully!

Demo Data Created:
- {len(user_ids)} users
- {len(org_ids)} organizations
- {len(brand_ids)} brands
- {len(event_ids)} events
- {match_count} brand-event matches

Demo Accounts (for local testing):
- Org 1: debate@example.com (Columbia Debate Society)
- Org 2: entrepreneurship@example.com (NYU Entrepreneurship Club)
- Brand 1: redbull@example.com (Red Bull)
- Brand 2: spotify@example.com (Spotify)
- Brand 3: brand3@example.com (Google for Startups)
- Brand 4: brand4@example.com (Nike)
- Brand 5: brand5@example.com (GitHub)
- Admin: admin@example.com

You can log in with any of these accounts to test the application.
All demo brands and organizations have "verified" status.
All demo events have "published" status.

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
