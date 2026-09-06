"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";

/**
 * No digital signature in V1 (CLAUDE.md). This records that the SR physically
 * reviewed and signed the printed card — it does not implement e-signing.
 */
export function CompleteReviewDialog({
  dischargeId,
  defaultReviewerName,
}: {
  dischargeId: string;
  defaultReviewerName: string;
}) {
  const [reviewerName, setReviewerName] = React.useState(defaultReviewerName);
  const [confirmed, setConfirmed] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const completeDischarge = useAppStore((s) => s.completeDischarge);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <CheckCircle2 className="size-3.5" />
          Mark Completed
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record completion</DialogTitle>
          <DialogDescription>
            Confirms the printed card was physically reviewed and signed by hand. Nisbat does not
            capture a digital signature.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="reviewer-name" required>
              Reviewing SR / Faculty name
            </Label>
            <Input id="reviewer-name" value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} />
          </div>
          <label className="flex items-start gap-2 text-[13px] text-foreground-muted">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 size-3.5 rounded border-border-strong"
            />
            I confirm the printed card has been physically reviewed and signed.
          </label>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button
            disabled={!reviewerName.trim() || !confirmed}
            onClick={() => {
              completeDischarge(dischargeId, reviewerName.trim());
              toast.success("Discharge completed", {
                description: "Status set to Completed / Signed.",
              });
              setOpen(false);
            }}
          >
            Mark Completed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
