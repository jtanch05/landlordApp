import type { ReactNode } from "react";

import { NavRail } from "@/components/layout/NavRail";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground lg:h-screen lg:overflow-hidden">
      <NavRail />
      <main className="px-4 py-5 lg:h-full lg:overflow-y-auto lg:overflow-x-hidden lg:py-3 lg:pl-[80px] lg:pr-4">
        {children}
      </main>
    </div>
  );
}
