"use client";

import * as React from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import type { ParentLanguageMode, PaperSize } from "@/types";

export default function SettingsPage() {
  const settings = useAppStore((s) => s.institutionalSettings);
  const update = useAppStore((s) => s.updateInstitutionalSettings);
  const currentUser = useAppStore((s) => s.getCurrentUser());
  const [draft, setDraft] = React.useState(settings);
  // React-recommended "adjust state during render" pattern instead of an
  // effect, so a store update (e.g. from another tab) resets the draft
  // without an extra render pass.
  const [prevSettings, setPrevSettings] = React.useState(settings);
  if (settings !== prevSettings) {
    setPrevSettings(settings);
    setDraft(settings);
  }

  const isAdmin = currentUser.role === "admin";
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  return (
    <div className="mx-auto max-w-[720px] p-6">
      <h1 className="mb-1 text-[20px] font-semibold text-foreground">Institutional Settings</h1>
      <p className="mb-5 text-[13px] text-foreground-muted">
        These values populate the discharge header and are snapshotted into each document at
        completion — later changes here never rewrite already-completed discharges.
      </p>

      {!isAdmin && (
        <div className="mb-4 rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 px-3 py-2.5 text-[13px] text-warning">
          Only Administrators can publish changes to institutional settings. You&apos;re viewing as{" "}
          {currentUser.designation}.
        </div>
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Hospital Identity</CardTitle>
            <CardDescription>Shown on every discharge header and print.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Hospital Name">
            <Input disabled={!isAdmin} value={draft.hospitalName} onChange={(e) => setDraft((d) => ({ ...d, hospitalName: e.target.value }))} />
          </Field>
          <Field label="Logo URL">
            <div className="flex items-center gap-3">
              <Input
                disabled={!isAdmin}
                value={draft.logoUrl ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, logoUrl: e.target.value || undefined }))}
                placeholder="https://…/logo.png"
              />
              {draft.logoUrl && (
                // An admin-supplied external URL, not a local/optimizable asset.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.logoUrl}
                  alt="Hospital logo preview"
                  className="h-10 w-10 shrink-0 rounded-[var(--radius-sm)] border border-border object-contain bg-white"
                  onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                  onLoad={(e) => (e.currentTarget.style.visibility = "visible")}
                />
              )}
            </div>
            <p className="mt-1 text-[11px] text-foreground-subtle">
              A direct link to an image — this app has no file upload, only a URL. Shown on the
              discharge header and print, snapshotted into each document at completion like every
              other field here.
            </p>
          </Field>
          <Field label="Department">
            <Input disabled={!isAdmin} value={draft.department} onChange={(e) => setDraft((d) => ({ ...d, department: e.target.value }))} />
          </Field>
          <Field label="HOD / Faculty Name">
            <Input disabled={!isAdmin} value={draft.hodName} onChange={(e) => setDraft((d) => ({ ...d, hodName: e.target.value }))} />
          </Field>
          <Field label="Contact Phone">
            <Input disabled={!isAdmin} value={draft.contactPhone} onChange={(e) => setDraft((d) => ({ ...d, contactPhone: e.target.value }))} />
          </Field>
          <Field label="Contact Address">
            <Input disabled={!isAdmin} value={draft.contactAddress} onChange={(e) => setDraft((d) => ({ ...d, contactAddress: e.target.value }))} />
          </Field>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <div>
            <CardTitle>Defaults</CardTitle>
            <CardDescription>Used for every new discharge, editable per-discharge on Summary &amp; Preview.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Field label="Default Paper Size">
            <Select disabled={!isAdmin} value={draft.defaultPaperSize} onValueChange={(v) => setDraft((d) => ({ ...d, defaultPaperSize: v as PaperSize }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="Legal">Legal</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Default Parent Language">
            <Select disabled={!isAdmin} value={draft.defaultParentLanguage} onValueChange={(v) => setDraft((d) => ({ ...d, defaultParentLanguage: v as ParentLanguageMode }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urdu_only">Urdu only</SelectItem>
                <SelectItem value="urdu_english">Urdu + English</SelectItem>
                <SelectItem value="english_only">English only</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      {isAdmin && (
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" disabled={!dirty} onClick={() => setDraft(settings)}>
            Discard
          </Button>
          <Button
            disabled={!dirty}
            onClick={() => {
              update(draft);
              toast.success("Institutional settings updated");
            }}
          >
            Save Changes
          </Button>
        </div>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-[13px] text-foreground-muted">
          <p><Badge variant="neutral">PGR/MO</Badge> Prepares discharges and prints for physical SR review.</p>
          <p><Badge variant="warning">SR/Faculty</Badge> Read-only clinical review; physically signs; can return for correction.</p>
          <p><Badge variant="info">Admin</Badge> Manages institutional settings and publishes content.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
