-- ============ Renter accounts ============
-- Profiles previously only supported 'owner' and 'admin'.
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('owner', 'admin', 'renter'));

-- Link inquiries to a logged-in renter's account (still nullable — an
-- inquiry can be submitted anonymously, without a renter account at all).
alter table public.inquiries add column renter_id uuid references public.profiles(id) on delete set null;

create policy "Renters can view their own inquiries"
  on public.inquiries for select
  using (auth.uid() = renter_id);

-- ============ Map coordinates + neighborhood area ============
alter table public.properties add column area text;
alter table public.properties add column latitude numeric;
alter table public.properties add column longitude numeric;

-- Tracks whether this listing has already been matched against search
-- alerts, so the alerts cron doesn't re-notify renters every day for the
-- same listing. Reset to false whenever a listing returns to 'available'
-- (handled in application code, not a trigger, to keep this simple).
alter table public.properties add column alert_sent boolean not null default false;

-- ============ Saved listings (renter "favorites") ============
create table public.saved_listings (
  id uuid primary key default gen_random_uuid(),
  renter_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  saved_price numeric not null, -- price at the time of saving, to detect changes
  created_at timestamptz not null default now(),
  unique (renter_id, property_id)
);

alter table public.saved_listings enable row level security;

create policy "Renters manage their own saved listings"
  on public.saved_listings for all
  using (auth.uid() = renter_id)
  with check (auth.uid() = renter_id);

-- ============ Search alerts ============
create table public.search_alerts (
  id uuid primary key default gen_random_uuid(),
  renter_id uuid not null references public.profiles(id) on delete cascade,
  listing_type text check (listing_type in ('rent', 'sale')), -- null = either
  min_bedrooms int,
  max_price numeric,
  city text not null default 'Accra',
  created_at timestamptz not null default now()
);

alter table public.search_alerts enable row level security;

create policy "Renters manage their own search alerts"
  on public.search_alerts for all
  using (auth.uid() = renter_id)
  with check (auth.uid() = renter_id);

-- ============ Reviews (via a tokenized link, not a tenant login) ============
-- Tenants don't have platform accounts, so a review is submitted through a
-- private tokenized link (sent by the owner via SMS) rather than auth.
alter table public.tenants add column review_token uuid not null default gen_random_uuid();
alter table public.tenants add column review_requested boolean not null default false;

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

-- Reviews are a public trust signal — anyone can read them. Writing only
-- ever happens server-side (service role, via the tokenized review route),
-- so no insert/update policy is needed for regular users.
create policy "Public can view reviews"
  on public.reviews for select
  using (true);
