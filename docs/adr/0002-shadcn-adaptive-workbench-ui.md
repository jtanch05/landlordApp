# Shadcn adaptive workbench UI

PropTrack will use shadcn primitives as the component base for the authenticated web app. We chose this over continuing ad hoc Tailwind-only components because the app is now broad enough to need consistent buttons, cards, forms, tabs, tables, dialogs, sheets, tooltips, avatars, dropdown menus, separators, scroll areas, and skeleton states.

The authenticated app shell will use an adaptive floating workbench rather than one fixed three-panel layout on every route. Dashboard, Vendors, Reports, Activity, and Settings can use a full content canvas when a middle context panel would add friction. Properties will use the full workbench pattern: icon rail, property list panel, and property workspace panel with tabs.

The visual palette will shift from the earlier Wise-inspired green-first direction to a Claude-inspired warm neutral direction: `#F4F3EE` canvas, `#FFFFFF` surfaces, `#C15F3C` primary actions, and `#B1ADA1` muted borders/icons. Green remains available for semantic success or paid states, not primary brand action.
