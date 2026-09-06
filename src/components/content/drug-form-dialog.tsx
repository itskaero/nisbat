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
import type { Formulary } from "@/types";

const FORMULARY_LABELS: Record<Formulary, string> = {
  hospital: "Hospital",
  private: "Private / Outside",
  both: "Hospital + Private",
};

/**
 * Adding a new drug to the formulary — deliberately no draft/publish state
 * here, unlike Advice Packs/Follow-up Modules/Dose Rules: this is factual
 * master data (a name, a class), not clinical guidance content, so it's
 * available to prescribe as soon as it's added. Still gated to Faculty/Admin
 * so routine users can't silently expand the formulary.
 */
export function DrugFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createDrug = useAppStore((s) => s.createDrug);
  const [name, setName] = React.useState("");
  const [genericClass, setGenericClass] = React.useState("");
  const [formulary, setFormulary] = React.useState<Formulary>("both");

  const canSave = name.trim().length > 0;

  function handleSave() {
    if (!canSave) return;
    createDrug({
      id: genId("d"),
      name: name.trim(),
      genericClass: genericClass.trim() || undefined,
      formulary,
    });
    toast.success(`"${name.trim()}" added to the formulary`, {
      description: "Add at least one formulation next so it can be prescribed.",
    });
    setName("");
    setGenericClass("");
    setFormulary("both");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Drug</DialogTitle>
          <DialogDescription>
            Canonical English name — this is master data, available immediately, not versioned
            clinical content.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label required>Drug name</Label>
            <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Azithromycin" />
          </div>
          <div>
            <Label recommended>Generic class</Label>
            <Input className="mt-1.5" value={genericClass} onChange={(e) => setGenericClass(e.target.value)} placeholder="e.g. Macrolide antibiotic" />
          </div>
          <div>
            <Label>Formulary</Label>
            <Select value={formulary} onValueChange={(v) => setFormulary(v as Formulary)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FORMULARY_LABELS) as Formulary[]).map((f) => (
                  <SelectItem key={f} value={f}>
                    {FORMULARY_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button disabled={!canSave} onClick={handleSave}>
            Add Drug
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
