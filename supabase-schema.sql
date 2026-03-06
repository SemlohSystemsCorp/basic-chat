-- Module - Video Meetings Database Schema
-- Run this in your Supabase SQL editor
-- WARNING: This drops and recreates all tables. Run supabase-reset.sql first if tables exist.

-- Function to generate a random 10-digit numeric ID
create or replace function generate_numeric_id()
returns bigint as $$
begin
  return floor(1000000000 + random() * 9000000000)::bigint;
end;
$$ language plpgsql;

-- Profiles table (extends Supabase auth.users — keeps UUID from auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Meetings table
create table public.meetings (
  id bigint default generate_numeric_id() primary key,
  title text not null default 'Untitled Meeting',
  room_name text unique not null,
  room_url text not null,
  host_id uuid references public.profiles(id) on delete cascade not null,
  started_at timestamptz default now() not null,
  ended_at timestamptz,
  created_at timestamptz default now() not null
);

-- Chat messages table (ephemeral — deleted when meeting ends)
create table public.chat_messages (
  id bigint default generate_numeric_id() primary key,
  room_name text not null,
  sender_name text not null,
  text text not null,
  created_at timestamptz default now() not null
);

-- Verification codes table (email verification + password reset)
create table public.verification_codes (
  id bigint default generate_numeric_id() primary key,
  email text not null,
  code text not null,
  type text not null check (type in ('email_verification', 'password_reset')),
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.meetings enable row level security;
alter table public.chat_messages enable row level security;
alter table public.verification_codes enable row level security;

-- Profiles policies
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Chat messages policies (anyone can read/insert, service role deletes)
create policy "Chat messages are viewable by everyone" on public.chat_messages
  for select using (true);

create policy "Anyone can send chat messages" on public.chat_messages
  for insert with check (true);

create policy "Anyone can delete chat messages" on public.chat_messages
  for delete using (true);

-- Meetings policies
create policy "Meetings are viewable by everyone" on public.meetings
  for select using (true);

create policy "Users can create meetings" on public.meetings
  for insert with check (auth.uid() = host_id);

create policy "Hosts can update their own meetings" on public.meetings
  for update using (auth.uid() = host_id);

create policy "Hosts can delete their own meetings" on public.meetings
  for delete using (auth.uid() = host_id);

-- Function to automatically create a profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user profile creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Indexes for performance
create index idx_meetings_host on public.meetings(host_id);
create index idx_meetings_room on public.meetings(room_name);
create index idx_meetings_created on public.meetings(created_at desc);
create index idx_profiles_username on public.profiles(username);
create index idx_chat_messages_room on public.chat_messages(room_name);
create index idx_chat_messages_created on public.chat_messages(created_at);
create index idx_verification_codes_email on public.verification_codes(email);
create index idx_verification_codes_code on public.verification_codes(code);
