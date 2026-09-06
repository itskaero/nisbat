"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { required?: boolean; recommended?: boolean }
>(({ className, required, recommended, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-[13px] font-medium text-foreground-muted inline-flex items-center gap-1",
      className,
    )}
    {...props}
  >
    {children}
    {required && <span className="text-danger">*</span>}
    {recommended && <span className="text-foreground-subtle font-normal">(recommended)</span>}
  </LabelPrimitive.Root>
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
