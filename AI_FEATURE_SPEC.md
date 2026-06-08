# PropTrack AI Feature Specification

Source basis: `FUNCTION_SPEC.md` and `FEATURE_EXTRACTION.md`.

This document defines how LLM assistance should be added to PropTrack. It focuses on useful product capabilities, data access, structured outputs, confirmation rules, and safety boundaries.

## 1. AI Product Positioning

The AI feature should behave as a property management copilot, not a generic chatbot.

Primary job:

```text
Help users understand, create, update, summarize, and act on property management records.
```

The AI should be grounded in PropTrack data:

- Properties
- Tenants
- Agreements
- Rent records
- Expenses
- Maintenance
- Vendors
- Deposits
- Payouts
- Alerts
- Reports

## 2. AI Feature Tiers

### Tier 1: Ask PropTrack

Read-only assistant for questions, summaries, and explanations.

Examples:

- Which tenants are overdue?
- Which properties need attention?
- Summarize this month's cash flow.
- What expenses are tax deductible this year?
- Which agreements expire soon?

Risk level: low.

Default system action: read only.

### Tier 2: Smart Data Entry

Parse natural language into structured record drafts.

Examples:

- Paid RM320 for TNB at Condo A today.
- New tenant John Tan moved into Melati A-12-3 on 1 June.
- Create a one-year agreement from 1 July at RM1800.
- Tenant reported leaking toilet, plumber quoted RM180.

Risk level: medium.

Default system action: create draft only.

Execution rule: user must confirm before writing data.

### Tier 3: Message Assistant

Generate messages for tenants, vendors, owners, and self-reminders.

Examples:

- Write a polite rent reminder.
- Write a stronger overdue payment follow-up.
- Ask vendor to arrange repair.
- Summarize maintenance status for co-owner.

Risk level: medium.

Default system action: generate message draft only.

Execution rule: user must confirm before opening/sending through external channel.

### Tier 4: Data Quality Checker

Detect missing records, inconsistent relationships, and unusual values.

Examples:

- Agreement has rent amount but no rent records.
- Property has active tenant but no active agreement.
- Rent is marked paid but amountPaid is zero.
- Deposit field mismatch.
- Insurance has no expiry date.

Risk level: low to medium.

Default system action: report findings and suggest fixes.

Execution rule: fixes require confirmation.

### Tier 5: Workflow Copilot

Suggest next actions and optionally prepare batch operations.

Examples:

- Generate missing rent records for this agreement.
- Mark selected rent as paid and generate payouts.
- Link this maintenance cost as rent deduction.
- Create calendar reminders for high-priority alerts.

Risk level: high.

Default system action: prepare plan and structured operations.

Execution rule: explicit confirmation required before each write or external action.

## 3. Recommended MVP

Start with these four capabilities:

1. Ask PropTrack
2. Smart Expense Entry
3. Rent Reminder Message Assistant
4. Data Quality Checker

Reason:

- They use existing data and workflows.
- They produce immediate value.
- They can be built with strict confirmation rules.
- They avoid silent destructive or financial actions.

## 4. Non-goals For First Version

The AI should not initially:

- Delete records.
- Send WhatsApp messages automatically.
- Mark rent as paid without confirmation.
- Create or update Google Calendar events without confirmation.
- Give legal advice.
- Give tax advice beyond summarizing user-marked deductible data.
- Invent missing financial data.
- Execute multi-record financial changes silently.
- Replace deterministic business rules.

The AI may suggest actions, but deterministic application logic must execute the final business operation.

## 5. AI Interaction Modes

### Mode A: Ask

User asks a question.

AI reads relevant data and returns:

- Answer summary.
- Supporting records.
- Suggested next actions.
- Limitations or assumptions.

No writes.

### Mode B: Draft

User describes a record or message.

AI returns:

- Parsed structured draft.
- Missing required fields.
- Confidence.
- Suggested confirmation prompt.

No writes until confirmed.

### Mode C: Review

User asks AI to check records.

AI returns:

- Findings.
- Severity.
- Affected entity.
- Why it matters.
- Suggested fix.

No writes until confirmed.

### Mode D: Assist Action

User asks AI to perform a workflow.

AI returns:

- Planned operations.
- Records affected.
- Business rule explanation.
- Required confirmation.

System executes only confirmed operations.

## 6. Data Access Model

### Read Scope

The AI should only access the current authenticated user's data.

Supported read datasets:

