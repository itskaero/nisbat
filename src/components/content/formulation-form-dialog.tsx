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
import type { FormulationForm, Drug } from "@/types";

const FORM_LABELS: Record<FormulationForm, string> = {
  syrup: "Syrup",
  suspension: "Suspension",
  tablet: "Tablet",
  capsule: "Capsule",
  injection: "Injection",
  drops: "Drops",
  sachet: "Sachet",
  topical: "Topical (cream/ointment/lotion)",
  eye_drops: "Eye drops",
  nebule: "Nebule (nebulized solution)",
};

const LIQUID_FORMS: FormulationForm[] = ["syrup", "suspension", "drops", "nebule"];

/**
 * Never assume concentration (CLAUDE.md) — strengthLabel is the mandatory,
 * always-shown label; mg/mL or mg/unit are what the dose calculator actually
 * consumes to produce a volume, and both stay optional so a formulation with
 * no fixed concentration (e.g. an ORS sachet) can still be recorded honestly.
 */
export function FormulationFormDialog({
  open,
  onOpenChange,
  drug,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drug?: Drug;
}) {
  const createFormulation = useAppStore((s) => s.createFormulation);
  const [form, setForm] = React.useState<FormulationForm>("syrup");
  const [strengthLabel, setStrengthLabel] = React.useState("");
  const [mgPerMl, setMgPerMl] = React.useState("");
  const [mgPerUnit, setMgPerUnit] = React.useState("");
  const [brandNames, setBrandNames] = React.useState("");

  const isLiquid = LIQUID_FORMS.includes(form);
  const canSave = drug && strengthLabel.trim().length > 0;

  function handleSave() {
    if (!canSave || !drug) return;
    const parsedBrandNames = brandNames
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);
    createFormulation({
      id: genId("f"),
      drugId: drug.id,
      form,
      strengthLabel: strengthLabel.trim(),
      mgPerMl: isLiquid && mgPerMl ? parseFloat(mgPerMl) : undefined,
      mgPerUnit: !isLiquid && mgPerUnit ? parseFloat(mgPerUnit) : undefined,
      brandNames: parsedBrandNames.length > 0 ? parsedBrandNames : undefined,
    });
    toast.success(`Formulation added to ${drug.name}`);
    setStrengthLabel("");
    setMgPerMl("");
    setMgPerUnit("");
    setBrandNames("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Formulation{drug ? ` — ${drug.name}` : ""}</DialogTitle>
          <DialogDescription>
            The exact strength a clinician selects before any volume is calculated — never assumed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Form</Label>
            <Select value={form} onValueChange={(v) => setForm(v as FormulationForm)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FORM_LABELS) as FormulationForm[]).map((f) => (
                  <SelectItem key={f} value={f}>
                    {FORM_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label required>Strength label</Label>
            <Input
              className="mt-1.5"
              value={strengthLabel}
              onChange={(e) => setStrengthLabel(e.target.value)}
              placeholder={isLiquid ? "e.g. 250 mg/5 mL" : "e.g. 500 mg tablet"}
            />
          </div>
          <div>
            <Label recommended>Brand names</Label>
            <Input
              className="mt-1.5"
              value={brandNames}
              onChange={(e) => setBrandNames(e.target.value)}
              placeholder="e.g. Panadol, Calpol — comma-separated"
            />
            <p className="mt-1 text-[11px] text-foreground-subtle">
              A recognition aid only — never used for dose calculation, which always reads the
              strength label above.
            </p>
          </div>
          {isLiquid ? (
            <div>
              <Label recommended>mg per mL</Label>
              <Input
                className="mt-1.5"
                type="number"
                step="0.01"
                value={mgPerMl}
                onChange={(e) => setMgPerMl(e.target.value)}
                placeholder="Needed for the dose calculator to compute a volume"
              />
            </div>
          ) : (
            <div>
              <Label recommended>mg per unit</Label>
              <Input
                className="mt-1.5"
                type="number"
                step="0.01"
                value={mgPerUnit}
                onChange={(e) => setMgPerUnit(e.target.value)}
                placeholder="Leave blank if not dosed by weight (e.g. ORS sachet)"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button disabled={!canSave} onClick={handleSave}>
            Add Formulation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
