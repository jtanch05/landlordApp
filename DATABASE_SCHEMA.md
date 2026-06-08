# PropTrack Database Schema Design

This document defines the planned Supabase/Postgres schema for PropTrack v1.

## 1. Conventions

- Table names use snake_case plural names.
- Primary keys use `uuid`.
- User identity comes from `auth.users`.
- Application user details live in `profiles`.
- Most business records include `portfolio_id`.
- Property-specific records include `property_id`.
- Soft archive uses `archived_at` and `archived_by`.
- Timestamps use `created_at` and `updated_at`.
- Money uses integer cents in RM: `amount_cents`.

## 2. Enums

```sql
create type portfolio_role as enum ('host');
create type property_status as enum ('active', 'vacant', 'occupied', 'archived');
create type tenant_status as enum ('active', 'notice_given', 'vacated');
create type agreement_type as enum ('six_months', 'one_year', 'two_years', 'three_years', 'custom');
create type rent_status as enum ('unpaid', 'partial', 'paid');
create type expense_status as enum ('unpaid', 'paid');
create type maintenance_status as enum ('open', 'closed');
create type deposit_status as enum ('held', 'refunded');
create type invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');
create type reminder_status as enum ('active', 'dismissed', 'resolved', 'archived');
create type attachment_target_type as enum ('agreement', 'expense', 'maintenance_issue', 'deposit');
create type audit_action as enum ('create', 'update', 'archive', 'restore', 'invite', 'revoke', 'system_generate');
```

## 3. Identity And Ownership

### profiles

Application profile for a Supabase Auth user.

Columns:

- `id uuid primary key references auth.users(id) on delete cascade`
- `display_name text`
- `email text not null`
- `avatar_url text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `profiles_email_idx` on `email`

### portfolios

A collection of properties and records managed by a Host.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `default_rent_due_day int not null default 1`
- `currency_code text not null default 'MYR'`
- `created_by uuid not null references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `archived_at timestamptz`
- `archived_by uuid references profiles(id)`

Constraints:

- `default_rent_due_day between 1 and 31`
- `currency_code = 'MYR'` for v1

### portfolio_members

Host membership for portfolios. V1 only stores Host role here.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `portfolio_id uuid not null references portfolios(id) on delete cascade`
- `user_id uuid not null references profiles(id) on delete cascade`
- `role portfolio_role not null default 'host'`
- `created_at timestamptz not null default now()`

Constraints:

- unique `(portfolio_id, user_id)`

Indexes:

- `portfolio_members_user_idx` on `user_id`
- `portfolio_members_portfolio_idx` on `portfolio_id`

## 4. Properties And Sharing

### properties

Rental properties managed inside a portfolio.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `portfolio_id uuid not null references portfolios(id) on delete cascade`
- `nickname text not null`
- `type text not null`
- `status property_status not null default 'vacant'`
- `state text`
- `local_council text`
- `address_line1 text`
- `address_line2 text`
- `city text`
- `postcode text`
- `unit_number text`
- `block_tower text`
- `floor text`
- `bedrooms int`
- `bathrooms int`
- `parking_count int not null default 0`
- `notes text`
- `co_owner_share_enabled boolean not null default false`
- `created_by uuid not null references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `archived_at timestamptz`
- `archived_by uuid references profiles(id)`

Indexes:

- `properties_portfolio_idx` on `portfolio_id`
- `properties_status_idx` on `portfolio_id, status`

### property_access

Property-level Co-owner access.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `property_id uuid not null references properties(id) on delete cascade`
- `user_id uuid not null references profiles(id) on delete cascade`
- `can_edit boolean not null default false`
- `can_view_tenant_contact boolean not null default false`
- `granted_by uuid not null references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `revoked_at timestamptz`
- `revoked_by uuid references profiles(id)`

Constraints:

- unique `(property_id, user_id)` where `revoked_at is null`

Indexes:

- `property_access_user_idx` on `user_id`
- `property_access_property_idx` on `property_id`

### co_owner_shares

Split percentages used for Co-owner Share calculations.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `property_id uuid not null references properties(id) on delete cascade`
- `profile_id uuid references profiles(id)`
- `display_name text not null`
- `split_percent numeric(5,2) not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `archived_at timestamptz`
- `archived_by uuid references profiles(id)`

Constraints:

- `split_percent >= 0 and split_percent <= 100`

Note:

- Total split validation should happen in server service logic for editable workflows.

### invitations

Email invitations for property-level Co-owner access.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `portfolio_id uuid not null references portfolios(id) on delete cascade`
- `property_id uuid not null references properties(id) on delete cascade`
- `email text not null`
- `can_edit boolean not null default false`
- `can_view_tenant_contact boolean not null default false`
- `status invitation_status not null default 'pending'`
- `token_hash text not null`
- `invited_by uuid not null references profiles(id)`
- `accepted_by uuid references profiles(id)`
- `expires_at timestamptz not null`
- `accepted_at timestamptz`
- `revoked_at timestamptz`
- `created_at timestamptz not null default now()`

Indexes:

- `invitations_email_idx` on `email`
- `invitations_property_idx` on `property_id`
- `invitations_status_idx` on `status, expires_at`

## 5. Core Property Records

### tenants

Columns:

- `id uuid primary key default gen_random_uuid()`
- `portfolio_id uuid not null references portfolios(id) on delete cascade`
- `property_id uuid not null references properties(id) on delete cascade`
- `name text not null`
- `phone text`
- `email text`
- `status tenant_status not null default 'active'`
- `move_in_date date`
- `move_out_date date`
- `notes text`
- `created_by uuid not null references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `archived_at timestamptz`
- `archived_by uuid references profiles(id)`