- Properties
- Tenants
- Agreements
- Rent records
- Tax records
- Utility records
- Insurance records
- Maintenance records
- Vendors
- Management fees
- Deposits
- Payouts
- Settings
- Computed alerts

### Data Minimization

Only send relevant records to the LLM.

Examples:

- For overdue rent question, send rent records where `status != paid`, plus linked tenant/property names.
- For expense categorization, send property names and expense type options.
- For agreement generation, send selected property and tenant candidates, not all expenses.

### Sensitive Data

Potentially sensitive fields:

- Tenant phone.
- Tenant email.
- Owner/co-owner names.
- Financial amounts.
- Google Calendar tokens.

Never send Google OAuth tokens to the LLM.

## 7. Write Safety Model

### Read-only Actions

No confirmation required:

- Summaries.
- Explanations.
- Calculations.
- Data quality findings.
- Suggested next actions.

### Draft-only Actions

Confirmation required before write:

- Create property.
- Create tenant.
- Create agreement.
- Create rent record.
- Create expense.
- Create maintenance record.
- Create vendor.
- Create deposit.
- Create payout.

### Update Actions

Confirmation required:

- Mark rent paid.
- Mark expense paid.
- Mark maintenance resolved.
- Refund deposit.
- Mark payout paid.
- Edit any financial amount.
- Link maintenance deduction.

### External Actions

Confirmation required:

- Open WhatsApp with generated message.
- Create/update Google Calendar event.
- Export generated report if it includes AI-written narrative.

### Destructive Actions

AI must not directly execute:

- Delete record.
- Clear all data.
- Disconnect integrations.

AI may explain how to do these manually or produce a proposed deletion list for review.

## 8. Structured Output Requirements

The AI should return structured JSON for any draft or operation.

### Generic Response Shape

```json
{
  "mode": "ask|draft|review|assist_action",
  "summary": "Short user-facing answer",
  "confidence": "low|medium|high",
  "requiresConfirmation": false,
  "recordsReferenced": [],
  "drafts": [],
  "operations": [],
  "warnings": [],
  "missingFields": [],
  "suggestedNextActions": []
}
```

### Operation Shape

```json
{
  "operationId": "client-generated-id",
  "type": "create|update|delete|external",
  "entity": "property|tenant|agreement|rentRecord|expense|maintenance|vendor|deposit|payout|message|calendarEvent",
  "risk": "low|medium|high",
  "description": "Human-readable operation summary",
  "payload": {},
  "requiresConfirmation": true
}
```

### Finding Shape

```json
{
  "findingId": "client-generated-id",
  "severity": "info|warning|danger",
  "entity": "agreement|rentRecord|expense|maintenance|property|tenant|deposit|payout",
  "entityId": "record-id",
  "title": "Missing rent records",
  "description": "Agreement has rentAmount and active date range but no linked rent records.",
  "suggestedFix": "Generate missing monthly rent records."
}
```

## 9. AI Use Cases

### Use Case 1: Ask Overdue Rent

User:

```text
Which tenants are overdue?
```

Input data:

- Rent records where `status != paid`.
- Linked tenants.
- Linked properties.
- Current date.

AI output:

- List overdue rent records.
- Tenant name.
- Property nickname.
- Month.
- Amount due.
- Amount paid.
- Balance.
- Days overdue.
- Suggested follow-up.

System action:

- None.

Risk:

- Low.

### Use Case 2: Monthly Cash Flow Summary

User:

```text
Summarize this month's cash flow.
```

Input data:

- Rent records for selected month.
- Expenses for selected month.
- Maintenance costs.
- Management fees.
- Insurance/tax/utility records.

AI output:

- Income.
- Expenses.
- Net.
- Top expense categories.
- Unusual items.
- Action items.

System action:

- None.

Risk:

- Low.

### Use Case 3: Smart Expense Entry

User:

```text
Paid RM320 TNB bill for Melati Condo today.
```

Input data:

- Property names.
- Expense category options.
- Current date.

AI draft:

```json
{
  "entity": "expense",
  "category": "utility",
  "collection": "utilityRecords",
  "propertyId": "matched-property-id",
  "amount": 320,
  "type": "tnb",
  "date": "today",
  "status": "paid",
  "taxDeductible": null,
  "notes": "TNB bill"
}
```

System action:

- Show draft form.
- User confirms save.

Risk:

- Medium.

### Use Case 4: Smart Agreement Entry

User:

```text
Create a one year agreement for John at Condo A from 1 July 2026, rent RM1800.
```

Input data:

