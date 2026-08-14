-- Extends Supabase's built-in auth.users with app-specific profile fields.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text unique,
  role text not null default 'owner' check (role in ('owner', 'admin')),
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'pending', 'verified', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  address text not null,
  city text not null default 'Accra',
  property_type text not null check (property_type in ('house', 'apartment', 'land', 'commercial')),
  listing_type text not null check (listing_type in ('rent', 'sale')),
  price numeric not null,
  currency text not null default 'GHS',
  bedrooms int,
  bathrooms int,
  size_sqm numeric,
  status text not null default 'available' check (status in ('available', 'occupied', 'sold', 'unlisted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  url text not null,
  r2_key text not null,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  renter_name text not null,
  renter_phone text not null,
  message text,
  created_at timestamptz not null default now()
  );

-- Auto-update updated_at on properties when a row is modified.
create function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger properties_updated_at
before update on public.properties
for each row execute function public.update_updated_at_column();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_media enable row level security;
alter table public.inquiries enable row level security;

-- Anyone can read available property listings and their media (public search).
create policy "Public can view available properties"
  on public.properties for select
  using (status = 'available');

create policy "Public can view media for available properties"
  on public.property_media for select
  using (
    exists (
      select 1 from public.properties
      where properties.id = property_media.property_id
      and properties.status = 'available'
    )
  );

-- Owners manage only their own properties.
create policy "Owners manage their own properties"
  on public.properties for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Owners manage their own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Anyone (including anonymous visitors) can submit an inquiry.
create policy "Anyone can create an inquiry"
  on public.inquiries for insert
  with check (true);

-- Only the property owner can read inquiries about their listings.
create policy "Owners can view inquiries on their properties"
  on public.inquiries for select
  using (
    exists (
      select 1 from public.properties
      where properties.id = inquiries.property_id
      and properties.owner_id = auth.uid()
    )
  );
