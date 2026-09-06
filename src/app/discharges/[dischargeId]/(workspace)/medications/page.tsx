"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, AlertTriangle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MedicationFormDialog } from "@/components/discharge/medication-form-dialog";
import { useWorkspace } from "@/components/discharge/workspace-context";
import { useAppStore } from "@/lib/store";
import { FREQUENCY_OPTIONS, parentPhrasePartsFor } from "@/lib/frequency";
import { formatDuration, formatBrandNames } from "@/lib/prescription-format";
import { cn } from "@/lib/utils";
import type { PrescriptionItem } from "@/types";
import { SectionFooterNav } from "@/components/discharge/section-footer-nav";

export default function MedicationsPage() {
  const { discharge, editable } = useWorkspace();
  const addPrescriptionItem = useAppStore((s) => s.addPrescriptionItem);
  const updatePrescriptionItem = useAppStore((s) => s.updatePrescriptionItem);
  const removePrescriptionItem = useAppStore((s) => s.removePrescriptionItem);
  const drugs = useAppStore((s) => s.drugs);
  const formulations = useAppStore((s) => s.formulations);
  const frequencyPhrases = useAppStore((s) => s.frequencyPhrases);
  const DRUG_BY_ID = React.useMemo(() => Object.fromEntries(drugs.map((d) => [d.id, d])), [drugs]);
  const FORMULATION_BY_ID = React.useMemo(
    () => Object.fromEntries(formulations.map((f) => [f.id, f])),
    [formulations],
  );

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PrescriptionItem | undefined>(undefined);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const weightKg = discharge.content.growth.weightKg;
  const items = discharge.content.medications;

  function openAdd() {
    setEditing(undefined);
    setDialogOpen(true);
  }
  function openEdit(item: PrescriptionItem) {
    setEditing(item);
    setDialogOpen(true);
  }
  function handleSave(item: PrescriptionItem) {
    if (editing) {
      updatePrescriptionItem(discharge.id, item.id, item);
    } else {
      addPrescriptionItem(discharge.id, item);
    }
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-[18px] font-semibold text-foreground">Medications</h1>
        {editable && (
          <Button size="sm" onClick={openAdd}>
            <Plus className="size-4" /> Add Medication
          </Button>
        )}
      </div>
      <p className="mb-5 text-[13px] text-foreground-muted">
        Inpatient medications never automatically become discharge prescriptions — add each item
        explicitly here, or confirm it on the Reconciliation page.
      </p>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Discharge Medications ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-y border-border bg-muted/20 text-left text-[10.5px] uppercase tracking-wide text-foreground-subtle">
                    <th className="px-3 py-2 font-medium">Drug</th>
                    <th className="px-3 py-2 font-medium">Formulation</th>
                    <th className="px-3 py-2 font-medium">Dose</th>
                    <th className="px-3 py-2 font-medium">Route</th>
                    <th className="px-3 py-2 font-medium">Frequency</th>
                    <th className="px-3 py-2 font-medium">Duration</th>
                    <th className="px-3 py-2 font-medium">PRN</th>
                    <th className="w-20 px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const drug = DRUG_BY_ID[item.drugId];
                    const formulation = item.formulationId ? FORMULATION_BY_ID[item.formulationId] : undefined;
                    const freq = FREQUENCY_OPTIONS[item.frequencyCode];
                    const isExpanded = expanded === item.id;
                    return (
                      <React.Fragment key={item.id}>
                        <tr className="border-b border-border last:border-b-0 hover:bg-surface-hover/50">
                          <td className="px-3 py-2.5">
                            <button
                              onClick={() => setExpanded(isExpanded ? null : item.id)}
                              className="flex items-center gap-1 font-medium text-foreground"
                            >
                              <ChevronDown className={cn("size-3.5 text-foreground-subtle transition-transform", isExpanded && "rotate-180")} />
                              {drug?.name}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-foreground-muted">
                            {formulation?.strengthLabel ?? "—"}
                            {formulation && formatBrandNames(formulation.brandNames) && (
                              <span className="block text-[11px] text-foreground-subtle">
                                {formatBrandNames(formulation.brandNames)}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-medium text-primary-light">{item.trace.finalDoseLabel}</span>
                            {item.trace.isOverridden && (
                              <Badge variant="warning" className="ml-1.5">
                                Override
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-foreground-muted">{item.route}</td>
                          <td className="px-3 py-2.5 text-foreground-muted">{freq.label.split(" — ")[0]}</td>
                          <td className="px-3 py-2.5 text-foreground-muted">{formatDuration(item.duration)}</td>
                          <td className="px-3 py-2.5">
                            {item.prn ? <Badge variant="info">PRN</Badge> : <span className="text-foreground-subtle">—</span>}
                          </td>
                          <td className="px-3 py-2.5">
                            {editable && (
                              <div className="flex items-center gap-2">
                                <button onClick={() => openEdit(item)} className="text-foreground-subtle hover:text-foreground">
                                  <Pencil className="size-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    removePrescriptionItem(discharge.id, item.id);
                                    toast.info("Medication removed");
                                  }}
                                  className="text-foreground-subtle hover:text-danger"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="border-b border-border bg-muted/10 last:border-b-0">
                            <td colSpan={8} className="px-3 py-3">
                              <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-foreground-muted">
                                <TraceChip>{item.trace.weightKg} kg</TraceChip>
                                <span className="text-foreground-subtle">→</span>
                                <TraceChip>
                                  {item.trace.ruleLabel
                                    ? item.trace.ruleMgPerKgMax != null
                                      ? `${item.trace.ruleLabel} — used ${item.trace.mgPerKg} mg/kg (range ${item.trace.ruleMgPerKgMin}–${item.trace.ruleMgPerKgMax})`
                                      : item.trace.ruleLabel
                                    : "No rule"}
                                </TraceChip>
                                <span className="text-foreground-subtle">→</span>
                                <TraceChip>
                                  {item.trace.calculatedMgPerDose != null
                                    ? `${round1(item.trace.calculatedMgPerDose)} mg/dose`
                                    : item.trace.calculatedMgPerDay != null
                                      ? `${item.trace.calculatedMgPerDay} mg/day`
                                      : "—"}
                                </TraceChip>
                                <span className="text-foreground-subtle">→</span>
                                <TraceChip>
                                  {formulation
                                    ? formulation.strengthLabel + (formatBrandNames(formulation.brandNames) ? ` (${formatBrandNames(formulation.brandNames)})` : "")
                                    : "No formulation"}
                                </TraceChip>
                                <span className="text-foreground-subtle">→</span>
                                <TraceChip highlight>{item.trace.finalDoseLabel}</TraceChip>
                              </div>
                              {item.trace.isOverridden && item.trace.overrideReason && (
                                <p className="mt-1.5 text-[12px] text-foreground-muted">
                                  Override reason: {item.trace.overrideReason}
                                </p>
                              )}
                              {item.trace.hasSubstantialDiscrepancy && (
                                <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-warning">
                                  <AlertTriangle className="size-3.5" /> Override differs substantially from the calculated dose.
                                </p>
                              )}
                              {item.trace.cappedByMaxMgPerKgPerDay && (
                                <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-warning">
                                  <AlertTriangle className="size-3.5" /> Reduced to stay within this rule&apos;s daily maximum at the
                                  prescribed frequency.
                                </p>
                              )}
                              {item.prnIndication && (
                                <p className="mt-1.5 text-[12px] text-foreground-muted">PRN indication: {item.prnIndication}</p>
                              )}
                              {(() => {
                                const defaultParts = parentPhrasePartsFor(item.frequencyCode, "urdu_english", frequencyPhrases);
                                const urdu = item.parentInstructionUrduOverride || defaultParts.urdu;
                                const english = item.parentInstructionEnglishOverride || defaultParts.english;
                                return (
                                  <div className="mt-1.5 rounded-[var(--radius-sm)] border border-border bg-muted/20 px-2 py-1.5">
                                    <p className="text-[10.5px] font-semibold uppercase tracking-wide text-foreground-subtle">
                                      Parent instruction (prints per the Medications language setting)
                                    </p>
                                    {urdu && <p className="font-urdu text-[12.5px] text-foreground" dir="rtl">{urdu}</p>}
                                    {english && <p className="text-[12.5px] text-foreground-muted">{english}</p>}
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-10 text-center text-[13px] text-foreground-subtle">No discharge medications added yet.</p>
          )}
        </CardContent>
      </Card>

      {/* key forces a fresh mount per medication edited — see the matching
          comment in advice-packs/page.tsx for why this is needed. */}
      <MedicationFormDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        weightKg={weightKg}
        existing={editing}
        onSave={handleSave}
      />

      <SectionFooterNav />
    </div>
  );
}

function TraceChip({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-[var(--radius-full)] border px-2.5 py-1",
        highlight ? "border-primary/40 bg-primary/15 font-semibold text-primary-light" : "border-border-strong bg-surface",
      )}
    >
      {children}
    </span>
  );
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
