"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useWorkspace } from "@/components/discharge/workspace-context";
import { useAppStore } from "@/lib/store";
import { TREATMENT_EVENT_TYPES, type TreatmentEventType } from "@/types";
import { TREATMENT_EVENT_LABELS, DRUG_LINKED_TREATMENT_TYPES } from "@/lib/clinical-vocab";
import { genId } from "@/lib/utils";
import { SectionFooterNav } from "@/components/discharge/section-footer-nav";

const NOT_IN_FORMULARY = "__none__";

function isDrugLinked(type: TreatmentEventType): boolean {
  return (DRUG_LINKED_TREATMENT_TYPES as readonly string[]).includes(type);
}

export default function TreatmentPage() {
  const { discharge, editable } = useWorkspace();
  const updateContent = useAppStore((s) => s.updateContent);
  const drugs = useAppStore((s) => s.drugs);
  const [adding, setAdding] = React.useState<TreatmentEventType | null>(null);
  const [drugId, setDrugId] = React.useState(NOT_IN_FORMULARY);
  const [detail, setDetail] = React.useState("");
  const events = discharge.content.treatment.events;

  function startAdding(type: TreatmentEventType) {
    setAdding(type);
    setDrugId(NOT_IN_FORMULARY);
    setDetail("");
  }

  function addEvent(type: TreatmentEventType) {
    const linkedDrugId = drugId !== NOT_IN_FORMULARY ? drugId : undefined;
    const drug = linkedDrugId ? drugs.find((d) => d.id === linkedDrugId) : undefined;
    const eventId = genId("tx");

    updateContent(discharge.id, (c) => {
      c.treatment.events.push({
        id: eventId,
        type,
        detail: detail.trim(),
        drugId: linkedDrugId,
        drugDoseLabel: linkedDrugId ? detail.trim() : undefined,
      });

      // Carry into Reconciliation — only when an actual formulary drug was
      // picked (CLAUDE.md rule 15: warn/degrade gracefully, never block —
      // a drug not yet in the formulary just stays free text, no carry).
      if (drug) {
        // De-dup: a repeat entry for the same still-undecided drug links to
        // the existing scaffold row instead of creating a second one. A
        // genuinely distinct course can still be entered manually below.
        const existing = c.reconciliation.find(
          (r) => r.sourceType === "inpatient" && r.drugName === drug.name && r.decision === "not_applicable",
        );
        if (existing) {
          existing.linkedTreatmentEventId = eventId;
          if (detail.trim()) existing.detailAsTaken = detail.trim();
        } else {
          c.reconciliation.push({
            id: genId("rec"),
            sourceType: "inpatient",
            drugName: drug.name,
            detailAsTaken: detail.trim(),
            decision: "not_applicable",
            linkedTreatmentEventId: eventId,
          });
        }
      }
    });
    setAdding(null);
    setDrugId(NOT_IN_FORMULARY);
    setDetail("");
  }

  function remove(id: string) {
    updateContent(discharge.id, (c) => {
      const event = c.treatment.events.find((e) => e.id === id);
      c.treatment.events = c.treatment.events.filter((e) => e.id !== id);
      if (!event?.drugId) return;

      const linked = c.reconciliation.find((r) => r.linkedTreatmentEventId === id);
      if (!linked) return;
      if (linked.decision === "not_applicable") {
        // No decision recorded yet — the scaffold row was only ever a
        // convenience, safe to remove with the event that created it.
        c.reconciliation = c.reconciliation.filter((r) => r.id !== linked.id);
      } else {
        // A real discharge decision already exists — never silently delete
        // it (CLAUDE.md rules 1/9). Detach it into an ordinary manual row.
        linked.linkedTreatmentEventId = undefined;
        toast.info("Reconciliation entry kept", {
          description: `"${linked.drugName}" already has a decision recorded — it's now a manual entry on Reconciliation.`,
        });
      }
    });
  }

  return (
    <div>
      <h1 className="mb-1 text-[18px] font-semibold text-foreground">Treatment</h1>
      <p className="mb-5 text-[13px] text-foreground-muted">
        Structured treatment events. This is separate from discharge medications.
      </p>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Add Treatment Event</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {TREATMENT_EVENT_TYPES.map((type) => (
              <Chip key={type} selected={adding === type} disabled={!editable} onClick={() => editable && startAdding(type)}>
                {TREATMENT_EVENT_LABELS[type]}
              </Chip>
            ))}
          </div>
          {adding && isDrugLinked(adding) && (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-48 flex-1">
                  <label className="mb-1 block text-[12px] text-foreground-subtle">Drug (from formulary)</label>
                  <Select value={drugId} onValueChange={setDrugId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NOT_IN_FORMULARY}>Not in formulary / free text only</SelectItem>
                      {drugs.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-48 flex-[2]">
                  <label className="mb-1 block text-[12px] text-foreground-subtle">Dose / route / frequency as given</label>
                  <Input
                    autoFocus
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addEvent(adding)}
                    placeholder="e.g. IV 50 mg/kg/day q8h"
                  />
                </div>
              </div>
              {drugId !== NOT_IN_FORMULARY && (
                <p className="text-[11.5px] text-foreground-subtle">
                  Adding this carries {drugs.find((d) => d.id === drugId)?.name} into Reconciliation as an
                  inpatient item awaiting a discharge decision.
                </p>
              )}
              <div className="flex items-center gap-2">
                <Button onClick={() => addEvent(adding)}>
                  <Plus className="size-4" /> Add
                </Button>
                <Button variant="ghost" onClick={() => setAdding(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {adding && !isDrugLinked(adding) && (
            <div className="mt-3 flex items-center gap-2">
              <Input
                autoFocus
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEvent(adding)}
                placeholder={`Detail for ${TREATMENT_EVENT_LABELS[adding]}, e.g. dose/duration…`}
                className="flex-1"
              />
              <Button onClick={() => addEvent(adding)}>
                <Plus className="size-4" /> Add
              </Button>
              <Button variant="ghost" onClick={() => setAdding(null)}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recorded Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <ul className="space-y-1.5">
              {events.map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-[var(--radius-sm)] bg-muted/40 px-3 py-2">
                  <span className="text-[13px]">
                    <span className="font-medium text-foreground">{TREATMENT_EVENT_LABELS[e.type]}</span>
                    {e.detail && <span className="text-foreground-muted"> — {e.detail}</span>}
                    {e.drugId && (
                      <Badge variant="info" className="ml-1.5">
                        In Reconciliation
                      </Badge>
                    )}
                  </span>
                  {editable && (
                    <button onClick={() => remove(e.id)} className="text-foreground-subtle hover:text-danger">
                      <X className="size-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-[13px] text-foreground-subtle">No treatment events recorded yet.</p>
          )}
        </CardContent>
      </Card>

      <SectionFooterNav />
    </div>
  );
}
