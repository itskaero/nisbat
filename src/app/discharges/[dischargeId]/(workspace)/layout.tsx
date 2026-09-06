"use client";

import * as React from "react";
import { use } from "react";
import { WorkspaceSidebar } from "@/components/layout/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/layout/workspace-topbar";
import { PatientBanner } from "@/components/layout/patient-banner";
import { QuickOverview } from "@/components/discharge/quick-overview";
import { DischargeDocument } from "@/components/discharge/discharge-document";
import { WorkspaceProvider } from "@/components/discharge/workspace-context";
import { useAppStore } from "@/lib/store";
import { isDischargeEditable } from "@/lib/permissions";

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ dischargeId: string }>;
}) {
  const { dischargeId } = use(params);
  const [mode, setMode] = React.useState<"edit" | "preview">("edit");

  const discharge = useAppStore((s) => s.getDischarge(dischargeId));
  const patient = useAppStore((s) => (discharge ? s.getPatient(discharge.patientId) : undefined));
  const admission = useAppStore((s) => (discharge ? s.getAdmission(discharge.admissionId) : undefined));
  const institutionalSettings = useAppStore((s) => s.institutionalSettings);
  const currentUser = useAppStore((s) => s.getCurrentUser());

  if (!discharge || !patient || !admission) {
    // seed data may not have hydrated from localStorage yet on first paint
    return <div className="flex h-screen items-center justify-center text-foreground-subtle">Loading…</div>;
  }

  const editable = isDischargeEditable(discharge, currentUser);

  return (
    <WorkspaceProvider discharge={discharge} editable={editable}>
      <div className="flex h-screen overflow-hidden">
        <WorkspaceSidebar dischargeId={dischargeId} content={discharge.content} patientId={patient.id} />
        <div className="flex min-w-0 flex-1 flex-col">
          <WorkspaceTopbar discharge={discharge} patient={patient} mode={mode} onModeChange={setMode} />
          <PatientBanner patient={patient} admission={admission} />
          <div className="flex min-h-0 flex-1">
            <main className="flex-1 overflow-y-auto">
              {mode === "edit" ? (
                <div className="mx-auto max-w-[820px] p-6">{children}</div>
              ) : (
                <div className="mx-auto max-w-[820px] p-6">
                  <div className="rounded-[var(--radius-lg)] border border-border-strong bg-[#0b0c10] p-6 shadow-inner">
                    <div className="mx-auto max-w-[720px] rounded-[6px] bg-white p-8 shadow-2xl">
                      <DischargeDocument
                        discharge={discharge}
                        patient={patient}
                        admission={admission}
                        institutionalSettings={institutionalSettings}
                      />
                    </div>
                  </div>
                </div>
              )}
            </main>
            <QuickOverview discharge={discharge} />
          </div>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
