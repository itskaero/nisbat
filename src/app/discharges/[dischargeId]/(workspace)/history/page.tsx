"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Chip } from "@/components/ui/chip";
import { Textarea } from "@/components/ui/textarea";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { useWorkspace } from "@/components/discharge/workspace-context";
import { useAppStore } from "@/lib/store";
import { HISTORY_CHIPS, resolveChipsBySystem } from "@/lib/clinical-vocab";
import { HISTORY_CATEGORIES, type HistoryCategory } from "@/types";
import { SectionFooterNav } from "@/components/discharge/section-footer-nav";

const LABELS: Record<HistoryCategory, string> = {
  birth: "Birth / Antenatal",
  immunization: "Immunization",
  past_medical: "Past Medical / Surgical",
  family: "Family History",
  allergy: "Allergy",
  developmental: "Developmental",
};

export default function HistoryPage() {
  const { discharge, editable } = useWorkspace();
  const updateContent = useAppStore((s) => s.updateContent);
  const vocabularyLists = useAppStore((s) => s.vocabularyLists);
  const historyChips = resolveChipsBySystem(vocabularyLists, "history_chips", HISTORY_CHIPS);
  const { categories, narrative } = discharge.content.history;

  function toggle(category: HistoryCategory, label: string) {
    updateContent(discharge.id, (c) => {
      const sel = c.history.categories[category].selected;
      c.history.categories[category].selected = sel.includes(label) ? sel.filter((x) => x !== label) : [...sel, label];
    });
  }

  function setNote(category: HistoryCategory, note: string) {
    updateContent(discharge.id, (c) => {
      c.history.categories[category].note = note;
    });
  }

  return (
    <div>
      <h1 className="mb-1 text-[18px] font-semibold text-foreground">History</h1>
      <p className="mb-5 text-[13px] text-foreground-muted">
        Chips grouped by category, each with its own free text alongside.
      </p>

      <Card className="mb-4 divide-y-0 px-4">
        {HISTORY_CATEGORIES.map((category) => {
          const { selected, note } = categories[category];
          return (
            <CollapsibleSection
              key={category}
              title={LABELS[category]}
              defaultOpen={category === "birth" || category === "past_medical"}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {(historyChips[category] ?? []).map((label) => (
                    <Chip
                      key={label}
                      selected={selected.includes(label)}
                      disabled={!editable}
                      onClick={() => editable && toggle(category, label)}
                    >
                      {label}
                    </Chip>
                  ))}
                </div>
                <Textarea
                  disabled={!editable}
                  value={note}
                  onChange={(e) => setNote(category, e.target.value)}
                  placeholder={`Additional ${LABELS[category].toLowerCase()} details…`}
                  className="min-h-14"
                />
              </div>
            </CollapsibleSection>
          );
        })}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overall Narrative</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="hist-narrative" recommended>
            Free text
          </Label>
          <Textarea
            id="hist-narrative"
            disabled={!editable}
            value={narrative}
            onChange={(e) =>
              updateContent(discharge.id, (c) => {
                c.history.narrative = e.target.value;
              })
            }
            placeholder="Anything not captured by the categories above…"
            className="mt-1.5 min-h-20"
          />
        </CardContent>
      </Card>

      <SectionFooterNav />
    </div>
  );
}
