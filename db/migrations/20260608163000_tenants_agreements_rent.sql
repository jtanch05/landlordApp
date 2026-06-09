create type public.tenant_status as enum (
  'active',
  'notice_given',
  'vacated'
);

create type public.agreement_type as enum (
  'six_months',
  'one_year',
  'two_years',
  'three_years',
  'custom'
);

create type public.rent_status as enum (
  'unpaid',
  'partial',
  'paid'
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  status public.tenant_status not null default 'active',
  move_in_date date,
  move_out_date date,
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references public.profiles(id)
);

create index tenants_property_idx on public.tenants (property_id);
create index tenants_status_idx on public.tenants (portfolio_id, status);

create trigger tenants_set_updated_at
before update on public.tenants
for each row
execute function public.set_updated_at();

create table public.agreements (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id),
  type public.agreement_type not null,
  start_date date not null,
  end_date date not null,
  rent_amount_cents int not null,
  rent_due_day int,
  notice_period_months int,
  renewal_option text,
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references public.profiles(id),
  constraint agreements_rent_amount_cents_check check (rent_amount_cents >= 0),
  constraint agreements_dates_check check (end_date >= start_date),
  constraint agreements_rent_due_day_check check (
    rent_due_day is null
    or rent_due_day between 1 and 31
  )
);

create index agreements_property_idx on public.agreements (property_id);
create index agreements_tenant_idx on public.agreements (tenant_id);
create index agreements_dates_idx
on public.agreements (property_id, start_date, end_date);

create trigger agreements_set_updated_at
before update on public.agreements
for each row
execute function public.set_updated_at();

create table public.rent_records (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  tenant_id uuid references public.tenants(id),
  agreement_id uuid references public.agreements(id),
  month text not null,
  due_date date not null,
  amount_due_cents int not null,
  amount_paid_cents int not null default 0,
  status public.rent_status not null default 'unpaid',
  payment_date date,
  payment_method text,
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references public.profiles(id),
  constraint rent_records_amount_due_cents_check check (amount_due_cents >= 0),
  constraint rent_records_amount_paid_cents_check check (amount_paid_cents >= 0)
);

create unique index rent_records_active_property_tenant_month_unique
on public.rent_records (property_id, tenant_id, month)
where archived_at is null;

create index rent_records_property_idx on public.rent_records (property_id);
create index rent_records_status_idx on public.rent_records (portfolio_id, status);
create index rent_records_due_idx on public.rent_records (portfolio_id, due_date);
create index rent_records_month_idx on public.rent_records (portfolio_id, month);

create trigger rent_records_set_updated_at
before update on public.rent_records
for each row
execute function public.set_updated_at();

alter table public.tenants enable row level security;
alter table public.agreements enable row level security;
alter table public.rent_records enable row level security;

create policy tenants_select_property_access
on public.tenants
for select
to authenticated
using (public.can_read_property(property_id));

create policy tenants_insert_property_edit
on public.tenants
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.can_edit_property(property_id)
);

create policy tenants_update_property_edit
on public.tenants
for update
to authenticated
using (public.can_edit_property(property_id))
with check (public.can_edit_property(property_id));

create policy agreements_select_property_access
on public.agreements
for select
to authenticated
using (public.can_read_property(property_id));

create policy agreements_insert_property_edit
on public.agreements
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.can_edit_property(property_id)
);

create policy agreements_update_property_edit
on public.agreements
for update
to authenticated
using (public.can_edit_property(property_id))
with check (public.can_edit_property(property_id));

create policy rent_records_select_property_access
on public.rent_records
for select
to authenticated
using (public.can_read_property(property_id));

create policy rent_records_insert_property_edit
on public.rent_records
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.can_edit_property(property_id)
);

create policy rent_records_update_property_edit
on public.rent_records
for update
to authenticated
using (public.can_edit_property(property_id))
with check (public.can_edit_property(property_id));
