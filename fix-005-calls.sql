-- ============================================
-- FIX 005: Calls, participants, and call invites
-- Run this in Supabase SQL Editor
-- ============================================

-- Calls table
create table if not exists public.calls (
  id uuid default uuid_generate_v4() primary key,
  box_id uuid references public.boxes(id) on delete cascade not null,
  channel_id uuid references public.channels(id) on delete set null,
  created_by uuid references public.profiles(id) on delete cascade not null,
  call_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  room_name text not null,
  room_url text,
  title text,
  status text default 'active' check (status in ('active', 'ended')),
  started_at timestamptz default now() not null,
  ended_at timestamptz
);

alter table public.calls enable row level security;

create policy "Box members can view calls"
  on public.calls for select
  using (box_id in (select public.get_user_box_ids(auth.uid())));

create policy "Box members can create calls"
  on public.calls for insert
  with check (
    auth.uid() = created_by
    and box_id in (select public.get_user_box_ids(auth.uid()))
  );

create policy "Call creator can update calls"
  on public.calls for update
  using (created_by = auth.uid());

-- Call participants
create table if not exists public.call_participants (
  id uuid default uuid_generate_v4() primary key,
  call_id uuid references public.calls(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz default now() not null,
  left_at timestamptz,
  unique(call_id, user_id)
);

alter table public.call_participants enable row level security;

create policy "Box members can view call participants"
  on public.call_participants for select
  using (
    call_id in (
      select id from public.calls
      where box_id in (select public.get_user_box_ids(auth.uid()))
    )
  );

create policy "Users can join calls"
  on public.call_participants for insert
  with check (auth.uid() = user_id);

create policy "Users can update own participation"
  on public.call_participants for update
  using (user_id = auth.uid());

-- Call invites
create table if not exists public.call_invites (
  id uuid default uuid_generate_v4() primary key,
  call_id uuid references public.calls(id) on delete cascade not null,
  invited_by uuid references public.profiles(id) on delete cascade not null,
  invited_user_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined', 'missed')),
  created_at timestamptz default now() not null
);

alter table public.call_invites enable row level security;

create policy "Users can view own call invites"
  on public.call_invites for select
  using (invited_user_id = auth.uid() or invited_by = auth.uid());

create policy "Box members can create call invites"
  on public.call_invites for insert
  with check (auth.uid() = invited_by);

create policy "Invited users can update call invites"
  on public.call_invites for update
  using (invited_user_id = auth.uid());

-- Indexes
create index if not exists idx_calls_box_id on public.calls(box_id);
create index if not exists idx_calls_call_code on public.calls(call_code);
create index if not exists idx_calls_status on public.calls(status);
create index if not exists idx_call_participants_call on public.call_participants(call_id);
create index if not exists idx_call_invites_user on public.call_invites(invited_user_id);
create index if not exists idx_call_invites_call on public.call_invites(call_id);

-- Realtime for incoming call invites
alter publication supabase_realtime add table public.call_invites;
