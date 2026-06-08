# PropTrack Product And Engineering Plan

This file records the planning decisions made during product grilling. Keep it updated before implementation so future design and coding work is grounded in the same assumptions.

## Current Direction

PropTrack will start as a web-first property management SaaS for individual Malaysian landlords, with future support for a dedicated React Native mobile app.

The first version should prove the core property management workflow before AI, push notifications, and deeper mobile integrations are added.

## Target User

- Primary v1 user: individual Malaysian landlord managing 1-10 properties.
- Product is personal-first, but must support future shared access for co-owners or managers.

## Platform Strategy

- Build the web app first.
- Web app has its own codebase.
- Mobile app will be built later with React Native, not by simply wrapping the web app.
- Backend/API/database should be designed so React Native can reuse the same product logic and data access later.

## V1 Technical Direction

- Web framework: full-stack Next.js.
- Hosting: Vercel.
- Backend style: Next.js server actions/API routes inside the same app.
- Database/auth: Supabase with Postgres.
- Auth methods for v1: Google sign-in and email magic link.
- Secrets and privileged operations should run server-side, not directly in browser code.

## Ownership And Access Model

- Use portfolio-based ownership, not direct user-owned records only.
- A user can have multiple portfolios.
- A default portfolio is created automatically during onboarding.
- Each property belongs to exactly one portfolio.
- Business records belong to a portfolio and, where relevant, a property.

### Sharing

- Co-owner/shared access is required.
- Design for configurable access.
- V1 implements property-level invited access.
- Host can invite users and change access later.
- Tenants are records only in v1, but database design should not block a future tenant portal.

### V1 Roles

V1 uses a simplified role model:

- Host.
- Co-owner.

Host:

- Owns the portfolio.
- Can create, edit, and archive records.
- Can invite and remove co-owners.
- Can change co-owner access.
- Can see all financials and reports.
- Can configure co-owner split percentages.

Co-owner:

- Can access only shared properties.
- Can see property financials, reports, rent, expenses, maintenance, deposits, and attachments for shared properties.
- Cannot delete/archive a property.
- Cannot invite users.
- Cannot change ownership or split percentages.
- Can be view-only or editable, controlled by a simple Host-managed `can_edit` setting.

If `can_edit` is enabled, the Co-owner can edit shared-property operational records, but still cannot change ownership, invitations, split percentages, or destructive owner-level settings.

If co-owner share calculation is enabled for a property, each included co-owner must have a split percentage and the app should validate the total split.

### Invitations

- Property sharing happens through email invitation.
- Invitations are tied to the invited email address.
- If the invited co-owner does not have an account yet, they sign up or sign in with the invited email before access is activated.
- Invitations expire after 14 days.
- Host can revoke Co-owner access.
- Revoking access removes future access but keeps historical audit logs and action attribution.

### Co-owner Experience

- Co-owner uses the same dashboard, filtered to properties they can access.
- Co-owner can download reports for shared properties.
- Co-owner can see financial data and co-owner share calculations for shared properties.
- Co-owner can upload attachments when `can_edit` is enabled.
- Activity feed should show actor name and role.
- Host can configure whether Co-owner can see tenant contact info.
- Host can mark attachments as private so sensitive documents are visible only to Host.

## Offline And Mobile Considerations

- V1 web app does not need full offline editing.
- Offline expectation for v1: view last-loaded/cached data only, where practical.
- Push notifications, native calendar integration, and on-the-go mobile workflows belong to the later React Native app.
- Web v1 should still model reminders/alerts in the backend so mobile can reuse them later.

## V1 Product Scope

V1 includes:

- Guided onboarding.
- Properties.
- Tenants.
- Agreements.
- Auto-generated rent records.
- Rent ledger.
- Custom accounting expense categories.
- Expenses.
- Maintenance.
- Vendors.
- Deposits.
- Advanced dashboard with charts, cash flow trends, category breakdowns, rent due, expenses, reminders, and portfolio summary.
- In-app reminders/timeline.
- Basic reports.
- Property-level invitations and access roles.
- Co-owner share/payout calculation in reports.
- File attachments for agreements, expenses, maintenance, and deposits.
- Simple recurring expenses.
- Simple tax-deductible tracking.
- Search and common filters on key modules.
- Lightweight shared-access collaboration.

V1 excludes:

- AI assistant.
- Push notifications.
- Google Calendar sync.
- WhatsApp reminder links.
- Full payout management with paid/pending tracking.
- LHDN report.
- Tenant portal.
- Native mobile app.
- Data import.
- Multi-currency support.
- Billing/subscription logic.

## Navigation And Information Architecture

V1 top-level navigation:

- Dashboard.
- Properties.
- Vendors.
- Reports.
- Activity.
- Settings.

