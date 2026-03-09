-- Add user preference columns to profiles table
alter table public.profiles
  add column if not exists status text default '',
  add column if not exists bio text default '',
  add column if not exists timezone text default 'UTC',
  add column if not exists language text default 'en',
  add column if not exists message_preview boolean default true,
  add column if not exists show_online_status boolean default true,
  add column if not exists email_notifications boolean default true,
  add column if not exists desktop_notifications boolean default true,
  add column if not exists notification_sound boolean default true,
  add column if not exists compact_mode boolean default false,
  add column if not exists send_on_enter boolean default true,
  add column if not exists show_link_previews boolean default true,
  add column if not exists convert_emoticons boolean default true,
  add column if not exists mute_all boolean default false;
