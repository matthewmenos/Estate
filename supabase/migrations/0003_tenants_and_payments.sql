create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  phone text not null,
  lease_start date,
  lease_end date,
  rent_amount numeric not null,
  rent_due_day int not null default 1 check (rent_due_day between 1 and 28),
  created_at timestamptz not null default now()
);

create table public.rent_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  amount numeric not null,
  due_date date not null,
  paid_date date,
  status text not null default 'pending' check (status in ('pending', 'paid', 'overdue', 'failed')),
  payment_method text not null default 'manual' check (payment_method in ('manual', 'mobile_money')),
  hubtel_client_reference text unique,
  hubtel_transaction_id text,
  created_at timestamptz not null default now()
);

alter table public.tenants enable row level security;
alter table public.rent_payments enable row level security;

-- Owners manage tenants only on properties they own.
create policy "Owners manage tenants on their properties"
  on public.tenants for all
  using (
    exists (
      select 1 from public.properties
      where properties.id = tenants.property_id
      and properties.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties
      where properties.id = tenants.property_id
      and properties.owner_id = auth.uid()
    )
  );

-- Owners manage rent payments only for tenants on properties they own.
create policy "Owners manage rent payments on their properties"
  on public.rent_payments for all
  using (
    exists (
      select 1 from public.tenants
      join public.properties on properties.id = tenants.property_id
      where tenants.id = rent_payments.tenant_id
      and properties.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tenants
      join public.properties on properties.id = tenants.property_id
      where tenants.id = rent_payments.tenant_id
      and properties.owner_id = auth.uid()
    )
  );

create index rent_payments_tenant_id_idx on public.rent_payments(tenant_id);
create index tenants_property_id_idx on public.tenants(property_id);
