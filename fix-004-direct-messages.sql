-- ============================================
-- FIX 004: Direct Messages
-- Run this in Supabase SQL Editor
-- ============================================

-- DM conversations table (one per pair of users per box)
create table if not exists public.dm_conversations (
  id uuid default uuid_generate_v4() primary key,
  box_id uuid references public.boxes(id) on delete cascade not null,
  user1_id uuid references public.profiles(id) on delete cascade not null,
  user2_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(box_id, user1_id, user2_id),
  check (user1_id < user2_id)
);

alter table public.dm_conversations enable row level security;

create policy "Users can view own DM conversations"
  on public.dm_conversations for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Users can create DM conversations"
  on public.dm_conversations for insert
  with check (auth.uid() = user1_id or auth.uid() = user2_id);

-- DM messages table
create table if not exists public.dm_messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.dm_conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text,
  attachments jsonb default '[]'::jsonb,
  created_at timestamptz default now() not null
);

alter table public.dm_messages enable row level security;

create policy "Users can view DM messages in their conversations"
  on public.dm_messages for select
  using (
    conversation_id in (
      select id from public.dm_conversations
      where user1_id = auth.uid() or user2_id = auth.uid()
    )
  );

create policy "Users can insert DM messages in their conversations"
  on public.dm_messages for insert
  with check (
    auth.uid() = user_id
    and conversation_id in (
      select id from public.dm_conversations
      where user1_id = auth.uid() or user2_id = auth.uid()
    )
  );

create policy "Users can delete own DM messages"
  on public.dm_messages for delete
  using (user_id = auth.uid());

-- Indexes
create index if not exists idx_dm_conversations_user1 on public.dm_conversations(user1_id);
create index if not exists idx_dm_conversations_user2 on public.dm_conversations(user2_id);
create index if not exists idx_dm_conversations_box on public.dm_conversations(box_id);
create index if not exists idx_dm_messages_conversation on public.dm_messages(conversation_id);
create index if not exists idx_dm_messages_created_at on public.dm_messages(created_at desc);

-- Add to realtime
alter publication supabase_realtime add table public.dm_messages;
