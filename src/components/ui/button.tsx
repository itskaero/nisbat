import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-medium transition-[color,background-color,box-shadow,filter] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-b from-primary-light to-primary text-primary-foreground shadow-[var(--glow-primary-sm)] hover:shadow-[var(--glow-primary)] hover:brightness-105 active:brightness-95",
        secondary:
          "bg-muted text-foreground hover:bg-surface-hover border border-border-strong",
        outline:
          "border border-border-strong text-foreground hover:bg-surface-hover bg-transparent",
        ghost: "text-foreground-muted hover:text-foreground hover:bg-surface-hover",
        danger:
          "bg-danger text-white shadow-[0_2px_6px_-2px_rgba(0,0,0,0.45)] hover:shadow-[0_2px_6px_-2px_rgba(0,0,0,0.45),0_0_14px_-4px_rgba(239,68,68,0.5)] hover:brightness-110",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-2.5 text-[13px]",
        md: "h-9 px-3.5",
        lg: "h-10 px-5 text-[15px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
