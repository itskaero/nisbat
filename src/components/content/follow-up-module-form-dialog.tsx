"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DiagnosisTagInput } from "@/components/content/diagnosis-tag-input";
import { useAppStore } from "@/lib/store";
import { genId } from "@/lib/utils";
import type { FollowUpModule } from "@/types";

export function FollowUpModuleFormDialog({
  open,
  onOpenChange,
  existing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: FollowUpModule;
}) {
  const createFollowUpModule = useAppStore((s) => s.createFollowUpModule);
  const updateFollowUpModule = useAppStore((s) => s.updateFollowUpModule);
  const currentUser = useAppStore((s) => s.getCurrentUser());

  const [service, setService] = React.useState(existing?.service ?? "");
  const [defaultTimingLabel, setDefaultTimingLabel] = React.useState(existing?.defaultTimingLabel ?? "1 week");
  const [purpose, setPurpose] = React.useState(existing?.purpose ?? "");
  const [purposeUr, setPurposeUr] = React.useState(existing?.purposeUr ?? "");
  const [instructions, setInstructions] = React.useState(existing?.instructions ?? "");
  const [instructionsUr, setInstructionsUr] = React.useState(existing?.instructionsUr ?? "");
  const [hasPendingResultReview, setHasPendingResultReview] = React.useState(existing?.hasPendingResultReview ?? false);
  const [linkedDiagnoses, setLinkedDiagnoses] = React.useState<string[]>(existing?.linkedDiagnoses ?? []);
  // NOTE: correctness of all the initializers above depends on the parent
  // giving this component a `key` tied to `existing?.id` so a different
  // module gets a genuinely fresh mount (React only runs useState's
  // initial-value argument once per component instance) — see the usage site.

  const canSave = service.trim() && purpose.trim();

  function handleSave() {
    if (existing) {
      const wasPublished = existing.status === "published";
      updateFollowUpModule(existing.id, {
        service: service.trim(),
        defaultTimingLabel: defaultTimingLabel.trim(),
        purpose: purpose.trim(),
        purposeUr: purposeUr.trim() || undefined,
        instructions: instructions.trim(),
        instructionsUr: instructionsUr.trim() || undefined,
        hasPendingResultReview,
        linkedDiagnoses,
        ...(wasPublished ? { version: existing.version + 1, status: "draft" as const, publishedBy: undefined } : {}),
      });
      toast.success(wasPublished ? "New draft version created" : "Follow-up module updated");
    } else {
      createFollowUpModule({
        id: genId("fm"),
        service: service.trim(),
        version: 1,
        status: "draft",
        defaultTimingLabel: defaultTimingLabel.trim(),
        purpose: purpose.trim(),
        purposeUr: purposeUr.trim() || undefined,
        instructions: instructions.trim(),
        instructionsUr: instructionsUr.trim() || undefined,
        hasPendingResultReview,
        linkedDiagnoses,
        createdBy: currentUser.id,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Follow-up module created as draft");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Follow-up Module" : "New Follow-up Module"}</DialogTitle>
          <DialogDescription>Kept simpler than Advice Packs by design.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label required>Service / specialty</Label>
            <Input className="mt-1.5" value={service} onChange={(e) => setService(e.target.value)} placeholder="e.g. Chest / Pulmonology Clinic" />
          </div>
          <div>
            <Label>Default timing</Label>
            <Input className="mt-1.5" value={defaultTimingLabel} onChange={(e) => setDefaultTimingLabel(e.target.value)} placeholder="e.g. 2 weeks" />
          </div>
          <div>
            <Label required>Purpose</Label>
            <Input className="mt-1.5" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Respiratory recovery review" />
          </div>
          <div>
            <Label recommended>Purpose (Urdu)</Label>
            <Input
              className="mt-1.5 font-urdu"
              dir="rtl"
              value={purposeUr}
              onChange={(e) => setPurposeUr(e.target.value)}
              placeholder="اردو میں مقصد"
            />
          </div>
          <div>
            <Label recommended>Instructions</Label>
            <Textarea className="mt-1.5" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="What the clinician/parent should do at this visit…" />
          </div>
          <div>
            <Label recommended>Instructions (Urdu)</Label>
            <Textarea
              className="mt-1.5 font-urdu"
              dir="rtl"
              value={instructionsUr}
              onChange={(e) => setInstructionsUr(e.target.value)}
              placeholder="اردو میں ہدایات"
            />
          </div>
          <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border px-3 py-2">
            <div>
              <div className="text-[13px] font-medium text-foreground">Pending result review</div>
              <div className="text-[11px] text-foreground-subtle">This visit is for reviewing a pending result</div>
            </div>
            <Switch checked={hasPendingResultReview} onCheckedChange={setHasPendingResultReview} />
          </div>
          <div>
            <Label recommended>Suggested for diagnoses</Label>
            <div className="mt-1.5">
              <DiagnosisTagInput value={linkedDiagnoses} onChange={setLinkedDiagnoses} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button disabled={!canSave} onClick={handleSave}>
            {existing ? "Save Changes" : "Create Draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
