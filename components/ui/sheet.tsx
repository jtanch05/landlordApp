import * as React from "react";

import { cn } from "@/lib/utils/cn";

function Sheet({ className, ...props }: React.ComponentProps<"details">) {
  return <details className={cn("group", className)} {...props} />;
}

function SheetTrigger({ className, ...props }: React.ComponentProps<"summary">) {
  return (
    <summary className={cn("list-none cursor-pointer", className)} {...props} />
  );
}

function SheetContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "fixed inset-x-3 top-20 z-40 rounded-[18px] border border-border bg-card p-4 shadow-xl",
        className,
      )}
      {...props}
    />
  );
}

export { Sheet, SheetContent, SheetTrigger };
