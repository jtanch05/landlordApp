import * as React from "react";

import { cn } from "@/lib/utils/cn";

const selectChevron =
  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23B1ADA1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='m6 9 6 6 6-6'/%3e%3c/svg%3e\")";

function Select({ className, style, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "flex h-11 w-full appearance-none rounded-lg border border-input bg-card bg-no-repeat px-3 py-2 pr-10 text-sm font-medium text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={{
        backgroundImage: selectChevron,
        backgroundPosition: "right 0.875rem center",
        backgroundSize: "16px 16px",
        ...style,
      }}
      {...props}
    />
  );
}

export { Select };
