"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { useWorkspace } from "@/components/discharge/workspace-context";
import { useAppStore } from "@/lib/store";
import { EXAM_CHIPS, resolveChipsBySystem } from "@/lib/clinical-vocab";
import { EXAM_SYSTEMS, type ExamSystem } from "@/types";
import { SectionFooterNav } from "@/components/discharge/section-footer-nav";

const LABELS: Record<ExamSystem, string> = {
  general: "General Examination",
  respiratory: "Respiratory System",
  cvs: "Cardiovascular System",
  cns: "CNS",
  abdomen: "Abdomen",
  ent: "ENT",
  skin: "Skin",
  musculoskeletal: "Musculoskeletal",
  other: "Other / Custom",
};

export default function ExaminationPage() {
  const { discharge, editable } = useWorkspace();
  const updateContent = useAppStore((s) => s.updateContent);
  const vocabularyLists = useAppStore((s) => s.vocabularyLists);
  const examination = discharge.content.examination;
  const examChips = resolveChipsBySystem(vocabularyLists, "exam_chips", EXAM_CHIPS);

  function toggleChip(system: ExamSystem, chip: string) {
    updateContent(discharge.id, (c) => {
      const sel = c.examination[system].selected;
      c.examination[system].selected = sel.includes(chip) ? sel.filter((x) => x !== chip) : [...sel, chip];
    });
  }

  function setNote(system: ExamSystem, note: string) {
    updateContent(discharge.id, (c) => {
      c.examination[system].note = note;
    });
  }

  return (
    <div>
      <h1 className="mb-1 text-[18px] font-semibold text-foreground">Examination</h1>
      <p className="mb-5 text-[13px] text-foreground-muted">
        Chips plus free text per system. Type to autocomplete, e.g. “crep” → Crepitations.
      </p>

      <Card className="divide-y-0 px-4">
        {EXAM_SYSTEMS.filter((s) => s !== "other").map((system) => (
          <CollapsibleSection
            key={system}
            title={LABELS[system]}
            defaultOpen={system === "general" || system === "respiratory"}
          >
            <ExamSystemEditor
              chips={examChips[system] ?? []}
              selected={examination[system].selected}
              note={examination[system].note}
              editable={editable}
              onToggleChip={(chip) => toggleChip(system, chip)}
              onNoteChange={(note) => setNote(system, note)}
            />
          </CollapsibleSection>
        ))}
        <CollapsibleSection title={LABELS.other}>
          <Textarea
            disabled={!editable}
            value={examination.other.note}
            onChange={(e) => setNote("other", e.target.value)}
            placeholder="Any additional examination findings…"
            className="min-h-16"
          />
        </CollapsibleSection>
      </Card>

      <SectionFooterNav />
    </div>
  );
}

function ExamSystemEditor({
  chips,
  selected,
  note,
  editable,
  onToggleChip,
  onNoteChange,
}: {
  chips: string[];
  selected: string[];
  note: string;
  editable: boolean;
  onToggleChip: (chip: string) => void;
  onNoteChange: (note: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const suggestions = q ? chips.filter((c) => c.toLowerCase().includes(q)) : [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <Chip key={chip} selected={selected.includes(chip)} disabled={!editable} onClick={() => editable && onToggleChip(chip)}>
            {chip}
          </Chip>
        ))}
      </div>

      {editable && (
        <div className="relative max-w-xs">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to find a finding…"
            className="h-8 text-[12px]"
          />
          {suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-[var(--radius-md)] border border-border-strong bg-surface-raised shadow-2xl">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onToggleChip(s);
                    setQuery("");
                  }}
                  className="block w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-surface-hover"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="mb-1 block text-[12px] text-foreground-subtle">Custom findings:</label>
        <Textarea
          disabled={!editable}
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Free text findings…"
          className="min-h-14"
        />
      </div>
    </div>
  );
}
