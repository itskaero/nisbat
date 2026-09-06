import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  tone?: "default" | "danger";
}

/**
 * Compact clinical toggle chip — restrained in color/tone (muted fills, no
 * rainbow), pill-shaped for a softer, easier-on-the-eye feel per direct
 * feedback on the running product.
 */
const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected, tone = "default", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        aria-pressed={selected}
        className={cn(
          "inline-flex h-8 items-center rounded-[var(--radius-full)] border px-3.5 text-[13px] font-medium transition-[color,background-color,border-color,box-shadow] duration-150",
          selected
            ? tone === "danger"
              ? "bg-danger/15 border-danger/40 text-danger shadow-[0_0_0_1px_rgba(239,68,68,0.12),0_0_14px_-6px_rgba(239,68,68,0.55)]"
              : "bg-primary/15 border-primary/40 text-primary-light shadow-[0_0_0_1px_rgba(16,185,129,0.12),0_0_14px_-6px_rgba(16,185,129,0.55)]"
            : "bg-muted/60 border-border-strong text-foreground-muted hover:bg-surface-hover hover:text-foreground",
          className,
        )}
        {...props}
      />
    );
  },
);
Chip.displayName = "Chip";

export { Chip };
