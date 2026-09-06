"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DischargeStatusBadge } from "@/components/discharge/status-badge";
import { useAppStore } from "@/lib/store";
import { DISCHARGE_STATUSES, STATUS_LABELS } from "@/types";

export default function ReportsPage() {
  const allDischarges = useAppStore((s) => s.discharges);
  const discharges = allDischarges.filter((d) => !d.archived);
  const patients = useAppStore((s) => s.patients);

  const byStatus = DISCHARGE_STATUSES.map((status) => ({
    status,
    count: discharges.filter((d) => d.status === status).length,
  }));

  const byPreparer = Object.entries(
    discharges.reduce<Record<string, number>>((acc, d) => {
      acc[d.preparedByName] = (acc[d.preparedByName] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="mx-auto max-w-[1100px] p-6">
      <h1 className="mb-1 text-[20px] font-semibold text-foreground">Reports</h1>
      <p className="mb-5 text-[13px] text-foreground-muted">
        Basic throughput across {discharges.length} discharge record(s) for {patients.length} patient(s).
      </p>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {byStatus.map(({ status, count }) => (
          <Card key={status}>
            <CardContent className="pt-4">
              <div className="text-[24px] font-semibold text-foreground">{count}</div>
              <DischargeStatusBadge status={status} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Discharges by Preparer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {byPreparer.map(([name, count]) => (
            <div key={name} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-[13px] text-foreground-muted">{name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(count / discharges.length) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-[13px] text-foreground">{count}</span>
            </div>
          ))}
          {byPreparer.length === 0 && <p className="text-[13px] text-foreground-subtle">No data yet.</p>}
        </CardContent>
      </Card>

      <p className="mt-4 text-[11px] text-foreground-subtle">
        Status labels: {DISCHARGE_STATUSES.map((s) => STATUS_LABELS[s]).join(" → ")}
      </p>
    </div>
  );
}
