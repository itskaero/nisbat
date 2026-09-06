"use client";

import * as React from "react";
import { Check, Plus, X, SlidersHorizontal } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useWorkspace } from "@/components/discharge/workspace-context";
import { useAppStore } from "@/lib/store";
import { genId } from "@/lib/utils";
import { AdviceSectionsPreview } from "@/components/content/advice-sections-preview";
import { AdviceBulletPicker } from "@/components/content/advice-bullet-picker";
import { SectionFooterNav } from "@/components/discharge/section-footer-nav";
import type { AdvicePack, AppliedAdvicePack, ParentLanguageMode } from "@/types";

/** Sentinel for the Select — a real value is required, but "no override" is
 * represented as the field being absent, not an empty string. */
const USE_DEFAULT = "__default__";

const CATEGORY_LABELS: Record<string, string> = {
  general_pediatric: "General Pediatric",
  respiratory: "Respiratory",
  gi: "GI",
  neurology: "Neurology",
  cardiac: "Cardiac",
  hematology: "Hematology",
  infectious: "Infectious",
  neonatal: "Neonatal",
  nutrition: "Nutrition",
  disease_specific: "Disease-specific",
};

type PickerState = { mode: "apply"; pack: AdvicePack } | { mode: "customize"; applied: AppliedAdvicePack } | null;

