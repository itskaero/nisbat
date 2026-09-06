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
import { TagInput } from "@/components/ui/tag-input";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { useAppStore } from "@/lib/store";
import { EXAM_SYSTEMS, HISTORY_CATEGORIES } from "@/types";
import type { VocabularyList } from "@/types";

const EXAM_SYSTEM_LABELS: Record<string, string> = {
  general: "General",
  respiratory: "Respiratory",
  cvs: "Cardiovascular",
  cns: "CNS",
  abdomen: "Abdomen",
  ent: "ENT",
  skin: "Skin",
  musculoskeletal: "Musculoskeletal",
  other: "Other",
};

const HISTORY_CATEGORY_LABELS: Record<string, string> = {
  birth: "Birth History",
  immunization: "Immunization",
  past_medical: "Past Medical",
  family: "Family History",
  allergy: "Allergy",
  developmental: "Developmental",
};

/**
 * One dialog editing a whole VocabularyList row (all its systems/categories,
 * or the flat diagnosis list) in one sitting — the same editing grain as an
 * Advice Pack's several sections, not one row per chip.
 */
export function VocabularyListFormDialog({
  open,
  onOpenChange,
  existing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: VocabularyList;
}) {
  const updateVocabularyList = useAppStore((s) => s.updateVocabularyList);

  // NOTE: correctness of these initializers depends on the parent giving
  // this component a `key` tied to `existing?.id` so a different list gets a
  // genuinely fresh mount (React only runs useState's initial-value argument
  // once per component instance) — see the usage site.
  const [flatItems, setFlatItems] = React.useState<string[]>(existing?.flatItems ?? []);
  const [chipsBySystem, setChipsBySystem] = React.useState<Record<string, string[]>>(
    existing?.chipsBySystem ?? {},
  );

  const isFlat = existing?.key === "diagnosis_catalogue";
  const systemKeys = existing?.key === "history_chips" ? HISTORY_CATEGORIES : EXAM_SYSTEMS;
  const systemLabels = existing?.key === "history_chips" ? HISTORY_CATEGORY_LABELS : EXAM_SYSTEM_LABELS;

  function setChipsForSystem(system: string, chips: string[]) {
    setChipsBySystem((prev) => ({ ...prev, [system]: chips }));
  }

  function handleSave() {
    if (!existing) return;
    const wasPublished = existing.status === "published";
    updateVocabularyList(existing.id, {
      flatItems: isFlat ? flatItems : undefined,
      chipsBySystem: isFlat ? undefined : chipsBySystem,
      ...(wasPublished ? { version: existing.version + 1, status: "draft" as const, publishedBy: undefined } : {}),
    });
    toast.success(wasPublished ? "New draft version created" : "Vocabulary list updated", {
      description: wasPublished
        ? "Re-publish to make this version live again."
        : "Discharges already in progress keep whatever they've already selected.",
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {existing?.label ?? "Vocabulary List"}</DialogTitle>
          <DialogDescription>
            {isFlat
              ? "The suggestions shown while typing a diagnosis — free text always stays available alongside."
              : "The rapid-fill chips shown per system — free text always stays available alongside."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          {isFlat ? (
            <div>
              <Label>Diagnoses</Label>
              <div className="mt-1.5">
                <TagInput value={flatItems} onChange={setFlatItems} placeholder="Type a diagnosis, press Enter…" />
              </div>
            </div>
          ) : (
            systemKeys.map((system) => (
              <CollapsibleSection key={system} title={systemLabels[system] ?? system}>
                <TagInput
                  value={chipsBySystem[system] ?? []}
                  onChange={(chips) => setChipsForSystem(system, chips)}
                  placeholder="Type a chip, press Enter…"
                />
              </CollapsibleSection>
            ))
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
