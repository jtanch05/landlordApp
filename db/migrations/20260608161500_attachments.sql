create type public.attachment_target_type as enum (
  'agreement',
  'expense',
  'maintenance_issue',
  'deposit'
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  target_type public.attachment_target_type not null,
  target_id uuid not null,
  bucket text not null,
  storage_path text not null,
  file_name text not null,
  content_type text,
  size_bytes bigint,
  is_private boolean not null default false,
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references public.profiles(id)
);

create index attachments_target_idx
on public.attachments (target_type, target_id);

create index attachments_property_idx on public.attachments (property_id);

create or replace function public.can_view_private_attachment(
  target_attachment_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.attachments
    where id = target_attachment_id
      and public.is_portfolio_host(portfolio_id)
  );
$$;

alter table public.attachments enable row level security;

create policy attachments_select_accessible
on public.attachments
for select
to authenticated
using (
  archived_at is null
  and (
    public.is_portfolio_host(portfolio_id)
    or (
      is_private = false
      and property_id is not null
      and public.can_read_property(property_id)
    )
  )
);

create policy attachments_insert_accessible
on public.attachments
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and (
    public.is_portfolio_host(portfolio_id)
    or (
      is_private = false
      and property_id is not null
      and public.can_edit_property(property_id)
    )
  )
);

create policy attachments_update_host
on public.attachments
for update
to authenticated
using (public.is_portfolio_host(portfolio_id))
with check (public.is_portfolio_host(portfolio_id));
