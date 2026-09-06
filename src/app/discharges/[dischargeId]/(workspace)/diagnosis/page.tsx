"use client";

import * as React from "react";
import { Plus, X, Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/components/discharge/workspace-context";
import { useAppStore } from "@/lib/store";
import { DIAGNOSIS_LIST } from "@/lib/seed-data";
import { resolveFlatItems } from "@/lib/clinical-vocab";
import { genId } from "@/lib/utils";
import type { DiagnosisEntry } from "@/types";
import { SectionFooterNav } from "@/components/discharge/section-footer-nav";

export default function DiagnosisPage() {
  const { discharge, editable } = useWorkspace();
  const updateContent = useAppStore((s) => s.updateContent);
  const advicePacks = useAppStore((s) => s.advicePacks);
  const followUpModules = useAppStore((s) => s.followUpModules);
  const vocabularyLists = useAppStore((s) => s.vocabularyLists);
  const diagnosisList = resolveFlatItems(vocabularyLists, "diagnosis_catalogue", DIAGNOSIS_LIST);
  const [query, setQuery] = React.useState("");
  const [secondaryQuery, setSecondaryQuery] = React.useState("");

  const { primary, secondary } = discharge.content.diagnosis;

  const primaryMatches = query.trim()
    ? diagnosisList.filter((d) => d.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];
  const secondaryMatches = secondaryQuery.trim()
    ? diagnosisList.filter(
        (d) =>
          d.toLowerCase().includes(secondaryQuery.toLowerCase()) &&
          d !== primary?.label &&
          !secondary.some((s) => s.label === d),
      ).slice(0, 6)
    : [];

  function setPrimary(entry: DiagnosisEntry) {
    updateContent(discharge.id, (c) => {
      c.diagnosis.primary = entry;
    });
    setQuery("");
  }

  function addSecondary(entry: DiagnosisEntry) {
    updateContent(discharge.id, (c) => {
      c.diagnosis.secondary.push(entry);
    });
    setSecondaryQuery("");
  }

  function removeSecondary(id: string) {
    updateContent(discharge.id, (c) => {
      c.diagnosis.secondary = c.diagnosis.secondary.filter((d) => d.id !== id);
    });
  }

  const suggestedPacks = primary
    ? advicePacks.filter((p) => p.status === "published" && p.linkedDiagnoses.includes(primary.label))
    : [];
  const suggestedFollowUps = primary
    ? followUpModules.filter((m) => m.status === "published" && m.linkedDiagnoses.includes(primary.label))
    : [];

  return (
    <div>
      <h1 className="mb-1 text-[18px] font-semibold text-foreground">Diagnosis</h1>
      <p className="mb-5 text-[13px] text-foreground-muted">
        Search the structured list or add a custom diagnosis. Nothing is auto-selected for you.
      </p>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Primary Diagnosis</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="dx-primary" required>
            Primary diagnosis
          </Label>
          {primary ? (
            <div className="mt-1.5 flex items-center justify-between rounded-[var(--radius-md)] border border-primary/30 bg-primary/10 px-3 py-2.5">
              <span className="text-[14px] font-medium text-foreground">{primary.label}</span>
              {editable && (
                <button
                  onClick={() =>
                    updateContent(discharge.id, (c) => {
                      c.diagnosis.primary = null;
                    })
                  }
                  className="text-foreground-subtle hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="relative mt-1.5">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-subtle" />
              <Input
                id="dx-primary"
                disabled={!editable}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search diagnosis, e.g. pneumonia…"
                className="pl-9"
              />
              {primaryMatches.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-[var(--radius-md)] border border-border-strong bg-surface-raised shadow-2xl">
                  {primaryMatches.map((d) => (
                    <button
                      key={d}
                      onClick={() => setPrimary({ id: genId("dx"), label: d, isCustom: false })}
                      className="block w-full px-3 py-2 text-left text-[13px] hover:bg-surface-hover"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
              {query.trim() && primaryMatches.length === 0 && (
                <button
                  onClick={() => setPrimary({ id: genId("dx"), label: query.trim(), isCustom: true })}
                  className="mt-1.5 flex items-center gap-1.5 text-[13px] text-primary-light hover:underline"
                >
                  <Plus className="size-3.5" /> Add “{query.trim()}” as custom diagnosis
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Secondary Diagnoses / Comorbidities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {secondary.map((d) => (
              <Badge key={d.id} variant="outline" className="gap-1 py-1">
                {d.label}
                {editable && (
                  <button onClick={() => removeSecondary(d.id)}>
                    <X className="size-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
          {editable && (
            <div className="relative max-w-sm">
              <Input
                value={secondaryQuery}
                onChange={(e) => setSecondaryQuery(e.target.value)}
                placeholder="Add secondary diagnosis…"
              />
              {secondaryMatches.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-[var(--radius-md)] border border-border-strong bg-surface-raised shadow-2xl">
                  {secondaryMatches.map((d) => (
                    <button
                      key={d}
                      onClick={() => addSecondary({ id: genId("dx"), label: d, isCustom: false })}
                      className="block w-full px-3 py-2 text-left text-[13px] hover:bg-surface-hover"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
              {secondaryQuery.trim() && secondaryMatches.length === 0 && (
                <button
                  onClick={() => addSecondary({ id: genId("dx"), label: secondaryQuery.trim(), isCustom: true })}
                  className="mt-1.5 flex items-center gap-1.5 text-[13px] text-primary-light hover:underline"
                >
                  <Plus className="size-3.5" /> Add custom
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {(suggestedPacks.length > 0 || suggestedFollowUps.length > 0) && (
        <Card className="mb-4 border-info/25 bg-info/5">
          <CardContent className="pt-4 text-[13px]">
            <p className="mb-2 font-medium text-foreground">
              Suggested content for {primary?.label} — nothing is applied automatically.
            </p>
            <ul className="space-y-1 text-foreground-muted">
              {suggestedPacks.map((p) => (
                <li key={p.id}>
                  Advice Pack: <span className="text-foreground">{p.title}</span> — confirm on the Advice page.
                </li>
              ))}
              {suggestedFollowUps.map((m) => (
                <li key={m.id}>
                  Follow-up: <span className="text-foreground">{m.service}</span> — confirm on the Follow-up page.
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <SectionFooterNav />
    </div>
  );
}
