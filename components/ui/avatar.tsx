import * as React from "react";

import { cn } from "@/lib/utils/cn";

function Avatar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar };
