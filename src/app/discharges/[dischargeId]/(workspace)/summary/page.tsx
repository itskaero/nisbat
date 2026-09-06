"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Printer, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DischargeDocument } from "@/components/discharge/discharge-document";
import { useWorkspace } from "@/components/discharge/workspace-context";
import { useAppStore } from "@/lib/store";
import { WORKSPACE_SECTIONS, safeIsComplete } from "@/lib/workspace-nav";
import type { ParentLanguageMode, PaperSize } from "@/types";

const USE_DEFAULT = "__default__";
const LANGUAGE_LABELS: Record<ParentLanguageMode, string> = {
  urdu_only: "Urdu only",
  urdu_english: "Urdu + English",
  english_only: "English only",
};

export default function SummaryPage() {
  const router = useRouter();
  const { discharge, editable } = useWorkspace();
  const patient = useAppStore((s) => s.getPatient(discharge.patientId))!;
  const admission = useAppStore((s) => s.getAdmission(discharge.admissionId))!;
  const institutionalSettings = useAppStore((s) => s.institutionalSettings);
  const setParentLanguage = useAppStore((s) => s.setParentLanguage);
  const setMedicationsLanguage = useAppStore((s) => s.setMedicationsLanguage);
  const setFollowUpLanguage = useAppStore((s) => s.setFollowUpLanguage);
  const setPaperSize = useAppStore((s) => s.setPaperSize);
  const recordPrint = useAppStore((s) => s.recordPrint);

  const requiredSections = WORKSPACE_SECTIONS.filter((s) => s.required && s.id !== "summary");
  const incomplete = requiredSections.filter((s) => !safeIsComplete(s, discharge.content));

  return (
    <div>
      <h1 className="mb-1 text-[18px] font-semibold text-foreground">Summary &amp; Preview</h1>
      <p className="mb-5 text-[13px] text-foreground-muted">
        Full-page preview using the actual target paper size. Review everything before printing for SR review.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {requiredSections.map((s) => {
                const done = safeIsComplete(s, discharge.content);
                return (
                  <Link
                    key={s.id}
                    href={`/discharges/${discharge.id}/${s.id}`}
                    className="flex items-center gap-2 rounded-[var(--radius-sm)] px-1.5 py-1 text-[13px] hover:bg-surface-hover"
                  >
                    {done ? (
                      <CheckCircle2 className="size-3.5 shrink-0 text-success" />
                    ) : (
                      <Circle className="size-3.5 shrink-0 text-danger" />
                    )}
                    <span className={done ? "text-foreground-muted" : "text-foreground"}>{s.label}</span>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Output Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="mb-1 block text-[12px] text-foreground-subtle">Parent-facing language (default)</label>
                <Select
                  disabled={!editable}
                  value={discharge.parentLanguage}
                  onValueChange={(v) => setParentLanguage(discharge.id, v as ParentLanguageMode)}
                >
                  <SelectTrigger className="h-8 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urdu_only">Urdu only</SelectItem>
                    <SelectItem value="urdu_english">Urdu + English</SelectItem>
                    <SelectItem value="english_only">English only</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-foreground-subtle">
                  Each Advice Pack can override this on the Advice page.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-foreground-subtle">Medications language</label>
                <Select
                  disabled={!editable}
                  value={discharge.medicationsLanguage ?? USE_DEFAULT}
                  onValueChange={(v) => setMedicationsLanguage(discharge.id, v === USE_DEFAULT ? undefined : (v as ParentLanguageMode))}
                >
                  <SelectTrigger className="h-8 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={USE_DEFAULT}>Use default ({LANGUAGE_LABELS[discharge.parentLanguage]})</SelectItem>
                    <SelectItem value="urdu_only">Urdu only</SelectItem>
                    <SelectItem value="urdu_english">Urdu + English</SelectItem>
                    <SelectItem value="english_only">English only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-foreground-subtle">Follow-up language</label>
                <Select
                  disabled={!editable}
                  value={discharge.followUpLanguage ?? USE_DEFAULT}
                  onValueChange={(v) => setFollowUpLanguage(discharge.id, v === USE_DEFAULT ? undefined : (v as ParentLanguageMode))}
                >
                  <SelectTrigger className="h-8 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={USE_DEFAULT}>Use default ({LANGUAGE_LABELS[discharge.parentLanguage]})</SelectItem>
                    <SelectItem value="urdu_only">Urdu only</SelectItem>
                    <SelectItem value="urdu_english">Urdu + English</SelectItem>
                    <SelectItem value="english_only">English only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-foreground-subtle">Paper size</label>
                <Select disabled={!editable} value={discharge.paperSize} onValueChange={(v) => setPaperSize(discharge.id, v as PaperSize)}>
                  <SelectTrigger className="h-8 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-foreground-subtle">Default from Settings: {institutionalSettings.defaultPaperSize}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              {discharge.status === "completed" ? (
                <Link href={`/discharges/${discharge.id}/print`}>
                  <Button className="w-full">
                    <Printer className="size-4" /> View Signed Print
                  </Button>
                </Link>
              ) : discharge.status === "pending_sr_review" ? (
                <div className="space-y-2 text-center">
                  <p className="text-[12px] text-foreground-subtle">Printed and pending SR review.</p>
                  <Link href={`/discharges/${discharge.id}/print`}>
                    <Button variant="secondary" className="w-full">
                      <Printer className="size-4" /> Reprint
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button
                  className="w-full"
                  disabled={incomplete.length > 0}
                  onClick={() => {
                    recordPrint(discharge.id);
                    toast.success("Marked Pending SR Review");
                    router.push(`/discharges/${discharge.id}/print`);
                  }}
                >
                  <Printer className="size-4" /> Print for SR Review <ArrowRight className="size-4" />
                </Button>
              )}
              {incomplete.length > 0 && discharge.status === "draft" && (
                <p className="mt-2 text-center text-[11px] text-danger">
                  {incomplete.length} required section(s) still incomplete.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border-strong bg-[#0b0c10] p-4 sm:p-6">
          <div className="mx-auto max-w-[720px] rounded-[6px] bg-white p-8 shadow-2xl">
            <DischargeDocument discharge={discharge} patient={patient} admission={admission} institutionalSettings={institutionalSettings} />
          </div>
        </div>
      </div>
    </div>
  );
}
