export const propertyWorkspaceTabs = [
  { id: "overview", label: "Overview" },
  { id: "tenants", label: "Tenants" },
  { id: "agreements", label: "Agreements" },
  { id: "rent", label: "Ledger" },
  { id: "expenses", label: "Expenses" },
  { id: "maintenance", label: "Maintenance" },
  { id: "deposits", label: "Deposits" },
  { id: "files", label: "Files" },
  { id: "activity", label: "Activity" },
] as const;

export type PropertyWorkspaceTab = (typeof propertyWorkspaceTabs)[number]["id"];

const workspaceTabIds = new Set<string>(
  propertyWorkspaceTabs.map((tab) => tab.id),
);

export function normalizeWorkspaceTab(
  tab: string | string[] | undefined,
): PropertyWorkspaceTab {
  const value = Array.isArray(tab) ? tab[0] : tab;

  if (value && workspaceTabIds.has(value)) {
    return value as PropertyWorkspaceTab;
  }

  return "overview";
}
