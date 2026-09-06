"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Check } from "lucide-react";
import { DischargeStatusBadge } from "@/components/discharge/status-badge";
import { CompleteReviewDialog } from "@/components/discharge/complete-review-dialog";
import { ReturnForCorrectionDialog } from "@/components/discharge/return-dialog";
import { useAppStore } from "@/lib/store";
import { canActAsReviewer } from "@/lib/permissions";
import { timeAgo } from "@/lib/utils";
import type { Discharge, Patient } from "@/types";
import { cn } from "@/lib/utils";

export function WorkspaceTopbar({
  discharge,
  patient,
  mode,
  onModeChange,
}: {
  discharge: Discharge;
  patient: Patient;
  mode: "edit" | "preview";
  onModeChange: (m: "edit" | "preview") => void;
}) {
  const currentUser = useAppStore((s) => s.getCurrentUser());
  const [, forceTick] = React.useReducer((n) => n + 1, 0);

  // The persisted store can diverge from the server's static seed snapshot by
  // the time the client hydrates, so a relative "ago" string can legitimately
  // differ between server and first client render. Render nothing until
  // mounted rather than let that show up as a hydration mismatch.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    // Sanctioned mount-gate: flips once, after the hydration-sensitive
    // content below is safe to show — not state derived from props/render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const t = setInterval(forceTick, 10_000);
    return () => clearInterval(t);
  }, []);

  const showReviewerActions = discharge.status === "pending_sr_review" && canActAsReviewer(currentUser);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-5">
      <div className="flex min-w-0 items-center gap-1.5 text-[13px] text-foreground-subtle">
        <Link href="/my-discharges" className="hover:text-foreground">
          Discharges
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/patients/${patient.id}`} className="truncate hover:text-foreground">
          {patient.name}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-foreground">Revision {discharge.revisionNumber}</span>
        <DischargeStatusBadge status={discharge.status} />
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {mounted && (
          <span className="hidden items-center gap-1 text-[12px] text-foreground-subtle sm:flex">
            <Check className="size-3.5 text-success" />
            Autosaved {timeAgo(discharge.updatedAt)}
          </span>
        )}

        <div className="flex items-center rounded-[var(--radius-md)] border border-border bg-muted/40 p-0.5">
          <button
            onClick={() => onModeChange("edit")}
            className={cn(
              "rounded-[calc(var(--radius-md)-3px)] px-3 py-1 text-[13px] font-medium transition-[color,background-color,box-shadow] duration-150",
              mode === "edit"
                ? "bg-gradient-to-b from-primary-light to-primary text-primary-foreground shadow-[var(--glow-primary-sm)]"
                : "text-foreground-muted",
            )}
          >
            Edit
          </button>
          <button
            onClick={() => onModeChange("preview")}
            className={cn(
              "rounded-[calc(var(--radius-md)-3px)] px-3 py-1 text-[13px] font-medium transition-[color,background-color,box-shadow] duration-150",
              mode === "preview"
                ? "bg-gradient-to-b from-primary-light to-primary text-primary-foreground shadow-[var(--glow-primary-sm)]"
                : "text-foreground-muted",
            )}
          >
            Preview
          </button>
        </div>

        {showReviewerActions && (
          <div className="flex items-center gap-2">
            <ReturnForCorrectionDialog dischargeId={discharge.id} />
            <CompleteReviewDialog dischargeId={discharge.id} defaultReviewerName={currentUser.name} />
          </div>
        )}
      </div>
    </header>
  );
}
