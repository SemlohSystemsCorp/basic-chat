-- Backfill missing profiles for existing auth users
-- Run this in your Supabase SQL editor

INSERT INTO public.profiles (id, username, display_name)
SELECT id, split_part(email, '@', 1), split_part(email, '@', 1)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
