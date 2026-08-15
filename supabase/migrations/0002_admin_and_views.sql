-- Admin flag on profiles
alter table public.profiles add column is_admin boolean not null default false;

-- View count for listings
alter table public.properties add column view_count int not null default 0;

-- RPC to increment view count without a read-modify-write race
create or replace function public.increment_property_views(prop_id uuid)
returns void
language sql
security definer
as $$
  update public.properties set view_count = view_count + 1 where id = prop_id;
$$;

-- Admins can read every profile (needed for the verification queue) and update verification_status.
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create policy "Admins can update verification status"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Resized image variants (added alongside image resizing at upload)
alter table public.property_media add column thumb_url text;
alter table public.property_media add column medium_url text;

-- To make your own account an admin, run in the SQL editor:
-- update public.profiles set is_admin = true where phone = '+233XXXXXXXXX';

-- Public can see an owner's phone (for WhatsApp contact) only if they have
-- at least one available listing — keeps unlisted/inactive owners' numbers private.
create policy "Public can view phone of owners with available listings"
  on public.profiles for select
  using (
    exists (
      select 1 from public.properties
      where properties.owner_id = profiles.id
      and properties.status = 'available'
    )
  );
