# Implementation Ledger

Use this file as the active step-by-step tracker. Each implementation thread should reference one exact step.

Current source files:

- `PRODUCT_PLAN.md`: product source of truth.
- `CONTEXT.md`: canonical domain glossary.
- `ARCHITECTURE.md`: code structure and boundaries.
- `AGENTS.md`: agent behavior and guardrails.

## Phase 0: Harness And Planning

- [x] Step 0.1: Create current product plan.
- [x] Step 0.2: Create domain glossary in `CONTEXT.md`.
- [x] Step 0.3: Mark `FUNCTION_SPEC.md` as legacy reference only.
- [x] Step 0.4: Keep `AI_FEATURE_SPEC.md` as future AI reference only.
- [x] Step 0.5: Create agent guardrails in `AGENTS.md`.
- [x] Step 0.6: Create architecture and folder conventions in `ARCHITECTURE.md`.
- [x] Step 0.7: Create frontend UI design direction.
- [x] Step 0.8: Create system design document.
- [x] Step 0.9: Create database schema document.
- [x] Step 0.10: Create detailed implementation plan under `docs/superpowers/plans/`.
- [x] Step 0.11: Create repository README, gitignore, and initial ADR.
- [x] Step 0.12: Create execution rules for automation, verification, and self-review.

## Phase 1: Project Foundation

- [x] Step 1.1: Initialize the Next.js App Router project with TypeScript.
- [x] Step 1.2: Add Tailwind CSS and base layout styling.
- [x] Step 1.3: Create the route groups `(auth)` and `(app)`.
- [x] Step 1.4: Create top-level app routes: dashboard, properties, vendors, reports, activity, settings.
- [x] Step 1.5: Create the property workspace route at `properties/[propertyId]`.
- [ ] Step 1.6: Add the folder structure from `ARCHITECTURE.md`.
- [x] Step 1.7: Configure lint/build scripts.
- [ ] Step 1.8: Add environment variable template.

## Phase 2: Supabase Foundation

- [ ] Step 2.1: Configure Supabase client helpers.
- [ ] Step 2.2: Create initial database migration for profiles, portfolios, portfolio membership, properties, and property access.
- [ ] Step 2.3: Create RLS policies for Host and Co-owner access.
- [ ] Step 2.4: Generate Supabase TypeScript database types.
- [ ] Step 2.5: Create server-side permission helpers.
- [ ] Step 2.6: Create audit log table and audit event helper.
- [ ] Step 2.7: Create archive columns and archive filtering conventions.

## Phase 3: Auth And Onboarding

- [ ] Step 3.1: Implement Google sign-in.
- [ ] Step 3.2: Implement email magic link sign-in.
- [ ] Step 3.3: Implement auth callback handling.
- [ ] Step 3.4: Auto-create default portfolio for new users.
- [ ] Step 3.5: Build guided onboarding for first property.
- [ ] Step 3.6: Support vacant property setup prompts.

## Phase 4: Property Workspace

- [ ] Step 4.1: Build property list page.
- [ ] Step 4.2: Build create/edit/archive property flow.
- [ ] Step 4.3: Build property workspace shell and tabs.
- [ ] Step 4.4: Build property overview tab.
- [ ] Step 4.5: Build property files tab with attachment metadata.
- [ ] Step 4.6: Build property activity view.

## Phase 5: Tenants, Agreements, And Rent

- [ ] Step 5.1: Build tenant records inside property workspace.
- [ ] Step 5.2: Build agreement create/edit flow.
- [ ] Step 5.3: Implement agreement end-date calculation.
- [ ] Step 5.4: Implement rent schedule preview.
- [ ] Step 5.5: Generate full-term monthly rent records after agreement confirmation.
- [ ] Step 5.6: Implement agreement edit preview for future unpaid rent records.
- [ ] Step 5.7: Build rent ledger tab.
- [ ] Step 5.8: Implement partial rent and payment method updates.
- [ ] Step 5.9: Implement manual rent record flow only for properties without active agreements.

## Phase 6: Expenses, Maintenance, Vendors, And Deposits

- [ ] Step 6.1: Build portfolio-level expense category management.
- [ ] Step 6.2: Build expense records inside property workspace.
- [ ] Step 6.3: Implement paid/unpaid expense status.
- [ ] Step 6.4: Implement simple recurring expense prompts.
- [ ] Step 6.5: Build portfolio-level vendor contacts.
- [ ] Step 6.6: Build maintenance issue records.
- [ ] Step 6.7: Implement linked maintenance expense creation/update.
- [ ] Step 6.8: Build deposits tied to agreements.
- [ ] Step 6.9: Implement simple held/refunded deposit status.

## Phase 7: Reminders, Activity, Dashboard, And Reports

- [ ] Step 7.1: Implement reminder generation and reconciliation.
- [ ] Step 7.2: Implement reminder dismissal.
- [ ] Step 7.3: Implement reminder retention behavior.
- [ ] Step 7.4: Build portfolio-level activity page.
- [ ] Step 7.5: Build advanced dashboard with charts and summaries.
- [ ] Step 7.6: Implement rent ledger PDF report.
- [ ] Step 7.7: Implement expenses PDF report.
- [ ] Step 7.8: Implement basic property statement PDF report.
- [ ] Step 7.9: Implement co-owner share calculation in reports.

## Phase 8: Sharing And Access

- [ ] Step 8.1: Build Host invitation flow by email.
- [ ] Step 8.2: Implement 14-day invitation expiry.
- [ ] Step 8.3: Activate Co-owner access after invited email signs in.
- [ ] Step 8.4: Implement Host-managed `can_edit`.
- [ ] Step 8.5: Implement access revocation while preserving audit logs.
- [ ] Step 8.6: Implement tenant contact visibility setting.
- [ ] Step 8.7: Implement private attachment visibility for Host-only files.

## Deferred Scope

- [ ] AI assistant.
- [ ] React Native mobile app.
- [ ] Push notifications.
- [ ] Google Calendar integration.
- [ ] WhatsApp reminder links.
- [ ] Tenant portal.
- [ ] LHDN report.
- [ ] Billing/subscriptions.
- [ ] Data import.
- [ ] CSV exports.
