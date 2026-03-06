-- Create subscriptions table and set up policies
-- Run this in your Supabase SQL editor

-- Create the table
create table public.subscriptions (
  id bigint default generate_numeric_id() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_end timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.subscriptions enable row level security;

-- Policies
create policy "Users can view their own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own subscription" on public.subscriptions
  for insert with check (auth.uid() = user_id);

-- Indexes
create index idx_subscriptions_user on public.subscriptions(user_id);
create index idx_subscriptions_stripe_customer on public.subscriptions(stripe_customer_id);
create index idx_subscriptions_stripe_sub on public.subscriptions(stripe_subscription_id);
