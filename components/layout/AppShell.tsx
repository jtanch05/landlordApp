import type { ReactNode } from "react";

import { NavRail } from "@/components/layout/NavRail";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground lg:h-screen lg:overflow-hidden">
      <NavRail />
      <main className="px-4 py-6 lg:h-full lg:overflow-hidden lg:py-5 lg:pl-28 lg:pr-4">
        {children}
      </main>
    </div>
  );
}
