"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DischargeStatusBadge } from "@/components/discharge/status-badge";
import { useAppStore } from "@/lib/store";
import { calculateAgeLabel } from "@/types";
import { formatDate } from "@/lib/utils";

export default function AdmissionsPage() {
  const router = useRouter();
  const [tab, setTab] = React.useState<"active" | "discharged">("active");
  const patients = useAppStore((s) => s.patients);
  const admissions = useAppStore((s) => s.admissions);
  const allDischarges = useAppStore((s) => s.discharges);
  const discharges = allDischarges.filter((d) => !d.archived);
  const createDischarge = useAppStore((s) => s.createDischarge);

  const rows = admissions
    .filter((a) => a.status === tab)
    .sort((a, b) => b.admissionDate.localeCompare(a.admissionDate));

  return (
    <div className="mx-auto max-w-[1300px] p-6">
      <h1 className="mb-5 text-[20px] font-semibold text-foreground">Admissions</h1>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "active" | "discharged")} className="mb-4">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="discharged">Discharged</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-y border-border text-left text-[11px] uppercase tracking-wide text-foreground-subtle">
                  <th className="px-4 py-2.5 font-medium">Patient</th>
                  <th className="px-4 py-2.5 font-medium">MR No.</th>
                  <th className="px-4 py-2.5 font-medium">Age / Sex</th>
                  <th className="px-4 py-2.5 font-medium">Ward / Bed</th>
                  <th className="px-4 py-2.5 font-medium">DOA</th>
                  <th className="px-4 py-2.5 font-medium">{tab === "discharged" ? "DOD" : "Reason"}</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
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
                      <td className="px-4 py-2.5 text-foreground-muted">
                        {tab === "discharged" ? formatDate(a.dischargeDate) : a.reasonForAdmission}
                      </td>
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
                            onClick={() =>
                              router.push(
                                latest.status === "completed"
                                  ? `/discharges/${latest.id}/print`
                                  : `/discharges/${latest.id}/diagnosis`,
                              )
                            }
                          >
                            {latest.status === "completed" ? "View" : "Continue"}
                          </Button>
                        ) : tab === "active" ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              const id = createDischarge(a.id);
                              router.push(`/discharges/${id}/diagnosis`);
                            }}
                          >
                            Start Discharge
                          </Button>
                        ) : (
                          <span className="text-foreground-subtle">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-foreground-subtle">
                      No {tab} admissions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
