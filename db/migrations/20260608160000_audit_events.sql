create type public.audit_action as enum (
  'create',
  'update',
  'archive',
  'restore',
  'invite',
  'revoke',
  'system_generate'
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  actor_email text,
  action public.audit_action not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_portfolio_idx
on public.audit_events (portfolio_id, created_at desc);

create index audit_events_property_idx
on public.audit_events (property_id, created_at desc);

create index audit_events_actor_idx on public.audit_events (actor_id);

alter table public.audit_events enable row level security;

create policy audit_events_select_accessible
on public.audit_events
for select
to authenticated
using (
  public.is_portfolio_host(portfolio_id)
  or (
    property_id is not null
    and public.can_read_property(property_id)
  )
);

create policy audit_events_insert_actor
on public.audit_events
for insert
to authenticated
with check (
  actor_id = auth.uid()
  and (
    public.is_portfolio_host(portfolio_id)
    or (
      property_id is not null
      and public.can_edit_property(property_id)
    )
  )
);
