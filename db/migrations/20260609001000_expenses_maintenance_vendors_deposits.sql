create type public.expense_status as enum ('unpaid', 'paid');
create type public.maintenance_status as enum ('open', 'closed');
create type public.deposit_status as enum ('held', 'refunded');

create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  name text not null,
  default_tax_deductible boolean not null default false,
  is_system_seed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references public.profiles(id)
);

create unique index expense_categories_active_name_unique
on public.expense_categories (portfolio_id, name)
where archived_at is null;

create trigger expense_categories_set_updated_at
before update on public.expense_categories
for each row
execute function public.set_updated_at();

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  category_id uuid not null references public.expense_categories(id),
  amount_cents int not null,
  status public.expense_status not null default 'unpaid',
  expense_date date not null,
  payment_date date,
  tax_deductible boolean not null default false,
  description text not null,
  notes text,
  linked_maintenance_issue_id uuid,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references public.profiles(id),
  constraint expenses_amount_cents_check check (amount_cents >= 0)
);

create index expenses_property_idx on public.expenses (property_id);
create index expenses_category_idx on public.expenses (category_id);
create index expenses_status_idx on public.expenses (portfolio_id, status);
create index expenses_date_idx on public.expenses (portfolio_id, expense_date);

create trigger expenses_set_updated_at
before update on public.expenses
for each row
execute function public.set_updated_at();

create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  category_id uuid not null references public.expense_categories(id),
  description text not null,
  amount_cents int not null,
  day_of_month int not null,
  starts_on date not null,
  ends_on date,
  tax_deductible boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references public.profiles(id),
  constraint recurring_expenses_amount_cents_check check (amount_cents >= 0),
  constraint recurring_expenses_day_of_month_check check (day_of_month between 1 and 31)
);

create trigger recurring_expenses_set_updated_at
before update on public.recurring_expenses
for each row
execute function public.set_updated_at();

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  name text not null,
  service_type text,
  phone text,
  email text,
  notes text,
  rating int,
  last_used_date date,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references public.profiles(id),
  constraint vendors_rating_check check (rating is null or rating between 1 and 5)
);

create trigger vendors_set_updated_at
before update on public.vendors
for each row
execute function public.set_updated_at();

create table public.maintenance_issues (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  vendor_id uuid references public.vendors(id),
  linked_expense_id uuid references public.expenses(id),
  issue_type text,
  description text not null,
  reported_date date not null,
  status public.maintenance_status not null default 'open',
  resolved_date date,
  cost_cents int,
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references public.profiles(id),
  constraint maintenance_issues_cost_cents_check check (cost_cents is null or cost_cents >= 0)
);

create trigger maintenance_issues_set_updated_at
before update on public.maintenance_issues
for each row
execute function public.set_updated_at();

create table public.deposits (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  agreement_id uuid not null references public.agreements(id) on delete cascade,
  tenant_id uuid references public.tenants(id),
  label text not null,
  amount_cents int not null,
  status public.deposit_status not null default 'held',
  refund_date date,
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references public.profiles(id),
  constraint deposits_amount_cents_check check (amount_cents >= 0)
);

create trigger deposits_set_updated_at
before update on public.deposits
for each row
execute function public.set_updated_at();

alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.vendors enable row level security;
alter table public.maintenance_issues enable row level security;
alter table public.deposits enable row level security;

create policy expense_categories_select_portfolio_access
on public.expense_categories for select to authenticated
using (public.can_read_portfolio(portfolio_id));

create policy expense_categories_write_host
on public.expense_categories for all to authenticated
using (public.is_portfolio_host(portfolio_id))
with check (public.is_portfolio_host(portfolio_id));

create policy expenses_select_access
on public.expenses for select to authenticated
using (
  public.is_portfolio_host(portfolio_id)
  or (property_id is not null and public.can_read_property(property_id))
);

create policy expenses_insert_access
on public.expenses for insert to authenticated
with check (
  created_by = auth.uid()
  and (
    public.is_portfolio_host(portfolio_id)
    or (property_id is not null and public.can_edit_property(property_id))
  )
);

create policy expenses_update_access
on public.expenses for update to authenticated
using (
  public.is_portfolio_host(portfolio_id)
  or (property_id is not null and public.can_edit_property(property_id))
)
with check (
  public.is_portfolio_host(portfolio_id)
  or (property_id is not null and public.can_edit_property(property_id))
);

create policy recurring_expenses_access
on public.recurring_expenses for all to authenticated
using (
  public.is_portfolio_host(portfolio_id)
  or (property_id is not null and public.can_edit_property(property_id))
)
with check (
  created_by = auth.uid()
  and (
    public.is_portfolio_host(portfolio_id)
    or (property_id is not null and public.can_edit_property(property_id))
  )
);

create policy vendors_select_portfolio_access
on public.vendors for select to authenticated
using (public.can_read_portfolio(portfolio_id));

create policy vendors_write_host
on public.vendors for all to authenticated
using (public.is_portfolio_host(portfolio_id))
with check (created_by = auth.uid() and public.is_portfolio_host(portfolio_id));

create policy maintenance_issues_select_property_access
on public.maintenance_issues for select to authenticated
using (public.can_read_property(property_id));

create policy maintenance_issues_insert_property_edit
on public.maintenance_issues for insert to authenticated
with check (created_by = auth.uid() and public.can_edit_property(property_id));

create policy maintenance_issues_update_property_edit
on public.maintenance_issues for update to authenticated
using (public.can_edit_property(property_id))
with check (public.can_edit_property(property_id));

create policy deposits_select_property_access
on public.deposits for select to authenticated
using (public.can_read_property(property_id));

create policy deposits_insert_property_edit
on public.deposits for insert to authenticated
with check (created_by = auth.uid() and public.can_edit_property(property_id));

create policy deposits_update_property_edit
on public.deposits for update to authenticated
using (public.can_edit_property(property_id))
with check (public.can_edit_property(property_id));
