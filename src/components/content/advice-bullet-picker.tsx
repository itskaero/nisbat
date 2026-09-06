"use client";

import * as React from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import type { AdvicePackSection } from "@/types";

/**
 * Lets a clinician pick individual bullets from a pack rather than only
 * applying it whole — reused both from "Apply Pack" (every bullet
 * pre-checked, so the one-click fast path for the common case is
 * unchanged) and from "Customize" on an already-applied pack (pre-seeded
 * from the current selection, so pruning isn't a one-shot decision made
 * only at apply time).
 */
export function AdviceBulletPicker({
  open,
  onOpenChange,
  packTitle,
  sections,
  initiallySelected,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packTitle: string;
  /** the full candidate list to choose from — a pack's own sections when
   * applying fresh, or `sourceSections` when re-customizing an applied one */
  sections: AdvicePackSection[];
  /** undefined = every bullet starts checked (the apply flow's fast path) */
  initiallySelected?: Set<string>;
  onConfirm: (selectedBulletIds: Set<string>) => void;
}) {
  const allBulletIds = React.useMemo(
    () => new Set(sections.flatMap((s) => s.bullets.map((b) => b.id))),
    [sections],
  );
  const [selected, setSelected] = React.useState<Set<string>>(initiallySelected ?? allBulletIds);
  // Re-seed whenever the dialog is (re)opened for a different pack/selection
  // — adjust state during render rather than an effect, so the first paint
  // already reflects the right pack instead of flashing the previous one.
  const [seededFor, setSeededFor] = React.useState<{ open: boolean; sections: AdvicePackSection[] } | null>(null);
  if (open && seededFor?.sections !== sections) {
    setSeededFor({ open, sections });
    setSelected(initiallySelected ?? allBulletIds);
  }

  function toggleBullet(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSection(section: AdvicePackSection) {
    const ids = section.bullets.map((b) => b.id);
    const allChecked = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (allChecked ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  const selectedCount = selected.size;
  const totalCount = allBulletIds.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{packTitle}</DialogTitle>
          <DialogDescription>
            Uncheck anything that doesn&apos;t apply — the rest is included as published. This
            doesn&apos;t change the source pack, only what&apos;s in this discharge.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-2 flex items-center justify-between text-[12px] text-foreground-subtle">
          <span>{selectedCount} of {totalCount} selected</span>
          <button
            className="text-primary-light hover:underline"
            onClick={() => setSelected(selectedCount === totalCount ? new Set() : new Set(allBulletIds))}
          >
            {selectedCount === totalCount ? "Deselect all" : "Select all"}
          </button>
        </div>

        <div className="space-y-4">
          {sections.map((sec) => {
            const ids = sec.bullets.map((b) => b.id);
            const allChecked = ids.length > 0 && ids.every((id) => selected.has(id));
            return (
              <div key={sec.id} className="rounded-[var(--radius-md)] border border-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-foreground">
                    {sec.heading}
                    {sec.isDangerSigns && <span className="ml-1.5 text-[11px] font-normal text-danger">Danger signs</span>}
                  </span>
                  <button className="text-[11px] text-primary-light hover:underline" onClick={() => toggleSection(sec)}>
                    {allChecked ? "Deselect section" : "Select section"}
                  </button>
                </div>
                <ul className="space-y-2">
                  {sec.bullets.map((b) => (
                    <li key={b.id} className="flex items-start gap-2">
                      <Checkbox
                        className="mt-0.5"
                        checked={selected.has(b.id)}
                        onCheckedChange={() => toggleBullet(b.id)}
                        id={`bullet-${b.id}`}
                      />
                      <label htmlFor={`bullet-${b.id}`} className="cursor-pointer text-[13px] leading-snug">
                        {b.ur && <span className="block font-urdu text-foreground">{b.ur}</span>}
                        <span className={"block" + (b.ur ? " text-[12px] text-foreground-muted" : " text-foreground")}>
                          {b.en}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button
            disabled={selectedCount === 0}
            onClick={() => {
              onConfirm(selected);
              onOpenChange(false);
            }}
          >
            {initiallySelected ? "Save Selection" : `Apply ${selectedCount} Item${selectedCount === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