The app should stay property-centric. Rent, expenses, maintenance, tenants, agreements, deposits, and files are primarily managed inside each property workspace rather than as separate top-level navigation items.

Property workspace tabs:

- Overview.
- Tenants.
- Agreements.
- Rent.
- Expenses.
- Maintenance.
- Deposits.
- Files.
- Activity or recent activity section.

Vendors are top-level because vendor contacts belong to the portfolio and can serve multiple properties.

Reports are top-level because users need portfolio-level and property-level reporting from one place.

Activity is top-level for portfolio-wide accountability, and property-specific activity should also be visible inside property workspaces.

Settings should include:

- Profile.
- Theme.
- Portfolio settings.
- Members and invitations.
- Expense categories.
- Defaults such as rent due day.

If Settings becomes crowded later, portfolio administration can be split into a separate Admin area.

## Onboarding

New user flow:

1. Sign in.
2. Auto-create default portfolio.
3. Add first property.
4. Add tenant, or skip if vacant.
5. Add agreement, or skip if no tenant yet.
6. If agreement is added, preview and generate rent records.
7. Land on dashboard.

Properties can be vacant. Vacant properties should show a vacant status and setup prompts.

V1 property statuses:

- Active.
- Vacant.
- Occupied.
- Archived.

Under-maintenance state should be derived from maintenance records instead of stored as a manual property status.

## Dashboard

V1 should include an advanced dashboard.

Dashboard scope:

- Portfolio summary.
- Rent due and overdue.
- Expense summary.
- In-app reminders.
- Cash-flow trend charts.
- Expense category breakdowns.
- Property-level summary cards.

## Destructive Actions And Auditability

- V1 should use soft delete/archive for destructive actions instead of hard delete.
- Archived records should be hidden from normal views by default.
- Host-level users should be able to review archived records.
- Permanent deletion can be deferred or restricted to later administrative flows.
- V1 should include a basic audit log for create, update, and archive actions.
- Invited users can create, update, or archive records only according to their role.
- Invited-user actions should be recorded in the audit log.
- Audit log records should be retained indefinitely unless the owning portfolio is deleted.
- Field-level diff tracking is deferred.

## Collaboration

- Collaboration should be lightweight in v1.
- Realtime collaboration is not required.
- Normal refetch-after-write behavior is enough.
- The app should include an in-app activity feed based on audit events.
- V1 should support both portfolio-level and property-level activity views.
- Portfolio-level activity is for Host-level visibility.
- Property-level activity is for users with access to specific properties.
- Host email notifications for invited-user edits are deferred.
- Approval workflows for every invited-user edit are deferred.

## Reminders And Timeline

- V1 should use both computed reminder logic and stored generated reminder records.
- Source records remain the source of truth.
- Stored reminder records support timeline display, dismissal state, and future mobile push/calendar integrations.
- Users can dismiss reminders in v1.
- Snooze is deferred.
- Reminder storage should have retention rules to control database growth.
- Recommended retention: keep unresolved future/current reminders, keep resolved or dismissed reminder records for 12 months, then archive or purge them.
- Reminder records should be regenerated or reconciled from source records when relevant source data changes.

## Archived Records In Reports

- Archived records are hidden from normal views by default.
- Reports should include archived historical financial records where needed for accurate statements.
- Reports should exclude archived operational records by default.
- Report behavior can become configurable later.

## Agreement And Rent Workflow

When an agreement is created:

1. User fills agreement details.
2. App calculates end date for fixed-term agreements.
3. App previews monthly rent schedule.
4. User confirms.
5. Backend creates agreement.
6. Backend creates all monthly rent records for the full agreement term.
7. Backend creates in-app reminders.

Agreement edits:

- Never silently change paid or partial historical rent records.
- Show preview before rent schedule changes.
- Default option: update future unpaid rent records only.
- User may choose to leave rent records unchanged.

Manual rent records:

- Allowed only when the property has no active agreement.
- Only Host or editable Co-owner can add manual rent records.

Agreement documents:

- Uploaded agreement documents are not required in v1.
- The app can show missing-document prompts instead of blocking agreement creation.

Rent due dates:

- Portfolio should have a default rent due day.
- Agreements can override the portfolio default due day.
- Rent records derive due dates from the relevant agreement/default.

Rent payments:

- V1 supports partial rent with a single `amount_paid` field and calculated status.
- V1 does not support multiple payment entries per rent record.
- Rent records should track a simple payment method field.
- Payment reference numbers can be stored in notes for v1.
- Rent records should support notes.

Agreement history:

- Agreement edit history should be visible as simple activity history on the agreement page.
- Full version history and restore are deferred.

## Expenses And Categories

