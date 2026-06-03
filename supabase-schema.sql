-- RiChord Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Songs table
create table if not exists songs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  artist text,
  content text not null default '',
  key text,
  tags text[] not null default '{}',
  notes text,
  type text not null check (type in ('chordpro', 'pdf', 'image')),
  file_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Setlists table
create table if not exists setlists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  event_date date,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Setlist songs (junction table)
create table if not exists setlist_songs (
  id uuid primary key default uuid_generate_v4(),
  setlist_id uuid not null references setlists(id) on delete cascade,
  song_id uuid not null references songs(id) on delete cascade,
  position integer not null default 0,
  custom_key text
);

-- Share links table
create table if not exists share_links (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  type text not null check (type in ('song', 'setlist')),
  resource_id uuid not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- User profiles table
create table if not exists user_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  notation text not null default 'italian' check (notation in ('italian', 'english')),
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  onboarding_done boolean not null default false,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table songs enable row level security;
alter table setlists enable row level security;
alter table setlist_songs enable row level security;
alter table share_links enable row level security;
alter table user_profiles enable row level security;

-- Songs policies
create policy "Users can manage their own songs"
  on songs for all using (auth.uid() = user_id);

-- Allow public read for shared song pages (via token validation in app)
create policy "Public read of songs for sharing"
  on songs for select using (true);

-- Setlists policies
create policy "Users can manage their own setlists"
  on setlists for all using (auth.uid() = user_id);

create policy "Public read of setlists for sharing"
  on setlists for select using (true);

-- Setlist songs policies
create policy "Users can manage setlist songs for their setlists"
  on setlist_songs for all using (
    exists (select 1 from setlists where id = setlist_songs.setlist_id and user_id = auth.uid())
  );

create policy "Public read of setlist songs for sharing"
  on setlist_songs for select using (true);

-- Share links policies
create policy "Users can manage their own share links"
  on share_links for all using (auth.uid() = user_id);

create policy "Public read of share links"
  on share_links for select using (true);

-- User profiles policies
create policy "Users can manage their own profile"
  on user_profiles for all using (auth.uid() = user_id);

-- Storage bucket for song files
insert into storage.buckets (id, name, public)
values ('song-files', 'song-files', true)
on conflict (id) do nothing;

create policy "Users can upload their files"
  on storage.objects for insert with check (
    bucket_id = 'song-files' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Public read of song files"
  on storage.objects for select using (bucket_id = 'song-files');

create policy "Users can delete their files"
  on storage.objects for delete using (
    bucket_id = 'song-files' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Indexes for performance
create index if not exists idx_songs_user_id on songs(user_id);
create index if not exists idx_setlists_user_id on setlists(user_id);
create index if not exists idx_setlist_songs_setlist_id on setlist_songs(setlist_id);
create index if not exists idx_share_links_token on share_links(token);
create index if not exists idx_share_links_user_id on share_links(user_id);
create index if not exists idx_user_profiles_user_id on user_profiles(user_id);
