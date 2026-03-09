-- Add workspace settings columns to boxes table
alter table public.boxes
  add column if not exists description text default '',
  add column if not exists allow_member_invites boolean default true,
  add column if not exists allow_member_channels boolean default true;
