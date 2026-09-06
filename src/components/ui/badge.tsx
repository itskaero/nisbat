import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[var(--radius-full)] border px-2.5 py-0.5 text-[11px] font-medium leading-normal tabular-nums",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-foreground-muted border-border-strong",
        primary: "bg-primary/15 text-primary-light border-primary/25 shadow-[0_0_10px_-4px_rgba(16,185,129,0.6)]",
        success: "bg-success/12 text-success border-success/25",
        warning: "bg-warning/12 text-warning border-warning/25",
        danger: "bg-danger/12 text-danger border-danger/25",
        info: "bg-info/12 text-info border-info/25",
        secondary: "bg-secondary/12 text-secondary-light border-secondary/25",
        outline: "bg-transparent text-foreground-muted border-border-strong",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
