-- Additional tables for data collection and ML model training
-- Run this after the main schema.sql

-- User interaction tracking
create table public.interactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  action_type text not null, -- 'view', 'contact', 'bookmark', 'apply', 'reject', 'search'
  target_type text not null, -- 'event', 'brand', 'match', 'profile'
  target_id uuid not null,
  metadata jsonb default '{}', -- search terms, filters used, time spent, etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Match feedback for improving algorithm
create table public.match_feedback (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  feedback_type text not null, -- 'thumbs_up', 'thumbs_down', 'not_relevant', 'perfect_match'
  feedback_reasons text[] default '{}', -- ['budget_mismatch', 'wrong_audience', 'good_fit', 'timing_issue']
  feedback_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(match_id, user_id) -- one feedback per user per match
);

-- Sponsorship deal tracking
create table public.sponsorship_deals (
  id uuid default uuid_generate_v4() primary key,
  thread_id uuid references public.threads(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete cascade not null,
  brand_id uuid references public.brands(id) on delete cascade not null,
  org_id uuid references public.orgs(id) on delete cascade not null,
  
  deal_status text not null default 'interested', -- 'interested', 'negotiating', 'agreed', 'completed', 'cancelled'
  deal_amount integer,
  agreed_benefits text[] default '{}',
  contract_signed_at timestamp with time zone,
  event_completed_at timestamp with time zone,
  
  -- Success metrics (filled post-event)
  actual_attendance integer,
  sponsor_satisfaction_score integer check (sponsor_satisfaction_score >= 1 and sponsor_satisfaction_score <= 5),
  org_satisfaction_score integer check (org_satisfaction_score >= 1 and org_satisfaction_score <= 5),
  would_sponsor_again boolean,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(thread_id) -- one deal per conversation
);

-- Event outcomes and results
create table public.event_results (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  
  -- Basic metrics
  actual_attendance integer,
  attendance_vs_expected decimal(4,2), -- ratio of actual/expected
  
  -- Sponsorship metrics
  total_sponsorship_raised integer default 0,
  number_of_sponsors integer default 0,
  sponsor_retention_rate decimal(4,2), -- for repeat events
  
  -- Engagement metrics
  media_mentions integer default 0,
  social_media_reach integer default 0,
  social_media_engagement integer default 0,
  
  -- Business metrics
  leads_generated integer default 0,
  conversions integer default 0,
  estimated_brand_value integer, -- estimated value to sponsors
  
  -- Qualitative feedback
  overall_success_rating integer check (overall_success_rating >= 1 and overall_success_rating <= 5),
  lessons_learned text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(event_id) -- one result record per event
);

-- Survey system for collecting feedback
create table public.surveys (
  id uuid default uuid_generate_v4() primary key,
  survey_type text not null, -- 'post_event_sponsor', 'post_event_org', 'quarterly_feedback'
  title text not null,
  description text,
  target_type text not null, -- 'event', 'deal', 'general'
  target_id uuid, -- event_id, deal_id, etc.
  
  questions jsonb not null, -- structured questions with types, options, etc.
  is_active boolean default true,
  auto_send_delay_hours integer default 24, -- hours after trigger event
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone
);

create table public.survey_responses (
  id uuid default uuid_generate_v4() primary key,
  survey_id uuid references public.surveys(id) on delete cascade not null,
  respondent_id uuid references public.users(id) on delete cascade not null,
  target_id uuid, -- event_id, deal_id that triggered this survey
  
  responses jsonb not null, -- question_id -> answer mapping
  completion_rate decimal(4,2) not null, -- percentage of questions answered
  time_to_complete_seconds integer,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(survey_id, respondent_id, target_id) -- one response per user per survey per target
);

-- User preferences learned from behavior
create table public.user_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  
  -- Inferred preferences from behavior
  preferred_event_types text[] default '{}',
  preferred_budget_range_min integer,
  preferred_budget_range_max integer,
  preferred_attendance_size_min integer,
  preferred_attendance_size_max integer,
  preferred_universities text[] default '{}',
  
  -- Engagement patterns
  avg_time_per_session_seconds integer,
  favorite_discovery_filters jsonb default '{}',
  response_time_hours decimal(6,2), -- average time to respond to messages
  
  -- Success patterns
  successful_match_score_threshold decimal(3,2),
  conversion_rate decimal(4,2), -- percentage of contacts that become deals
  
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id)
);

