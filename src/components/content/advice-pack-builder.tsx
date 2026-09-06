"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Upload, RotateCcw, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DiagnosisTagInput } from "@/components/content/diagnosis-tag-input";
import { AdviceSectionsPreview } from "@/components/content/advice-sections-preview";
import { useAppStore } from "@/lib/store";
import { canPublishContent } from "@/lib/permissions";
import { genId } from "@/lib/utils";
import { ADVICE_PACK_CATEGORIES, type AdvicePack, type AdvicePackCategory, type AdvicePackSection } from "@/types";

const CATEGORY_LABELS: Record<AdvicePackCategory, string> = {
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

interface BulletDraft {
  id: string;
  en: string;
  ur: string;
}

interface SectionDraft {
  id: string;
  heading: string;
  headingUr: string;
  bullets: BulletDraft[];
  isDangerSigns: boolean;
}

function emptyBullet(): BulletDraft {
  return { id: genId("b"), en: "", ur: "" };
}

function toDraft(sections: AdvicePackSection[]): SectionDraft[] {
  return sections.map((s) => ({
    id: s.id,
    heading: s.heading,
    headingUr: s.headingUr ?? "",
    isDangerSigns: s.isDangerSigns ?? /danger/i.test(s.heading),
    bullets: s.bullets.length ? s.bullets.map((b) => ({ id: b.id, en: b.en, ur: b.ur })) : [emptyBullet()],
  }));
}

function toSections(drafts: SectionDraft[]): AdvicePackSection[] {
  return drafts
    .filter((s) => s.heading.trim())
    .map((s) => ({
      id: s.id,
      heading: s.heading.trim(),
      headingUr: s.headingUr.trim() || undefined,
      isDangerSigns: s.isDangerSigns,
      bullets: s.bullets
        .filter((b) => b.en.trim() || b.ur.trim())
        .map((b) => ({ id: b.id, en: b.en.trim(), ur: b.ur.trim() })),
    }));
}

export function AdvicePackBuilder({ existing }: { existing?: AdvicePack }) {
  const router = useRouter();
  const createAdvicePack = useAppStore((s) => s.createAdvicePack);
  const updateAdvicePack = useAppStore((s) => s.updateAdvicePack);
  const publishAdvicePack = useAppStore((s) => s.publishAdvicePack);
  const unpublishAdvicePack = useAppStore((s) => s.unpublishAdvicePack);
  const currentUser = useAppStore((s) => s.getCurrentUser());
  const canPublish = canPublishContent(currentUser);

  const [title, setTitle] = React.useState(existing?.title ?? "");
  const [category, setCategory] = React.useState<AdvicePackCategory>(existing?.category ?? "general_pediatric");
  const [linkedDiagnoses, setLinkedDiagnoses] = React.useState<string[]>(existing?.linkedDiagnoses ?? []);
  const [sections, setSections] = React.useState<SectionDraft[]>(
    existing
      ? toDraft(existing.sections)
      : [
          { id: genId("s"), heading: "Home Care", headingUr: "گھر کی دیکھ بھال", bullets: [emptyBullet()], isDangerSigns: false },
          {
            id: genId("s"),
            heading: "Danger Signs — Return Immediately If",
            headingUr: "خطرے کی علامات — فوری واپس آئیں اگر",
            bullets: [emptyBullet()],
            isDangerSigns: true,
          },
        ],
  );

  const canSave =
    title.trim().length > 0 && sections.some((s) => s.heading.trim() && s.bullets.some((b) => b.en.trim() || b.ur.trim()));
  const missingUrduCount = sections.reduce(
    (n, s) => n + s.bullets.filter((b) => b.en.trim() && !b.ur.trim()).length,
    0,
  );

  function addSection(dangerSigns = false) {
    setSections((s) => [
      ...s,
      {
        id: genId("s"),
        heading: dangerSigns ? "Danger Signs — Return Immediately If" : "",
        headingUr: dangerSigns ? "خطرے کی علامات — فوری واپس آئیں اگر" : "",
        bullets: [emptyBullet()],
        isDangerSigns: dangerSigns,
      },
    ]);
  }
  function removeSection(id: string) {
    setSections((s) => s.filter((x) => x.id !== id));
  }
  function patchSection(id: string, patch: Partial<SectionDraft>) {
    setSections((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }
  function addBullet(sectionId: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, bullets: [...s.bullets, emptyBullet()] } : s)),
    );
  }
  function removeBullet(sectionId: string, bulletId: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, bullets: s.bullets.filter((b) => b.id !== bulletId) } : s)),
    );
  }
  function patchBullet(sectionId: string, bulletId: string, patch: Partial<BulletDraft>) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, bullets: s.bullets.map((b) => (b.id === bulletId ? { ...b, ...patch } : b)) }
          : s,
      ),
    );
  }

  function handleSave() {
    if (!canSave) return;
    const finalSections = toSections(sections);

    if (existing) {
      const wasPublished = existing.status === "published";
      updateAdvicePack(existing.id, {
        title: title.trim(),
        category,
        linkedDiagnoses,
        sections: finalSections,
        ...(wasPublished ? { version: existing.version + 1, status: "draft" as const, publishedBy: undefined } : {}),
      });
      toast.success(wasPublished ? "New draft version created" : "Advice pack updated", {
        description: wasPublished
          ? "Re-publish to make this version available for selection."
          : "Already-applied discharges keep their snapshot.",
      });
    } else {
      const id = genId("ap");
      createAdvicePack({
        id,
        title: title.trim(),
        category,
        version: 1,
        status: "draft",
        linkedDiagnoses,
        sections: finalSections,
        createdBy: currentUser.id,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Advice pack created as draft");
    }
    router.push("/advice-packs");
  }

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/advice-packs" className="flex items-center gap-1.5 text-[13px] text-foreground-muted hover:text-foreground">
            <ArrowLeft className="size-4" /> Advice Packs
          </Link>
          <span className="text-border-strong">/</span>
          <span className="text-[16px] font-semibold text-foreground">
            {existing ? existing.title || "Edit pack" : "New Advice Pack"}
          </span>
          {existing && (
            <Badge variant={existing.status === "published" ? "success" : "neutral"}>
              {existing.status === "published" ? "Published" : "Draft"} · v{existing.version}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {existing && canPublish && existing.status === "draft" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                publishAdvicePack(existing.id, currentUser.id);
                toast.success(`Published "${existing.title}"`);
                router.push("/advice-packs");
              }}
            >
              <Upload className="size-3.5" /> Publish
            </Button>
          )}
          {existing && canPublish && existing.status === "published" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                unpublishAdvicePack(existing.id);
                toast.info(`Unpublished "${existing.title}"`);
              }}
            >
              <RotateCcw className="size-3.5" /> Unpublish
            </Button>
          )}
          <Button size="sm" disabled={!canSave} onClick={handleSave}>
            {existing ? "Save Changes" : "Create Draft"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Builder form */}
        <div>
          <p className="mb-2 text-[13px] text-foreground-muted">
            Applying a pack to a discharge copies this content at that moment — editing it later
            never changes an already-applied discharge.
          </p>
          <p className="mb-5 text-[13px] text-foreground-muted">
            Urdu is the primary parent-facing wording — English shows alongside it only when a
            discharge is set to Urdu + English. Write curated Urdu here rather than leaving it to
            translate at print time.
          </p>
          {missingUrduCount > 0 && (
            <div className="mb-4 rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 px-3 py-2 text-[12px] text-warning">
              {missingUrduCount} bullet{missingUrduCount === 1 ? "" : "s"} missing Urdu wording — it
              will fall back to English-only, even in Urdu-only mode.
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label required>Title</Label>
              <Input className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Respiratory Illness — Home Care" />
            </div>

            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as AdvicePackCategory)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADVICE_PACK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label recommended>Suggested for diagnoses</Label>
              <div className="mt-1.5">
                <DiagnosisTagInput value={linkedDiagnoses} onChange={setLinkedDiagnoses} />
              </div>
            </div>

            <div>
              <Label required>Sections</Label>
              <div className="mt-1.5 space-y-3">
                {sections.map((s) => (
                  <div
                    key={s.id}
                    className={
                      "rounded-[var(--radius-md)] border p-3 " +
                      (s.isDangerSigns ? "border-danger/30 bg-danger/[0.04]" : "border-border")
                    }
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Input
                        value={s.heading}
                        onChange={(e) => patchSection(s.id, { heading: e.target.value })}
                        placeholder="Heading (English), e.g. Home Care"
                        className="h-8 flex-1 text-[13px]"
                      />
                      <button type="button" onClick={() => removeSection(s.id)} className="shrink-0 text-foreground-subtle hover:text-danger">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <Input
                      value={s.headingUr}
                      onChange={(e) => patchSection(s.id, { headingUr: e.target.value })}
                      placeholder="عنوان (اردو)"
                      dir="rtl"
                      className="font-urdu mb-3 h-8 text-[13px]"
                    />

                    <div className="space-y-2">
                      {s.bullets.map((b) => (
                        <div key={b.id} className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-border-strong bg-surface p-2">
                          <div className="flex-1 space-y-1.5">
                            <Input
                              value={b.en}
                              onChange={(e) => patchBullet(s.id, b.id, { en: e.target.value })}
                              placeholder="Bullet (English)"
                              className="h-8 text-[12.5px]"
                            />
                            <Input
                              value={b.ur}
                              onChange={(e) => patchBullet(s.id, b.id, { ur: e.target.value })}
                              placeholder="نکتہ (اردو)"
                              dir="rtl"
                              className="font-urdu h-8 text-[12.5px]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBullet(s.id, b.id)}
                            className="mt-1.5 shrink-0 text-foreground-subtle hover:text-danger"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                      <Button type="button" variant="ghost" size="sm" onClick={() => addBullet(s.id)}>
                        <Plus className="size-3.5" /> Add bullet
                      </Button>
                    </div>

                    <label className="mt-2 flex items-center gap-2 text-[12px] text-foreground-muted">
                      <Switch
                        checked={s.isDangerSigns}
                        onCheckedChange={(v) => patchSection(s.id, { isDangerSigns: v })}
                      />
                      <ShieldAlert className="size-3.5 text-danger" />
                      This is a danger-signs section (restrained warning styling on print)
                    </label>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => addSection(false)}>
                    <Plus className="size-3.5" /> Add Section
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => addSection(true)}>
                    <ShieldAlert className="size-3.5" /> Add Danger Signs Section
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live preview — exactly how this renders on the discharge document */}
        <div className="sticky top-6 h-fit rounded-[var(--radius-lg)] bg-[#0b0c10] p-6">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-foreground-subtle">
            Live Preview — Urdu + English
          </p>
          <div className="rounded-[6px] bg-white p-6 text-[#111318] shadow-2xl">
            <h2 className="mb-2 border-b border-[#e2e8f0] pb-1 text-[13px] font-bold uppercase tracking-wide text-[#334155]">
              {title.trim() || "Untitled Pack"}
            </h2>
            <div className="text-[12px] leading-snug">
              <AdviceSectionsPreview sections={toSections(sections)} mode="urdu_english" />
            </div>
            {sections.every((s) => s.bullets.every((b) => !b.en.trim() && !b.ur.trim())) && (
              <p className="text-[#94a3b8]">Add a section and bullets to see them here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
