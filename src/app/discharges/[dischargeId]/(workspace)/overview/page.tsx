"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/components/discharge/workspace-context";
import { useAppStore } from "@/lib/store";
import { calculateAgeLabel, isInfant, isNeonate } from "@/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import { SectionFooterNav } from "@/components/discharge/section-footer-nav";

export default function OverviewPage() {
  const { discharge } = useWorkspace();
  const patient = useAppStore((s) => s.getPatient(discharge.patientId))!;
  const admission = useAppStore((s) => s.getAdmission(discharge.admissionId))!;

  const ageFlag = isNeonate(patient.dob) ? "Neonate" : isInfant(patient.dob) ? "Infant" : null;

  return (
    <div>
      <h1 className="mb-1 text-[18px] font-semibold text-foreground">Overview</h1>
      <p className="mb-5 text-[13px] text-foreground-muted">
        Auto-populated from patient and admission records. Edit these in the admissions record —
        Nisbat never invents or edits factual identifiers here.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Patient</CardTitle>
            {ageFlag && <Badge variant="info">{ageFlag}</Badge>}
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Fact label="Name" value={patient.name} />
            <Fact label="MR Number" value={patient.mrNumber} />
            <Fact label="Date of Birth" value={`${formatDate(patient.dob)} (${calculateAgeLabel(patient.dob)})`} />
            <Fact label="Sex" value={patient.sex} />
            <Fact label="Father / Guardian" value={patient.fatherGuardianName} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Fact label="Ward / Bed" value={admission.wardBed} />
            <Fact label="Date of Admission" value={formatDate(admission.admissionDate)} />
            <Fact label="Reason for Admission" value={admission.reasonForAdmission} />
            <Fact label="Weight" value={`${admission.weightKg} kg`} />
            {admission.heightCm && <Fact label="Height / Length" value={`${admission.heightCm} cm`} />}
            <Fact
              label="Allergy Status"
              value={
                admission.allergy.status === "documented"
                  ? admission.allergy.allergies.join(", ")
                  : admission.allergy.status === "none_known"
                    ? "No known drug allergy"
                    : "Not documented"
              }
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>This Discharge</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Fact label="Revision" value={`#${discharge.revisionNumber}`} />
          <Fact label="Prepared by" value={discharge.preparedByName} />
          <Fact label="Created" value={formatDateTime(discharge.createdAt)} />
          <Fact label="Last updated" value={formatDateTime(discharge.updatedAt)} />
        </CardContent>
      </Card>

      <SectionFooterNav />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-foreground-subtle">{label}</div>
      <div className="text-[13px] font-medium capitalize text-foreground">{value}</div>
    </div>
  );
}
