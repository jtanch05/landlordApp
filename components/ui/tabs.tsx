import Link from "next/link";

import { cn } from "@/lib/utils/cn";

type TabItem = {
  href: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  label: string;
};

function TabsList({ className, children }: React.ComponentProps<"nav">) {
  return (
    <nav
      className={cn(
        "flex items-center gap-5 overflow-x-auto border-b border-border px-6",
        className,
      )}
    >
      {children}
    </nav>
  );
}

function TabsLink({ href, icon, isActive, label }: TabItem) {
  return (
    <Link
      className={cn(
        "inline-flex h-12 shrink-0 items-center gap-2 border-b-2 border-transparent text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground",
        isActive && "border-foreground text-foreground",
      )}
      href={href}
    >
      {icon}
      {label}
    </Link>
  );
}

export { TabsLink, TabsList };
