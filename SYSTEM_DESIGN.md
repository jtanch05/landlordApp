# PropTrack System Design

This document translates `PRODUCT_PLAN.md`, `CONTEXT.md`, and `ARCHITECTURE.md` into the technical design for v1.

## 1. System Overview

PropTrack v1 is a full-stack web SaaS for Malaysian landlords. The app is web-first, property-centric, and built around a portfolio ownership model with property-level Co-owner access.

Runtime shape:

```text
Browser
  -> Next.js App Router UI
  -> Next.js server actions / API routes
  -> Supabase Auth / Postgres / Storage
  -> Vercel hosting
```

Future React Native should call the same server/API boundary, not duplicate business rules in the mobile client.

## 2. Core Principles

- `PRODUCT_PLAN.md` defines v1 scope.
- `CONTEXT.md` defines canonical names.
- `ARCHITECTURE.md` defines file and code boundaries.
- Server-side code is the source of truth for writes.
- UI renders state and collects user input; it does not own financial workflows.
- Important actions are audited.
- Destructive actions are soft archives.
- AI, push notifications, calendar sync, WhatsApp links, tenant portal, billing, import, CSV, and mobile are deferred.

## 3. Application Areas

Top-level app navigation:

- Dashboard.
- Properties.
- Vendors.
- Reports.
- Activity.
- Settings.

Property workspace tabs:

- Overview.
- Tenants.
- Agreements.
- Rent.
- Expenses.
- Maintenance.
- Deposits.
- Files.
- Activity or recent activity.

Vendors remain top-level because they are portfolio contacts that may serve multiple properties.

## 4. Authentication

V1 auth methods:

- Google sign-in.
- Email magic link.

Supabase Auth owns identity. The app stores application profile and portfolio membership data in Postgres.

Auth flow:

1. User signs in through Supabase Auth.
2. Auth callback establishes session.
3. Server checks whether an app profile exists.
4. If absent, create profile.
5. Server checks whether user has a portfolio.
6. If absent, create default portfolio and Host membership.
7. User enters onboarding or dashboard depending on setup state.

## 5. Ownership And Access

The app uses portfolio ownership plus property-level sharing.

Canonical access concepts:

- Host owns portfolio-level administration.
- Co-owner is invited to specific properties.
- Co-owner may be view-only or editable using `can_edit`.

Access flow:

```text
User
  -> profile
  -> portfolio_memberships
  -> portfolio
  -> properties
  -> property_access for Co-owner sharing
```

Host can:

- Manage portfolio settings.
- Manage properties.
- Invite/revoke Co-owners.
- Configure Co-owner access.
- Configure split percentages.
- See all records.

Co-owner can:

- See shared properties.
- See financial data for shared properties.
- Download reports for shared properties.
- Upload attachments only when `can_edit = true`.
- Edit operational records only when `can_edit = true`.

Co-owner cannot:

- Invite users.
- Change ownership.
- Change split percentages.
- Archive properties.
- See Host-private attachments.

## 6. Permission Model

Permission checks happen in two places:

- Supabase RLS blocks unauthorized database access.
- Server-side permission helpers enforce business-level rules before writes.

RLS should prevent raw unauthorized reads/writes. Server services should still call permission helpers so behavior is explicit and testable.

Permission helper examples:

- `canReadPortfolio(userId, portfolioId)`
- `canManagePortfolio(userId, portfolioId)`
- `canReadProperty(userId, propertyId)`
- `canEditProperty(userId, propertyId)`
- `canViewPrivateAttachment(userId, attachmentId)`
- `canArchiveRecord(userId, record)`

## 7. Server Action Boundary

Server actions handle UI-triggered writes.

Pattern:

```text
UI form
  -> schema validation
  -> server action
  -> permission check
  -> service
  -> database write
  -> audit event
  -> typed result
```

Server actions must be used for:

- Creating/editing/archiving properties.
- Creating/editing agreements.
- Generating rent records.
- Updating rent payment status.
- Creating/editing expenses.
- Creating/editing maintenance issues.
- Creating linked maintenance expenses.
- Uploading/registering attachments.
- Inviting/revoking Co-owners.
- Changing `can_edit`.
- Updating split percentages.
- Generating report data.

## 8. Domain Services

Domain services orchestrate deterministic rules.

Primary services:

- `portfolioService`: profile/default portfolio setup.
- `propertyService`: property CRUD/archive and access checks.
- `sharingService`: invitations, access activation, revocation.
- `agreementService`: agreement create/edit and rent schedule effects.
- `rentService`: rent status and payment updates.
- `expenseService`: expense category and expense handling.
- `maintenanceService`: maintenance issue and linked expense behavior.
- `depositService`: held/refunded status handling.
- `reminderService`: reminder generation and reconciliation.
- `activityService`: audit event creation and activity reads.
- `reportService`: report data assembly and PDF generation.
- `attachmentService`: storage metadata, private flag, and file access.

## 9. Agreement And Rent Flow

Create agreement:

1. Validate property and tenant belong to same portfolio.
2. Validate user can edit property.
3. Calculate end date if agreement type is fixed term.
4. Generate rent schedule preview.
5. User confirms.
6. Create agreement.
7. Create all monthly rent records for full term.
8. Create relevant reminders.
9. Write audit events.

Edit agreement:

- Paid and partial historical rent records are never silently changed.
- Show preview for affected future unpaid rent records.
- Default option updates future unpaid records only.
- User may leave rent records unchanged.

Manual rent records:

- Allowed only if property has no active agreement.
- Allowed only for Host or editable Co-owner.

## 10. Expenses And Maintenance

Expense categories are portfolio-level.

Category rules:

- Starter categories are seeded per portfolio.
- Categories may be archived even if used.
- Archived categories remain linked to historical expenses.
- Archived categories do not appear in new expense forms by default.

Maintenance cost rule:

- Maintenance is operational.
- Expense is financial.
- If maintenance has a cost, the app creates or updates a linked expense record.
- Linked maintenance expense is edited from the maintenance issue.
- Expense list links back to the maintenance issue for edits.

## 11. Reminders

Reminder model is both computed and stored.

Source records remain authoritative. Stored reminders support:

- Timeline display.
- Dismissal.
- Retention.
- Future mobile push.
- Future calendar sync.

Reminder lifecycle:

1. Source record is created or changed.
2. Reminder service reconciles expected reminders.
3. Current/future unresolved reminders stay active.
4. User can dismiss reminders.
5. Dismissed/resolved reminders are retained for 12 months.
6. Older dismissed/resolved reminders may be archived or purged.

## 12. Activity And Audit

Audit events are internal accountability records.
Activity is the user-facing feed derived from audit events.

Audit records capture:

- Actor.
- Portfolio.
- Property if applicable.
- Action.
- Entity type.
- Entity id.
- Human-readable summary.
- Timestamp.

Field-level diffs are deferred. Basic create/update/archive actions are enough for v1.

Audit records are retained indefinitely unless the owning portfolio is deleted.

## 13. Attachments

Files use Supabase Storage. Metadata lives in Postgres.

Supported target records:

- Agreements.
- Expenses.
- Maintenance issues.
- Deposits.

Attachment behavior:

- Each attachment belongs to a portfolio.
- Property-linked attachments also carry a property id.
- Attachments can be marked private.
- Private attachments are Host-only.
- Non-private attachments follow property access rules.

## 14. Reports

V1 reports are PDF-only:

- Rent ledger.
- Expenses.
- Basic property statement.

Reports use server-side report data assembly. Archived historical financial records may be included where needed for accurate statements. Archived operational records are excluded by default.

Co-owner share formula:

```text
net_cash_flow = rent_collected - expenses - maintenance_costs

if net_cash_flow > 0:
  co_owner_share = net_cash_flow * split_percent / 100
else:
  co_owner_share = 0
  report shows property loss separately
```

V1 reports do not create payout records.

## 15. Dashboard

Dashboard uses server-side summary queries.

Dashboard sections:

- Portfolio summary.
- Rent due and overdue.
- Expense summary.
- In-app reminders.
- Cash-flow trend charts.
- Expense category breakdowns.
- Property-level summary cards.

For Co-owner users, dashboard data is filtered to shared properties.

## 16. Settings

Settings include:

- Profile.
- Theme.
- Portfolio settings.
- Members and invitations.
- Expense categories.
- Defaults such as rent due day.

If this grows too large, portfolio administration can later split into an Admin area.

## 17. Future Mobile Path

React Native is a separate codebase later.

To preserve that path:

- Keep core writes server-side.
- Keep report/reminder/access logic in services.
- Expose mobile-safe API routes when mobile starts.
- Avoid embedding business rules only in React components.

## 18. Deferred Systems

Do not design or implement these for v1 beyond preserving extension points:

- AI assistant.
- Push notifications.
- Google Calendar sync.
- WhatsApp links.
- Tenant portal.
- Billing.
- LHDN report.
- Data import.
- CSV exports.