Indexes:

- `tenants_property_idx` on `property_id`
- `tenants_status_idx` on `portfolio_id, status`

### agreements

Columns:

- `id uuid primary key default gen_random_uuid()`
- `portfolio_id uuid not null references portfolios(id) on delete cascade`
- `property_id uuid not null references properties(id) on delete cascade`
- `tenant_id uuid not null references tenants(id)`
- `type agreement_type not null`
- `start_date date not null`
- `end_date date not null`
- `rent_amount_cents int not null`
- `rent_due_day int`
- `notice_period_months int`
- `renewal_option text`
- `notes text`
- `created_by uuid not null references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `archived_at timestamptz`
- `archived_by uuid references profiles(id)`

Constraints:

- `rent_amount_cents >= 0`
- `end_date >= start_date`
- `rent_due_day is null or rent_due_day between 1 and 31`

Indexes:

- `agreements_property_idx` on `property_id`
- `agreements_tenant_idx` on `tenant_id`
- `agreements_dates_idx` on `property_id, start_date, end_date`

### rent_records

Columns:

- `id uuid primary key default gen_random_uuid()`
- `portfolio_id uuid not null references portfolios(id) on delete cascade`
- `property_id uuid not null references properties(id) on delete cascade`
- `tenant_id uuid references tenants(id)`
- `agreement_id uuid references agreements(id)`
- `month text not null`
- `due_date date not null`
- `amount_due_cents int not null`
- `amount_paid_cents int not null default 0`
- `status rent_status not null default 'unpaid'`
- `payment_date date`
- `payment_method text`
- `notes text`
- `created_by uuid not null references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `archived_at timestamptz`
- `archived_by uuid references profiles(id)`

Constraints:

- `amount_due_cents >= 0`
- `amount_paid_cents >= 0`
- unique `(property_id, tenant_id, month)` where `archived_at is null`

Indexes:

- `rent_records_property_idx` on `property_id`
- `rent_records_status_idx` on `portfolio_id, status`
- `rent_records_due_idx` on `portfolio_id, due_date`
- `rent_records_month_idx` on `portfolio_id, month`

## 6. Expenses, Maintenance, Vendors, Deposits

### expense_categories

Columns:

- `id uuid primary key default gen_random_uuid()`
- `portfolio_id uuid not null references portfolios(id) on delete cascade`
- `name text not null`
- `default_tax_deductible boolean not null default false`
- `is_system_seed boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `archived_at timestamptz`
- `archived_by uuid references profiles(id)`

Constraints:

- unique `(portfolio_id, name)` where `archived_at is null`

### expenses

Columns:

- `id uuid primary key default gen_random_uuid()`
- `portfolio_id uuid not null references portfolios(id) on delete cascade`
- `property_id uuid references properties(id) on delete cascade`
- `category_id uuid not null references expense_categories(id)`
- `amount_cents int not null`
- `status expense_status not null default 'unpaid'`
- `expense_date date not null`
- `payment_date date`
- `tax_deductible boolean not null default false`
- `description text not null`
- `notes text`
- `linked_maintenance_issue_id uuid`
- `created_by uuid not null references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `archived_at timestamptz`
- `archived_by uuid references profiles(id)`

Constraints:

- `amount_cents >= 0`

Indexes:

- `expenses_property_idx` on `property_id`
- `expenses_category_idx` on `category_id`
- `expenses_status_idx` on `portfolio_id, status`
- `expenses_date_idx` on `portfolio_id, expense_date`

### recurring_expenses

Columns:

- `id uuid primary key default gen_random_uuid()`
- `portfolio_id uuid not null references portfolios(id) on delete cascade`
- `property_id uuid references properties(id) on delete cascade`
- `category_id uuid not null references expense_categories(id)`
- `description text not null`
- `amount_cents int not null`
- `day_of_month int not null`
- `starts_on date not null`
- `ends_on date`
- `tax_deductible boolean not null default false`
- `created_by uuid not null references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `archived_at timestamptz`
- `archived_by uuid references profiles(id)`

Constraints:

- `amount_cents >= 0`
- `day_of_month between 1 and 31`

### vendors

Columns:

- `id uuid primary key default gen_random_uuid()`
- `portfolio_id uuid not null references portfolios(id) on delete cascade`
- `name text not null`
- `service_type text`
- `phone text`
- `email text`
- `notes text`
- `rating int`
- `last_used_date date`
- `created_by uuid not null references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `archived_at timestamptz`
- `archived_by uuid references profiles(id)`

