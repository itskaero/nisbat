"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useWorkspace } from "@/components/discharge/workspace-context";
import { useAppStore } from "@/lib/store";
import { ageInDays, isInfant, isNeonate } from "@/types";
import {
  weightForAgeZ,
  lengthHeightForAgeZ,
  bmiForAgeZ,
  headCircumferenceForAgeZ,
  WFA_LMS,
  LHFA_LMS,
  BFA_LMS,
  HCFA_LMS,
} from "@/lib/growth-calc";
import { GrowthIndicatorCard } from "@/components/discharge/growth-indicator";
import { SectionFooterNav } from "@/components/discharge/section-footer-nav";

export default function GrowthPage() {
  const { discharge, editable } = useWorkspace();
  const updateContent = useAppStore((s) => s.updateContent);
  const patient = useAppStore((s) => s.getPatient(discharge.patientId))!;
  const growth = discharge.content.growth;

  const infant = isInfant(patient.dob);
  const neonate = isNeonate(patient.dob);
  const days = ageInDays(patient.dob);
  const ageMonths = days / (365.25 / 12);
  const sex = patient.sex === "male" || patient.sex === "female" ? patient.sex : null;
  const outOfRange = ageMonths > 60;

  function set<K extends keyof typeof growth>(key: K, value: (typeof growth)[K]) {
    updateContent(discharge.id, (c) => {
      c.growth[key] = value;
      if (key === "weightKg" || key === "heightCm") {
        const w = key === "weightKg" ? (value as number) : c.growth.weightKg;
        const h = key === "heightCm" ? (value as number) : c.growth.heightCm;
        if (w && h) {
          const m = h / 100;
          c.growth.bmi = Math.round((w / (m * m)) * 10) / 10;
        }
      }
    });
  }

  const wfa = sex ? weightForAgeZ(sex, days, growth.weightKg) : null;
  const lhfa = sex && growth.heightCm ? lengthHeightForAgeZ(sex, days, growth.heightCm) : null;
  const bfa = sex && growth.bmi ? bmiForAgeZ(sex, days, growth.bmi) : null;
  const hcfa = sex && growth.headCircumferenceCm ? headCircumferenceForAgeZ(sex, days, growth.headCircumferenceCm) : null;

  return (
    <div>
      <h1 className="mb-1 text-[18px] font-semibold text-foreground">Growth</h1>
      <p className="mb-5 text-[13px] text-foreground-muted">
        Automatically age-driven — no need to manually classify infant/neonate.
        {neonate ? " Neonatal fields shown." : infant ? " Infant fields shown." : ""}
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Measurements</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Weight (kg)" required>
            <Input
              type="number"
              step="0.1"
              disabled={!editable}
              value={growth.weightKg}
              onChange={(e) => set("weightKg", parseFloat(e.target.value) || 0)}
            />
          </Field>
          <Field label={infant ? "Length (cm)" : "Height (cm)"}>
            <Input
              type="number"
              disabled={!editable}
              value={growth.heightCm ?? ""}
              onChange={(e) => set("heightCm", parseFloat(e.target.value) || undefined)}
            />
          </Field>
          <Field label="BMI">
            <Input disabled value={growth.bmi ?? "—"} className="text-foreground-muted" />
          </Field>
          <Field label="MUAC (cm)">
            <Input
              type="number"
              disabled={!editable}
              value={growth.muacCm ?? ""}
              onChange={(e) => set("muacCm", parseFloat(e.target.value) || undefined)}
            />
          </Field>
          {(neonate || infant) && (
            <Field label="Head Circumference (cm)">
              <Input
                type="number"
                disabled={!editable}
                value={growth.headCircumferenceCm ?? ""}
                onChange={(e) => set("headCircumferenceCm", parseFloat(e.target.value) || undefined)}
              />
            </Field>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>WHO Child Growth Standards</CardTitle>
        </CardHeader>
        <CardContent>
          {!sex ? (
            <p className="text-[13px] text-foreground-subtle">
              WHO Child Growth Standards publish separate tables for male and female only — not
              available for this patient&apos;s recorded sex.
            </p>
          ) : outOfRange ? (
            <p className="text-[13px] text-foreground-subtle">
              Outside the WHO Child Growth Standards age range (0–5 years / 0–60 months) — not
              computed. Enter an interpretation manually below if needed.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {wfa && (
                <GrowthIndicatorCard
                  title="Weight-for-age"
                  result={wfa}
                  table={WFA_LMS}
                  sex={sex}
                  ageMonths={ageMonths}
                  value={growth.weightKg}
                  unit="kg"
                />
              )}
              {lhfa && growth.heightCm && (
                <GrowthIndicatorCard
                  title={infant ? "Length-for-age" : "Height-for-age"}
                  result={lhfa}
                  table={LHFA_LMS}
                  sex={sex}
                  ageMonths={ageMonths}
                  value={growth.heightCm}
                  unit="cm"
                />
              )}
              {bfa && growth.bmi && (
                <GrowthIndicatorCard
                  title="BMI-for-age"
                  result={bfa}
                  table={BFA_LMS}
                  sex={sex}
                  ageMonths={ageMonths}
                  value={growth.bmi}
                  unit="kg/m²"
                />
              )}
              {hcfa && growth.headCircumferenceCm && (
                <GrowthIndicatorCard
                  title="Head circumference-for-age"
                  result={hcfa}
                  table={HCFA_LMS}
                  sex={sex}
                  ageMonths={ageMonths}
                  value={growth.headCircumferenceCm}
                  unit="cm"
                />
              )}
              {!lhfa && !bfa && !hcfa && (
                <p className="text-[13px] text-foreground-subtle lg:col-span-2">
                  Enter height/length (and head circumference for infants) above to see
                  height-for-age, BMI-for-age, and head-circumference-for-age.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Clinician Note</CardTitle>
        </CardHeader>
        <CardContent>
          <Label recommended>Additional interpretation or note (optional)</Label>
          <Input
            className="mt-1.5"
            disabled={!editable}
            value={growth.whoInterpretation ?? ""}
            onChange={(e) =>
              updateContent(discharge.id, (c) => {
                c.growth.whoInterpretation = e.target.value || undefined;
              })
            }
            placeholder="e.g. Consistent with catch-up growth since last visit"
          />

          <div className="mt-4 flex items-center justify-between rounded-[var(--radius-md)] border border-border px-3 py-2.5">
            <div>
              <div className="text-[13px] font-medium text-foreground">Show growth on printed discharge</div>
              <div className="text-[11px] text-foreground-subtle">Optional on the printed card</div>
            </div>
            <Switch checked={growth.showOnPrint} disabled={!editable} onCheckedChange={(v) => set("showOnPrint", v)} />
          </div>
        </CardContent>
      </Card>

      <SectionFooterNav />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
