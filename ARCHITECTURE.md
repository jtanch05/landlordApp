# Software Architecture And Folder Conventions

This file defines how PropTrack code should be organized once the Next.js app is initialized. It is the structural guardrail for implementation.

## Architecture Goals

- Keep UI rendering separate from business rules.
- Keep financial, permission, reminder, and report rules deterministic and testable.
- Keep browser code from becoming the source of truth for writes.
- Keep future React Native support possible by exposing server-side business operations through stable boundaries.
- Prefer small files with one responsibility over large mixed-purpose modules.

## Stack

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- Supabase Auth.
- Supabase Postgres.
- Supabase Storage.
- Vercel hosting.

## Folder Tree

```text
.
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── callback/
│   ├── (app)/
│   │   ├── dashboard/
│   │   ├── properties/
│   │   │   └── [propertyId]/
│   │   ├── vendors/
│   │   ├── reports/
│   │   ├── activity/
│   │   └── settings/
│   └── api/
├── components/
│   ├── ui/
│   ├── layout/
│   └── features/
├── features/
│   ├── portfolios/
│   ├── properties/
│   ├── tenants/
│   ├── agreements/
│   ├── rent-records/
│   ├── expenses/
│   ├── maintenance/
│   ├── vendors/
│   ├── deposits/
│   ├── reminders/
│   ├── activity/
│   ├── reports/
│   └── sharing/
├── lib/
│   ├── supabase/
│   ├── auth/
│   ├── validation/
│   └── utils/
├── server/
│   ├── actions/
│   ├── queries/
│   ├── services/
│   └── permissions/
├── db/
│   ├── migrations/
│   ├── seeds/
│   └── types/
├── types/
└── tests/
```

## Route Responsibilities

- `app/(auth)`: login and auth callback routes only.
- `app/(app)/dashboard`: portfolio-level dashboard.
- `app/(app)/properties`: property list and property workspaces.
- `app/(app)/properties/[propertyId]`: property-centric tabs for overview, tenants, agreements, rent, expenses, maintenance, deposits, files, and activity.
- `app/(app)/vendors`: portfolio-level vendor contacts.
- `app/(app)/reports`: portfolio and property PDF report generation entry points.
- `app/(app)/activity`: portfolio-level activity feed.
- `app/(app)/settings`: profile, theme, portfolio settings, members/invitations, categories, and defaults.
- `app/api`: server endpoints needed by non-browser clients, webhooks, or future React Native integration.

## Feature Folder Shape

Each feature folder should use this shape where relevant:

```text
features/<feature>/
├── components/
├── schemas.ts
├── types.ts
├── service.ts
├── queries.ts
├── actions.ts
└── domain.ts
```

Responsibilities:

- `components/`: feature-specific UI components.
- `schemas.ts`: Zod schemas for form and server validation.
- `types.ts`: feature-specific TypeScript types.
- `service.ts`: server-side use cases and orchestration.
- `queries.ts`: read/query helpers.
- `actions.ts`: server actions exposed to UI.
- `domain.ts`: pure deterministic business logic.

Do not create every file automatically. Create files when the feature needs that responsibility.

## Boundary Rules

- UI components call server actions or hooks; they do not directly implement business rules.
- Server actions validate input, check permissions, call services, and return typed results.
- Services orchestrate database writes, generated records, reminders, attachments, and audit events.
- Domain files contain pure functions for calculations and state transitions.
- Queries read data and must respect portfolio/property access.
- Permission checks live in `server/permissions` or feature-specific permission helpers.
- Supabase client setup lives in `lib/supabase`.

## Database And Type Rules

- Database table names should use snake_case plural names.
- TypeScript domain names should use canonical terms from `CONTEXT.md`.
- Generated Supabase database types should live under `db/types`.
- Application-level types can live under `types` or feature-level `types.ts`.
- Do not use `any` for database records, server action inputs, or financial calculations.
- Validate all write inputs with schemas before database writes.

## Business Rule Placement

Put these in domain/service layers, not UI components:

- Agreement end-date calculation.
- Rent schedule generation.
- Rent status calculation.
- Recurring expense due detection.
- Maintenance-to-expense linking.
- Co-owner share calculation.
- Reminder generation/reconciliation.
- Report data assembly.
- Permission decisions.
- Archive behavior.
- Audit event creation.

## Server-Side Write Rules

These operations must go through server-side validation and permission checks:

- Create/update/archive property.
- Create/update agreement.
- Generate or update rent records.
- Mark rent paid or partial.
- Create/update expenses.
- Create/update maintenance issues.
- Create linked maintenance expenses.
- Upload/register attachments.
- Invite/revoke co-owner access.
- Change `can_edit`.
- Change split percentages.
- Generate report data.

## Testing Expectations

Business logic should be covered before UI polish:

- Agreement date and rent schedule generation.
- Rent status calculation.
- Co-owner share calculation.
- Reminder generation.
- Permission checks.
- Archive filtering.
- Maintenance linked expense behavior.

When the project exists, use:

```text
npm run lint
npm run build
```

Add more focused test commands once the test framework is installed.

## Deferred Architecture

Do not build these in v1 unless scope changes:

- AI assistant runtime.
- React Native app.
- Push notifications.
- Google Calendar sync.
- WhatsApp links.
- Billing/subscription logic.
- Tenant portal.
- CSV imports/exports.
