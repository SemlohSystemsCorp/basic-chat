-- Module - Workspaces & Channels Schema
-- Run this in your Supabase SQL editor AFTER the main schema

-- Workspaces table
create table public.workspaces (
  id bigint default generate_numeric_id() primary key,
  name text not null,
  slug text unique not null,
  icon_url text,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

-- Workspace members
create table public.workspace_members (
  id bigint default generate_numeric_id() primary key,
  workspace_id bigint references public.workspaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz default now() not null,
  unique (workspace_id, user_id)
);

-- Channels table
create table public.channels (
  id bigint default generate_numeric_id() primary key,
  workspace_id bigint references public.workspaces(id) on delete cascade not null,
  name text not null,
  description text,
  is_default boolean default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- Channel messages (persistent chat)
create table public.channel_messages (
  id bigint default generate_numeric_id() primary key,
  channel_id bigint references public.channels(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Direct messages
create table public.direct_messages (
  id bigint default generate_numeric_id() primary key,
  workspace_id bigint references public.workspaces(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.channels enable row level security;
alter table public.channel_messages enable row level security;
alter table public.direct_messages enable row level security;

-- Workspaces policies
create policy "Members can view their workspaces" on public.workspaces
  for select using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspaces.id
        and workspace_members.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create workspaces" on public.workspaces
  for insert with check (auth.uid() = owner_id);

create policy "Owners can update their workspace" on public.workspaces
  for update using (auth.uid() = owner_id);

create policy "Owners can delete their workspace" on public.workspaces
  for delete using (auth.uid() = owner_id);

-- Workspace members policies
create policy "Members can view workspace members" on public.workspace_members
  for select using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id
        and wm.user_id = auth.uid()
    )
  );

create policy "Workspace owners/admins can add members" on public.workspace_members
  for insert with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
    or auth.uid() = user_id -- users can add themselves (for joining)
  );

create policy "Workspace owners/admins can remove members" on public.workspace_members
  for delete using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
    or auth.uid() = user_id -- users can leave
  );

-- Channels policies
create policy "Workspace members can view channels" on public.channels
  for select using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = channels.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  );

create policy "Workspace members can create channels" on public.channels
  for insert with check (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = channels.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  );

create policy "Channel creator or workspace owner can update channels" on public.channels
  for update using (
    auth.uid() = created_by
    or exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = channels.workspace_id
        and workspace_members.user_id = auth.uid()
        and workspace_members.role = 'owner'
    )
  );

-- Channel messages policies
create policy "Workspace members can view channel messages" on public.channel_messages
  for select using (
    exists (
      select 1 from public.channels c
      join public.workspace_members wm on wm.workspace_id = c.workspace_id
      where c.id = channel_messages.channel_id
        and wm.user_id = auth.uid()
    )
  );

create policy "Workspace members can send channel messages" on public.channel_messages
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.channels c
      join public.workspace_members wm on wm.workspace_id = c.workspace_id
      where c.id = channel_messages.channel_id
        and wm.user_id = auth.uid()
    )
  );

create policy "Users can delete their own channel messages" on public.channel_messages
  for delete using (auth.uid() = user_id);

-- Direct messages policies
create policy "Users can view their DMs" on public.direct_messages
  for select using (
    auth.uid() = sender_id or auth.uid() = receiver_id
  );

create policy "Users can send DMs" on public.direct_messages
  for insert with check (auth.uid() = sender_id);

-- Indexes
create index idx_workspace_members_workspace on public.workspace_members(workspace_id);
create index idx_workspace_members_user on public.workspace_members(user_id);
create index idx_channels_workspace on public.channels(workspace_id);
create index idx_channel_messages_channel on public.channel_messages(channel_id);
create index idx_channel_messages_created on public.channel_messages(created_at);
create index idx_direct_messages_workspace on public.direct_messages(workspace_id);
create index idx_direct_messages_sender on public.direct_messages(sender_id);
create index idx_direct_messages_receiver on public.direct_messages(receiver_id);
create index idx_direct_messages_created on public.direct_messages(created_at);
create index idx_workspaces_slug on public.workspaces(slug);
create index idx_workspaces_owner on public.workspaces(owner_id);

-- Enable Realtime for channel messages and direct messages
alter publication supabase_realtime add table public.channel_messages;
alter publication supabase_realtime add table public.direct_messages;
