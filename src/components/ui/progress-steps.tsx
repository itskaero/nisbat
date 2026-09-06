import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProgressStep {
  label: string;
  state: "complete" | "active" | "upcoming";
}

export function ProgressSteps({ steps, className }: { steps: ProgressStep[]; className?: string }) {
  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                step.state === "complete" && "bg-primary text-primary-foreground",
                step.state === "active" &&
                  "bg-primary/15 text-primary-light border-2 border-primary",
                step.state === "upcoming" && "bg-muted text-foreground-subtle",
              )}
            >
              {step.state === "complete" ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </div>
            <span
              className={cn(
                "text-[11px] font-medium",
                step.state === "upcoming" ? "text-foreground-subtle" : "text-foreground-muted",
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "mx-2 h-px w-8 sm:w-12 -translate-y-2.5",
                step.state === "complete" ? "bg-primary" : "bg-border-strong",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
