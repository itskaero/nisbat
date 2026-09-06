"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/components/discharge/workspace-context";
import { useAppStore } from "@/lib/store";
import type { ImmunizationStatus } from "@/types";
import { SectionFooterNav } from "@/components/discharge/section-footer-nav";

const OPTIONS: { value: ImmunizationStatus; label: string }[] = [
  { value: "up_to_date", label: "Up to date" },
  { value: "catch_up_required", label: "Catch-up required" },
  { value: "not_assessed", label: "Not assessed" },
  { value: "not_applicable", label: "Not applicable" },
];

export default function ImmunizationPage() {
  const { discharge, editable } = useWorkspace();
  const updateContent = useAppStore((s) => s.updateContent);
  const immunization = discharge.content.immunization;

  return (
    <div>
      <h1 className="mb-1 text-[18px] font-semibold text-foreground">Immunization</h1>
      <p className="mb-5 text-[13px] text-foreground-muted">Optional section.</p>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={immunization.status}
            onValueChange={(v) =>
              updateContent(discharge.id, (c) => {
                c.immunization.status = v as ImmunizationStatus;
              })
            }
          >
            {OPTIONS.map((o) => (
              <label key={o.value} className="flex items-center gap-2.5 text-[13px] text-foreground">
                <RadioGroupItem value={o.value} disabled={!editable} />
                {o.label}
              </label>
            ))}
          </RadioGroup>

          {immunization.status === "catch_up_required" && (
            <div>
              <Label>Vaccines due</Label>
              <Input
                className="mt-1.5"
                disabled={!editable}
                value={immunization.vaccinesDue ?? ""}
                onChange={(e) =>
                  updateContent(discharge.id, (c) => {
                    c.immunization.vaccinesDue = e.target.value;
                  })
                }
                placeholder="e.g. Measles-2, DTaP booster"
              />
            </div>
          )}

          <div>
            <Label recommended>Note</Label>
            <Textarea
              className="mt-1.5"
              disabled={!editable}
              value={immunization.note ?? ""}
              onChange={(e) =>
                updateContent(discharge.id, (c) => {
                  c.immunization.note = e.target.value;
                })
              }
              placeholder="Any additional notes…"
            />
          </div>
        </CardContent>
      </Card>

      <SectionFooterNav />
    </div>
  );
}
