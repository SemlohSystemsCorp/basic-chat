-- Add recording_enabled column to meetings table
-- Run this in your Supabase SQL editor

alter table public.meetings
  add column if not exists recording_enabled boolean not null default false;
