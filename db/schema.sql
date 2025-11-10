-- PlugCU Database Schema
-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types
create type user_role as enum ('student_org', 'brand', 'admin');
create type org_status as enum ('pending', 'verified', 'rejected');
create type brand_status as enum ('pending', 'verified', 'rejected');
create type event_status as enum ('draft', 'published', 'closed');

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid primary key,
  email text unique not null,
  role user_role not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Student Organizations table
create table public.orgs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  description text,
  university text not null,
  website_url text,
  logo_url text,
  contact_email text,
  phone text,
  member_count integer,
  founded_year integer,
  category text, -- e.g., 'Greek Life', 'Academic', 'Cultural', 'Sports'
  status org_status default 'pending',
  verification_document_url text,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Brands table
create table public.brands (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  company_name text not null,
  description text,
  website_url text,
  logo_url text,
  contact_email text,
  phone text,
  industry text,
  company_size text, -- e.g., 'startup', 'small', 'medium', 'enterprise'
  status brand_status default 'pending',
  target_demographics text[],
  budget_range_min integer,
  budget_range_max integer,
  preferred_event_types text[] default '{}',
  geographic_focus text[] default '{}', -- universities or regions they focus on
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Events/Opportunities table
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.orgs(id) on delete cascade not null,
  title text not null,
  description text not null,
  event_date timestamp with time zone,
  application_deadline timestamp with time zone,
  expected_attendance integer,
  venue text,
  event_type text, -- e.g., 'conference', 'social', 'fundraiser', 'competition'
  sponsorship_min_amount integer,
  sponsorship_max_amount integer,
  sponsorship_benefits text[], -- what sponsors get in return
  tags text[] default '{}',
  status event_status default 'draft',
  featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Matches table (precomputed brand-event matches)
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  brand_id uuid references public.brands(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete cascade not null,
  score decimal(3,2) not null check (score >= 0 and score <= 1),
  reasoning jsonb, -- explanation of match factors
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(brand_id, event_id)
);

-- Message threads
create table public.threads (
  id uuid default uuid_generate_v4() primary key,
  brand_id uuid references public.brands(id) on delete cascade not null,
  org_id uuid references public.orgs(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete cascade,
  subject text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(brand_id, org_id, event_id)
);

-- Messages
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  thread_id uuid references public.threads(id) on delete cascade not null,
  sender_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  read_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for performance
create index idx_users_role on public.users(role);
create index idx_users_email on public.users(email);

create index idx_orgs_user_id on public.orgs(user_id);
create index idx_orgs_university on public.orgs(university);
create index idx_orgs_status on public.orgs(status);
create index idx_orgs_tags on public.orgs using gin(tags);

create index idx_brands_user_id on public.brands(user_id);
create index idx_brands_status on public.brands(status);
create index idx_brands_industry on public.brands(industry);

create index idx_events_org_id on public.events(org_id);
create index idx_events_status on public.events(status);
create index idx_events_event_date on public.events(event_date);
create index idx_events_tags on public.events using gin(tags);
create index idx_events_featured on public.events(featured);

create index idx_matches_brand_id on public.matches(brand_id);
create index idx_matches_event_id on public.matches(event_id);
create index idx_matches_score on public.matches(score desc);

create index idx_threads_brand_id on public.threads(brand_id);
create index idx_threads_org_id on public.threads(org_id);
create index idx_threads_event_id on public.threads(event_id);

create index idx_messages_thread_id on public.messages(thread_id);
create index idx_messages_sender_id on public.messages(sender_id);
create index idx_messages_created_at on public.messages(created_at desc);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.orgs enable row level security;
alter table public.brands enable row level security;
alter table public.events enable row level security;
alter table public.matches enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;

-- Users policies
create policy "Users can view their own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.users
  for update using (auth.uid() = id);

create policy "Public profiles are viewable by authenticated users" on public.users
  for select using (auth.role() = 'authenticated');

create policy "Enable insert for auth trigger" on public.users
  for insert with check (true);

-- Orgs policies
create policy "Orgs can manage their own data" on public.orgs
  for all using (user_id = auth.uid());

create policy "Verified orgs are viewable by authenticated users" on public.orgs
  for select using (status = 'verified' and auth.role() = 'authenticated');

-- Brands policies
create policy "Brands can manage their own data" on public.brands
  for all using (user_id = auth.uid());

create policy "Verified brands are viewable by authenticated users" on public.brands
  for select using (status = 'verified' and auth.role() = 'authenticated');

-- Events policies
create policy "Orgs can manage their own events" on public.events
  for all using (
    org_id in (
      select id from public.orgs where user_id = auth.uid()
    )
  );

create policy "Published events are viewable by authenticated users" on public.events
  for select using (status = 'published' and auth.role() = 'authenticated');

-- Matches policies
create policy "Brands can view their matches" on public.matches
  for select using (
    brand_id in (
      select id from public.brands where user_id = auth.uid()
    )
  );

create policy "Orgs can view matches for their events" on public.matches
  for select using (
    event_id in (
      select e.id from public.events e
      join public.orgs o on e.org_id = o.id
      where o.user_id = auth.uid()
    )
  );

-- Threads policies
create policy "Thread participants can view threads" on public.threads
  for select using (
    brand_id in (select id from public.brands where user_id = auth.uid()) or
    org_id in (select id from public.orgs where user_id = auth.uid())
  );

create policy "Brands can create threads with orgs" on public.threads
  for insert with check (
    brand_id in (select id from public.brands where user_id = auth.uid())
  );

-- Messages policies
create policy "Thread participants can view messages" on public.messages
  for select using (
    thread_id in (
      select t.id from public.threads t
      join public.brands b on t.brand_id = b.id
      join public.orgs o on t.org_id = o.id
      where b.user_id = auth.uid() or o.user_id = auth.uid()
    )
  );

create policy "Thread participants can send messages" on public.messages
  for insert with check (
    sender_id = auth.uid() and
    thread_id in (
      select t.id from public.threads t
      join public.brands b on t.brand_id = b.id
      join public.orgs o on t.org_id = o.id
      where b.user_id = auth.uid() or o.user_id = auth.uid()
    )
  );

-- Functions for updating timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_users_updated_at before update on public.users
  for each row execute function update_updated_at_column();

create trigger update_orgs_updated_at before update on public.orgs
  for each row execute function update_updated_at_column();

create trigger update_brands_updated_at before update on public.brands
  for each row execute function update_updated_at_column();

create trigger update_events_updated_at before update on public.events
  for each row execute function update_updated_at_column();

create trigger update_threads_updated_at before update on public.threads
  for each row execute function update_updated_at_column();

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_role text;
begin
  -- Extract role from metadata, default to 'student_org'
  user_role := coalesce(new.raw_user_meta_data->>'role', 'student_org');

  -- Ensure the role is one of the valid enum values
  if user_role not in ('student_org', 'brand', 'admin') then
    user_role := 'student_org';
  end if;

  insert into public.users (id, email, role, full_name)
  values (
    new.id,
    new.email,
    user_role::user_role,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  -- Log the error but don't fail the trigger
  raise warning 'Error in handle_new_user: %', sqlerrm;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Trigger to automatically create user profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();