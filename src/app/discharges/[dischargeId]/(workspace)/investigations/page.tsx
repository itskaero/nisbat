"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useWorkspace } from "@/components/discharge/workspace-context";
import { useAppStore } from "@/lib/store";
import { genId } from "@/lib/utils";
import { SectionFooterNav } from "@/components/discharge/section-footer-nav";

export default function InvestigationsPage() {
  const { discharge, editable } = useWorkspace();
  const updateContent = useAppStore((s) => s.updateContent);
  const investigationPanels = useAppStore((s) => s.investigationPanels);
  const [test, setTest] = React.useState("");
  const [result, setResult] = React.useState("");
  const items = discharge.content.investigations;
  const publishedPanels = investigationPanels.filter((p) => p.status === "published");

  function add() {
    if (!test.trim()) return;
    updateContent(discharge.id, (c) => {
      c.investigations.push({ id: genId("inv"), test: test.trim(), result: result.trim(), source: "manual", includeOnPrint: true });
    });
    setTest("");
    setResult("");
  }

  function addPanel(panelId: string) {
    const panel = investigationPanels.find((p) => p.id === panelId);
    if (!panel) return;
    updateContent(discharge.id, (c) => {
      for (const t of panel.tests) {
        c.investigations.push({ id: genId("inv"), test: t.name, result: "", source: "manual", includeOnPrint: true });
      }
    });
  }

  return (
    <div>
      <h1 className="mb-1 text-[18px] font-semibold text-foreground">Investigations</h1>
      <p className="mb-5 text-[13px] text-foreground-muted">
        Manual entry always available. Choose which results the clinician wants to appear on the printed discharge.
      </p>

      {editable && publishedPanels.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Rapid Fill — Panels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {publishedPanels.map((panel) => (
                <div key={panel.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                      {panel.name}
                      {panel.category && <Badge variant="outline">{panel.category}</Badge>}
                    </div>
                    <div className="truncate text-[11px] text-foreground-subtle">
                      {panel.tests.map((t) => t.name).join(", ")}
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => addPanel(panel.id)}>
                    <Plus className="size-3.5" /> Add
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          {editable && (
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-32">
                <label className="mb-1 block text-[12px] text-foreground-subtle">Test</label>
                <Input value={test} onChange={(e) => setTest(e.target.value)} placeholder="e.g. CBC" />
              </div>
              <div className="flex-[2] min-w-40">
                <label className="mb-1 block text-[12px] text-foreground-subtle">Result</label>
                <Input value={result} onChange={(e) => setResult(e.target.value)} placeholder="e.g. TLC 14.2, Hb 11.4" onKeyDown={(e) => e.key === "Enter" && add()} />
              </div>
              <Button onClick={add}>
                <Plus className="size-4" /> Add
              </Button>
            </div>
          )}

          {items.length > 0 ? (
            <div className="overflow-hidden rounded-[var(--radius-md)] border border-border">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-[11px] uppercase tracking-wide text-foreground-subtle">
                    <th className="px-3 py-2 font-medium">Test</th>
                    <th className="px-3 py-2 font-medium">Result</th>
                    <th className="w-24 px-3 py-2 font-medium">On print</th>
                    {editable && <th className="w-10 px-3 py-2" />}
                  </tr>
                </thead>
                <tbody>
                  {items.map((inv) => (
                    <tr key={inv.id} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-2 font-medium text-foreground">
                        {editable ? (
                          <Input
                            value={inv.test}
                            onChange={(e) =>
                              updateContent(discharge.id, (c) => {
                                const item = c.investigations.find((x) => x.id === inv.id);
                                if (item) item.test = e.target.value;
                              })
                            }
                            className="h-8"
                          />
                        ) : (
                          inv.test
                        )}
                      </td>
                      <td className="px-3 py-2 text-foreground-muted">
                        {editable ? (
                          <Input
                            value={inv.result}
                            placeholder="Enter result…"
                            onChange={(e) =>
                              updateContent(discharge.id, (c) => {
                                const item = c.investigations.find((x) => x.id === inv.id);
                                if (item) item.result = e.target.value;
                              })
                            }
                            className="h-8"
                          />
                        ) : (
                          inv.result || "—"
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={inv.includeOnPrint}
                          disabled={!editable}
                          onCheckedChange={(v) =>
                            updateContent(discharge.id, (c) => {
                              const item = c.investigations.find((x) => x.id === inv.id);
                              if (item) item.includeOnPrint = !!v;
                            })
                          }
                        />
                      </td>
                      {editable && (
                        <td className="px-3 py-2">
                          <button
                            onClick={() =>
                              updateContent(discharge.id, (c) => {
                                c.investigations = c.investigations.filter((x) => x.id !== inv.id);
                              })
                            }
                            className="text-foreground-subtle hover:text-danger"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-center text-[13px] text-foreground-subtle">No investigations added yet.</p>
          )}
        </CardContent>
      </Card>

      <SectionFooterNav />
    </div>
  );
}
