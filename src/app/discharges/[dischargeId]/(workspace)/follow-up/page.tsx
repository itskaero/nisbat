"use client";

import * as React from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useWorkspace } from "@/components/discharge/workspace-context";
import { useAppStore } from "@/lib/store";
import { genId } from "@/lib/utils";
import { SectionFooterNav } from "@/components/discharge/section-footer-nav";
import type { AppliedFollowUpItem } from "@/types";

type FollowUpDraft = Pick<
  AppliedFollowUpItem,
  "service" | "timingLabel" | "purpose" | "purposeUr" | "instructions" | "instructionsUr" | "pendingResultReview"
>;

export default function FollowUpPage() {
  const { discharge, editable } = useWorkspace();
  const addFollowUpItem = useAppStore((s) => s.addFollowUpItem);
  const updateFollowUpItem = useAppStore((s) => s.updateFollowUpItem);
  const removeFollowUpItem = useAppStore((s) => s.removeFollowUpItem);
  const followUpModules = useAppStore((s) => s.followUpModules);

  const primaryDx = discharge.content.diagnosis.primary?.label;
  const items = discharge.content.followUp;
  const published = followUpModules.filter((m) => m.status === "published");

  const [custom, setCustom] = React.useState({
    service: "",
    timingLabel: "",
    purpose: "",
    purposeUr: "",
    instructions: "",
    instructionsUr: "",
  });

  // A module's fields (or a custom item's) are just the starting point, not
  // a lock — this is the inline edit state for whichever confirmed row is
  // currently open, keyed by item id.
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editDraft, setEditDraft] = React.useState<FollowUpDraft | null>(null);

  function startEdit(item: AppliedFollowUpItem) {
    setEditingId(item.id);
    setEditDraft({
      service: item.service,
      timingLabel: item.timingLabel,
      purpose: item.purpose,
      purposeUr: item.purposeUr ?? "",
      instructions: item.instructions,
      instructionsUr: item.instructionsUr ?? "",
      pendingResultReview: item.pendingResultReview,
    });
  }
  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
  }
  function saveEdit() {
    if (!editingId || !editDraft || !editDraft.service.trim()) return;
    updateFollowUpItem(discharge.id, editingId, {
      service: editDraft.service.trim(),
      timingLabel: editDraft.timingLabel.trim() || "As advised",
      purpose: editDraft.purpose.trim(),
      purposeUr: editDraft.purposeUr?.trim() || undefined,
      instructions: editDraft.instructions.trim(),
      instructionsUr: editDraft.instructionsUr?.trim() || undefined,
      pendingResultReview: editDraft.pendingResultReview,
    });
    cancelEdit();
  }

  function addFromModule(moduleId: string) {
    const m = published.find((x) => x.id === moduleId);
    if (!m) return;
    addFollowUpItem(discharge.id, {
      id: genId("fu"),
      moduleId: m.id,
      service: m.service,
      timingLabel: m.defaultTimingLabel,
      purpose: m.purpose,
      purposeUr: m.purposeUr,
      instructions: m.instructions,
      instructionsUr: m.instructionsUr,
      pendingResultReview: m.hasPendingResultReview,
      isCustom: false,
    });
  }

  function addCustom() {
    if (!custom.service.trim()) return;
    addFollowUpItem(discharge.id, {
      id: genId("fu"),
      service: custom.service.trim(),
      timingLabel: custom.timingLabel.trim() || "As advised",
      purpose: custom.purpose.trim(),
      purposeUr: custom.purposeUr.trim() || undefined,
      instructions: custom.instructions.trim(),
      instructionsUr: custom.instructionsUr.trim() || undefined,
      pendingResultReview: false,
      isCustom: true,
    });
    setCustom({ service: "", timingLabel: "", purpose: "", purposeUr: "", instructions: "", instructionsUr: "" });
  }

  return (
    <div>
      <h1 className="mb-1 text-[18px] font-semibold text-foreground">Follow-up</h1>
      <p className="mb-5 text-[13px] text-foreground-muted">Confirm any follow-up modules suggested by the diagnosis, or add a custom one.</p>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Suggested / Available Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {published.map((m) => {
              const suggested = primaryDx && m.linkedDiagnoses.includes(primaryDx);
              return (
                <div key={m.id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-border px-3 py-2.5">
                  <div>
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                      {m.service}
                      {suggested && <Badge variant="info">Suggested</Badge>}
                      {m.hasPendingResultReview && <Badge variant="warning">Pending result</Badge>}
                    </div>
                    <div className="text-[11px] text-foreground-subtle">{m.defaultTimingLabel} · {m.purpose}</div>
                  </div>
                  {editable && (
                    <Button size="sm" variant="secondary" onClick={() => addFromModule(m.id)}>
                      <Plus className="size-3.5" /> Add
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {editable && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Add Custom Follow-up</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Input placeholder="Service" value={custom.service} onChange={(e) => setCustom((c) => ({ ...c, service: e.target.value }))} />
            <Input placeholder="When, e.g. 2 weeks" value={custom.timingLabel} onChange={(e) => setCustom((c) => ({ ...c, timingLabel: e.target.value }))} />
            <Input placeholder="Purpose" value={custom.purpose} onChange={(e) => setCustom((c) => ({ ...c, purpose: e.target.value }))} />
            <Input
              className="font-urdu"
              dir="rtl"
              placeholder="مقصد (اردو)"
              value={custom.purposeUr}
              onChange={(e) => setCustom((c) => ({ ...c, purposeUr: e.target.value }))}
            />
            <Input placeholder="Instructions" value={custom.instructions} onChange={(e) => setCustom((c) => ({ ...c, instructions: e.target.value }))} />
            <Input
              className="font-urdu"
              dir="rtl"
              placeholder="ہدایات (اردو)"
              value={custom.instructionsUr}
              onChange={(e) => setCustom((c) => ({ ...c, instructionsUr: e.target.value }))}
            />
            <Button className="col-span-2 justify-self-start" onClick={addCustom}>
              <Plus className="size-4" /> Add Follow-up
            </Button>
          </CardContent>
        </Card>
      )}

      {items.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Confirmed Follow-up ({items.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-y border-border bg-muted/20 text-left text-[10.5px] uppercase tracking-wide text-foreground-subtle">
                  <th className="px-3 py-2 font-medium">Service</th>
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">Purpose</th>
                  <th className="px-3 py-2 font-medium">Instructions</th>
                  {editable && <th className="w-10 px-3 py-2" />}
                </tr>
              </thead>
              <tbody>
                {items.map((f) => {
                  const isEditing = editable && editingId === f.id;
                  if (isEditing && editDraft) {
                    return (
                      <tr key={f.id} className="border-b border-border bg-muted/10 last:border-b-0">
                        <td className="px-3 py-2">
                          <Input
                            className="h-8 text-[13px]"
                            value={editDraft.service}
                            onChange={(e) => setEditDraft((d) => d && { ...d, service: e.target.value })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            className="h-8 text-[13px]"
                            value={editDraft.timingLabel}
                            onChange={(e) => setEditDraft((d) => d && { ...d, timingLabel: e.target.value })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-1.5">
                            <Input
                              className="h-8 text-[13px]"
                              value={editDraft.purpose}
                              onChange={(e) => setEditDraft((d) => d && { ...d, purpose: e.target.value })}
                            />
                            <Input
                              className="h-8 font-urdu text-[13px]"
                              dir="rtl"
                              placeholder="اردو"
                              value={editDraft.purposeUr ?? ""}
                              onChange={(e) => setEditDraft((d) => d && { ...d, purposeUr: e.target.value })}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-1.5">
                            <Input
                              className="h-8 text-[13px]"
                              value={editDraft.instructions}
                              onChange={(e) => setEditDraft((d) => d && { ...d, instructions: e.target.value })}
                            />
                            <Input
                              className="h-8 font-urdu text-[13px]"
                              dir="rtl"
                              placeholder="اردو"
                              value={editDraft.instructionsUr ?? ""}
                              onChange={(e) => setEditDraft((d) => d && { ...d, instructionsUr: e.target.value })}
                            />
                            <label className="flex items-center gap-1.5 text-[11px] text-foreground-subtle">
                              <Switch
                                checked={editDraft.pendingResultReview}
                                onCheckedChange={(v) => setEditDraft((d) => d && { ...d, pendingResultReview: v })}
                              />
                              Pending result review
                            </label>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button onClick={saveEdit} className="text-success hover:text-success">
                              <Check className="size-3.5" />
                            </button>
                            <button onClick={cancelEdit} className="text-foreground-subtle hover:text-foreground">
                              <X className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={f.id} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-2 font-medium text-foreground">{f.service}</td>
                      <td className="px-3 py-2 text-foreground-muted">{f.timingLabel}</td>
                      <td className="px-3 py-2 text-foreground-muted">
                        {f.purpose}
                        {f.purposeUr && <span className="font-urdu mt-0.5 block" dir="rtl">{f.purposeUr}</span>}
                      </td>
                      <td className="px-3 py-2 text-foreground-muted">
                        {f.instructions}
                        {f.instructionsUr && <span className="font-urdu mt-0.5 block" dir="rtl">{f.instructionsUr}</span>}
                        {f.pendingResultReview && <span className="ml-1.5 text-warning">(pending result)</span>}
                      </td>
                      {editable && (
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button onClick={() => startEdit(f)} className="text-foreground-subtle hover:text-foreground">
                              <Pencil className="size-3.5" />
                            </button>
                            <button onClick={() => removeFollowUpItem(discharge.id, f.id)} className="text-foreground-subtle hover:text-danger">
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <SectionFooterNav />
    </div>
  );
}
