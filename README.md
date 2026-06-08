# PropTrack

PropTrack is a planned property management SaaS for Malaysian landlords. V1 is a web-first app focused on properties, tenants, agreements, rent records, expenses, maintenance, vendors, deposits, reports, reminders, activity, and Co-owner access.

## Current Status

This repository is in the harness and design phase. The coding phase starts at `TODO.md` Step 1.1.

## Source Of Truth

- `AGENTS.md`: agent instructions, project guardrails, and development rules.
- `CONTEXT.md`: canonical domain glossary. Use these terms in code and database design.
- `PRODUCT_PLAN.md`: current product scope and v1 decisions.
- `UI_DESIGN.md`: frontend visual direction and component rules.
- `EXECUTION_RULES.md`: automation checkpoints, verification rules, and self-review loop.
- `ARCHITECTURE.md`: folder structure and code boundary rules.
- `SYSTEM_DESIGN.md`: technical system design.
- `DATABASE_SCHEMA.md`: planned Supabase/Postgres schema.
- `TODO.md`: active implementation ledger.
- `AI_FEATURE_SPEC.md`: future AI assistant reference only.
- `FUNCTION_SPEC.md`: legacy reference only.

## V1 Direction

- Web app first.
- Future React Native mobile app as a separate codebase.
- Full-stack Next.js on Vercel.
- Supabase Auth, Postgres, and Storage.
- Property-centric UX.
- Host and Co-owner roles.
- Property-level sharing by email invitation.
- Wise-inspired, white-first product UI.

## Deferred Scope

These are intentionally not part of v1 unless the scope changes:

- AI assistant.
- Native mobile app.
- Push notifications.
- Google Calendar sync.
- WhatsApp reminder links.
- Tenant portal.
- Billing/subscriptions.
- LHDN report.
- CSV exports/imports.

## Development Workflow

1. Read `AGENTS.md`.
2. Check `TODO.md` for the exact step.
3. Check `ARCHITECTURE.md` for where code belongs.
4. Check `UI_DESIGN.md` before building UI.
5. Check `EXECUTION_RULES.md` before automating multiple steps.
6. Implement one step at a time.
7. Run verification commands when the project exists:

```powershell
npm run lint
npm run build
```

## First Coding Step

Start with:

```text
TODO.md Step 1.1: Initialize the Next.js App Router project with TypeScript.
```

Follow:

```text
docs/superpowers/plans/2026-06-08-project-foundation.md
```
