-- PlugCU Database Schema - Fresh Start
-- Drop all existing objects to start clean
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.threads CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.brands CASCADE;
DROP TABLE IF EXISTS public.orgs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP TYPE IF EXISTS event_status;
DROP TYPE IF EXISTS brand_status;
DROP TYPE IF EXISTS org_status;
DROP TYPE IF EXISTS user_role;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('student_org', 'brand', 'admin');
CREATE TYPE org_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE brand_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'closed');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'student_org',
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Student Organizations table
CREATE TABLE public.orgs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  university TEXT NOT NULL,
  website_url TEXT,
  logo_url TEXT,
  contact_email TEXT,
  phone TEXT,
  member_count INTEGER,
  founded_year INTEGER,
  category TEXT,
  status org_status DEFAULT 'pending',
  verification_document_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Brands table
CREATE TABLE public.brands (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  contact_email TEXT,
  phone TEXT,
  industry TEXT,
  company_size TEXT,
  status brand_status DEFAULT 'pending',
  target_demographics TEXT[],
  budget_range_min INTEGER,
  budget_range_max INTEGER,
  preferred_event_types TEXT[] DEFAULT '{}',
  geographic_focus TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Events/Opportunities table
CREATE TABLE public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE,
  application_deadline TIMESTAMP WITH TIME ZONE,
  expected_attendance INTEGER,
  venue TEXT,
  event_type TEXT,
  sponsorship_min_amount INTEGER,
  sponsorship_max_amount INTEGER,
  sponsorship_benefits TEXT[],
  tags TEXT[] DEFAULT '{}',
  status event_status DEFAULT 'draft',
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Matches table
CREATE TABLE public.matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  score DECIMAL(3,2) NOT NULL CHECK (score >= 0 AND score <= 1),
  reasoning JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE(brand_id, event_id)
);

-- Message threads
CREATE TABLE public.threads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE(brand_id, org_id, event_id)
);

-- Messages
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);

CREATE INDEX idx_orgs_user_id ON public.orgs(user_id);
CREATE INDEX idx_orgs_university ON public.orgs(university);
CREATE INDEX idx_orgs_status ON public.orgs(status);
CREATE INDEX idx_orgs_tags ON public.orgs USING gin(tags);

CREATE INDEX idx_brands_user_id ON public.brands(user_id);
CREATE INDEX idx_brands_status ON public.brands(status);
CREATE INDEX idx_brands_industry ON public.brands(industry);

CREATE INDEX idx_events_org_id ON public.events(org_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_event_date ON public.events(event_date);
CREATE INDEX idx_events_tags ON public.events USING gin(tags);
CREATE INDEX idx_events_featured ON public.events(featured);

CREATE INDEX idx_matches_brand_id ON public.matches(brand_id);
CREATE INDEX idx_matches_event_id ON public.matches(event_id);
CREATE INDEX idx_matches_score ON public.matches(score DESC);

CREATE INDEX idx_threads_brand_id ON public.threads(brand_id);
CREATE INDEX idx_threads_org_id ON public.threads(org_id);
CREATE INDEX idx_threads_event_id ON public.threads(event_id);

CREATE INDEX idx_messages_thread_id ON public.messages(thread_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by authenticated users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for auth trigger" ON public.users
  FOR INSERT WITH CHECK (true);

-- Orgs policies
CREATE POLICY "Orgs can manage their own data" ON public.orgs
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Verified orgs are viewable by authenticated users" ON public.orgs
  FOR SELECT USING (status = 'verified' AND auth.role() = 'authenticated');

-- Brands policies
CREATE POLICY "Brands can manage their own data" ON public.brands
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Verified brands are viewable by authenticated users" ON public.brands
  FOR SELECT USING (status = 'verified' AND auth.role() = 'authenticated');

-- Events policies
CREATE POLICY "Orgs can manage their own events" ON public.events
  FOR ALL USING (
    org_id IN (
      SELECT id FROM public.orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Published events are viewable by authenticated users" ON public.events
  FOR SELECT USING (status = 'published' AND auth.role() = 'authenticated');

-- Matches policies
CREATE POLICY "Brands can view their matches" ON public.matches
  FOR SELECT USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Orgs can view matches for their events" ON public.matches
  FOR SELECT USING (
    event_id IN (
      SELECT e.id FROM public.events e
      JOIN public.orgs o ON e.org_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

-- Threads policies
CREATE POLICY "Thread participants can view threads" ON public.threads
  FOR SELECT USING (
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()) OR
    org_id IN (SELECT id FROM public.orgs WHERE user_id = auth.uid())
  );

CREATE POLICY "Brands can create threads with orgs" ON public.threads
  FOR INSERT WITH CHECK (
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
  );

-- Messages policies
CREATE POLICY "Thread participants can view messages" ON public.messages
  FOR SELECT USING (
    thread_id IN (
      SELECT t.id FROM public.threads t
      JOIN public.brands b ON t.brand_id = b.id
      JOIN public.orgs o ON t.org_id = o.id
      WHERE b.user_id = auth.uid() OR o.user_id = auth.uid()
    )
  );

CREATE POLICY "Thread participants can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    thread_id IN (
      SELECT t.id FROM public.threads t
      JOIN public.brands b ON t.brand_id = b.id
      JOIN public.orgs o ON t.org_id = o.id
      WHERE b.user_id = auth.uid() OR o.user_id = auth.uid()
    )
  );

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = TIMEZONE('utc'::TEXT, NOW());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orgs_updated_at BEFORE UPDATE ON public.orgs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON public.threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role user_role;
  role_str TEXT;
BEGIN
  -- Extract role from metadata
  role_str := COALESCE(new.raw_user_meta_data->>'role', 'student_org');

  -- Validate role value
  IF role_str NOT IN ('student_org', 'brand', 'admin') THEN
    role_str := 'student_org';
  END IF;

  -- Cast to enum
  user_role := role_str::user_role;

  INSERT INTO public.users (id, email, role, full_name)
  VALUES (
    new.id,
    new.email,
    user_role,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET role = user_role,
      full_name = COALESCE(new.raw_user_meta_data->>'full_name', full_name);

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail trigger
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
