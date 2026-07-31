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
-- NOTE: SELECT policies are permissive for development. Once the app properly
-- manages conversation_members rows, tighten SELECT to check membership.

alter table messages enable row level security;
create policy "allow_authenticated_select" on messages
  for select using (auth.role() = 'authenticated');
create policy "allow_authenticated_insert" on messages
  for insert with check (auth.role() = 'authenticated' and (sender_id = auth.uid() or sender_id is null));

alter table conversations enable row level security;
create policy "allow_authenticated_select_conversations" on conversations
  for select using (auth.role() = 'authenticated');
create policy "allow_authenticated_insert_conversations" on conversations
  for insert with check (auth.role() = 'authenticated');

alter table conversation_members enable row level security;
create policy "allow_authenticated_select_members" on conversation_members
  for select using (auth.role() = 'authenticated');
create policy "allow_authenticated_insert_members" on conversation_members
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
