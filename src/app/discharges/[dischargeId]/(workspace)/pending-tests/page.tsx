"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/components/discharge/workspace-context";
import { useAppStore } from "@/lib/store";
import { genId } from "@/lib/utils";
import { SectionFooterNav } from "@/components/discharge/section-footer-nav";

export default function PendingTestsPage() {
  const { discharge, editable } = useWorkspace();
  const updateContent = useAppStore((s) => s.updateContent);
  const [test, setTest] = React.useState("");
  const [action, setAction] = React.useState("");
  const items = discharge.content.pendingTests;

  function add() {
    if (!test.trim()) return;
    updateContent(discharge.id, (c) => {
      c.pendingTests.push({ id: genId("pt"), test: test.trim(), followUpAction: action.trim() || "Review at follow-up visit" });
    });
    setTest("");
    setAction("");
  }

  return (
    <div>
      <h1 className="mb-1 text-[18px] font-semibold text-foreground">Pending Tests</h1>
      <p className="mb-5 text-[13px] text-foreground-muted">Optional — investigations still pending at the time of discharge, with a follow-up instruction for each.</p>

      <Card>
        <CardHeader>
          <CardTitle>Pending Investigations</CardTitle>
        </CardHeader>
        <CardContent>
          {editable && (
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-32">
                <label className="mb-1 block text-[12px] text-foreground-subtle">Test</label>
                <Input value={test} onChange={(e) => setTest(e.target.value)} placeholder="e.g. Blood culture" />
              </div>
              <div className="flex-[2] min-w-40">
                <label className="mb-1 block text-[12px] text-foreground-subtle">Follow-up action</label>
                <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. Review at OPD visit" onKeyDown={(e) => e.key === "Enter" && add()} />
              </div>
              <Button onClick={add}>
                <Plus className="size-4" /> Add
              </Button>
            </div>
          )}
          {items.length > 0 ? (
            <ul className="space-y-1.5">
              {items.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-[var(--radius-sm)] bg-muted/40 px-3 py-2">
                  <span className="text-[13px]">
                    <span className="font-medium text-foreground">{t.test}</span>
                    <span className="text-foreground-muted"> — {t.followUpAction}</span>
                  </span>
                  {editable && (
                    <button
                      onClick={() =>
                        updateContent(discharge.id, (c) => {
                          c.pendingTests = c.pendingTests.filter((x) => x.id !== t.id);
                        })
                      }
                      className="text-foreground-subtle hover:text-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-[13px] text-foreground-subtle">No pending tests.</p>
          )}
        </CardContent>
      </Card>

      <SectionFooterNav />
    </div>
  );
}
