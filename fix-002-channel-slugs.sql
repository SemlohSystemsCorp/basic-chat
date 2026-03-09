-- ============================================
-- FIX 002: Add 10-digit slugs to channels
-- Run this in Supabase SQL Editor
-- ============================================

-- Function to generate unique channel slugs
create or replace function public.generate_channel_slug()
returns text as $$
declare
  new_slug text;
  slug_exists boolean;
begin
  loop
    new_slug := lpad(floor(random() * 10000000000)::bigint::text, 10, '0');
    select exists(select 1 from public.channels where slug = new_slug) into slug_exists;
    exit when not slug_exists;
  end loop;
  return new_slug;
end;
$$ language plpgsql;

-- Add slug column to channels
alter table public.channels
  add column if not exists slug text unique default public.generate_channel_slug();

-- Backfill existing channels that have null slugs
update public.channels
set slug = public.generate_channel_slug()
where slug is null;

-- Make slug not null after backfill
alter table public.channels
  alter column slug set not null;

-- Index for channel slug lookups
create index if not exists idx_channels_slug on public.channels(slug);
