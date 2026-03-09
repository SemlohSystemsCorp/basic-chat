-- ============================================
-- Chatterbox: Auth & Boxes Schema
-- Run this in the Supabase SQL Editor
-- ============================================

create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  display_name text not null,
  avatar_url text,
  email_verified boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view any profile"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, email_verified)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'email_verified')::boolean, false)
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- BOXES (workspaces)
-- ============================================
create table public.boxes (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  icon_url text,
  invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  plan text default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  max_members int default 25,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.boxes enable row level security;

-- NOTE: boxes SELECT policy is created AFTER box_members table exists (see below)

create policy "Box owner can update box"
  on public.boxes for update
  using (owner_id = auth.uid());

create policy "Authenticated users can create boxes"
  on public.boxes for insert
  with check (auth.uid() = owner_id);

-- ============================================
-- BOX MEMBERS (must be created before boxes RLS that references it)
-- ============================================
create table public.box_members (
  id uuid default uuid_generate_v4() primary key,
  box_id uuid references public.boxes(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz default now() not null,
  unique(box_id, user_id)
);

-- Security definer functions to avoid infinite recursion in RLS policies
-- (policies on box_members can't query box_members directly)
create or replace function public.get_user_box_ids(uid uuid)
returns setof uuid as $$
  select box_id from public.box_members where user_id = uid;
$$ language sql security definer stable;

create or replace function public.get_user_admin_box_ids(uid uuid)
returns setof uuid as $$
  select box_id from public.box_members where user_id = uid and role in ('owner', 'admin');
$$ language sql security definer stable;

-- NOW create the boxes SELECT policy (box_members + helpers exist)
create policy "Box members can view their boxes"
  on public.boxes for select
  using (
    id in (select public.get_user_box_ids(auth.uid()))
  );

alter table public.box_members enable row level security;

create policy "Members can view members of their boxes"
  on public.box_members for select
  using (
    box_id in (select public.get_user_box_ids(auth.uid()))
  );

create policy "Box admins can insert members"
  on public.box_members for insert
  with check (
    box_id in (select public.get_user_admin_box_ids(auth.uid()))
    or user_id = auth.uid()
  );

create policy "Box admins can delete members"
  on public.box_members for delete
  using (
    box_id in (select public.get_user_admin_box_ids(auth.uid()))
    or user_id = auth.uid()
  );

-- ============================================
-- CHANNELS
-- ============================================
create table public.channels (
  id uuid default uuid_generate_v4() primary key,
  box_id uuid references public.boxes(id) on delete cascade not null,
  name text not null,
  description text,
  is_private boolean default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(box_id, name)
);

alter table public.channels enable row level security;

create policy "Box members can view channels"
  on public.channels for select
  using (
    box_id in (select public.get_user_box_ids(auth.uid()))
  );

create policy "Box admins can create channels"
  on public.channels for insert
  with check (
    box_id in (
      select public.get_user_admin_box_ids(auth.uid())
    )
  );

create policy "Box admins can update channels"
  on public.channels for update
  using (
    box_id in (
      select public.get_user_admin_box_ids(auth.uid())
    )
  );

create policy "Box admins can delete channels"
  on public.channels for delete
  using (
    box_id in (
      select public.get_user_admin_box_ids(auth.uid())
    )
  );

-- ============================================
-- MESSAGES
-- ============================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  channel_id uuid references public.channels(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  edited_at timestamptz,
  created_at timestamptz default now() not null
);

alter table public.messages enable row level security;

create policy "Box members can view messages"
  on public.messages for select
  using (
    channel_id in (
      select c.id from public.channels c
      where c.box_id in (select public.get_user_box_ids(auth.uid()))
    )
  );

create policy "Box members can insert messages"
  on public.messages for insert
  with check (
    auth.uid() = user_id
    and channel_id in (
      select c.id from public.channels c
      where c.box_id in (select public.get_user_box_ids(auth.uid()))
    )
  );

create policy "Users can update own messages"
  on public.messages for update
  using (user_id = auth.uid());

create policy "Users can delete own messages"
  on public.messages for delete
  using (user_id = auth.uid());

-- ============================================
-- INVITES
-- ============================================
create table public.invites (
  id uuid default uuid_generate_v4() primary key,
  box_id uuid references public.boxes(id) on delete cascade not null,
  email text not null,
  invited_by uuid references public.profiles(id) on delete cascade not null,
  code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  status text default 'pending' check (status in ('pending', 'accepted', 'expired')),
  created_at timestamptz default now() not null,
  expires_at timestamptz default (now() + interval '7 days') not null
);

alter table public.invites enable row level security;

create policy "Box admins can view invites"
  on public.invites for select
  using (
    box_id in (
      select public.get_user_admin_box_ids(auth.uid())
    )
    or email = (select email from public.profiles where id = auth.uid())
  );

create policy "Box admins can create invites"
  on public.invites for insert
  with check (
    box_id in (
      select public.get_user_admin_box_ids(auth.uid())
    )
  );

create policy "Box admins can update invites"
  on public.invites for update
  using (
    box_id in (
      select public.get_user_admin_box_ids(auth.uid())
    )
    or email = (select email from public.profiles where id = auth.uid())
  );

-- ============================================
-- VERIFICATION CODES
-- ============================================
create table public.verification_codes (
  id uuid default uuid_generate_v4() primary key,
  email text not null,
  code text not null,
  attempts int default 0,
  max_attempts int default 5,
  created_at timestamptz default now() not null,
  expires_at timestamptz default (now() + interval '10 minutes') not null,
  used_at timestamptz
);

alter table public.verification_codes enable row level security;

-- Only service role should access this table (no user-facing policies)
-- RLS is enabled but no policies = no direct access from client

create index idx_verification_codes_email on public.verification_codes(email);
create index idx_verification_codes_email_code on public.verification_codes(email, code);

-- Auto-cleanup expired codes (run via pg_cron or manually)
create or replace function public.cleanup_expired_verification_codes()
returns void as $$
begin
  delete from public.verification_codes
  where expires_at < now() - interval '1 hour';
end;
$$ language plpgsql security definer;

-- ============================================
-- TRIGGERS
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

create trigger update_boxes_updated_at
  before update on public.boxes
  for each row execute procedure public.update_updated_at();

create trigger update_channels_updated_at
  before update on public.channels
  for each row execute procedure public.update_updated_at();

-- ============================================
-- INDEXES
-- ============================================
create index idx_box_members_user_id on public.box_members(user_id);
create index idx_box_members_box_id on public.box_members(box_id);
create index idx_channels_box_id on public.channels(box_id);
create index idx_messages_channel_id on public.messages(channel_id);
create index idx_messages_created_at on public.messages(created_at desc);
create index idx_invites_email on public.invites(email);
create index idx_invites_code on public.invites(code);
create index idx_boxes_invite_code on public.boxes(invite_code);
create index idx_boxes_slug on public.boxes(slug);

-- ============================================
-- ENABLE REALTIME for messages
-- ============================================
alter publication supabase_realtime add table public.messages;
