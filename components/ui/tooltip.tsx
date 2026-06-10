import * as React from "react";

type TooltipProps = React.ComponentProps<"span"> & {
  label: string;
};

function Tooltip({ children, label, ...props }: TooltipProps) {
  return (
    <span aria-label={label} title={label} {...props}>
      {children}
    </span>
  );
}

export { Tooltip };
