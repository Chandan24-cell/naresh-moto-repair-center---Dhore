-- Example Row Level Security setup for Supabase.
-- In production, enable RLS and restrict writes to admin role users only.

alter table site_settings enable row level security;
alter table sections enable row level security;
alter table cards enable row level security;
alter table stats enable row level security;
alter table media_assets enable row level security;
alter table admin_users enable row level security;
alter table audit_logs enable row level security;
alter table section_revisions enable row level security;

create policy "Public can read site settings and sections" on site_settings
  for select using (true);

create policy "Public can read sections and cards" on sections
  for select using (true);

create policy "Public can read cards" on cards
  for select using (true);

create policy "Public can read stats" on stats
  for select using (true);

create policy "Public can read media" on media_assets
  for select using (true);

create policy "Admins can manage content" on sections
  for all using (
    exists (
      select 1 from admin_users au
      where au.email = auth.email() and au.role in ('admin', 'editor') and au.is_active = true
    )
  )
  with check (
    exists (
      select 1 from admin_users au
      where au.email = auth.email() and au.role in ('admin', 'editor') and au.is_active = true
    )
  );

create policy "Admins can manage cards" on cards
  for all using (
    exists (
      select 1 from admin_users au
      where au.email = auth.email() and au.role in ('admin', 'editor') and au.is_active = true
    )
  )
  with check (
    exists (
      select 1 from admin_users au
      where au.email = auth.email() and au.role in ('admin', 'editor') and au.is_active = true
    )
  );

create policy "Admins can manage stats" on stats
  for all using (
    exists (
      select 1 from admin_users au
      where au.email = auth.email() and au.role in ('admin', 'editor') and au.is_active = true
    )
  )
  with check (
    exists (
      select 1 from admin_users au
      where au.email = auth.email() and au.role in ('admin', 'editor') and au.is_active = true
    )
  );

create policy "Admins can manage media" on media_assets
  for all using (
    exists (
      select 1 from admin_users au
      where au.email = auth.email() and au.role in ('admin', 'editor') and au.is_active = true
    )
  )
  with check (
    exists (
      select 1 from admin_users au
      where au.email = auth.email() and au.role in ('admin', 'editor') and au.is_active = true
    )
  );

create policy "Only admins can manage admin users" on admin_users
  for all using (
    exists (
      select 1 from admin_users au
      where au.email = auth.email() and au.role = 'admin' and au.is_active = true
    )
  )
  with check (
    exists (
      select 1 from admin_users au
      where au.email = auth.email() and au.role = 'admin' and au.is_active = true
    )
  );