-- Create indexes for performance
create index idx_interactions_user_id on public.interactions(user_id);
create index idx_interactions_action_type on public.interactions(action_type);
create index idx_interactions_target on public.interactions(target_type, target_id);
create index idx_interactions_created_at on public.interactions(created_at desc);

create index idx_match_feedback_match_id on public.match_feedback(match_id);
create index idx_match_feedback_user_id on public.match_feedback(user_id);
create index idx_match_feedback_type on public.match_feedback(feedback_type);

create index idx_sponsorship_deals_status on public.sponsorship_deals(deal_status);
create index idx_sponsorship_deals_event_id on public.sponsorship_deals(event_id);
create index idx_sponsorship_deals_brand_id on public.sponsorship_deals(brand_id);

create index idx_event_results_event_id on public.event_results(event_id);
create index idx_survey_responses_survey_id on public.survey_responses(survey_id);
create index idx_survey_responses_respondent on public.survey_responses(respondent_id);

-- RLS Policies

-- Interactions - users can only see their own
alter table public.interactions enable row level security;
create policy "Users can manage their own interactions" on public.interactions
  for all using (user_id = auth.uid());

-- Match feedback - users can only manage their own
alter table public.match_feedback enable row level security;
create policy "Users can manage their own feedback" on public.match_feedback
  for all using (user_id = auth.uid());

-- Sponsorship deals - visible to participants
alter table public.sponsorship_deals enable row level security;
create policy "Deal participants can view deals" on public.sponsorship_deals
  for select using (
    brand_id in (select id from public.brands where user_id = auth.uid()) or
    org_id in (select id from public.orgs where user_id = auth.uid())
  );

create policy "Deal participants can update deals" on public.sponsorship_deals
  for update using (
    brand_id in (select id from public.brands where user_id = auth.uid()) or
    org_id in (select id from public.orgs where user_id = auth.uid())
  );

-- Event results - visible to event owners and their sponsors
alter table public.event_results enable row level security;
create policy "Event owners can manage results" on public.event_results
  for all using (
    event_id in (
      select e.id from public.events e
      join public.orgs o on e.org_id = o.id
      where o.user_id = auth.uid()
    )
  );

create policy "Sponsors can view event results" on public.event_results
  for select using (
    event_id in (
      select d.event_id from public.sponsorship_deals d
      join public.brands b on d.brand_id = b.id
      where b.user_id = auth.uid()
    )
  );

-- Surveys - public read, admin manage
alter table public.surveys enable row level security;
create policy "Surveys are publicly viewable" on public.surveys
  for select using (is_active = true);

-- Survey responses - users can manage their own
alter table public.survey_responses enable row level security;
create policy "Users can manage their own survey responses" on public.survey_responses
  for all using (respondent_id = auth.uid());

-- User preferences - users can only access their own
alter table public.user_preferences enable row level security;
create policy "Users can manage their own preferences" on public.user_preferences
  for all using (user_id = auth.uid());

-- Functions for updating timestamps
create trigger update_sponsorship_deals_updated_at before update on public.sponsorship_deals
  for each row execute function update_updated_at_column();

-- Functions for automatic preference learning (to be implemented later)
create or replace function update_user_preferences()
returns trigger as $$
begin
  -- This function will analyze user interactions and update preferences
  -- Implementation will be added as we build the ML system
  return new;
end;
$$ language plpgsql;

-- Trigger to update preferences when interactions are added
create trigger trigger_update_preferences after insert on public.interactions
  for each row execute function update_user_preferences();