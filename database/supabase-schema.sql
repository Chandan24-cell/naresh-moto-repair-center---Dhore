-- Supabase-ready schema for the Naresh Moto dashboard CMS
-- This mirrors the current data model used by the project and provides a clean migration target.

create extension if not exists pgcrypto;

create table if not exists site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text,
  heading_en text,
  heading_np text,
  description_en text,
  description_np text,
  visible boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references sections(id) on delete cascade,
  slug text not null,
  title_en text,
  title_np text,
  text_en text,
  text_np text,
  link text,
  image_url text,
  sort_order integer not null default 0,
  visible boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists stats (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references sections(id) on delete cascade,
  label_en text,
  label_np text,
  value text,
  suffix text,
  sort_order integer not null default 0,
  visible boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  path text not null,
  alt_en text,
  alt_np text,
  mime_type text,
  size_bytes integer,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text,
  role text not null default 'admin' check (role in ('admin', 'editor', 'viewer')),
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_email text,
  entity_type text not null,
  entity_id text,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists section_revisions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references sections(id) on delete cascade,
  revision_number integer not null default 1,
  payload jsonb not null,
  created_by text,
  created_at timestamptz not null default now()
);

-- Example seed values mirroring the live workshop dashboard.
insert into site_settings(key, value) values
  ('brand', '{"name":"Naresh Moto Repair Center","tagline":"Two Wheeler Repair Shop | Dhore, Nepal","phone":"+977 982-9455583"}'::jsonb),
  ('hours', '{"open":"06:00","close":"20:00","days":"Every day"}'::jsonb),
  ('theme', '{"defaultMode":"light","supportsDarkMode":true}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

create index if not exists idx_sections_sort on sections(sort_order);
create index if not exists idx_cards_section on cards(section_id, sort_order);
create index if not exists idx_stats_section on stats(section_id, sort_order);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at desc);
