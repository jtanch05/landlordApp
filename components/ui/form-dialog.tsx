"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";

type FormDialogProps = {
  children: ReactNode;
  contentClassName?: string;
  description?: string;
  title: string;
  triggerAriaLabel?: string;
  triggerClassName?: string;
  triggerIcon?: ReactNode;
  triggerLabel: ReactNode;
  triggerSize?: "default" | "sm" | "lg" | "icon";
  triggerVariant?: "default" | "secondary" | "ghost" | "destructive";
};

export function FormDialog({
  children,
  contentClassName,
  description,
  title,
  triggerAriaLabel,
  triggerClassName,
  triggerIcon,
  triggerLabel,
  triggerSize = "default",
  triggerVariant = "default",
}: FormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button
        aria-label={triggerAriaLabel}
        className={triggerClassName}
        onClick={() => dialogRef.current?.showModal()}
        size={triggerSize}
        type="button"
        variant={triggerVariant}
      >
        {triggerIcon}
        {triggerLabel}
      </Button>

      <Dialog
        className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-48px)] w-[min(860px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] backdrop:bg-black/60"
        ref={dialogRef}
      >
        <div className="flex min-h-0 max-h-[calc(100vh-48px)] flex-col">
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-7 py-5">
            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            <form method="dialog">
              <Button aria-label="Close dialog" size="icon" type="submit" variant="ghost">
                <X className="size-5" />
              </Button>
            </form>
          </header>

          <div className={cn("min-h-0 flex-1 overflow-y-auto px-7 py-6", contentClassName)}>
            {children}
          </div>
        </div>
      </Dialog>
    </>
  );
}
