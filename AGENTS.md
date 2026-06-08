# Agent Instructions

These instructions guide AI agents working in this repository. Treat `PRODUCT_PLAN.md` as the current product source of truth.

## Current Product Direction

- Product: PropTrack, a property management SaaS for Malaysian landlords.
- First platform: web app.
- Future platform: separate React Native mobile app using the same backend/API.
- V1 goal: build the core property management system before AI, push notifications, Google Calendar, or native mobile.

## Tech Stack

- Web app: Next.js App Router, TypeScript.
- Styling: Tailwind CSS.
- Backend: Next.js server actions/API routes.
- Database/Auth/Storage: Supabase with Postgres, Supabase Auth, and Supabase Storage.
- Hosting: Vercel.
- Currency: Malaysian Ringgit only in v1.

## Source Of Truth Files

- `PRODUCT_PLAN.md`: current v1 product and engineering plan.
- `CONTEXT.md`: domain glossary and canonical language only; do not treat it as a product spec.
- `ARCHITECTURE.md`: folder structure, code boundaries, and implementation architecture rules.
- `UI_DESIGN.md`: frontend visual direction, layout rules, and component design constraints.
- `EXECUTION_RULES.md`: automation, verification, self-review, and phase-boundary rules.
- `AI_FEATURE_SPEC.md`: future AI assistant reference only; do not implement AI in v1 unless explicitly requested.
- `FUNCTION_SPEC.md`: legacy/reference note only; do not treat it as current implementation scope.
- `TODO.md`: task tracker and execution order.

## Architecture Rules

- Keep business rules out of UI components.
- Put deterministic domain logic in focused service/domain modules.
- Use server-side validation for writes that affect financial records, permissions, invitations, reports, reminders, or generated records.
- Do not let browser-only code become the source of truth for financial workflows.
- React Native must be able to reuse the backend/API direction later.
- Prefer small, focused files with clear responsibilities.

## Product Guardrails

- V1 is property-centric.
- Top-level navigation should be: Dashboard, Properties, Vendors, Reports, Activity, Settings.
- Rent, expenses, maintenance, tenants, agreements, deposits, and files are primarily managed inside property workspaces.
- Frontend UI should follow `UI_DESIGN.md`: Wise-inspired neutral product UI, white-first screens, forest-green interaction, bright-green accents used sparingly, and dense operational layouts.
- Use soft delete/archive for destructive actions.
- Keep audit logs for create, update, and archive actions.
- Do not add billing, AI, push notifications, Google Calendar sync, WhatsApp links, tenant portal, or native mobile in v1 unless the user explicitly changes scope.

## Data And Permission Guardrails

- Use portfolio-based ownership.
- Each property belongs to exactly one portfolio.
- V1 roles are Host and Co-owner.
- Co-owner access is property-level and controlled by invitation.
- Co-owner can be view-only or editable via a simple `can_edit` setting.
- Host can revoke access, but historical audit logs remain.
- Attachments use Supabase Storage plus Postgres metadata.
- Private attachments are visible only to Host.

## AI Feature Guardrails

- AI assistant is deferred.
- If AI is later implemented, it must draft or explain; it must not silently write financial data.
- AI must not delete records, invent financial amounts, expose tokens, or replace deterministic application rules.
- Any create/update/external action proposed by AI requires explicit user confirmation.

## Development Workflow

- Before coding a major feature, write or update a plan.
- Before implementing a task, check `TODO.md` for the exact step and `ARCHITECTURE.md` for where the code belongs.
- When automating multiple steps, follow `EXECUTION_RULES.md`.
- For every feature, define:
  - Goal.
  - Context.
  - Constraints.
  - Done When verification.
- Run `npm run lint` and `npm run build` after meaningful code changes when the project exists.
- Do not install new dependencies without checking whether the project already has a suitable package.
- Do not delete or refactor files without checking references first.
- Preserve user changes in the working tree.

## Done When Standard

A feature is not complete until:

- TypeScript compiles.
- Lint/build pass, if scripts exist.
- Important business rules are covered by tests or explicit verification.
- The changed behavior matches `PRODUCT_PLAN.md`.
- Any plan or documentation affected by the change is updated.
