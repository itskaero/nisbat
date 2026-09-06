"use client";

import * as React from "react";
import { Stethoscope, Pill, BookHeart, CalendarClock, FlaskConical, LayoutTemplate } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAppStore, CLINICAL_TEMPLATES } from "@/lib/store";
import type { Discharge } from "@/types";
import { useWorkspace } from "@/components/discharge/workspace-context";

export function QuickOverview({ discharge }: { discharge: Discharge }) {
  const { editable } = useWorkspace();
  const setTemplate = useAppStore((s) => s.setTemplate);
  const template = CLINICAL_TEMPLATES.find((t) => t.id === discharge.templateId);
  const { content } = discharge;

  return (
    <aside className="hidden w-72 shrink-0 space-y-4 overflow-y-auto border-l border-border p-4 xl:block">
      <div>
        <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-foreground-subtle">
          Quick Overview
        </h3>
        <div className="space-y-2.5">
          <OverviewRow
            icon={Stethoscope}
            label="Diagnosis"
            value={content.diagnosis.primary?.label ?? "Not yet set"}
          />
          <OverviewRow icon={Pill} label="Medications" value={`${content.medications.length} item(s) added`} />
          <OverviewRow icon={BookHeart} label="Advice Selected" value={`${content.advice.reduce((n, a) => n + a.sections.length, 0)} sections`} />
          <OverviewRow icon={CalendarClock} label="Follow-up" value={`${content.followUp.length} appointment(s)`} />
          <OverviewRow icon={FlaskConical} label="Pending Tests" value={`${content.pendingTests.length} pending`} />
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] border border-border bg-surface p-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-foreground-muted">
          <LayoutTemplate className="size-3.5" /> Template
        </div>
        <div className="mb-2 text-[13px] font-medium text-foreground">{template?.name}</div>
        <Select
          disabled={!editable}
          value={discharge.templateId}
          onValueChange={(v) => setTemplate(discharge.id, v as Discharge["templateId"])}
        >
          <SelectTrigger className="h-8 text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLINICAL_TEMPLATES.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {discharge.templateAutoSelected && (
          <p className="mt-1.5 text-[11px] text-foreground-subtle">Auto-selected based on age.</p>
        )}
      </div>
    </aside>
  );
}

function OverviewRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-muted text-foreground-muted">
        <Icon className="size-3.5" />
      </div>
      <div>
        <div className="text-[12px] font-medium text-primary-light">{label}</div>
        <div className="text-[12px] text-foreground-muted">{value}</div>
      </div>
    </div>
  );
}
