-- ============================================
-- FIX 003: Message attachments + Supabase Storage
-- Run this in Supabase SQL Editor
-- ============================================

-- Add attachments column to messages (JSONB array)
-- Each attachment: { url, name, type, size }
alter table public.messages
  add column if not exists attachments jsonb default '[]'::jsonb;

-- Make content nullable (messages can be attachment-only)
alter table public.messages
  alter column content drop not null;

-- Create storage bucket for message attachments
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

-- Storage policies: members can upload to their box's folder
create policy "Authenticated users can upload attachments"
  on storage.objects for insert
  with check (
    bucket_id = 'attachments'
    and auth.role() = 'authenticated'
  );

create policy "Anyone can view attachments"
  on storage.objects for select
  using (bucket_id = 'attachments');

create policy "Users can delete own attachments"
  on storage.objects for delete
  using (
    bucket_id = 'attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
