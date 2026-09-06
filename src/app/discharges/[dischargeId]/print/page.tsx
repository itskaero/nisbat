"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DischargeDocument } from "@/components/discharge/discharge-document";
import { useAppStore } from "@/lib/store";

const PAPER_MM: Record<string, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  Legal: { w: 216, h: 356 },
};

export default function PrintPreviewPage({ params }: { params: Promise<{ dischargeId: string }> }) {
  const { dischargeId } = use(params);
  const discharge = useAppStore((s) => s.getDischarge(dischargeId));
  const patient = useAppStore((s) => (discharge ? s.getPatient(discharge.patientId) : undefined));
  const admission = useAppStore((s) => (discharge ? s.getAdmission(discharge.admissionId) : undefined));
  const institutionalSettings = useAppStore((s) => s.institutionalSettings);

  if (!discharge || !patient || !admission) {
    return <div className="flex h-screen items-center justify-center text-foreground-subtle">Loading…</div>;
  }

  const paper = PAPER_MM[discharge.paperSize];

  return (
    <div className="min-h-screen bg-[#0b0c10]">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-5 py-3">
        <Link
          href={`/discharges/${dischargeId}/summary`}
          className="flex items-center gap-1.5 text-[13px] text-foreground-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to workspace
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-foreground-subtle">
            {discharge.paperSize} · {paper.w} × {paper.h} mm
          </span>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="size-4" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      <style>{`@media print { @page { size: ${paper.w}mm ${paper.h}mm; } }`}</style>

      <div className="flex justify-center py-8">
        <div
          className="print-page bg-white shadow-2xl"
          style={{ width: `${paper.w}mm`, minHeight: `${paper.h}mm`, padding: "14mm" }}
        >
          {/* table/thead trick: the patient-ID snippet inside <thead> repeats on every printed page */}
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <td>
                  <div className="mb-2 hidden text-[10px] text-[#64748b] print:block">
                    {patient.name} · MR {patient.mrNumber} — continued
                  </div>
                </td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <DischargeDocument
                    discharge={discharge}
                    patient={patient}
                    admission={admission}
                    institutionalSettings={institutionalSettings}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
