-- ============================================================
--  LandR - consolidated database schema (Supabase / Postgres)
--
--  Run this whole file in Supabase > SQL Editor. It is idempotent:
--  safe to run as many times as you like.
--
--  IMPORTANT: "create table if not exists" does NOT add missing
--  columns to a table that already exists. That is why every
--  column below is also repeated as "alter table ... add column
--  if not exists". Run the whole file, not just the top half.
--
--  Index names below deliberately match the ones already in the
--  live database. Creating the same index under a new name would
--  leave two identical indexes slowing down every write.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- CREATORS (one row per model / page)
-- ------------------------------------------------------------
create table if not exists creators (
  id uuid primary key default gen_random_uuid(),
  handle text unique not null,
  display_name text,
  bio text,
  photo_url text,
  created_at timestamptz default now()
);

alter table creators add column if not exists display_name text;
alter table creators add column if not exists bio text;
alter table creators add column if not exists photo_url text;
alter table creators add column if not exists created_at timestamptz default now();

-- Presence badge
alter table creators add column if not exists show_active_badge boolean default true;
alter table creators add column if not exists active_text text default 'Active now';

-- Identity / copy
alter table creators add column if not exists location text;
alter table creators add column if not exists tagline text;
alter table creators add column if not exists socials jsonb default '[]';

-- Look and feel: theme | image | video | color
alter table creators add column if not exists theme text default 'noir';
alter table creators add column if not exists background_type text default 'theme';
alter table creators add column if not exists background_url text;
alter table creators add column if not exists bg_image_url text;
alter table creators add column if not exists bg_video_url text;
alter table creators add column if not exists avatar_type text default 'image';
alter table creators add column if not exists embed_layout text default 'stack';

-- Email capture
alter table creators add column if not exists show_subscribe boolean default false;
alter table creators add column if not exists subscribe_title text;
alter table creators add column if not exists subscribe_note text;

-- Page-level country blocking
alter table creators add column if not exists blocked_countries jsonb default '[]';
alter table creators add column if not exists blocked_redirect_url text;

-- Per-creator dashboard login.
-- Deliberately plaintext for now: single client, at most ~5 users, still in
-- testing. Switch to a bcrypt hash (or Supabase Auth) before this becomes a
-- multi-tenant product. Until then, treat this column as a secret: it is
-- readable by anyone holding the service role key.
alter table creators add column if not exists dashboard_password text;

