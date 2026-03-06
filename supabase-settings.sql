-- Settings: avatar storage bucket + user preferences table
-- Run this in your Supabase SQL editor

-- 1. Create a storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Storage policies for avatars
create policy "Anyone can view avatars" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Users can upload their own avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own avatar" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Create user_preferences table
create table public.user_preferences (
  id bigint default generate_numeric_id() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  mic_on_join boolean not null default true,
  cam_on_join boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.user_preferences enable row level security;

-- Policies
create policy "Users can view their own preferences" on public.user_preferences
  for select using (auth.uid() = user_id);

create policy "Users can insert their own preferences" on public.user_preferences
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own preferences" on public.user_preferences
  for update using (auth.uid() = user_id);

-- Index
create index idx_user_preferences_user on public.user_preferences(user_id);
