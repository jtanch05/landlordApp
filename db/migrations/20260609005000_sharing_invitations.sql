create type public.invitation_status as enum (
  'pending',
  'accepted',
  'expired',
  'revoked'
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  email text not null,
  can_edit boolean not null default false,
  can_view_tenant_contact boolean not null default false,
  status public.invitation_status not null default 'pending',
  token_hash text not null,
  invited_by uuid not null references public.profiles(id),
  accepted_by uuid references public.profiles(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index invitations_email_idx on public.invitations (email);
create index invitations_property_idx on public.invitations (property_id);
create index invitations_status_idx on public.invitations (status, expires_at);

alter table public.invitations enable row level security;

create policy invitations_select_host_or_invitee
on public.invitations for select to authenticated
using (
  public.is_portfolio_host(portfolio_id)
  or email = (select email from public.profiles where id = auth.uid())
);

create policy invitations_insert_host
on public.invitations for insert to authenticated
with check (invited_by = auth.uid() and public.is_portfolio_host(portfolio_id));

create policy invitations_update_host_or_invitee
on public.invitations for update to authenticated
using (
  public.is_portfolio_host(portfolio_id)
  or email = (select email from public.profiles where id = auth.uid())
)
with check (
  public.is_portfolio_host(portfolio_id)
  or email = (select email from public.profiles where id = auth.uid())
);
