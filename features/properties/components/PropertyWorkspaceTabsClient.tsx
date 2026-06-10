"use client";

import type { ReactElement, ReactNode } from "react";
import { Children, isValidElement, useMemo, useState } from "react";

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
      <div className="shrink-0 border-b border-border px-5 py-2">
        <nav
          aria-label="Property workspace modules"
          className="flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-muted/65 p-1"
          role="tablist"
        >
          {propertyWorkspaceTabs.map((tab) => {
            const isActive = tab.id === activeTab;

            return (
              <button
                aria-controls={`property-tab-${tab.id}`}
                aria-selected={isActive}
                className={cn(
                  "inline-flex h-7 shrink-0 items-center justify-center rounded-md px-3 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground",
                  isActive && "bg-card text-foreground shadow-sm",
                )}
                id={`property-tab-trigger-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5 lg:p-7">
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
