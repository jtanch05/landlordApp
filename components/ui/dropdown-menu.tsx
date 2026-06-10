import * as React from "react";

import { cn } from "@/lib/utils/cn";

function DropdownMenu({ className, ...props }: React.ComponentProps<"details">) {
  return <details className={cn("relative", className)} {...props} />;
}

function DropdownMenuTrigger({
  className,
  ...props
}: React.ComponentProps<"summary">) {
  return (
    <summary
      className={cn("cursor-pointer list-none rounded-lg outline-none", className)}
      {...props}
    />
  );
}

function DropdownMenuContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "absolute right-0 z-20 mt-2 min-w-40 rounded-xl border border-border bg-card p-2 shadow-lg",
        className,
      )}
      {...props}
    />
  );
}

export { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger };
