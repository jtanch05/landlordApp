create extension if not exists pgcrypto;

create type public.portfolio_role as enum ('host');
create type public.property_status as enum ('active', 'vacant', 'occupied', 'archived');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_email_idx on public.profiles (email);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_rent_due_day int not null default 1,
  currency_code text not null default 'MYR',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references public.profiles(id),
  constraint portfolios_default_rent_due_day_check check (
    default_rent_due_day between 1 and 31
  ),
  constraint portfolios_currency_code_check check (currency_code = 'MYR')
);

create trigger portfolios_set_updated_at
before update on public.portfolios
for each row
execute function public.set_updated_at();

create table public.portfolio_members (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.portfolio_role not null default 'host',
  created_at timestamptz not null default now(),
  constraint portfolio_members_portfolio_user_unique unique (portfolio_id, user_id)
);

create index portfolio_members_user_idx on public.portfolio_members (user_id);
create index portfolio_members_portfolio_idx on public.portfolio_members (portfolio_id);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  nickname text not null,
  type text not null,
  status public.property_status not null default 'vacant',
  state text,
  local_council text,
  address_line1 text,
  address_line2 text,
  city text,
  postcode text,
  unit_number text,
  block_tower text,
  floor text,
  bedrooms int,
  bathrooms int,
  parking_count int not null default 0,
  notes text,
  co_owner_share_enabled boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references public.profiles(id),
  constraint properties_bedrooms_check check (bedrooms is null or bedrooms >= 0),
  constraint properties_bathrooms_check check (bathrooms is null or bathrooms >= 0),
  constraint properties_parking_count_check check (parking_count >= 0)
);

create index properties_portfolio_idx on public.properties (portfolio_id);
create index properties_status_idx on public.properties (portfolio_id, status);

create trigger properties_set_updated_at
before update on public.properties
for each row
execute function public.set_updated_at();

create table public.property_access (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  can_edit boolean not null default false,
  can_view_tenant_contact boolean not null default false,
  granted_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id)
);

create unique index property_access_active_unique
on public.property_access (property_id, user_id)
where revoked_at is null;

create index property_access_user_idx on public.property_access (user_id);
create index property_access_property_idx on public.property_access (property_id);

create trigger property_access_set_updated_at
before update on public.property_access
for each row
execute function public.set_updated_at();
