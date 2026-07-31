-- Supabase initialization SQL for FriendsChat
-- Run this in Supabase SQL editor or via psql to create basic tables for conversations and messages.

-- Enable pgcrypto if not enabled (for gen_random_uuid)
create extension if not exists pgcrypto;

-- Conversations table
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  name text,
  avatar text,
  is_group boolean default false,
  created_at timestamptz default now()
);

-- Messages table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid,
  sender_name text,
  sender_avatar text,
  content text,
  message_type text default 'text', -- 'text' | 'file'
  file_name text,
  is_read boolean default false,
  inserted_at timestamptz default now()
);

create index if not exists messages_conversation_idx on messages(conversation_id, inserted_at desc);

-- Conversation members (store minimal profile snapshot for each member)
create table if not exists conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  user_id uuid,
  user_name text,
  user_email text,
  user_avatar text,
  created_at timestamptz default now()
);

-- Row Level Security (RLS) policies
-- Restrict SELECT to conversation members only. INSERT is allowed only when
-- the actor is authenticated and sender_id matches auth.uid().

alter table messages enable row level security;
-- Allow SELECT only if the requesting user is a member of the conversation
create policy "select_for_members_only" on messages
  for select using (
    exists (
      select 1 from conversation_members cm
      where cm.conversation_id = messages.conversation_id
        and cm.user_id = auth.uid()
    )
  );

-- Allow INSERT only when sender_id matches the authenticated user.
create policy "insert_limited_to_sender" on messages
  for insert with check (
    auth.role() = 'authenticated' and (sender_id = auth.uid())
  );

alter table conversations enable row level security;
create policy "select_conversations_for_members" on conversations
  for select using (
    exists (
      select 1 from conversation_members cm
      where cm.conversation_id = conversations.id
        and cm.user_id = auth.uid()
    )
  );
create policy "insert_conversations_authenticated" on conversations
  for insert with check (auth.role() = 'authenticated');

alter table conversation_members enable row level security;
-- Allow users to see rows where they are the member
create policy "select_members_for_self" on conversation_members
  for select using (
    cm.user_id = auth.uid()
  );
-- Allow insert only for authenticated users (extra checks can be added to ensure conversation creation flow writes members atomically)
create policy "insert_members_authenticated" on conversation_members
  for insert with check (auth.role() = 'authenticated');

-- Realtime: enable the messages table so INSERT events are broadcast to clients.
-- In Supabase Dashboard > Database > Replication, toggle "messages" on.
-- Or run: alter publication supabase_realtime add table messages;

-- Example seed: a public test conversation
insert into conversations (id, name, is_group) values
  ('00000000-0000-0000-0000-000000000001', 'Welcome Room', true)
  on conflict do nothing;

insert into messages (conversation_id, sender_id, sender_name, content)
values ('00000000-0000-0000-0000-000000000001', null, 'System', 'Welcome to FriendsChat!')
on conflict do nothing;

-- Guidance:
-- 1) Create a storage bucket named 'uploads' in Supabase > Storage for file uploads.
-- 2) Configure CORS/Policies as needed for your application.
-- 3) Tighten RLS policies to restrict SELECT to conversation members once
--    the app populates conversation_members on conversation creation.
