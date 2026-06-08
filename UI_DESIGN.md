# PropTrack UI Design Direction

PropTrack should use a Wise-inspired product UI direction without copying Wise branding. The goal is a calm, high-trust, financial operations interface for landlords.

Reference inspiration:

- Wise Platform uses a more neutral palette with restrained text and subtle secondary colour pops.
- Wise product colour guidance uses white as the dominant screen colour, warm neutral surfaces, near-black content, forest green for interaction, and bright green sparingly as an accent.

## Design Personality

- Clear.
- Trustworthy.
- Financially precise.
- Calm under repeated daily use.
- Modern but not decorative.
- Friendly enough for individual landlords, structured enough for financial records.

Avoid:

- Marketing-heavy hero layouts inside the app.
- Decorative gradients, orbs, or bokeh backgrounds.
- Overly colorful dashboards.
- Dark finance-app styling for v1.
- Card-heavy pages where every section becomes a floating panel.

## Colour System

Use a Wise-inspired green and neutral system adapted for PropTrack.

### Core Tokens

```text
--pt-bg-screen: #ffffff;
--pt-bg-neutral: rgba(22, 51, 0, 0.08);
--pt-bg-elevated: #ffffff;

--pt-content-primary: #0e0f0c;
--pt-content-secondary: #454745;
--pt-content-tertiary: #6a6c6a;

--pt-border-neutral: rgba(14, 15, 12, 0.12);

--pt-green-forest: #163300;
--pt-green-bright: #9fe870;
```

### Semantic Tokens

```text
--pt-action-primary-bg: #9fe870;
--pt-action-primary-fg: #163300;
--pt-action-secondary-bg: rgba(22, 51, 0, 0.08);
--pt-action-secondary-fg: #163300;

--pt-link: #163300;
--pt-focus-ring: #9fe870;

--pt-status-paid-bg: #dff8d2;
--pt-status-paid-fg: #163300;
--pt-status-unpaid-bg: #fff3c4;
--pt-status-unpaid-fg: #3a341c;
--pt-status-overdue-bg: #ffe1dc;
--pt-status-overdue-fg: #320707;
--pt-status-open-bg: #dff3f3;
--pt-status-open-fg: #123536;
```

### Colour Proportions

- White should dominate app screens.
- Warm neutral surfaces should separate areas without heavy borders.
- Content greys should carry hierarchy.
- Forest green should mark active navigation, links, and key controls.
- Bright green should be used sparingly for primary actions and important highlights.
- Secondary colours should stay contained in badges, icons, and small chart marks.

## Typography

Use an Inter-like system font stack for the whole product.

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Typography rules:

- Use compact, clear headings.
- Avoid oversized marketing headlines inside authenticated app pages.
- Tables, forms, and dashboards should prioritize scan speed.
- Keep letter spacing at normal.
- Do not scale font size with viewport width.

Recommended scale:

```text
Page title: 28-32px, semibold
Section title: 18-22px, semibold
Card/table title: 15-16px, semibold
Body: 14-16px
Metadata: 12-13px
```

## Shape And Spacing

Use restrained rounded corners.

```text
Small controls: 6px radius
Inputs: 8px radius
Panels/cards: 8px radius
Primary pill buttons: 999px radius only where appropriate
```

Spacing:

- Use dense but breathable layouts.
- Prefer 16px and 24px section spacing.
- Avoid large empty marketing whitespace inside operational screens.
- Use tables/lists for repeated records instead of oversized cards.

## Layout System

Top-level navigation:

- Dashboard.
- Properties.
- Vendors.
- Reports.
- Activity.
- Settings.

Authenticated app layout:

- Desktop: left sidebar navigation with content area.
- Mobile: top bar plus compact navigation/menu.
- Maximum content width for normal pages: around 1280px.
- Property workspace should use tabs for property-specific modules.

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

## Component Patterns

### Buttons

Primary action:

- Bright green background.
- Forest green text.
- Pill or 8px radius depending on context.
- Used for one primary action per section.

Secondary action:

- Neutral background or bordered.
- Forest green or primary content text.

Danger action:

- Avoid loud red until confirmation state.
- Use clear destructive copy and confirmation.

### Forms

- Labels above inputs.
- Required fields visible.
- Optional fields marked subtly.
- Use inline validation messages.
- Financial fields should display RM clearly.
- Multi-step financial workflows must show preview before save when generated records are affected.

### Tables And Lists

Use tables for:

- Rent ledger.
- Expenses.
- Vendors.
- Activity.
- Reports list.

Use compact record cards for:

- Mobile list views.
- Dashboard summaries.
- Property overview modules.

Table rules:

- Sticky or clear column headers where useful.
- Status badges for paid/unpaid/overdue/open/closed.
- Row actions in a compact menu.
- Click row to open detail where appropriate.

### Status Badges

Badges should be small and high-signal:

- Paid.
- Unpaid.
- Partial.
- Overdue.
- Open.
- Closed.
- Vacant.
- Occupied.
- Archived.

### Empty States

Empty states should be practical, not promotional.

Example:

```text
No rent records yet
Create an agreement to generate the rent schedule for this property.
```

Each empty state should include the next useful action when allowed by permissions.

## Dashboard Design

Dashboard should be advanced but not noisy.

Sections:

- Portfolio summary strip.
- Rent due and overdue.
- Cash-flow trend.
- Expense category breakdown.
- Reminders.
- Property summary cards.

Dashboard visual rules:

- Use a clean grid.
- Keep charts compact.
- Use green for positive/action states.
- Use warm warning colours only for unpaid/overdue states.
- Do not overuse bright green in charts.

## Property Workspace Design

Property workspace header:

- Property nickname.
- Property status.
- Key metadata.
- Primary action menu.

Overview tab:

- Current tenant/agreement summary.
- Rent status.
- Upcoming reminders.
- Recent activity.
- Financial summary.

Module tabs:

- Use focused tables/forms.
- Keep generated workflows explicit, especially agreement-to-rent generation.

## Reports Design

Reports are PDF-only in v1.

On-screen report pages should:

- Show available report types.
- Let user select portfolio/property/date range.
- Explain what the PDF includes.
- Show generation state.

PDF styling should be conservative:

- White background.
- Strong headings.
- Clear tables.
- RM formatting.
- Minimal accent green.
- No decorative brand-heavy graphics.

## Permissions UI

Co-owner sharing UI should be simple:

- Invite by email.
- Select property.
- Toggle editable access.
- Toggle tenant contact visibility.
- Show invitation status and expiry.
- Show revoke action with confirmation.

Avoid complex role matrices in v1.

## Attachments UI

Attachments should show:

- File name.
- File type.
- Linked record.
- Uploaded by.
- Uploaded date.
- Private flag.

Private attachment copy:

```text
Private to Host
```

## Accessibility

- Maintain accessible contrast.
- Do not rely only on colour for financial status.
- Every input must have a label.
- Focus states must be visible.
- Buttons must have clear text or accessible labels.
- Tables need clear headers.

## Implementation Notes

- Tailwind can map these colours as custom theme tokens.
- Prefer reusable UI primitives for buttons, inputs, badges, panels, tabs, and tables.
- Use lucide icons when icon buttons are needed.
- Avoid implementing a full design system before the first screens exist; build primitives as screens require them.