- Properties.
- Tenants.
- Agreement type options.
- Existing agreements.

AI draft:

- Property match.
- Tenant match.
- Start date.
- End date.
- Rent amount.
- Notice period default.
- Renewal option default.
- Rent records to be generated.

System action:

- Show agreement draft.
- Explain generated rent records.
- User confirms.
- Deterministic app logic creates agreement and rent records.

Risk:

- High, because it creates financial schedule.

### Use Case 5: Maintenance Triage

User:

```text
Tenant says toilet leaking since yesterday, plumber quoted RM180.
```

Input data:

- Properties and tenants if context missing.
- Maintenance type options.
- Vendor list.

AI draft:

- Issue type: plumbing.
- Description.
- Reported date.
- Cost: 180.
- Status: open.
- Suggested vendor if known.

System action:

- Show maintenance draft.
- User confirms.

Risk:

- Medium.

### Use Case 6: Rent Reminder Message

User:

```text
Write a reminder for this overdue rent.
```

Input data:

- Tenant name.
- Tenant phone if needed for WhatsApp URL, not for text generation unless necessary.
- Property nickname.
- Rent month.
- Amount due.
- Amount paid.
- Days overdue.

AI output:

- Message tone options:
  - Friendly.
  - Firm.
  - Final notice style.
- Recommended message.

System action:

- User selects or edits.
- User confirms opening WhatsApp.

Risk:

- Medium.

### Use Case 7: Data Quality Check

User:

```text
Check my records for problems.
```

Input data:

- All core records, possibly summarized if large.

Findings:

- Missing relationships.
- Missing rent records.
- Financial inconsistencies.
- Expired agreements still linked to active tenants.
- Paid rent with missing payment date.
- Deposit field mismatch.
- Maintenance open too long.

System action:

- Show findings.
- Offer fixes as drafts.

Risk:

- Low for detection, medium for fixes.

## 10. Business Logic The AI Must Not Reimplement Blindly

The app should keep these as deterministic functions:

- Agreement end date calculation.
- Monthly rent record generation.
- Rent status calculation.
- Net collectible calculation.
- Payout generation.
- Alert computation.
- LHDN grouping.
- PDF export data assembly.
- Calendar event creation.

AI may explain or trigger these workflows, but the final calculation should be performed by trusted application code.

## 11. Retrieval And Context Strategy

### Small Dataset

If user has limited records, the app can send relevant full records.

### Growing Dataset

For larger datasets, retrieve only relevant slices:

- Date range filters.
- Property filters.
- Status filters.
- Search by entity name.
- Precomputed summaries.

### Recommended Context Objects

For LLM input, use simplified objects:

```json
{
  "properties": [{ "id": "p1", "nickname": "Condo A", "type": "condo" }],
  "tenants": [{ "id": "t1", "propertyId": "p1", "name": "John", "status": "active" }],
  "rentRecords": [{ "id": "r1", "propertyId": "p1", "tenantId": "t1", "month": "2026-06", "amountDue": 1800, "amountPaid": 0, "status": "unpaid" }]
}
```

Avoid sending full raw Firestore documents when a smaller projection is enough.

## 12. Tool / Function Design

The LLM should interact through backend-defined tools rather than directly writing Firestore.

### Read Tools

- `searchProperties(query)`
- `getPropertyContext(propertyId)`
- `getOverdueRent(filters)`
- `getCashFlowSummary(range, propertyId?)`
- `getExpenseSummary(range, propertyId?)`
- `getAlerts(filters)`
- `runDataQualityCheck(scope)`

### Draft Tools

- `draftProperty(input)`
- `draftTenant(input)`
- `draftAgreement(input)`
- `draftRentRecord(input)`
- `draftExpense(input)`
- `draftMaintenance(input)`
- `draftVendor(input)`
- `draftMessage(input)`

### Confirmed Write Tools

These should only run after user confirmation:

- `createProperty(payload)`
- `createTenant(payload)`
- `createAgreement(payload)`
- `createRentRecord(payload)`
- `createExpense(payload)`
- `createMaintenance(payload)`
- `createVendor(payload)`
- `updateRentStatus(payload)`
- `linkMaintenanceDeduction(payload)`
- `refundDeposit(payload)`
- `markPayoutPaid(payload)`

### External Tools

- `openWhatsAppDraft(message, phone?)`
- `createCalendarEventDraft(alertId)`
- `syncCalendarAlerts()`

External actions require confirmation.

## 13. Confirmation Rules

### Must Confirm

