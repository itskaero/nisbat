"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useWorkspace } from "@/components/discharge/workspace-context";
import { useAppStore } from "@/lib/store";
import { genId } from "@/lib/utils";
import type { ReconciliationDecision, ReconciliationItem, ReconciliationSourceType } from "@/types";
import { SectionFooterNav } from "@/components/discharge/section-footer-nav";

const DECISIONS: { value: ReconciliationDecision; label: string }[] = [
  { value: "continue", label: "Continue" },
  { value: "stop", label: "Stop" },
  { value: "change", label: "Change" },
  { value: "new", label: "New" },
  { value: "not_applicable", label: "Not Applicable" },
];

export default function ReconciliationPage() {
  const { discharge, editable } = useWorkspace();
  const addReconciliationItem = useAppStore((s) => s.addReconciliationItem);
  const updateReconciliationItem = useAppStore((s) => s.updateReconciliationItem);
  const removeReconciliationItem = useAppStore((s) => s.removeReconciliationItem);

  const home = discharge.content.reconciliation.filter((r) => r.sourceType === "home");
  const inpatient = discharge.content.reconciliation.filter((r) => r.sourceType === "inpatient");
  const needsDecision = discharge.content.reconciliation.filter((r) => r.decision !== "not_applicable" && r.decision !== "stop" && !r.linkedPrescriptionItemId);

  return (
    <div>
      <h1 className="mb-1 text-[18px] font-semibold text-foreground">Medication Reconciliation</h1>
      <p className="mb-5 text-[13px] text-foreground-muted">
        Inpatient medications never automatically become discharge prescriptions. Record a
        decision for each item, then add matching entries on the Medications page.
      </p>

      <ReconciliationGroup
        title="Home / Pre-admission Medications"
        sourceType="home"
        items={home}
        editable={editable}
        onAdd={(item) => addReconciliationItem(discharge.id, item)}
        onUpdate={(id, patch) => updateReconciliationItem(discharge.id, id, patch)}
        onRemove={(id) => removeReconciliationItem(discharge.id, id)}
      />

      <ReconciliationGroup
        title="Inpatient Medications / Treatment"
        sourceType="inpatient"
        items={inpatient}
        editable={editable}
        onAdd={(item) => addReconciliationItem(discharge.id, item)}
        onUpdate={(id, patch) => updateReconciliationItem(discharge.id, id, patch)}
        onRemove={(id) => removeReconciliationItem(discharge.id, id)}
      />

      {needsDecision.length > 0 && (
        <Card className="mt-4 border-info/25 bg-info/5">
          <CardContent className="flex items-center justify-between pt-4 text-[13px]">
            <span className="text-foreground-muted">
              {needsDecision.length} item(s) marked Continue/Change/New — add the matching entry on
              the Medications page to complete the discharge prescription.
            </span>
            <Link href={`/discharges/${discharge.id}/medications`}>
              <Button size="sm" variant="secondary">
                Go to Medications
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <SectionFooterNav />
    </div>
  );
}

function ReconciliationGroup({
  title,
  sourceType,
  items,
  editable,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  sourceType: ReconciliationSourceType;
  items: ReconciliationItem[];
  editable: boolean;
  onAdd: (item: ReconciliationItem) => void;
  onUpdate: (id: string, patch: Partial<ReconciliationItem>) => void;
  onRemove: (id: string) => void;
}) {
  const [drugName, setDrugName] = React.useState("");
  const [detail, setDetail] = React.useState("");

  function add() {
    if (!drugName.trim()) return;
    onAdd({
      id: genId("rec"),
      sourceType,
      drugName: drugName.trim(),
      detailAsTaken: detail.trim(),
      decision: "not_applicable" as ReconciliationDecision,
    });
    setDrugName("");
    setDetail("");
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {editable && (
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-32">
              <label className="mb-1 block text-[12px] text-foreground-subtle">Drug</label>
              <Input value={drugName} onChange={(e) => setDrugName(e.target.value)} placeholder="e.g. Ceftriaxone (IV)" />
            </div>
            <div className="flex-[2] min-w-40">
              <label className="mb-1 block text-[12px] text-foreground-subtle">As taken/given</label>
              <Input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Dose, form, frequency…" onKeyDown={(e) => e.key === "Enter" && add()} />
            </div>
            <Button onClick={add}>
              <Plus className="size-4" /> Add
            </Button>
          </div>
        )}

        {items.length > 0 ? (
          <div className="space-y-1.5">
            {items.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-[var(--radius-sm)] bg-muted/40 px-3 py-2">
                <div className="min-w-32 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-foreground">{item.drugName}</span>
                    {item.linkedTreatmentEventId && <Badge variant="info">From Treatment</Badge>}
                  </div>
                  {item.detailAsTaken && <div className="text-[12px] text-foreground-subtle">{item.detailAsTaken}</div>}
                </div>
                <Select disabled={!editable} value={item.decision} onValueChange={(v) => onUpdate(item.id, { decision: v as ReconciliationDecision })}>
                  <SelectTrigger className="h-8 w-40 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DECISIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editable && (
                  <button onClick={() => onRemove(item.id)} className="text-foreground-subtle hover:text-danger">
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-[13px] text-foreground-subtle">No items recorded.</p>
        )}
      </CardContent>
    </Card>
  );
}
