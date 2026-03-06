-- Module - Reset Script
-- Run this BEFORE supabase-schema.sql to drop existing tables
-- WARNING: This deletes ALL data. Only use to start fresh.

-- Drop tables in correct order (respecting foreign keys)
drop table if exists public.chat_messages cascade;
drop table if exists public.verification_codes cascade;
drop table if exists public.meetings cascade;
drop table if exists public.pages cascade;
drop table if exists public.profiles cascade;

-- Drop old forum tables (if migrating from Chatterbox)
drop table if exists public.reports cascade;
drop table if exists public.votes cascade;
drop table if exists public.posts cascade;
drop table if exists public.threads cascade;
drop table if exists public.categories cascade;

-- Drop trigger (if exists)
drop trigger if exists on_auth_user_created on auth.users;

-- Now run supabase-schema.sql to recreate everything
