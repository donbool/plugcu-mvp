# 📦 PlugCU MVP

**Connecting Student Organizations with Brands for Sponsorships and Collaborations**

PlugCU is a web platform that bridges the gap between student organizations seeking funding and brands looking to access legitimate, active campus communities. Our MVP provides a structured, scalable solution for sponsorship discovery and relationship building.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Supabase account
- Git

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd plugcu-mvp

# Install frontend dependencies
cd apps/web
npm install

# Install backend dependencies  
cd ../api
pip install -r requirements.txt
```

### 2. Environment Configuration

```bash
# Copy environment files
cp .env.example .env.local
cp apps/api/.env.example apps/api/.env

# Edit with your Supabase credentials
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY  
# - SUPABASE_SERVICE_ROLE_KEY
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the schema migration:
   ```bash
   # In Supabase SQL Editor, execute:
   cat db/schema.sql
   ```
3. Seed demo data:
   ```bash
   cd scripts
   python seed_data.py
   ```

### 4. Start Development Servers

```bash
# Terminal 1: Frontend (Next.js)
cd apps/web
npm run dev

# Terminal 2: Backend (FastAPI)  
cd apps/api
uvicorn main:app --reload

# Access:
# Frontend: http://localhost:3000
# API: http://localhost:8000
```

## 📋 Features

### ✅ Core MVP Features

- **Role-based Authentication** - Student orgs, brands, and admin accounts
- **Organization Profiles** - Complete org setup with verification
- **Brand Profiles** - Company details with target demographics
- **Event Posting** - Orgs can create sponsorship opportunities
- **Discovery & Filtering** - Brands can browse and filter events
- **AI-Powered Matching** - Rule-based algorithm scoring brand-event compatibility
- **In-App Messaging** - Direct communication between orgs and brands

### 🎯 Matching Algorithm

Our rule-based scoring system evaluates:

```
score = 0.35 * tag_overlap + 
        0.25 * budget_alignment + 
        0.20 * demographic_match +
        0.15 * attendance_size + 
        0.05 * recency_factor
```

- **Tag Overlap**: Interest/content alignment
- **Budget Alignment**: Financial compatibility  
- **Demographics**: Target audience match
- **Attendance**: Event size vs brand preferences
- **Recency**: Event timing relevance

## 🏗️ Architecture

### Tech Stack

**Frontend**
- Next.js 15 with App Router
- TypeScript + TailwindCSS
- ShadCN UI components
- React Query for state management
- Supabase Auth integration

**Backend**  
- FastAPI (Python) for matching engine
- Supabase PostgreSQL with RLS
- Pydantic for data validation
- JWT authentication

**Infrastructure**
- Supabase (Database + Auth + Storage)
- Vercel (Frontend deployment)
- Fly.io (Backend deployment)

### Project Structure

```
plugcu-mvp/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # FastAPI backend
├── db/
│   └── schema.sql    # Database schema + RLS
├── scripts/
│   └── seed_data.py  # Demo data seeding
├── infra/
│   └── docker/       # Deployment configs
└── README.md
```

## 🔐 Security

- **Row Level Security (RLS)** on all database tables
- **Role-based access control** (student_org / brand / admin)
- **JWT token authentication** via Supabase Auth
- **Input validation** with Zod (frontend) and Pydantic (backend)

## 🧪 Demo Data

Use these demo accounts for testing:

**Organizations:**
- `columbia.debate@columbia.edu` - Columbia Debate Society
- `nyu.entrepreneurship@nyu.edu` - NYU Entrepreneurship Club

**Brands:**
- `partnerships@redbull.com` - Red Bull
- `campus@spotify.com` - Spotify

**Admin:**
- `admin@plugcu.com` - Platform admin

## 🛠️ Development

### Database Changes

```bash
# After modifying db/schema.sql
# Apply changes in Supabase SQL Editor
```

### Running Tests

```bash
# Frontend tests
cd apps/web
npm test

# Backend tests  
cd apps/api
pytest
```

### Linting & Formatting

```bash
# Frontend
cd apps/web
npm run lint
npm run typecheck

# Backend
cd apps/api
ruff check .
black .
```

## 🚀 Deployment

### Frontend (Vercel)

1. Connect GitHub repo to Vercel
2. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy automatically on push to main

### Backend (Fly.io)

```bash
cd apps/api
fly launch
fly secrets set SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key>
fly deploy
```

### Database (Supabase)

- Production database managed by Supabase
- Automatic backups and scaling
- RLS policies enforce data security

## 📊 API Endpoints

### Matching Engine

```
POST /api/v1/compute-matches
GET  /api/v1/matches/{brand_id}
GET  /api/v1/event-matches/{event_id}
POST /api/v1/recompute-all-matches
```

### Database Access

- All CRUD operations via Supabase client
- Real-time subscriptions available
- Automatic RLS enforcement

## 🔄 Future Enhancements

- **Real-time messaging** with Supabase Realtime
- **ML-powered matching** with pgvector
- **Payment processing** for sponsorship deals
- **Analytics dashboard** for orgs and brands
- **Mobile app** with React Native
- **Advanced filtering** and search
- **Event analytics** and ROI tracking

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

