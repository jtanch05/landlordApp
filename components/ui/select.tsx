"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type SelectOption = {
  disabled: boolean;
  label: string;
  value: string;
};

type SelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "children" | "onChange" | "size"
> & {
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
};

function optionText(children: React.ReactNode) {
  return React.Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }
      return "";
    })
    .join("")
    .trim();
}

function readOptions(children: React.ReactNode) {
  return React.Children.toArray(children)
    .filter(React.isValidElement)
    .map((child) => {
      const props = child.props as React.OptionHTMLAttributes<HTMLOptionElement>;
      const label = props.label ?? optionText(props.children);

      return {
        disabled: Boolean(props.disabled),
        label,
        value: String(props.value ?? label),
      };
    });
}

function Select({
  className,
  defaultValue,
  disabled,
  name,
  onValueChange,
  required,
  value,
  children,
}: SelectProps) {
  const options = readOptions(children);
  const initialValue =
    value?.toString() ??
    defaultValue?.toString() ??
    options.find((option) => !option.disabled)?.value ??
    "";
  const [selectedValue, setSelectedValue] = React.useState(initialValue);
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listboxId = React.useId();
  const currentValue = value?.toString() ?? selectedValue;
  const selectedOption =
    options.find((option) => option.value === currentValue) ?? options[0];

  React.useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  function chooseOption(option: SelectOption) {
    if (option.disabled) return;

    if (value === undefined) {
      setSelectedValue(option.value);
    }
    onValueChange?.(option.value);
    setOpen(false);
  }

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      {name ? (
        <input
          name={name}
          required={required}
          type="hidden"
          value={currentValue}
        />
      ) : null}
      <button
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-input bg-card px-3 py-2 text-left text-sm font-medium text-foreground shadow-xs outline-none transition-colors hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-50",
          !selectedOption?.value && "text-muted-foreground",
        )}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="min-w-0 truncate">
          {selectedOption?.label || "Select option"}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-64 overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-lg"
          id={listboxId}
          role="listbox"
        >
          {options.map((option) => {
            const selected = option.value === currentValue;

            return (
              <button
                aria-selected={selected}
                className={cn(
                  "flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-popover-foreground outline-none transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-45",
                  selected && "bg-accent text-foreground",
                )}
                disabled={option.disabled}
                key={`${option.value}-${option.label}`}
                onClick={() => chooseOption(option)}
                role="option"
                type="button"
              >
                <span className="truncate">{option.label}</span>
                {selected ? <Check className="size-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export { Select };
