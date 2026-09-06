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
import { TagInput } from "@/components/ui/tag-input";
import { useAppStore } from "@/lib/store";
import { genId } from "@/lib/utils";
import type { InvestigationPanel } from "@/types";

/**
 * A modal form, not a page-builder — a panel is structurally just a name
 * plus an ordered list of test names, the same "intentionally simpler than
 * Advice Packs" precedent Follow-up Modules use.
 */
export function InvestigationPanelFormDialog({
  open,
  onOpenChange,
  existing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: InvestigationPanel;
}) {
  const createInvestigationPanel = useAppStore((s) => s.createInvestigationPanel);
  const updateInvestigationPanel = useAppStore((s) => s.updateInvestigationPanel);
  const currentUser = useAppStore((s) => s.getCurrentUser());

  // NOTE: correctness of these initializers depends on the parent giving
  // this component a `key` tied to `existing?.id` so a different panel gets
  // a genuinely fresh mount (React only runs useState's initial-value
  // argument once per component instance) — see the usage site.
  const [name, setName] = React.useState(existing?.name ?? "");
  const [category, setCategory] = React.useState(existing?.category ?? "");
  const [testNames, setTestNames] = React.useState<string[]>(existing?.tests.map((t) => t.name) ?? []);

  const canSave = name.trim() && testNames.length > 0;

  function handleSave() {
    const tests = testNames.map((n) => ({ id: genId("ipt"), name: n }));
    if (existing) {
      const wasPublished = existing.status === "published";
      updateInvestigationPanel(existing.id, {
        name: name.trim(),
        category: category.trim() || undefined,
        tests,
        ...(wasPublished ? { version: existing.version + 1, status: "draft" as const, publishedBy: undefined } : {}),
      });
      toast.success(wasPublished ? "New draft version created" : "Investigation panel updated");
    } else {
      createInvestigationPanel({
        id: genId("ip"),
        name: name.trim(),
        category: category.trim() || undefined,
        version: 1,
        status: "draft",
        tests,
        createdBy: currentUser.id,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Investigation panel created as draft");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Investigation Panel" : "New Investigation Panel"}</DialogTitle>
          <DialogDescription>
            A name plus an ordered list of test rows — selecting this on a discharge bulk-adds one
            result row per test.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label required>Panel name</Label>
            <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Serum Profile" />
          </div>
          <div>
            <Label recommended>Category</Label>
            <Input className="mt-1.5" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Chemistry, Hematology" />
          </div>
          <div>
            <Label required>Tests</Label>
            <div className="mt-1.5">
              <TagInput value={testNames} onChange={setTestNames} placeholder="Type a test name, press Enter…" />
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