export default function AdvicePage() {
  const { discharge, editable } = useWorkspace();
  const applyAdvicePack = useAppStore((s) => s.applyAdvicePack);
  const removeAppliedAdvicePack = useAppStore((s) => s.removeAppliedAdvicePack);
  const updateAppliedAdvicePackSelection = useAppStore((s) => s.updateAppliedAdvicePackSelection);
  const updateContent = useAppStore((s) => s.updateContent);
  const advicePacks = useAppStore((s) => s.advicePacks);
  const [picker, setPicker] = React.useState<PickerState>(null);

  function setPackLanguage(appliedId: string, value: string) {
    updateContent(discharge.id, (c) => {
      const a = c.advice.find((x) => x.id === appliedId);
      if (a) a.languageOverride = value === USE_DEFAULT ? undefined : (value as ParentLanguageMode);
    });
  }

  const primaryDx = discharge.content.diagnosis.primary?.label;
  const applied = discharge.content.advice;
  const publishedPacks = advicePacks.filter((p) => p.status === "published");

  function isApplied(packId: string) {
    return applied.some((a) => a.packId === packId);
  }

  /** Opens the picker pre-checked-all — a click straight through it keeps
   * today's one-click "apply the whole pack" fast path intact. */
  function openApplyPicker(packId: string) {
    const pack = advicePacks.find((p) => p.id === packId);
    if (pack) setPicker({ mode: "apply", pack });
  }

  function confirmApply(pack: AdvicePack, selectedBulletIds: Set<string>) {
    // deep clone, not a shallow spread — sourceSections/sections must be
    // fully independent snapshots, never sharing array references with the
    // live pack content or with each other.
    const sourceSections = JSON.parse(JSON.stringify(pack.sections));
    applyAdvicePack(discharge.id, {
      id: genId("adv"),
      packId: pack.id,
      packTitle: pack.title,
      version: pack.version,
      category: pack.category,
      sourceSections,
      sections: sourceSections
        .map((sec: (typeof sourceSections)[number]) => ({
          ...sec,
          bullets: sec.bullets.filter((b: { id: string }) => selectedBulletIds.has(b.id)),
        }))
        .filter((sec: { bullets: unknown[] }) => sec.bullets.length > 0),
      appliedAt: new Date().toISOString(),
    });
  }

  function openCustomizePicker(applied: AppliedAdvicePack) {
    setPicker({ mode: "customize", applied });
  }

  return (
    <div>
      <h1 className="mb-1 text-[18px] font-semibold text-foreground">Advice</h1>
      <p className="mb-5 text-[13px] text-foreground-muted">
        Nothing is selected automatically. Applying a pack copies its current published content
        into this discharge — later edits to the pack won&apos;t change what&apos;s already applied.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {publishedPacks.map((pack) => {
          const suggested = primaryDx && pack.linkedDiagnoses.includes(primaryDx);
          const applied_ = isApplied(pack.id);
          return (
            <Card key={pack.id} className={suggested ? "border-info/30" : undefined}>
              <CardHeader>
                <div>
                  <CardTitle>{pack.title}</CardTitle>
                  <p className="mt-0.5 text-[11px] text-foreground-subtle">
                    {CATEGORY_LABELS[pack.category]} · v{pack.version}
                  </p>
                </div>
                {suggested && <Badge variant="info">Suggested</Badge>}
              </CardHeader>
              <CardContent>
                <ul className="mb-3 space-y-0.5 text-[12px] text-foreground-muted">
                  {pack.sections.slice(0, 2).map((s) => (
                    <li key={s.id}>• {s.heading}</li>
                  ))}
                </ul>
                {editable && (
                  <Button
                    size="sm"
                    variant={applied_ ? "secondary" : "primary"}
                    onClick={() => {
                      if (applied_) {
                        const app = applied.find((a) => a.packId === pack.id);
                        if (app) removeAppliedAdvicePack(discharge.id, app.id);
                      } else {
                        openApplyPicker(pack.id);
                      }
                    }}
                  >
                    {applied_ ? (
                      <>
                        <Check className="size-3.5" /> Applied — Remove
                      </>
                    ) : (
                      <>
                        <Plus className="size-3.5" /> Apply Pack
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {applied.length > 0 && (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Applied to this Discharge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {applied.map((a) => (
              <div key={a.id}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-foreground">{a.packTitle}</span>
                  <div className="flex items-center gap-2">
                    <Select
                      disabled={!editable}
                      value={a.languageOverride ?? USE_DEFAULT}
                      onValueChange={(v) => setPackLanguage(a.id, v)}
                    >
                      <SelectTrigger className="h-7 w-[168px] text-[11.5px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={USE_DEFAULT}>Use discharge default</SelectItem>
                        <SelectItem value="urdu_only">Urdu only</SelectItem>
                        <SelectItem value="urdu_english">Urdu + English</SelectItem>
                        <SelectItem value="english_only">English only</SelectItem>
                      </SelectContent>
                    </Select>
                    {editable && (
                      <button
                        onClick={() => openCustomizePicker(a)}
                        className="flex items-center gap-1 text-[11.5px] text-foreground-subtle hover:text-foreground"
                        title="Choose which bullets from this pack apply"
                      >
                        <SlidersHorizontal className="size-3.5" /> Customize
                      </button>
                    )}
                    {editable && (
                      <button onClick={() => removeAppliedAdvicePack(discharge.id, a.id)} className="text-foreground-subtle hover:text-danger">
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {/* same component the discharge document/print renders, so this
                    preview can never drift from the real output */}
                <div className="rounded-[6px] bg-white p-3 text-[#111318]">
                  <div className="text-[12px] leading-snug">
                    <AdviceSectionsPreview sections={a.sections} mode={a.languageOverride ?? discharge.parentLanguage} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {picker && (
        <AdviceBulletPicker
          open
          onOpenChange={(open) => !open && setPicker(null)}
          packTitle={picker.mode === "apply" ? picker.pack.title : picker.applied.packTitle}
          sections={
            picker.mode === "apply"
              ? picker.pack.sections
              : // fall back to the current (pruned) view for packs applied before
                // this field existed — the best available stand-in for "the full
                // original snapshot" when that snapshot was never captured
                (picker.applied.sourceSections ?? picker.applied.sections)
          }
          initiallySelected={
            picker.mode === "customize"
              ? new Set(picker.applied.sections.flatMap((s) => s.bullets.map((b) => b.id)))
              : undefined
          }
          onConfirm={(selectedBulletIds) => {
            if (picker.mode === "apply") confirmApply(picker.pack, selectedBulletIds);
            else updateAppliedAdvicePackSelection(discharge.id, picker.applied.id, selectedBulletIds);
          }}
        />
      )}

      <SectionFooterNav />
    </div>
  );
}
