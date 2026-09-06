"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Chip } from "@/components/ui/chip";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/components/discharge/workspace-context";
import { useAppStore } from "@/lib/store";
import { DISCHARGE_CONDITION_CHIPS } from "@/lib/clinical-vocab";
import { SectionFooterNav } from "@/components/discharge/section-footer-nav";

export default function ClinicalCoursePage() {
  const { discharge, editable } = useWorkspace();
  const updateContent = useAppStore((s) => s.updateContent);
  const { courseNarrative } = discharge.content.treatment;
  const dischargeCondition = discharge.content.dischargeCondition;

  function toggleCondition(label: string) {
    updateContent(discharge.id, (c) => {
      c.dischargeCondition.selected = c.dischargeCondition.selected.includes(label)
        ? c.dischargeCondition.selected.filter((x) => x !== label)
        : [...c.dischargeCondition.selected, label];
    });
  }

  return (
    <div>
      <h1 className="mb-1 text-[18px] font-semibold text-foreground">Clinical Course</h1>
      <p className="mb-5 text-[13px] text-foreground-muted">
        Clinician-written narrative — Nisbat never auto-generates hospital course or clinical
        judgment.
      </p>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Hospital Course Narrative</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="course-narrative" required>
            Course &amp; response to treatment
          </Label>
          <Textarea
            id="course-narrative"
            disabled={!editable}
            value={courseNarrative}
            onChange={(e) =>
              updateContent(discharge.id, (c) => {
                c.treatment.courseNarrative = e.target.value;
              })
            }
            placeholder="Summarize the hospital course, response to treatment, and any complications…"
            className="mt-1.5 min-h-32"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Condition at Discharge</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {DISCHARGE_CONDITION_CHIPS.map((label) => (
              <Chip
                key={label}
                selected={dischargeCondition.selected.includes(label)}
                disabled={!editable}
                onClick={() => editable && toggleCondition(label)}
              >
                {label}
              </Chip>
            ))}
          </div>
          <Textarea
            disabled={!editable}
            value={dischargeCondition.note}
            onChange={(e) =>
              updateContent(discharge.id, (c) => {
                c.dischargeCondition.note = e.target.value;
              })
            }
            placeholder="Additional notes on discharge condition…"
            className="min-h-16"
          />
        </CardContent>
      </Card>

      <SectionFooterNav />
    </div>
  );
}
