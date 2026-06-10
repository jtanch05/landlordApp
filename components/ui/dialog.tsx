import * as React from "react";

import { cn } from "@/lib/utils/cn";

function Dialog({ className, ...props }: React.ComponentProps<"dialog">) {
  return (
    <dialog
      className={cn("rounded-[18px] border border-border bg-card p-0 shadow-xl", className)}
      {...props}
    />
  );
}

export { Dialog };
