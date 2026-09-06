"use client";

import * as React from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { calculateDose } from "@/lib/dose-calc";
import { FREQUENCY_OPTIONS, parentPhrasePartsFor } from "@/lib/frequency";
import { formatBrandNames } from "@/lib/prescription-format";
import { genId } from "@/lib/utils";
import { FREQUENCY_CODES, DURATION_PRESETS } from "@/types";
import type { PrescriptionItem, PrescriptionRoute, FrequencyCode, DurationPreset } from "@/types";

const ROUTES: PrescriptionRoute[] = ["PO", "IV", "IM", "PR", "Topical", "Inhaled", "Other"];
const ALL_BRANDS = "__all__";

export function MedicationFormDialog({
  open,
  onOpenChange,
  weightKg,
  existing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weightKg: number;
  existing?: PrescriptionItem;
  onSave: (item: PrescriptionItem) => void;
}) {
  const [drugId, setDrugId] = React.useState(existing?.drugId ?? "");
  const [doseRuleId, setDoseRuleId] = React.useState(existing?.doseRuleId ?? "");
  const [brandFilter, setBrandFilter] = React.useState(ALL_BRANDS);
  const [formulationId, setFormulationId] = React.useState(existing?.formulationId ?? "");
  const [selectedMgPerKg, setSelectedMgPerKg] = React.useState<number | undefined>(existing?.trace.mgPerKg);
  const [route, setRoute] = React.useState<PrescriptionRoute>(existing?.route ?? "PO");
  const [frequencyCode, setFrequencyCode] = React.useState<FrequencyCode>(existing?.frequencyCode ?? "BD");
  const [durationPreset, setDurationPreset] = React.useState<DurationPreset>(existing?.duration.preset ?? "5d");
  const [customDays, setCustomDays] = React.useState(existing?.duration.customDays?.toString() ?? "");
  const [prn, setPrn] = React.useState(existing?.prn ?? false);
  const [prnIndication, setPrnIndication] = React.useState(existing?.prnIndication ?? "");
  const [overrideOn, setOverrideOn] = React.useState(existing?.trace.isOverridden ?? false);
  const [overrideDose, setOverrideDose] = React.useState(
    existing?.trace.isOverridden ? String(existing.trace.calculatedMgPerDose ?? "") : "",
  );
  const [overrideReason, setOverrideReason] = React.useState(existing?.trace.overrideReason ?? "");
  const [customInstructionOn, setCustomInstructionOn] = React.useState(
    !!(existing?.parentInstructionUrduOverride || existing?.parentInstructionEnglishOverride),
  );
  const [instructionUr, setInstructionUr] = React.useState(existing?.parentInstructionUrduOverride ?? "");
  const [instructionEn, setInstructionEn] = React.useState(existing?.parentInstructionEnglishOverride ?? "");

  // Correction: the previous comment here claimed Radix unmounting Dialog's
  // portaled content on close meant each reopen was a fresh mount, so no key
  // was needed at the usage site. That's wrong — Radix only unmounts what
  // `DialogContent` itself renders; `MedicationFormDialog` (this component,
  // holding all the useState above, declared outside and above the <Dialog>
  // JSX it returns) is rendered unconditionally by the workspace page and
  // never unmounts, so its hooks never re-run their initializers. Editing
  // one medication then a different one showed the first one's stale
  // drug/rule/formulation/override fields — a real patient-safety-relevant
  // bug in a prescription entry form, not a cosmetic one. Fixed at the usage
  // site with a `key` tied to `existing?.id`, not an effect (this project's
  // lint config flags resetting state in an effect — React's own current
  // guidance prefers forcing a fresh mount instead).

  const doseRules = useAppStore((s) => s.doseRules);
  const drugs = useAppStore((s) => s.drugs);
  const frequencyPhrases = useAppStore((s) => s.frequencyPhrases);
  const formulations = useAppStore((s) => s.formulations);
  const drugFormulations = formulations.filter((f) => f.drugId === drugId);
  // Brand is a narrowing/navigation aid over the same formulation list, never
  // a second source of concentration — the formulation actually selected
  // still shows (and drives calculation from) its own explicit strength.
  const availableBrands = Array.from(new Set(drugFormulations.flatMap((f) => f.brandNames ?? [])));
  const visibleFormulations =
    brandFilter === ALL_BRANDS ? drugFormulations : drugFormulations.filter((f) => f.brandNames?.includes(brandFilter));
  const drugRules = doseRules.filter((r) => r.drugId === drugId && r.status === "published");
  const rule = doseRules.find((r) => r.id === doseRuleId);
  const formulation = formulations.find((f) => f.id === formulationId);
  const freq = FREQUENCY_OPTIONS[frequencyCode];

  function handleRuleChange(id: string) {
    setDoseRuleId(id);
    const r = doseRules.find((x) => x.id === id);
    if (r) {
      setFrequencyCode(r.defaultFrequencyCode);
      // Always start a freshly-picked range at its low end — never carry
      // over a slider position from a different rule, and never silently
      // jump to the high end.
      setSelectedMgPerKg(r.mgPerKgMax != null ? r.mgPerKg : undefined);
    }
  }

  function handleBrandChange(brand: string) {
    setBrandFilter(brand);
    if (brand === ALL_BRANDS) return;
    const matches = drugFormulations.filter((f) => f.brandNames?.includes(brand));
    // Narrows to exactly one real, already-concentration-defined formulation
    // → safe to auto-select (still shown and changeable, never hidden); more
    // than one (the same brand sold at more than one strength) still requires
    // the clinician to explicitly pick which strength, per CLAUDE.md rule 5.
    if (matches.length === 1) setFormulationId(matches[0].id);
  }

  const trace = calculateDose({
    weightKg,
    rule,
    timesPerDay: freq.timesPerDay,
    formulation,
    selectedMgPerKg,
    manualOverrideDose: overrideOn && overrideDose ? parseFloat(overrideDose) : undefined,
    overrideReason: overrideOn ? overrideReason : undefined,
  });

  const canSave = !!drugId && !!formulationId;

  function handleSave() {
    if (!canSave) return;
    const item: PrescriptionItem = {
      id: existing?.id ?? genId("rx"),
      drugId,
      formulationId,
      doseRuleId: doseRuleId || undefined,
      source: existing?.source ?? "new",
      reconciliationItemId: existing?.reconciliationItemId,
      trace,
      route,
      frequencyCode,
      duration: { preset: durationPreset, customDays: durationPreset === "custom" ? parseInt(customDays) || undefined : undefined },
      prn,
      prnIndication: prn ? prnIndication : undefined,
      parentInstructionUrduOverride: customInstructionOn && instructionUr.trim() ? instructionUr.trim() : undefined,
      parentInstructionEnglishOverride: customInstructionOn && instructionEn.trim() ? instructionEn.trim() : undefined,
    };
    onSave(item);
    toast.success(existing ? "Medication updated" : "Medication added");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Medication" : "Add Medication"}</DialogTitle>
          <DialogDescription>Exact formulation must be selected before a volume is calculated.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label required>Drug</Label>
              <Select
                value={drugId}
                onValueChange={(v) => {
                  setDrugId(v);
                  setDoseRuleId("");
                  setBrandFilter(ALL_BRANDS);
                  setFormulationId("");
                  setSelectedMgPerKg(undefined);
                }}
              >
                <SelectTrigger className="mt-1">
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

            <div className="col-span-2">
              <Label>Dose rule</Label>
              <Select value={doseRuleId} onValueChange={handleRuleChange} disabled={!drugId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={drugId ? "Select rule, or leave blank for manual…" : "Select a drug first"} />
                </SelectTrigger>
                <SelectContent>
                  {drugRules.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {rule?.mgPerKgMax != null && (
              <div className="col-span-2 rounded-[var(--radius-md)] border border-border px-3 py-2.5">
                <div className="mb-2 flex items-center justify-between">
                  <Label>Dose within range</Label>
                  <span className="text-[12.5px] font-medium text-foreground">
                    {selectedMgPerKg ?? rule.mgPerKg} mg/kg
                    <span className="text-foreground-subtle"> (range {rule.mgPerKg}–{rule.mgPerKgMax})</span>
                  </span>
                </div>
                <Slider
                  min={rule.mgPerKg}
                  max={rule.mgPerKgMax}
                  step={0.5}
                  value={[selectedMgPerKg ?? rule.mgPerKg ?? 0]}
                  onValueChange={([v]) => setSelectedMgPerKg(v)}
                />
              </div>
            )}

            {availableBrands.length > 0 && (
              <div className="col-span-2">
                <Label>Brand (optional)</Label>
                <Select value={brandFilter} onValueChange={handleBrandChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_BRANDS}>All brands</SelectItem>
                    {availableBrands.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-foreground-subtle">
                  Narrows the strength list below — the strength you confirm there is still what&apos;s
                  actually used to calculate the volume, never the brand name alone.
                </p>
              </div>
            )}

            <div className="col-span-2">
              <Label required>Formulation / Strength</Label>
              <Select value={formulationId} onValueChange={setFormulationId} disabled={!drugId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={drugId ? "Select exact formulation…" : "Select a drug first"} />
                </SelectTrigger>
                <SelectContent>
                  {visibleFormulations.map((f) => {
                    const brands = formatBrandNames(f.brandNames);
                    return (
                      <SelectItem key={f.id} value={f.id}>
                        {f.strengthLabel} ({f.form}){brands && ` — ${brands}`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Route</Label>
              <Select value={route} onValueChange={(v) => setRoute(v as PrescriptionRoute)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROUTES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Frequency</Label>
              <Select value={frequencyCode} onValueChange={(v) => setFrequencyCode(v as FrequencyCode)}>
                <SelectTrigger className="mt-1">
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

            <div>
              <Label>Duration</Label>
              <Select value={durationPreset} onValueChange={(v) => setDurationPreset(v as DurationPreset)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_PRESETS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p === "custom" ? "Custom" : p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {durationPreset === "custom" && (
                <Input
                  className="mt-1.5"
                  type="number"
                  min={1}
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="Days"
                />
              )}
            </div>

            <div className="col-span-2 flex items-center justify-between rounded-[var(--radius-md)] border border-border px-3 py-2">
              <div>
                <div className="text-[13px] font-medium text-foreground">PRN</div>
                <div className="text-[11px] text-foreground-subtle">As-needed, not scheduled</div>
              </div>
              <Switch checked={prn} onCheckedChange={setPrn} />
            </div>
            {prn && (
              <Input
                className="col-span-2"
                value={prnIndication}
                onChange={(e) => setPrnIndication(e.target.value)}
                placeholder="Indication, e.g. for fever above 100.4°F"
              />
            )}
          </div>

          {/* Calculation trace */}
          <div className="rounded-[var(--radius-md)] border border-border-strong bg-muted/30 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-foreground-subtle">
              Calculation Trace
            </p>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] text-foreground-muted">
              <TraceStep>{weightKg} kg</TraceStep>
              <ArrowRight className="size-3 text-foreground-subtle" />
              <TraceStep>
                {rule
                  ? trace.ruleMgPerKgMax != null
                    ? `${rule.label} — using ${trace.mgPerKg} mg/kg`
                    : rule.label
                  : "No rule selected"}
              </TraceStep>
              <ArrowRight className="size-3 text-foreground-subtle" />
              <TraceStep>
                {trace.calculatedMgPerDay != null && !trace.calculatedMgPerDose
                  ? `${trace.calculatedMgPerDay} mg/day`
                  : trace.calculatedMgPerDose != null
                    ? `${round1(trace.calculatedMgPerDose)} mg/dose${trace.calculatedMgPerDay ? ` (of ${trace.calculatedMgPerDay} mg/day ÷ ${trace.timesPerDay})` : ""}`
                    : "—"}
              </TraceStep>
              <ArrowRight className="size-3 text-foreground-subtle" />
              <TraceStep>
                {formulation
                  ? formulation.strengthLabel + (formatBrandNames(formulation.brandNames) ? ` (${formatBrandNames(formulation.brandNames)})` : "")
                  : "No formulation selected"}
              </TraceStep>
              <ArrowRight className="size-3 text-foreground-subtle" />
              <TraceStep highlight>{trace.finalDoseLabel}</TraceStep>
            </div>

            {rule?.basis !== "topical_instruction" && (
              <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
                <div>
                  <div className="text-[13px] font-medium text-foreground">Manual override</div>
                  <div className="text-[11px] text-foreground-subtle">Overrides the per-dose mg amount above</div>
                </div>
                <Switch checked={overrideOn} onCheckedChange={setOverrideOn} />
              </div>
            )}
            {rule?.basis !== "topical_instruction" && overrideOn && (
              <div className="mt-2 space-y-2">
                <Input
                  type="number"
                  value={overrideDose}
                  onChange={(e) => setOverrideDose(e.target.value)}
                  placeholder="Override dose (mg per administration)"
                />
                <Textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Reason for override…"
                  className="min-h-14"
                />
              </div>
            )}
            {trace.hasSubstantialDiscrepancy && (
              <div className="mt-2 flex items-start gap-2 rounded-[var(--radius-sm)] border border-warning/30 bg-warning/10 px-2.5 py-2 text-[12px] text-warning">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                Override differs substantially (&gt;20%) from the calculated dose. You may still proceed.
              </div>
            )}
            {trace.cappedByMaxMgPerKgPerDay && (
              <div className="mt-2 flex items-start gap-2 rounded-[var(--radius-sm)] border border-warning/30 bg-warning/10 px-2.5 py-2 text-[12px] text-warning">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                Reduced to stay within this rule&apos;s daily maximum ({rule?.maxMgPerKgPerDay} mg/kg/day) at the
                chosen frequency. Review before confirming — you may still override.
              </div>
            )}
          </div>

          {/* Parent-facing instruction — what actually prints for the parent to
              read, not just the clinical trace above. Shown and editable here
              so it's never a silent background computation. */}
          <div className="rounded-[var(--radius-md)] border border-border-strong bg-muted/30 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-foreground-subtle">
              Parent Instruction (Urdu / English)
            </p>
            {(() => {
              const defaultParts = parentPhrasePartsFor(frequencyCode, "urdu_english", frequencyPhrases);
              return (
                <div className="rounded-[var(--radius-sm)] border border-border bg-surface px-2.5 py-2 text-[12.5px]">
                  <p className="font-urdu text-foreground" dir="rtl">{defaultParts.urdu}</p>
                  <p className="text-foreground-muted">{defaultParts.english}</p>
                  <p className="mt-1 text-[11px] text-foreground-subtle">
                    Default, from the selected frequency — this is what prints unless overridden below.
                  </p>
                </div>
              );
            })()}
            <div className="mt-2.5 flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium text-foreground">Custom instruction</div>
                <div className="text-[11px] text-foreground-subtle">
                  Replace the default above, e.g. to add a caution like &quot;on an empty stomach&quot;
                </div>
              </div>
              <Switch checked={customInstructionOn} onCheckedChange={setCustomInstructionOn} />
            </div>
            {customInstructionOn && (
              <div className="mt-2 space-y-2">
                <Textarea
                  className="font-urdu min-h-14"
                  dir="rtl"
                  value={instructionUr}
                  onChange={(e) => setInstructionUr(e.target.value)}
                  placeholder="اردو ہدایت"
                />
                <Textarea
                  className="min-h-14"
                  value={instructionEn}
                  onChange={(e) => setInstructionEn(e.target.value)}
                  placeholder="English instruction"
                />
                <p className="text-[11px] text-foreground-subtle">
                  Either language can be filled alone — the other still falls back to the computed default above
                  rather than printing blank.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button disabled={!canSave} onClick={handleSave}>
            {existing ? "Save Changes" : "Add Medication"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TraceStep({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <span
      className={
        "rounded-[var(--radius-full)] border px-2.5 py-1 " +
        (highlight ? "border-primary/40 bg-primary/15 font-semibold text-primary-light" : "border-border-strong bg-surface")
      }
    >
      {children}
    </span>
  );
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