-- ------------------------------------------------------------
-- LINKS (buttons, embeds and uploaded videos)
-- ------------------------------------------------------------
create table if not exists links (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references creators(id) on delete cascade,
  label text,
  position int default 0,
  destinations jsonb default '[]',
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table links add column if not exists label text;
alter table links add column if not exists position int default 0;
alter table links add column if not exists destinations jsonb default '[]';
alter table links add column if not exists is_active boolean default true;
alter table links add column if not exists created_at timestamptz default now();

-- Presentation
alter table links add column if not exists icon text;
alter table links add column if not exists subtitle text;
alter table links add column if not exists preview_image_url text;
alter table links add column if not exists media_url text;
alter table links add column if not exists size text default 'md';
alter table links add column if not exists shape text default 'pill';
alter table links add column if not exists color text;
alter table links add column if not exists layout jsonb default '{}';
alter table links add column if not exists type text default 'button';

-- Routing: country rules and rotation pools
alter table links add column if not exists geo_rules jsonb default '[]';
alter table links add column if not exists rotate boolean default false;
alter table links add column if not exists rotation_urls jsonb default '[]';
alter table links add column if not exists rotation_index int default 0;

-- Scheduling
alter table links add column if not exists starts_at timestamptz;
alter table links add column if not exists ends_at timestamptz;

-- ------------------------------------------------------------
-- ROTATION: even spread instead of random
--
-- Math.random() clusters: with 3 URLs and 30 clicks you can easily
-- get 14/9/7. This does the increment and the read in ONE atomic
-- statement, so concurrent clicks cannot land on the same index
-- and the spread is exactly even.
-- ------------------------------------------------------------
create or replace function next_rotation_index(link_id uuid, pool_size int)
returns int
language plpgsql
as $$
declare
  idx int;
begin
  if pool_size is null or pool_size < 1 then
    return 0;
  end if;

  update links
     set rotation_index = (coalesce(rotation_index, 0) + 1) % pool_size
   where id = link_id
  returning rotation_index into idx;

  return coalesce(idx, 0);
end;
$$;

-- ------------------------------------------------------------
-- ANALYTICS
--
-- lib/analytics.ts writes region, city, device, browser, os and
-- source on every page view, and the same set plus destination_url
-- on every click. Without these columns those inserts fail.
-- ------------------------------------------------------------
create table if not exists page_views (
  id bigint generated always as identity primary key,
  creator_id uuid references creators(id) on delete cascade,
  path text,
  country text,
  referrer text,
  created_at timestamptz default now()
);

alter table page_views add column if not exists path text;
alter table page_views add column if not exists country text;
alter table page_views add column if not exists referrer text;
alter table page_views add column if not exists region text;
alter table page_views add column if not exists city text;
alter table page_views add column if not exists device text;
alter table page_views add column if not exists browser text;
alter table page_views add column if not exists os text;
alter table page_views add column if not exists source text;
alter table page_views add column if not exists created_at timestamptz default now();

create table if not exists link_clicks (
  id bigint generated always as identity primary key,
  link_id uuid references links(id) on delete cascade,
  creator_id uuid references creators(id) on delete cascade,
  country text,
  referrer text,
  created_at timestamptz default now()
);

alter table link_clicks add column if not exists country text;
alter table link_clicks add column if not exists referrer text;
alter table link_clicks add column if not exists destination_url text;
alter table link_clicks add column if not exists region text;
alter table link_clicks add column if not exists city text;
alter table link_clicks add column if not exists device text;
alter table link_clicks add column if not exists browser text;
alter table link_clicks add column if not exists os text;
alter table link_clicks add column if not exists source text;
alter table link_clicks add column if not exists created_at timestamptz default now();

-- ------------------------------------------------------------
-- EMAIL SUBSCRIBERS
--
-- The subscribe action inserts { creator_id, handle, email }, so the
-- handle column is required. It also treats Postgres error 23505
-- (unique violation) as "already subscribed", which only works if a
-- unique constraint actually exists.
-- ------------------------------------------------------------
create table if not exists subscribers (
  id bigint generated always as identity primary key,
  creator_id uuid references creators(id) on delete cascade,
  handle text,
  email text,
  created_at timestamptz default now()
);

alter table subscribers add column if not exists handle text;
alter table subscribers add column if not exists email text;
alter table subscribers add column if not exists created_at timestamptz default now();
alter table subscribers add column if not exists unsubscribed_at timestamptz;

-- Collapse any duplicates saved before the constraint existed, keeping the
-- earliest signup. Required or the unique index below fails.
delete from subscribers s
using subscribers t
where s.creator_id = t.creator_id
  and lower(s.email) = lower(t.email)
  and s.id > t.id;

create unique index if not exists subscribers_creator_id_email_key
  on subscribers (creator_id, lower(email));

-- ------------------------------------------------------------
-- SIGNUP RATE LIMITING
-- ------------------------------------------------------------
create table if not exists signup_log (
  id bigint generated always as identity primary key,
  ip text,
  handle text,
  created_at timestamptz default now()
);

create index if not exists signup_log_ip_created_at_idx on signup_log (ip, created_at desc);

-- ------------------------------------------------------------
-- INDEXES
--
-- These four names match what is already live, so re-running this
-- file is a no-op rather than creating duplicates.
-- ------------------------------------------------------------
create index if not exists page_views_creator_id_created_at_idx on page_views (creator_id, created_at desc);
create index if not exists link_clicks_creator_id_created_at_idx on link_clicks (creator_id, created_at desc);
create index if not exists link_clicks_link_id_idx on link_clicks (link_id);
create index if not exists links_creator_id_position_idx on links (creator_id, position);

-- New: the editor lists subscribers newest-first per creator.
create index if not exists subscribers_creator_id_created_at_idx on subscribers (creator_id, created_at desc);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
--
-- Every write happens server-side with the service role key, which
-- bypasses RLS. RLS is enabled with no public policies, so the anon
-- key cannot read or write these tables directly.
-- ------------------------------------------------------------
alter table creators enable row level security;
alter table links enable row level security;
alter table page_views enable row level security;
alter table link_clicks enable row level security;
alter table subscribers enable row level security;
alter table signup_log enable row level security;

-- ------------------------------------------------------------
-- SEED the demo creator
--
-- /ava currently returns "This page does not exist", which means
-- there is no row for that handle. This puts it back.
-- ------------------------------------------------------------
insert into creators (handle, display_name)
select 'ava', 'Ava'
where not exists (select 1 from creators where handle = 'ava');

-- ============================================================
--  STORAGE (one-time, done in the dashboard)
--  Storage > New bucket > name it 'media' and mark it Public,
--  then add a "Public read" policy. Uploads happen server-side
--  with the service role key.
-- ============================================================

-- ------------------------------------------------------------
-- Verify what actually exists (run on its own)
-- ------------------------------------------------------------
-- select table_name,
--        string_agg(column_name, ', ' order by ordinal_position) as columns
--   from information_schema.columns
--  where table_schema = 'public'
--  group by table_name
--  order by table_name;
