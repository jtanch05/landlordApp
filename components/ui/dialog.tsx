import * as React from "react";

import { cn } from "@/lib/utils/cn";

const Dialog = React.forwardRef<
  HTMLDialogElement,
  React.ComponentProps<"dialog">
>(function Dialog({ className, ...props }, ref) {
  return (
    <dialog
      className={cn(
        "rounded-[18px] border border-border bg-card p-0 shadow-xl",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

export { Dialog };
