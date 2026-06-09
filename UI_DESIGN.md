# PropTrack UI Design Direction

PropTrack should use a Claude-inspired warm operational UI direction without copying Claude branding. The goal is a calm, high-trust, financial operations interface for landlords with soft floating work surfaces and dense, practical content.

Reference inspiration:

- Claude-style warm neutrals: soft canvas, white elevated surfaces, near-black content, and rust/copper primary actions.
- The app reference uses a floating icon rail, rounded work surfaces, compact cards, and route-specific layouts rather than one rigid shell for every page.

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
- Marketing-style empty space that makes operational screens slow to scan.
- Copying deferred features from visual references, such as Google Calendar sync, theme switching, or destructive clear-all-data controls.

## Colour System

Use a Claude-inspired warm neutral system adapted for PropTrack.

### Core Tokens

```text
--pt-bg-screen: #f4f3ee;
--pt-bg-neutral: #f4f3ee;
--pt-bg-elevated: #ffffff;

--pt-content-primary: #1f1f1d;
--pt-content-secondary: #4d4a44;
--pt-content-tertiary: #7a756b;

--pt-border-neutral: rgba(177, 173, 161, 0.45);
--pt-muted: #b1ada1;

--pt-primary: #c15f3c;
--pt-primary-hover: #ad5334;
```

### Semantic Tokens

```text
--pt-action-primary-bg: #c15f3c;
--pt-action-primary-fg: #ffffff;
--pt-action-secondary-bg: #ffffff;
--pt-action-secondary-fg: #1f1f1d;

--pt-link: #c15f3c;
--pt-focus-ring: rgba(193, 95, 60, 0.35);

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
- Rust/copper should mark primary actions, active accents, and key chart marks.
- Green should be reserved for semantic paid/success states or explicit property-finance meaning, not primary brand action.
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

Use soft but restrained rounded corners.

```text
Small controls: 6px radius
Inputs: 8px radius
Inner cards and table containers: 8-12px radius
Floating shell surfaces: 16-20px radius
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

- Desktop: floating icon rail plus an adaptive workbench area.
- Mobile: compact navigation plus a sheet for contextual lists and filters.
- Maximum content width for normal pages: around 1440px when the route uses a full canvas.
- Property workspace should use tabs for property-specific modules.
- Do not force a middle panel on every route. Use route-specific layout:
  - Dashboard: icon rail plus full-width dashboard canvas.
  - Properties: icon rail, property list panel, and property workspace panel.
  - Vendors: icon rail plus full content canvas with search and vendor cards.
  - Reports: icon rail plus report selection and generation canvas.
  - Activity: icon rail plus filterable activity canvas.
  - Settings: icon rail plus centered settings sections.

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

- Rust/copper background.
- White text.
- Pill or 8px radius depending on context.
- Used for one primary action per section.

Secondary action:

- Neutral background or bordered.
- Primary content text or rust/copper text when the action is directional.

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
- Use rust/copper for brand/action marks.
- Use green for positive financial status only.
- Use warm warning colours only for unpaid/overdue states.
- Do not overuse the primary colour in charts.

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

- Use shadcn primitives as the component base, with PropTrack wrappers for app-specific styling consistency.
- Configure shadcn/Tailwind CSS variables around the Claude-inspired palette.
- Prefer reusable UI primitives for buttons, inputs, badges, panels, tabs, tables, dialogs, sheets, tooltips, avatars, dropdown menus, separators, scroll areas, and skeletons.
- Use lucide icons when icon buttons are needed.
- Keep v1 light-only. Theme switching is deferred unless product scope changes.
