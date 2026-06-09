create type public.reminder_status as enum (
  'active',
  'dismissed',
  'resolved',
  'archived'
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  title text not null,
  description text,
  due_date date not null,
  status public.reminder_status not null default 'active',
  dismissed_at timestamptz,
  dismissed_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index reminders_active_source_unique
on public.reminders (source_type, source_id, title, due_date)
where status != 'archived';

create index reminders_due_idx on public.reminders (portfolio_id, status, due_date);
create index reminders_property_idx on public.reminders (property_id);

create trigger reminders_set_updated_at
before update on public.reminders
for each row
execute function public.set_updated_at();

alter table public.reminders enable row level security;

create policy reminders_select_access
on public.reminders for select to authenticated
using (
  public.is_portfolio_host(portfolio_id)
  or (property_id is not null and public.can_read_property(property_id))
);

create policy reminders_insert_access
on public.reminders for insert to authenticated
with check (
  public.is_portfolio_host(portfolio_id)
  or (property_id is not null and public.can_edit_property(property_id))
);

create policy reminders_update_access
on public.reminders for update to authenticated
using (
  public.is_portfolio_host(portfolio_id)
  or (property_id is not null and public.can_edit_property(property_id))
)
with check (
  public.is_portfolio_host(portfolio_id)
  or (property_id is not null and public.can_edit_property(property_id))
);
