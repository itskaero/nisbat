import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { calculateAgeLabel, type Admission, type Patient } from "@/types";
import { formatDate } from "@/lib/utils";

export function PatientBanner({ patient, admission }: { patient: Patient; admission: Admission }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border bg-surface/80 px-5 py-2.5 backdrop-blur-sm">
      <div className="flex items-baseline gap-2">
        <span className="text-[14px] font-semibold text-foreground">{patient.name}</span>
        <span className="text-[12px] text-foreground-subtle">
          {calculateAgeLabel(patient.dob)} · {patient.sex === "male" ? "Male" : patient.sex === "female" ? "Female" : "Other"} · MR{" "}
          {patient.mrNumber}
        </span>
      </div>

      <Field label="DOA → DOD" value={`${formatDate(admission.admissionDate)} → ${admission.dischargeDate ? formatDate(admission.dischargeDate) : "—"}`} />
      <Field label="Ward/Bed" value={admission.wardBed} />
      <Field label="Weight" value={`${admission.weightKg} kg`} />

      <div className="ml-auto flex items-center gap-2">
        {admission.allergy.status === "documented" && admission.allergy.allergies.length > 0 ? (
          <Badge variant="danger">
            <ShieldAlert className="size-3" /> Allergy: {admission.allergy.allergies.join(", ")}
          </Badge>
        ) : admission.allergy.status === "none_known" ? (
          <Badge variant="success">No Known Drug Allergy</Badge>
        ) : (
          <Badge variant="outline">Allergy Not Documented</Badge>
        )}
        {admission.alerts.map((alert) => (
          <Badge key={alert} variant="danger">
            <AlertTriangle className="size-3" /> {alert}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5 text-[12px]">
      <span className="text-foreground-subtle">{label}</span>
      <span className="font-medium text-foreground-muted">{value}</span>
    </div>
  );
}
