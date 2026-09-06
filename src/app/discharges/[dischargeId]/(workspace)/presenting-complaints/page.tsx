"use client";

import * as React from "react";
import { X, Plus, ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/tag-input";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { useWorkspace } from "@/components/discharge/workspace-context";
import { useAppStore } from "@/lib/store";
import { PRESENTING_COMPLAINT_CHIPS, COMPLAINT_PROMPTS, resolveChipsBySystem } from "@/lib/clinical-vocab";
import { genId, cn } from "@/lib/utils";
import { EXAM_SYSTEMS, type ExamSystem } from "@/types";
import { SectionFooterNav } from "@/components/discharge/section-footer-nav";

const LABELS: Record<ExamSystem, string> = {
  general: "General / Constitutional",
  respiratory: "Respiratory",
  cvs: "Cardiovascular",
  cns: "CNS / Neurological",
  abdomen: "GI / Abdomen",
  ent: "ENT",
  skin: "Skin",
  musculoskeletal: "Musculoskeletal",
  other: "Other / Custom",
};

export default function PresentingComplaintsPage() {
  const { discharge, editable } = useWorkspace();
  const updateContent = useAppStore((s) => s.updateContent);
  const vocabularyLists = useAppStore((s) => s.vocabularyLists);
  const complaintChips = resolveChipsBySystem(vocabularyLists, "presenting_complaint_chips", PRESENTING_COMPLAINT_CHIPS);
  const [customSymptom, setCustomSymptom] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const { complaints, narrative } = discharge.content.presentingComplaints;

  function toggleChip(symptom: string) {
    updateContent(discharge.id, (c) => {
      const existing = c.presentingComplaints.complaints.find((x) => x.symptom === symptom && !x.isCustom);
      if (existing) {
        c.presentingComplaints.complaints = c.presentingComplaints.complaints.filter((x) => x.id !== existing.id);
      } else {
        c.presentingComplaints.complaints.push({ id: genId("cx"), symptom, isCustom: false });
      }
    });
  }

  function addCustom() {
    if (!customSymptom.trim()) return;
    updateContent(discharge.id, (c) => {
      c.presentingComplaints.complaints.push({ id: genId("cx"), symptom: customSymptom.trim(), isCustom: true });
    });
    setCustomSymptom("");
  }

  function patchComplaint(id: string, patch: Partial<(typeof complaints)[number]>) {
    updateContent(discharge.id, (c) => {
      const item = c.presentingComplaints.complaints.find((x) => x.id === id);
      if (item) Object.assign(item, patch);
    });
  }

  function remove(id: string) {
    updateContent(discharge.id, (c) => {
      c.presentingComplaints.complaints = c.presentingComplaints.complaints.filter((x) => x.id !== id);
    });
    if (expandedId === id) setExpandedId(null);
  }

  return (
    <div>
      <h1 className="mb-1 text-[18px] font-semibold text-foreground">Presenting Complaints</h1>
      <p className="mb-5 text-[13px] text-foreground-muted">
        Chips grouped by system — a diagnosis in one system doesn&apos;t mean every complaint will
        be. Expand a selected complaint below for {COMPLAINT_PROMPTS.slice(1).join(", ").toLowerCase()}.
      </p>

      <Card className="mb-4 divide-y-0 px-4">
        {EXAM_SYSTEMS.filter((s) => s !== "other").map((system) => (
          <CollapsibleSection
            key={system}
            title={LABELS[system]}
            defaultOpen={system === "general" || system === "respiratory"}
          >
            <div className="flex flex-wrap gap-1.5">
              {(complaintChips[system] ?? []).map((symptom) => (
                <Chip
                  key={symptom}
                  selected={complaints.some((c) => c.symptom === symptom && !c.isCustom)}
                  onClick={() => editable && toggleChip(symptom)}
                  disabled={!editable}
                >
                  {symptom}
                </Chip>
              ))}
            </div>
          </CollapsibleSection>
        ))}
        <CollapsibleSection title={LABELS.other}>
          {editable && (
            <div className="flex items-center gap-1">
              <Input
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustom()}
                placeholder="Custom complaint…"
                className="h-8 w-56 text-[12px]"
              />
              <Button size="icon" variant="secondary" className="size-8" onClick={addCustom}>
                <Plus className="size-4" />
              </Button>
            </div>
          )}
        </CollapsibleSection>
      </Card>

      {complaints.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Selected Complaints ({complaints.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {complaints.map((c) => {
              const isExpanded = expandedId === c.id;
              return (
                <div key={c.id} className="rounded-[var(--radius-sm)] bg-muted/40 px-2.5 py-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      className="flex min-w-28 items-center gap-1 text-[13px] font-medium text-foreground"
                    >
                      <ChevronDown className={cn("size-3.5 shrink-0 text-foreground-subtle transition-transform", isExpanded && "rotate-180")} />
                      {c.symptom}
                    </button>
                    <Input
                      disabled={!editable}
                      value={c.duration ?? ""}
                      onChange={(e) => patchComplaint(c.id, { duration: e.target.value })}
                      placeholder="Duration, e.g. 3 days"
                      className="h-7 flex-1 text-[12px]"
                    />
                    {editable && (
                      <button onClick={() => remove(c.id)} className="text-foreground-subtle hover:text-danger">
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="mt-2 grid grid-cols-1 gap-2.5 border-t border-border pt-2.5 sm:grid-cols-2">
                      <div>
                        <Label className="text-[11px]">Onset</Label>
                        <Input
                          disabled={!editable}
                          value={c.onset ?? ""}
                          onChange={(e) => patchComplaint(c.id, { onset: e.target.value })}
                          placeholder="e.g. Sudden, or 2 days prior to admission"
                          className="mt-1 h-8 text-[12px]"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Progression</Label>
                        <Input
                          disabled={!editable}
                          value={c.progression ?? ""}
                          onChange={(e) => patchComplaint(c.id, { progression: e.target.value })}
                          placeholder="e.g. Progressively worsening"
                          className="mt-1 h-8 text-[12px]"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Associated symptoms</Label>
                        <div className="mt-1">
                          <TagInput
                            disabled={!editable}
                            value={c.associatedSymptoms ?? []}
                            onChange={(next) => patchComplaint(c.id, { associatedSymptoms: next })}
                            placeholder="Type and press Enter…"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-[11px]">Relevant history</Label>
                        <Input
                          disabled={!editable}
                          value={c.relevantHistory ?? ""}
                          onChange={(e) => patchComplaint(c.id, { relevantHistory: e.target.value })}
                          placeholder="e.g. Similar episode 2 months ago"
                          className="mt-1 h-8 text-[12px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Narrative</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="pc-narrative" recommended>
            Free text
          </Label>
          <Textarea
            id="pc-narrative"
            disabled={!editable}
            value={narrative}
            onChange={(e) =>
              updateContent(discharge.id, (c) => {
                c.presentingComplaints.narrative = e.target.value;
              })
            }
            placeholder="Describe onset, duration, progression, associated symptoms…"
            className="mt-1.5 min-h-24"
          />
        </CardContent>
      </Card>

      <SectionFooterNav />
    </div>
  );
}
