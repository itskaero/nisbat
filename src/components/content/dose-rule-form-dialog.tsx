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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { calculateDose } from "@/lib/dose-calc";
import { FREQUENCY_OPTIONS } from "@/lib/frequency";
import { genId } from "@/lib/utils";
import { FREQUENCY_CODES } from "@/types";
import type { DoseBasis, DoseRule, FrequencyCode } from "@/types";

const BASIS_LABELS: Record<DoseBasis, string> = {
  mg_per_kg_per_dose: "mg/kg per dose",
  mg_per_kg_per_day: "mg/kg per day",
  fixed: "Fixed dose (not weight-based)",
  topical_instruction: "Topical/ophthalmic instruction (no mg dose)",
};

const PREVIEW_WEIGHTS = [5, 10, 20];

export function DoseRuleFormDialog({
  open,
  onOpenChange,
  existing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** only "faculty"-sourced rules are ever passed here for editing — system rules are never editable */
  existing?: DoseRule;
}) {
  const createDoseRule = useAppStore((s) => s.createDoseRule);
  const updateDoseRule = useAppStore((s) => s.updateDoseRule);
  const currentUser = useAppStore((s) => s.getCurrentUser());
  const drugs = useAppStore((s) => s.drugs);

  const [drugId, setDrugId] = React.useState(existing?.drugId ?? "");
  const [label, setLabel] = React.useState(existing?.label ?? "");
  const [basis, setBasis] = React.useState<DoseBasis>(existing?.basis ?? "mg_per_kg_per_dose");
  const [isRange, setIsRange] = React.useState(existing?.mgPerKgMax != null);
  const [mgPerKg, setMgPerKg] = React.useState(existing?.mgPerKg?.toString() ?? "");
  const [mgPerKgMax, setMgPerKgMax] = React.useState(existing?.mgPerKgMax?.toString() ?? "");
  const [fixedMg, setFixedMg] = React.useState(existing?.fixedMg?.toString() ?? "");
  const [instructionText, setInstructionText] = React.useState(existing?.instructionText ?? "");
  const [defaultFrequencyCode, setDefaultFrequencyCode] = React.useState<FrequencyCode>(
    existing?.defaultFrequencyCode ?? "BD",
  );
  const [maxMgPerDose, setMaxMgPerDose] = React.useState(existing?.maxMgPerDose?.toString() ?? "");
  const [maxMgPerDay, setMaxMgPerDay] = React.useState(existing?.maxMgPerDay?.toString() ?? "");
  const [maxMgPerKgPerDay, setMaxMgPerKgPerDay] = React.useState(existing?.maxMgPerKgPerDay?.toString() ?? "");
  const [minAgeMonths, setMinAgeMonths] = React.useState(existing?.minAgeMonths?.toString() ?? "");
  const [maxAgeMonths, setMaxAgeMonths] = React.useState(existing?.maxAgeMonths?.toString() ?? "");
  // NOTE: correctness of all the initializers above depends on the parent
  // giving this component a `key` tied to `existing?.id` so a different rule
  // gets a genuinely fresh mount (React only runs useState's initial-value
  // argument once per component instance) — see the usage site.

  const canSave =
    drugId &&
    label.trim() &&
    (basis === "topical_instruction"
      ? instructionText.trim().length > 0
      : basis === "fixed"
        ? parseFloat(fixedMg) > 0
        : parseFloat(mgPerKg) > 0 && (!isRange || parseFloat(mgPerKgMax) > parseFloat(mgPerKg)));

  const previewRule: DoseRule = {
    id: existing?.id ?? "preview",
    drugId,
    label: label.trim() || "(unnamed rule)",
    basis,
    mgPerKg: parseFloat(mgPerKg) || undefined,
    mgPerKgMax: basis !== "fixed" && isRange ? parseFloat(mgPerKgMax) || undefined : undefined,
    fixedMg: parseFloat(fixedMg) || undefined,
    instructionText: basis === "topical_instruction" ? instructionText.trim() || undefined : undefined,
    defaultFrequencyCode,
    maxMgPerDose: parseFloat(maxMgPerDose) || undefined,
    maxMgPerDay: parseFloat(maxMgPerDay) || undefined,
    maxMgPerKgPerDay: parseFloat(maxMgPerKgPerDay) || undefined,
    minAgeMonths: parseFloat(minAgeMonths) || undefined,
    maxAgeMonths: parseFloat(maxAgeMonths) || undefined,
    source: "faculty",
    status: "draft",
    version: 1,
    createdBy: currentUser.id,
    updatedAt: new Date().toISOString(),
  };

  function handleSave() {
    if (!canSave) return;
    const patch = {
      drugId,
      label: label.trim(),
      basis,
      mgPerKg: basis === "fixed" || basis === "topical_instruction" ? undefined : parseFloat(mgPerKg),
      mgPerKgMax: basis !== "fixed" && basis !== "topical_instruction" && isRange ? parseFloat(mgPerKgMax) : undefined,
      fixedMg: basis === "fixed" ? parseFloat(fixedMg) : undefined,
      instructionText: basis === "topical_instruction" ? instructionText.trim() : undefined,
      defaultFrequencyCode,
      maxMgPerDose: maxMgPerDose ? parseFloat(maxMgPerDose) : undefined,
      maxMgPerDay: maxMgPerDay ? parseFloat(maxMgPerDay) : undefined,
      maxMgPerKgPerDay: maxMgPerKgPerDay ? parseFloat(maxMgPerKgPerDay) : undefined,
      minAgeMonths: minAgeMonths ? parseFloat(minAgeMonths) : undefined,
      maxAgeMonths: maxAgeMonths ? parseFloat(maxAgeMonths) : undefined,
    };

    if (existing) {
      const wasPublished = existing.status === "published";
      updateDoseRule(existing.id, {
        ...patch,
        ...(wasPublished ? { version: existing.version + 1, status: "draft" as const, publishedBy: undefined } : {}),
      });
      toast.success(wasPublished ? "New draft version created" : "Dose rule updated", {
        description: wasPublished
          ? "Re-publish to make this version selectable again. Prescriptions already written keep their own calculation trace."
          : "Prescriptions already written keep their own calculation trace — this only affects new ones.",
      });
    } else {
      createDoseRule({ ...patch, id: genId("r"), source: "faculty", status: "draft", version: 1, createdBy: currentUser.id, updatedAt: new Date().toISOString() });
      toast.success("Dose rule created as draft");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Dose Rule" : "New Dose Rule"}</DialogTitle>
          <DialogDescription>
            Only faculty-configured rules are editable here — curated system rules are fixed.
            Prescriptions already written never change when a rule changes later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label required>Drug</Label>
            <Select value={drugId} onValueChange={setDrugId} disabled={!!existing}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select drug…" />
              </SelectTrigger>
              <SelectContent>
                {drugs.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label required>Label</Label>
            <Input
              className="mt-1.5"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Amoxicillin — high dose, otitis media (90 mg/kg/day)"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Basis</Label>
              <Select value={basis} onValueChange={(v) => setBasis(v as DoseBasis)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(BASIS_LABELS) as DoseBasis[]).map((b) => (
                    <SelectItem key={b} value={b}>
                      {BASIS_LABELS[b]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {basis !== "topical_instruction" && (
              <div>
                <Label required>{basis === "fixed" ? "Fixed dose (mg)" : isRange ? "mg per kg — min" : "mg per kg"}</Label>
                {basis === "fixed" ? (
                  <Input className="mt-1.5" type="number" step="0.01" value={fixedMg} onChange={(e) => setFixedMg(e.target.value)} />
                ) : (
                  <Input className="mt-1.5" type="number" step="0.01" value={mgPerKg} onChange={(e) => setMgPerKg(e.target.value)} />
                )}
              </div>
            )}
          </div>

          {basis === "topical_instruction" && (
            <div>
              <Label required>Instruction text</Label>
              <Input
                className="mt-1.5"
                value={instructionText}
                onChange={(e) => setInstructionText(e.target.value)}
                placeholder="e.g. Apply a thin layer to the affected area"
              />
              <p className="mt-1 text-[11px] text-foreground-subtle">
                Not a calculable mg dose — this text prints as the dose directly. Frequency below still
                applies (e.g. &quot;… twice daily&quot;).
              </p>
            </div>
          )}

          {basis !== "fixed" && basis !== "topical_instruction" && (
            <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border px-3 py-2">
              <div>
                <div className="text-[13px] font-medium text-foreground">Dosed as a range</div>
                <div className="text-[11px] text-foreground-subtle">
                  Many pediatric doses are published as a band (e.g. 10–15 mg/kg/dose) rather than one
                  point — the clinician then picks where in the range via a slider.
                </div>
              </div>
              <Switch checked={isRange} onCheckedChange={setIsRange} />
            </div>
          )}
          {basis !== "fixed" && basis !== "topical_instruction" && isRange && (
            <div>
              <Label required>mg per kg — max</Label>
              <Input className="mt-1.5" type="number" step="0.01" value={mgPerKgMax} onChange={(e) => setMgPerKgMax(e.target.value)} placeholder="Must be greater than the min above" />
            </div>
          )}

          <div>
            <Label>Default frequency</Label>
            <Select value={defaultFrequencyCode} onValueChange={(v) => setDefaultFrequencyCode(v as FrequencyCode)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_CODES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {FREQUENCY_OPTIONS[code].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {basis !== "topical_instruction" && (
              <>
                <div>
                  <Label recommended>Max mg/dose</Label>
                  <Input className="mt-1.5" type="number" value={maxMgPerDose} onChange={(e) => setMaxMgPerDose(e.target.value)} placeholder="Optional cap" />
                </div>
                <div>
                  <Label recommended>Max mg/day</Label>
                  <Input className="mt-1.5" type="number" value={maxMgPerDay} onChange={(e) => setMaxMgPerDay(e.target.value)} placeholder="Optional cap" />
                </div>
                <div className="col-span-2">
                  <Label recommended>Max mg/kg/day</Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    value={maxMgPerKgPerDay}
                    onChange={(e) => setMaxMgPerKgPerDay(e.target.value)}
                    placeholder="e.g. 60 — weight-scaled, usually the one that actually binds"
                  />
                  <p className="mt-1 text-[11px] text-foreground-subtle">
                    Checked against the implied daily total at the chosen frequency, in addition to the flat
                    caps above — most published pediatric ceilings (e.g. &quot;max 60 mg/kg/day&quot;) are
                    weight-scaled, not one fixed number.
                  </p>
                </div>
              </>
            )}
            <div>
              <Label recommended>Min age (months)</Label>
              <Input className="mt-1.5" type="number" value={minAgeMonths} onChange={(e) => setMinAgeMonths(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <Label recommended>Max age (months)</Label>
              <Input className="mt-1.5" type="number" value={maxAgeMonths} onChange={(e) => setMaxAgeMonths(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          {/* live sanity-check preview — never trust a dose rule you haven't seen calculated */}
          <div className="rounded-[var(--radius-md)] border border-border-strong bg-muted/30 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-foreground-subtle">
              {basis === "topical_instruction"
                ? "Preview — exactly what prints as the dose"
                : "Preview — no formulation selected, mg only"}
              {basis !== "fixed" && basis !== "topical_instruction" && isRange && " (both ends of the range)"}
            </p>
            {basis === "topical_instruction" ? (
              <p className="text-[12.5px] font-medium text-foreground">
                {instructionText.trim() || "—"}
                {instructionText.trim() && `, ${FREQUENCY_OPTIONS[defaultFrequencyCode].label.toLowerCase()}`}
              </p>
            ) : (
              <div className="space-y-1">
                {PREVIEW_WEIGHTS.map((w) => {
                  const rule = canSave ? previewRule : undefined;
                  const timesPerDay = FREQUENCY_OPTIONS[defaultFrequencyCode].timesPerDay;
                  const traceMin = calculateDose({ weightKg: w, rule, timesPerDay, selectedMgPerKg: rule?.mgPerKg });
                  const traceMax =
                    basis !== "fixed" && isRange
                      ? calculateDose({ weightKg: w, rule, timesPerDay, selectedMgPerKg: rule?.mgPerKgMax })
                      : undefined;

                  function fmt(trace: typeof traceMin) {
                    return trace.calculatedMgPerDose != null
                      ? `${Math.round(trace.calculatedMgPerDose * 10) / 10}`
                      : trace.calculatedMgPerDay != null
                        ? `${trace.calculatedMgPerDay}`
                        : "—";
                  }
                  const unit = traceMin.calculatedMgPerDose != null ? "mg/dose" : traceMin.calculatedMgPerDay != null ? "mg/day" : "";

                  return (
                    <div key={w} className="flex items-center justify-between text-[12.5px]">
                      <span className="text-foreground-muted">{w} kg child</span>
                      <span className="font-medium text-foreground">
                        {traceMax ? `${fmt(traceMin)}–${fmt(traceMax)} ${unit}` : `${fmt(traceMin)} ${unit}`.trim() || "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
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
