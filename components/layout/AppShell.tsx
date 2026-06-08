import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/properties", label: "Properties" },
  { href: "/vendors", label: "Vendors" },
  { href: "/reports", label: "Reports" },
  { href: "/activity", label: "Activity" },
  { href: "/settings", label: "Settings" },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-white text-[#0e0f0c]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[rgba(14,15,12,0.12)] bg-white px-4 py-6 md:block">
        <div className="mb-8 text-lg font-semibold">PropTrack</div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              className="block rounded-md px-3 py-2 text-sm font-medium text-[#454745] hover:bg-[rgba(22,51,0,0.08)] hover:text-[#163300]"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="md:pl-64">
        <header className="border-b border-[rgba(14,15,12,0.12)] bg-white px-4 py-4 md:hidden">
          <div className="text-lg font-semibold">PropTrack</div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