- V1 supports full custom accounting categories.
- Expense categories are managed per portfolio.
- Each portfolio starts with built-in starter categories.
- Users can add, rename, and archive categories.
- Expenses always belong to one category.
- Categories can optionally have default tax-deductible behavior.
- Expenses should support a simple `tax_deductible` flag.
- Category defaults can prefill the expense tax-deductible value, but users can override per expense.
- Expenses should support paid/unpaid status.
- Partial expense payments and full payable workflows are deferred.
- LHDN mapping can wait until a later version.
- Expense categories can be archived even if already used.
- Archived categories should remain linked to historical expenses but disappear from new expense forms by default.

Starter categories to consider:

- Assessment Tax
- Quit Rent
- TNB / Electricity
- Water
- Sewage
- Internet
- Insurance
- Management Fee
- Sinking Fund
- Maintenance / Repairs
- Cleaning
- Agent Fee
- Other

## Currency

- V1 supports Malaysian Ringgit only.
- Currency should still be represented cleanly in the data model so future multi-currency support is possible.

## Attachments

V1 supports file attachments for:

- Agreements.
- Expenses.
- Maintenance.
- Deposits.

Typical attachment examples:

- Tenancy agreement PDFs.
- Receipts and invoices.
- Maintenance photos.
- Deposit proof.

Attachments for every record type are deferred.

Attachment storage:

- Use Supabase Storage for file bytes.
- Store attachment metadata in Postgres.
- Attachment records should link files to the owning portfolio and target record.
- Attachment permissions should follow the target record and property access rules.

## Import

- V1 does not include CSV or spreadsheet import.
- Guided manual setup is the v1 path.
- Import tooling can be added after the schema and validation rules stabilize.

## Search And Filters

- V1 should support search plus common filters on key modules.
- Global cross-record search is deferred.
- Properties should be searchable by nickname, state, and type.
- Tenants should be searchable by name, phone, and email.
- Rent records should filter by property, status, month, and tenant where relevant.
- Expenses should filter by property, category, paid status, and date range.
- Maintenance should filter by property, status, issue type, vendor, and date range.

## Custom Fields

- V1 does not support arbitrary custom fields.
- Records should include practical notes fields where useful.
- Property-level notes are included.
- Custom key-value fields can be added later if real usage demands them.

## Recurring Expenses

- V1 supports simple recurring expenses such as monthly management fee, sinking fund, internet, or similar predictable costs.
- Custom recurrence schedules are deferred.
- The app should not silently create due recurring expense records.
- When recurring expenses are due, the app should prompt the user to confirm creation of the expense record.
- Confirmed recurring expense records should start as unpaid unless the user marks them paid.

## Maintenance And Vendors

- Maintenance is its own module, not just an expense category.
- Maintenance issues track operational status.
- Maintenance costs should automatically create or update a linked expense record.
- Linked maintenance expenses should flow into expenses, cash-flow reporting, and property statements.
- The UI should clearly show the relationship between the maintenance issue and linked expense so users do not double-enter the same cost.
- Linked maintenance expenses should be edited from the maintenance record, not directly from the expense page.
- The expense page should link back to the maintenance issue for edits.
- Vendors are included in v1.

V1 vendor fields:

- Name
- Service type
- Phone
- Email optional
- Notes
- Rating optional
- Last used date optional

## Deposits

- Deposits are tied to agreements.
- V1 deposit refund support is simple status tracking only.
- V1 deposit statuses should include `held` and `refunded`.
- Partial refunds, forfeitures, deduction notes, and detailed refund accounting are deferred.

## Reports

V1 reports:

- Rent ledger export.
- Expenses export.
- Basic property statement.

- V1 report export format: PDF only.
- CSV exports are deferred.

LHDN allowable deduction report is deferred, but the data model should preserve tax-deductible fields and category structure so it can be added later.

## Co-owner Share Calculation

V1 calculates co-owner shares in reports but does not create payout records.

Co-owner share calculations are financial data:

- Visible to Host.
- Visible to Co-owner for shared properties.
- Split percentage is required only if payout/share calculation is enabled for that property.

Formula:

```text
net_cash_flow = rent_collected - expenses - maintenance_costs

if net_cash_flow > 0:
  co_owner_share = net_cash_flow * split_percent / 100
else:
  co_owner_share = 0
  report shows property loss separately
```

## AI Direction

AI is deferred until after the v1 foundation.

When added, AI should follow the AI feature spec:

- Read-only summaries do not require confirmation.
- Draft creation requires confirmation before writes.
- Updates, financial changes, external actions, and batch operations require explicit confirmation.
- AI must not delete data, invent financial records, expose tokens, or replace deterministic business rules.

## Billing

- Billing and subscription logic are deferred until after private beta or product validation.
- The architecture should not block future plan limits or Stripe integration, but v1 should not implement billing gates.

## Open Decisions

- Initial database schema.
- Initial implementation milestones.
