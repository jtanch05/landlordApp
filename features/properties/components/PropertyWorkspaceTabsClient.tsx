"use client";

import type { ReactElement, ReactNode } from "react";
import { Children, isValidElement, useMemo, useState } from "react";
import {
  Activity,
  FileText,
  Home,
  ReceiptText,
  UsersRound,
  WalletCards,
  Wrench,
} from "lucide-react";

import {
  propertyWorkspaceTabs,
  type PropertyWorkspaceTab,
} from "@/features/properties/workspace-tabs";
import { cn } from "@/lib/utils/cn";

type PropertyWorkspaceTabsClientProps = {
  children: ReactNode;
  initialTab: PropertyWorkspaceTab;
};

type TabPanelElement = ReactElement<{
  "data-tab": PropertyWorkspaceTab;
}>;

function isTabPanelElement(child: ReactNode): child is TabPanelElement {
  return (
    isValidElement<{ "data-tab"?: PropertyWorkspaceTab }>(child) &&
    Boolean(child.props["data-tab"])
  );
}

const tabIcons = {
  activity: Activity,
  agreements: FileText,
  deposits: WalletCards,
  expenses: ReceiptText,
  files: FileText,
  maintenance: Wrench,
  overview: Home,
  rent: WalletCards,
  tenants: UsersRound,
};

export function PropertyWorkspaceTabsClient({
  children,
  initialTab,
}: PropertyWorkspaceTabsClientProps) {
  const [activeTab, setActiveTab] = useState<PropertyWorkspaceTab>(initialTab);
  const panels = useMemo(
    () => Children.toArray(children).filter(isTabPanelElement),
    [children],
  );
  const activePanel =
    panels.find((panel) => panel.props["data-tab"] === activeTab) ?? panels[0];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav
        aria-label="Property workspace modules"
        className="flex h-12 shrink-0 items-center gap-5 overflow-x-auto border-b border-border px-6"
        role="tablist"
      >
        {propertyWorkspaceTabs.map((tab) => {
          const Icon = tabIcons[tab.id];
          const isActive = tab.id === activeTab;

          return (
            <button
              aria-controls={`property-tab-${tab.id}`}
              aria-selected={isActive}
              className={cn(
                "inline-flex h-12 shrink-0 items-center gap-2 border-b-2 border-transparent text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground",
                isActive && "border-foreground text-foreground",
              )}
              id={`property-tab-trigger-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-9">
        {activePanel ? (
          <section
            aria-labelledby={`property-tab-trigger-${activeTab}`}
            className="min-h-full"
            id={`property-tab-${activeTab}`}
            role="tabpanel"
          >
            {activePanel}
          </section>
        ) : null}
      </div>
    </div>
  );
}
