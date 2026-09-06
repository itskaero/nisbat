"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function CollapsibleSection({
  title,
  defaultOpen = false,
  badge,
  children,
  className,
}: {
  title: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className={cn("border-b border-border last:border-b-0", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
          {title}
          {badge}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-foreground-subtle transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>
      <div className={cn("grid transition-all duration-150", open ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