Constraints:

- `rating is null or rating between 1 and 5`

### maintenance_issues

Columns:

- `id uuid primary key default gen_random_uuid()`
- `portfolio_id uuid not null references portfolios(id) on delete cascade`
- `property_id uuid not null references properties(id) on delete cascade`
- `vendor_id uuid references vendors(id)`
- `linked_expense_id uuid references expenses(id)`
- `issue_type text`
- `description text not null`
- `reported_date date not null`
- `status maintenance_status not null default 'open'`
- `resolved_date date`
- `cost_cents int`
- `notes text`
- `created_by uuid not null references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `archived_at timestamptz`
- `archived_by uuid references profiles(id)`

Constraints:

- `cost_cents is null or cost_cents >= 0`

### deposits

Columns:

- `id uuid primary key default gen_random_uuid()`
- `portfolio_id uuid not null references portfolios(id) on delete cascade`
- `property_id uuid not null references properties(id) on delete cascade`
- `agreement_id uuid not null references agreements(id) on delete cascade`
- `tenant_id uuid references tenants(id)`
- `label text not null`
- `amount_cents int not null`
- `status deposit_status not null default 'held'`
- `refund_date date`
- `notes text`
- `created_by uuid not null references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `archived_at timestamptz`
- `archived_by uuid references profiles(id)`

Constraints:

- `amount_cents >= 0`

## 7. Attachments, Reminders, Activity

### attachments

Columns:

- `id uuid primary key default gen_random_uuid()`
- `portfolio_id uuid not null references portfolios(id) on delete cascade`
- `property_id uuid references properties(id) on delete cascade`
- `target_type attachment_target_type not null`
- `target_id uuid not null`
- `bucket text not null`
- `storage_path text not null`
- `file_name text not null`
- `content_type text`
- `size_bytes bigint`
- `is_private boolean not null default false`
- `uploaded_by uuid not null references profiles(id)`
- `created_at timestamptz not null default now()`
- `archived_at timestamptz`
- `archived_by uuid references profiles(id)`

Indexes:

- `attachments_target_idx` on `target_type, target_id`
- `attachments_property_idx` on `property_id`

### reminders

Columns:

- `id uuid primary key default gen_random_uuid()`
- `portfolio_id uuid not null references portfolios(id) on delete cascade`
- `property_id uuid references properties(id) on delete cascade`
- `source_type text not null`
- `source_id uuid not null`
- `title text not null`
- `description text`
- `due_date date not null`
- `status reminder_status not null default 'active'`
- `dismissed_at timestamptz`
- `dismissed_by uuid references profiles(id)`
- `resolved_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- unique `(source_type, source_id, title, due_date)` where `status != 'archived'`

Indexes:

- `reminders_due_idx` on `portfolio_id, status, due_date`
- `reminders_property_idx` on `property_id`

### audit_events

Internal accountability records. User-facing Activity is derived from this table.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `portfolio_id uuid not null references portfolios(id) on delete cascade`
- `property_id uuid references properties(id) on delete cascade`
- `actor_id uuid references profiles(id)`
- `actor_email text`
- `action audit_action not null`
- `entity_type text not null`
- `entity_id uuid`
- `summary text not null`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

Indexes:

- `audit_events_portfolio_idx` on `portfolio_id, created_at desc`
- `audit_events_property_idx` on `property_id, created_at desc`
- `audit_events_actor_idx` on `actor_id`

## 8. RLS Policy Shape

RLS should be enabled on all application tables.

Core access predicates:

- Host can access records in portfolios where they have `portfolio_members.role = 'host'`.
- Co-owner can read records for properties where active `property_access` exists.
- Editable Co-owner can write operational records for shared properties when `can_edit = true`.
- Co-owner cannot write portfolio settings, invitations, split percentages, property archive, or private attachments.
- Private attachments are Host-only.

Recommended helper functions:

```sql
is_portfolio_host(target_portfolio_id uuid)
can_read_property(target_property_id uuid)
can_edit_property(target_property_id uuid)
can_view_private_attachment(target_attachment_id uuid)
```

Server-side code should still enforce permissions before writes.

## 9. Index Priorities

Add indexes early for:

- `portfolio_id` on all business tables.
- `property_id` on property-specific tables.
- status/date combinations used in dashboard and reminders.
- invitation email/status lookup.
- audit event portfolio/property feeds.
- rent record month/status queries.
- expense date/category/status queries.

## 10. Open Schema Review Items

These should be validated during implementation planning:

- Whether `linked_maintenance_issue_id` and `linked_expense_id` should be enforced by a deferred constraint or handled in service logic.
- Whether `source_type/source_id` polymorphic references for reminders are acceptable for v1.
- Whether report generation needs persisted report records or can generate on demand.
- Whether `co_owner_shares.profile_id` should be required for invited app users or remain optional for manual share participants.
