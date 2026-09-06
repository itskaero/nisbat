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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { genId } from "@/lib/utils";
import { FREQUENCY_CODES } from "@/types";
import type { FrequencyCode, FrequencyPhrase } from "@/types";

/**
 * Edits one phrase, or adds another phrasing for a code — never the
 * underlying clinical semantics (timesPerDay/intervalHours in
 * FREQUENCY_OPTIONS stay fixed and aren't chosen here; a code's meaning as
 * "twice daily" isn't editable content, only how that's phrased for a parent
 * is). More than one phrase can exist per code (drafts to compare/iterate
 * on), but the store enforces exactly one *published* phrase per code at a
 * time — publishing a new one for a code retires whichever was live, so a
 * prescription is never ambiguous about which wording actually prints.
 */
export function FrequencyPhraseFormDialog({
  open,
  onOpenChange,
  existing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: FrequencyPhrase;
}) {
  const currentUser = useAppStore((s) => s.getCurrentUser());
  const createFrequencyPhrase = useAppStore((s) => s.createFrequencyPhrase);
  const updateFrequencyPhrase = useAppStore((s) => s.updateFrequencyPhrase);

  // NOTE: correctness of these initializers depends on the parent giving
  // this component a `key` tied to `existing?.id` so a different phrase gets
  // a genuinely fresh mount (React only runs useState's initial-value
  // argument once per component instance) — see the usage site.
  const [frequencyCode, setFrequencyCode] = React.useState<FrequencyCode>(
    (existing?.frequencyCode as FrequencyCode) ?? "BD",
  );
  const [phraseEnglish, setPhraseEnglish] = React.useState(existing?.phraseEnglish ?? "");
  const [phraseUrdu, setPhraseUrdu] = React.useState(existing?.phraseUrdu ?? "");

  const canSave = phraseEnglish.trim().length > 0 && phraseUrdu.trim().length > 0;

  function handleSave() {
    if (!canSave) return;
    if (existing) {
      const wasPublished = existing.status === "published";
      updateFrequencyPhrase(existing.id, {
        phraseEnglish: phraseEnglish.trim(),
        phraseUrdu: phraseUrdu.trim(),
        ...(wasPublished ? { version: existing.version + 1, status: "draft" as const, publishedBy: undefined } : {}),
      });
      toast.success(wasPublished ? "New draft version created" : "Frequency phrase updated", {
        description: wasPublished
          ? "Re-publish to make this version live again."
          : "Prescriptions already written keep their own printed wording — this only affects new ones.",
      });
    } else {
      createFrequencyPhrase({
        id: genId("fp"),
        frequencyCode,
        phraseEnglish: phraseEnglish.trim(),
        phraseUrdu: phraseUrdu.trim(),
        version: 1,
        status: "draft",
        createdBy: currentUser.id,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Phrase added as draft", {
        description: `Publish it to make it the live wording for ${frequencyCode} — that retires whichever was published before.`,
      });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? `Edit ${existing.frequencyCode} Phrase` : "New Frequency Phrase"}</DialogTitle>
          <DialogDescription>
            The parent-facing wording for this frequency — printed on the discharge card wherever
            this frequency is used, not a code deploy away.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label required>Frequency code</Label>
            {existing ? (
              <Input className="mt-1.5" value={existing.frequencyCode} disabled />
            ) : (
              <Select value={frequencyCode} onValueChange={(v) => setFrequencyCode(v as FrequencyCode)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_CODES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="mt-1 text-[11px] text-foreground-subtle">
              What this code means for dose timing (e.g. BD = twice daily) is fixed — this only adds
              another wording option for it, not a new meaning.
            </p>
          </div>
          <div>
            <Label required>English phrase</Label>
            <Input className="mt-1.5" value={phraseEnglish} onChange={(e) => setPhraseEnglish(e.target.value)} placeholder="e.g. Twice daily" />
          </div>
          <div>
            <Label required>Urdu phrase</Label>
            <Input
              className="mt-1.5 font-urdu"
              dir="rtl"
              value={phraseUrdu}
              onChange={(e) => setPhraseUrdu(e.target.value)}
              placeholder="اردو فقرہ"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button disabled={!canSave} onClick={handleSave}>
            {existing ? "Save Changes" : "Add as Draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
