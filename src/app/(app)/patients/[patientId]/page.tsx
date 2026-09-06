"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DischargeStatusBadge } from "@/components/discharge/status-badge";
import { useAppStore } from "@/lib/store";
import { calculateAgeLabel } from "@/types";
import { formatDate } from "@/lib/utils";

export default function PatientHistoryPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);
  const router = useRouter();
  const patient = useAppStore((s) => s.getPatient(patientId));
  const allAdmissions = useAppStore((s) => s.admissions);
  const allDischarges = useAppStore((s) => s.discharges);
  const createDischarge = useAppStore((s) => s.createDischarge);

  const admissions = allAdmissions.filter((a) => a.patientId === patientId);
  const discharges = allDischarges.filter((d) => !d.archived);

  if (!patient) {
    return (
      <div className="p-6 text-foreground-muted">
        Patient not found. <Link href="/search" className="text-primary-light">Search again</Link>
      </div>
    );
  }

  const sortedAdmissions = [...admissions].sort((a, b) => b.admissionDate.localeCompare(a.admissionDate));

  return (
    <div className="mx-auto max-w-[1100px] p-6">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1.5 text-[13px] text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-4">
          <div>
            <div className="text-[18px] font-semibold text-foreground">{patient.name}</div>
            <div className="text-[13px] text-foreground-muted">
              {calculateAgeLabel(patient.dob)} · {patient.sex === "male" ? "Male" : patient.sex === "female" ? "Female" : "Other"} · MR {patient.mrNumber}
            </div>
          </div>
          <InfoField label="Guardian" value={patient.fatherGuardianName} />
          <InfoField label="Date of Birth" value={formatDate(patient.dob)} />
          {patient.contactPhone && (
            <InfoField label="Contact" value={patient.contactPhone} icon={Phone} />
          )}
          {patient.address && <InfoField label="Address" value={patient.address} icon={MapPin} />}
        </CardContent>
      </Card>

      <h2 className="mb-3 text-[15px] font-semibold text-foreground">Admissions &amp; Discharges</h2>
      <div className="space-y-3">
        {sortedAdmissions.map((admission) => {
          const admissionDischarges = discharges
            .filter((d) => d.admissionId === admission.id)
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
          const latest = admissionDischarges[0];

          return (
            <Card key={admission.id}>
              <CardHeader>
                <div>
                  <CardTitle>
                    {formatDate(admission.admissionDate)}
                    {admission.dischargeDate ? ` → ${formatDate(admission.dischargeDate)}` : " → present"}
                  </CardTitle>
                  <p className="mt-0.5 text-[13px] text-foreground-muted">
                    {admission.reasonForAdmission} · {admission.wardBed} · {admission.weightKg} kg
                  </p>
                </div>
                {admission.status === "active" ? (
                  <Badge variant="info">Active</Badge>
                ) : (
                  <Badge variant="neutral">Discharged</Badge>
                )}
              </CardHeader>
              <CardContent>
                {admissionDischarges.length === 0 ? (
                  <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-dashed border-border-strong px-3 py-2.5">
                    <span className="text-[13px] text-foreground-subtle">No discharge started for this admission yet.</span>
                    <Button
                      size="sm"
                      onClick={() => {
                        const id = createDischarge(admission.id);
                        router.push(`/discharges/${id}/diagnosis`);
                      }}
                    >
                      Start Discharge
                    </Button>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {admissionDischarges.map((d) => (
                      <li key={d.id} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-3">
                          <DischargeStatusBadge status={d.status} />
                          <span className="text-[13px] text-foreground-muted">
                            Rev {d.revisionNumber} · {d.content.diagnosis.primary?.label ?? "No diagnosis yet"} · prepared by{" "}
                            {d.preparedByName}
                          </span>
                        </div>
                        <Link
                          href={d.status === "completed" ? `/discharges/${d.id}/print` : `/discharges/${d.id}/diagnosis`}
                          className="text-[13px] font-medium text-primary-light hover:underline"
                        >
                          {d.status === "completed" ? "View" : "Continue"}
                        </Link>
                      </li>
                    ))}
                    {latest === admissionDischarges[0] && admission.status === "active" && (
                      <li className="pt-2.5" />
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
        {sortedAdmissions.length === 0 && (
          <p className="py-10 text-center text-[13px] text-foreground-subtle">No admissions recorded.</p>
        )}
      </div>
    </div>
  );
}

function InfoField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-foreground-subtle">{label}</div>
      <div className="flex items-center gap-1.5 text-[13px] text-foreground">
        {Icon && <Icon className="size-3.5 text-foreground-subtle" />}
        {value}
      </div>
    </div>
  );
}
