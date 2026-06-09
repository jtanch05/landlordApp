create or replace function public.is_portfolio_host(target_portfolio_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.portfolio_members
    where portfolio_id = target_portfolio_id
      and user_id = auth.uid()
      and role = 'host'
  );
$$;

create or replace function public.can_read_property(target_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.properties
    where id = target_property_id
      and public.is_portfolio_host(portfolio_id)
  )
  or exists (
    select 1
    from public.property_access
    where property_id = target_property_id
      and user_id = auth.uid()
      and revoked_at is null
  );
$$;

create or replace function public.can_edit_property(target_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.properties
    where id = target_property_id
      and public.is_portfolio_host(portfolio_id)
  )
  or exists (
    select 1
    from public.property_access
    where property_id = target_property_id
      and user_id = auth.uid()
      and can_edit = true
      and revoked_at is null
  );
$$;

create or replace function public.can_read_portfolio(target_portfolio_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_portfolio_host(target_portfolio_id)
  or exists (
    select 1
    from public.properties p
    join public.property_access pa on pa.property_id = p.id
    where p.portfolio_id = target_portfolio_id
      and pa.user_id = auth.uid()
      and pa.revoked_at is null
  );
$$;

create or replace function public.can_read_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_profile_id = auth.uid()
  or exists (
    select 1
    from public.portfolio_members viewer
    join public.portfolio_members target
      on target.portfolio_id = viewer.portfolio_id
    where viewer.user_id = auth.uid()
      and viewer.role = 'host'
      and target.user_id = target_profile_id
  )
  or exists (
    select 1
    from public.property_access pa
    join public.properties p on p.id = pa.property_id
    where pa.user_id = target_profile_id
      and pa.revoked_at is null
      and public.is_portfolio_host(p.portfolio_id)
  );
$$;

alter table public.profiles enable row level security;
alter table public.portfolios enable row level security;
alter table public.portfolio_members enable row level security;
alter table public.properties enable row level security;
alter table public.property_access enable row level security;

create policy profiles_select_accessible
on public.profiles
for select
to authenticated
using (public.can_read_profile(id));

create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy portfolios_select_accessible
on public.portfolios
for select
to authenticated
using (public.can_read_portfolio(id));

create policy portfolios_insert_own
on public.portfolios
for insert
to authenticated
with check (created_by = auth.uid());

create policy portfolios_update_host
on public.portfolios
for update
to authenticated
using (public.is_portfolio_host(id))
with check (public.is_portfolio_host(id));

create policy portfolio_members_select_accessible
on public.portfolio_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_portfolio_host(portfolio_id)
);

create policy portfolio_members_insert_host
on public.portfolio_members
for insert
to authenticated
with check (
  public.is_portfolio_host(portfolio_id)
  or (
    user_id = auth.uid()
    and role = 'host'
    and exists (
      select 1
      from public.portfolios
      where portfolios.id = portfolio_members.portfolio_id
        and portfolios.created_by = auth.uid()
    )
  )
);

create policy portfolio_members_update_host
on public.portfolio_members
for update
to authenticated
using (public.is_portfolio_host(portfolio_id))
with check (public.is_portfolio_host(portfolio_id));

create policy properties_select_accessible
on public.properties
for select
to authenticated
using (public.can_read_property(id));

create policy properties_insert_host
on public.properties
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_portfolio_host(portfolio_id)
);

create policy properties_update_host
on public.properties
for update
to authenticated
using (public.is_portfolio_host(portfolio_id))
with check (public.is_portfolio_host(portfolio_id));

create policy property_access_select_accessible
on public.property_access
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.properties
    where properties.id = property_access.property_id
      and public.is_portfolio_host(properties.portfolio_id)
  )
);

create policy property_access_insert_host
on public.property_access
for insert
to authenticated
with check (
  granted_by = auth.uid()
  and exists (
    select 1
    from public.properties
    where properties.id = property_access.property_id
      and public.is_portfolio_host(properties.portfolio_id)
  )
);

create policy property_access_update_host
on public.property_access
for update
to authenticated
using (
  exists (
    select 1
    from public.properties
    where properties.id = property_access.property_id
      and public.is_portfolio_host(properties.portfolio_id)
  )
)
with check (
  exists (
    select 1
    from public.properties
    where properties.id = property_access.property_id
      and public.is_portfolio_host(properties.portfolio_id)
  )
);
