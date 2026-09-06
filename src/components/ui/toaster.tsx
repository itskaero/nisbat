"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "bg-surface-raised! border! border-border-strong! text-foreground! rounded-[10px]! shadow-2xl!",
          title: "text-foreground! text-[13px]! font-medium!",
          description: "text-foreground-muted! text-[12px]!",
          actionButton: "bg-primary! text-primary-foreground!",
          cancelButton: "bg-muted! text-foreground-muted!",
          success: "[&_svg]:text-success!",
          error: "[&_svg]:text-danger!",
          warning: "[&_svg]:text-warning!",
        },
      }}
    />
  );
}
