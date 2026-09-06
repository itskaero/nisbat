"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DischargeStatusBadge } from "@/components/discharge/status-badge";
import { useAppStore } from "@/lib/store";
import { formatDateTime, timeAgo } from "@/lib/utils";
import type { DischargeStatus } from "@/types";

type FilterKey = "all" | DischargeStatus | "returned" | "printed";

export default function MyDischargesPage() {
  return (
    <React.Suspense fallback={null}>
      <MyDischargesContent />
    </React.Suspense>
  );
}

function MyDischargesContent() {
  const searchParams = useSearchParams();
  const initial = (searchParams.get("status") as FilterKey) ?? "all";
  const [filter, setFilter] = React.useState<FilterKey>(initial);

  const patients = useAppStore((s) => s.patients);
  const admissions = useAppStore((s) => s.admissions);
  const currentUser = useAppStore((s) => s.getCurrentUser());
  const allDischarges = useAppStore((s) => s.discharges);
  const discharges = allDischarges
    .filter((d) => !d.archived)
    .filter((d) => currentUser.role === "sr_faculty" || d.preparedById === currentUser.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const filtered = discharges.filter((d) => {
    if (filter === "all") return true;
    if (filter === "returned") return d.status === "draft" && d.auditTrail.at(-1)?.action === "returned_by_reviewer";
    if (filter === "printed") return d.status === "pending_sr_review" && d.printEvents.length > 0;
    return d.status === filter;
  });

  return (
    <div className="mx-auto max-w-[1100px] p-6">
      <h1 className="mb-5 text-[20px] font-semibold text-foreground">My Discharges</h1>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="pending_sr_review">Awaiting Review</TabsTrigger>
          <TabsTrigger value="returned">Returned</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {filtered.map((d) => {
              const patient = patients.find((p) => p.id === d.patientId);
              const admission = admissions.find((a) => a.id === d.admissionId);
              return (
                <li key={d.id}>
                  <Link
                    href={d.status === "completed" ? `/discharges/${d.id}/print` : `/discharges/${d.id}/diagnosis`}
                    className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface-hover"
                  >
                    <div>
                      <div className="text-[13px] font-medium text-foreground">
                        {patient?.name ?? "Unknown patient"}{" "}
                        <span className="font-normal text-foreground-subtle">
                          MR {patient?.mrNumber} · {admission?.wardBed}
                        </span>
                      </div>
                      <div className="text-[12px] text-foreground-subtle">
                        {d.content.diagnosis.primary?.label ?? "No diagnosis yet"} · Rev {d.revisionNumber} · updated{" "}
                        {/* the persisted store can diverge from the server's static seed snapshot by
                            hydration time, so this relative string can legitimately differ from SSR */}
                        <span suppressHydrationWarning>{timeAgo(d.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="hidden text-[12px] text-foreground-subtle sm:inline">
                        {formatDateTime(d.updatedAt)}
                      </span>
                      <DischargeStatusBadge status={d.status} />
                    </div>
                  </Link>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-4 py-10 text-center text-[13px] text-foreground-subtle">No discharges in this view.</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
