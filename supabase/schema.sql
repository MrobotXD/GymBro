-- GymBro Database Schema
-- Run this in your Supabase SQL Editor

-- User data (plans, XP, profile)
create table if not exists user_data (
  user_id uuid references auth.users(id) on delete cascade primary key,
  profile jsonb,
  xp_data jsonb,
  plans jsonb default '[]'::jsonb,
  active_plan_id text,
  updated_at timestamptz default now()
);

-- Nutrition log (one row per user per day)
create table if not exists nutrition_log (
  user_id uuid references auth.users(id) on delete cascade,
  date text not null,
  data jsonb,
  updated_at timestamptz default now(),
  primary key (user_id, date)
);

-- Enable Row Level Security
alter table user_data enable row level security;
alter table nutrition_log enable row level security;

-- Policies: users can only access their own data
create policy "Users can read own data" on user_data
  for select using (auth.uid() = user_id);

create policy "Users can insert own data" on user_data
  for insert with check (auth.uid() = user_id);

create policy "Users can update own data" on user_data
  for update using (auth.uid() = user_id);

create policy "Users can read own nutrition" on nutrition_log
  for select using (auth.uid() = user_id);

create policy "Users can insert own nutrition" on nutrition_log
  for insert with check (auth.uid() = user_id);

create policy "Users can update own nutrition" on nutrition_log
  for update using (auth.uid() = user_id);
