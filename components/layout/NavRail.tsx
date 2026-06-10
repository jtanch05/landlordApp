"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  Clock3,
  LayoutDashboard,
  Menu,
  Settings,
  UsersRound,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/properties", icon: Building2, label: "Properties" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/vendors", icon: UsersRound, label: "Vendors" },
  { href: "/activity", icon: Clock3, label: "Activity" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavRail() {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed left-4 top-1/2 z-30 hidden w-[56px] -translate-y-1/2 rounded-[20px] border border-border bg-card px-2 py-4 shadow-sm lg:block">
        <nav className="flex min-h-[400px] flex-col items-center gap-1.5">
          <Tooltip label="Menu">
            <button
              aria-label="Menu"
              className="mb-5 flex size-9 items-center justify-center rounded-xl text-muted-foreground"
              type="button"
            >
              <Menu className="size-[18px]" />
            </button>
          </Tooltip>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

            return (
              <Tooltip key={item.href} label={item.label}>
                <Link
                  aria-label={item.label}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                    active && "bg-accent text-foreground",
                  )}
                  href={item.href}
                >
                  <Icon className="size-[18px]" />
                </Link>
              </Tooltip>
            );
          })}

          <div className="mt-auto">
            <Avatar>J</Avatar>
          </div>
        </nav>
      </aside>

      <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <Link className="text-base font-semibold" href="/dashboard">
            PropTrack
          </Link>
          <Sheet>
            <SheetTrigger>
              <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-card">
                <Menu className="size-5" />
              </span>
            </SheetTrigger>
            <SheetContent>
              <nav className="grid gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item.href);

                  return (
                    <Link
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-muted-foreground",
                        active && "bg-accent text-foreground",
                      )}
                      href={item.href}
                      key={item.href}
                    >
                      <Icon className="size-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}
