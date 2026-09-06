"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileEdit, ClipboardCheck, RotateCcw, Printer, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DischargeStatusBadge } from "@/components/discharge/status-badge";
import { useAppStore } from "@/lib/store";
import { calculateAgeLabel } from "@/types";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const patients = useAppStore((s) => s.patients);
  const admissions = useAppStore((s) => s.admissions);
  const allDischarges = useAppStore((s) => s.discharges);
  const currentUser = useAppStore((s) => s.getCurrentUser());
  const createDischarge = useAppStore((s) => s.createDischarge);

  // derived in the component body, not inside the selector — a selector that
  // allocates a new array/object on every call breaks useSyncExternalStore's
  // reference-equality check and causes an infinite render loop.
  const discharges = allDischarges.filter((d) => !d.archived);

  const myDischarges =
    currentUser.role === "sr_faculty"
      ? discharges
      : discharges.filter((d) => d.preparedById === currentUser.id);

  const workCounts = {
    drafts: myDischarges.filter((d) => d.status === "draft").length,
    awaitingReview: myDischarges.filter((d) => d.status === "pending_sr_review").length,
    returned: myDischarges.filter(
      (d) => d.status === "draft" && d.auditTrail.at(-1)?.action === "returned_by_reviewer",
    ).length,
    printedAwaitingSignature: myDischarges.filter(
      (d) => d.status === "pending_sr_review" && d.printEvents.length > 0,
    ).length,
    completed: myDischarges.filter((d) => d.status === "completed").length,
  };

  const activeAdmissions = admissions
    .filter((a) => a.status === "active")
    .sort((a, b) => b.admissionDate.localeCompare(a.admissionDate));

  function handleStart(admissionId: string) {
    const id = createDischarge(admissionId);
    router.push(`/discharges/${id}/diagnosis`);
  }

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <h1 className="mb-5 text-[20px] font-semibold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_1fr]">
        {/* My Work */}
        <Card>
          <CardHeader>
            <CardTitle>My Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <WorkRow icon={FileEdit} label="Drafts" count={workCounts.drafts} href="/my-discharges?status=draft" />
            <WorkRow
              icon={ClipboardCheck}
              label="Awaiting SR Review"
              count={workCounts.awaitingReview}
              href="/my-discharges?status=pending_sr_review"
            />
            <WorkRow
              icon={RotateCcw}
              label="Returned by SR"
              count={workCounts.returned}
              href="/my-discharges?status=returned"
              tone="warning"
            />
            <WorkRow
              icon={Printer}
              label="Printed — Awaiting Signature"
              count={workCounts.printedAwaitingSignature}
              href="/my-discharges?status=printed"
            />
            <WorkRow
              icon={CheckCircle2}
              label="Completed"
              count={workCounts.completed}
              href="/my-discharges?status=completed"
              tone="success"
            />
          </CardContent>
        </Card>

        {/* Current Admissions */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Current Admissions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-y border-border text-left text-[11px] uppercase tracking-wide text-foreground-subtle">
                    <th className="px-4 py-2.5 font-medium">Patient</th>
                    <th className="px-4 py-2.5 font-medium">MR No.</th>
                    <th className="px-4 py-2.5 font-medium">Age / Sex</th>
                    <th className="px-4 py-2.5 font-medium">Ward / Bed</th>
                    <th className="px-4 py-2.5 font-medium">Admission</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAdmissions.map((a) => {
                    const patient = patients.find((p) => p.id === a.patientId);
                    if (!patient) return null;
                    const latest = discharges
                      .filter((d) => d.admissionId === a.id)
                      .sort((x, y) => y.updatedAt.localeCompare(x.updatedAt))[0];

                    return (
                      <tr key={a.id} className="border-b border-border last:border-b-0 hover:bg-surface-hover/50">
                        <td className="px-4 py-2.5">
                          <Link href={`/patients/${patient.id}`} className="font-medium text-foreground hover:text-primary-light">
                            {patient.name}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-foreground-muted">{patient.mrNumber}</td>
                        <td className="px-4 py-2.5 text-foreground-muted">
                          {calculateAgeLabel(patient.dob)} / {patient.sex === "male" ? "M" : "F"}
                        </td>
                        <td className="px-4 py-2.5 text-foreground-muted">{a.wardBed}</td>
                        <td className="px-4 py-2.5 text-foreground-muted">{formatDate(a.admissionDate)}</td>
                        <td className="px-4 py-2.5">
                          {latest ? (
                            <DischargeStatusBadge status={latest.status} />
                          ) : (
                            <Badge variant="success">Ready</Badge>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {latest ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => router.push(`/discharges/${latest.id}/diagnosis`)}
                            >
                              Continue
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => handleStart(a.id)}>
                              Start Discharge
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {activeAdmissions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-foreground-subtle">
                        No current admissions.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function WorkRow({
  icon: Icon,
  label,
  count,
  href,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  href: string;
  tone?: "warning" | "success";
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-2.5 py-2.5 transition-colors hover:bg-surface-hover"
    >
      <span className="flex items-center gap-2.5 text-[13px] text-foreground-muted">
        <Icon className="size-4 text-foreground-subtle" />
        {label}
      </span>
      <span
        className={
          "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold " +
          (tone === "warning"
            ? "bg-warning/15 text-warning"
            : tone === "success"
              ? "bg-success/15 text-success"
              : "bg-muted text-foreground-muted")
        }
      >
        {count}
      </span>
    </Link>
  );
}