- Any create.
- Any update.
- Any delete.
- Any financial amount change.
- Any payment status change.
- Any external communication.
- Any calendar write.
- Any batch operation.

### Confirmation Copy Should Include

- What will change.
- Which records are affected.
- Financial amounts.
- Dates.
- Whether linked records will also be generated.
- Whether message/calendar action will be external.

Example:

```text
I will create a 1-year agreement for John Tan at Condo A from 2026-07-01 to 2027-06-30, rent RM1,800/month. This will generate 12 unpaid rent records. Confirm?
```

## 14. Risk Levels

### Low Risk

- Read-only summaries.
- Alert explanation.
- Report narrative.
- Data quality detection.

### Medium Risk

- Drafting records.
- Drafting messages.
- Categorizing expenses.
- Suggesting tax deductible status.

### High Risk

- Creating agreements.
- Generating rent records.
- Marking rent as paid.
- Generating payouts.
- Linking deductions.
- Calendar writes.
- Batch updates.

### Disallowed For AI Direct Execution

- Deleting records.
- Clearing all data.
- Disconnecting integrations.
- Sending messages without user action.
- Giving definitive legal or tax advice.

## 15. Prompting Principles

System prompt should emphasize:

- Use only provided data.
- Do not invent record IDs or financial amounts.
- Ask for missing required fields.
- Return structured JSON for drafts and operations.
- Explain assumptions.
- Do not execute writes.
- Treat legal/tax topics as informational only.
- Prefer deterministic app rules for calculations.

## 16. Example System Instructions

```text
You are PropTrack Copilot, an assistant for property management records.

Use only the data provided by the app.
Do not invent missing records, IDs, dates, or amounts.
For create/update/delete/external actions, produce a draft operation and require user confirmation.
Never delete data or send external messages directly.
For calculations, use provided summaries or deterministic app rules.
For tax/legal topics, provide general organization help, not professional advice.
Return structured JSON when drafting records or operations.
```

## 17. AI Output Examples

### Read-only Answer

```json
{
  "mode": "ask",
  "summary": "There are 2 overdue rent records totaling RM3,600.",
  "confidence": "high",
  "requiresConfirmation": false,
  "recordsReferenced": ["rent_1", "rent_2"],
  "suggestedNextActions": [
    "Send rent reminder to John Tan",
    "Review partial payment for Condo B"
  ]
}
```

### Draft Expense

```json
{
  "mode": "draft",
  "summary": "I found a utility expense for Condo A.",
  "confidence": "high",
  "requiresConfirmation": true,
  "drafts": [
    {
      "entity": "utilityRecord",
      "payload": {
        "propertyId": "property_123",
        "amount": 320,
        "type": "tnb",
        "date": "2026-06-08",
        "status": "paid",
        "taxDeductible": null,
        "notes": "TNB bill"
      }
    }
  ],
  "missingFields": []
}
```

### Data Quality Finding

```json
{
  "mode": "review",
  "summary": "I found 3 data quality issues.",
  "confidence": "medium",
  "requiresConfirmation": false,
  "findings": [
    {
      "findingId": "finding_1",
      "severity": "warning",
      "entity": "agreement",
      "entityId": "agreement_123",
      "title": "Missing rent records",
      "description": "This agreement has a rent amount and active date range, but no linked monthly rent records.",
      "suggestedFix": "Generate missing rent records."
    }
  ]
}
```

## 18. Evaluation Checklist

Before shipping an AI feature, test:

- It refuses or defers destructive actions.
- It does not write without confirmation.
- It handles ambiguous property or tenant names.
- It asks for missing required fields.
- It does not expose integration tokens.
- It does not invent financial amounts.
- It returns parseable structured output.
- It handles empty datasets.
- It works with multiple matching records.
- It explains confidence and assumptions.

## 19. Implementation Caveats

- LLM should not be the source of truth for calculations.
- Server should validate all proposed operations.
- Firestore security rules remain the final data access boundary.
- Client should display AI drafts in normal forms where possible.
- Batch operations need a preview screen.
- AI summaries should cite records by display name and ID internally.
- Audit trail is recommended for AI-assisted writes.

## 20. Suggested Build Order

1. Add read-only Ask PropTrack for overdue rent, alerts, and monthly summary.
2. Add message drafting for rent reminders and vendor messages.
3. Add smart expense draft creation.
4. Add maintenance draft creation.
5. Add data quality checker.
6. Add agreement draft creation with rent schedule preview.
7. Add confirmed workflow actions such as generate missing rent records.
