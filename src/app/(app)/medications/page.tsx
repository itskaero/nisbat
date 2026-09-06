"use client";

import * as React from "react";
import { Plus, Pencil, Upload, RotateCcw, Lock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DoseRuleFormDialog } from "@/components/content/dose-rule-form-dialog";
import { DrugFormDialog } from "@/components/content/drug-form-dialog";
import { FormulationFormDialog } from "@/components/content/formulation-form-dialog";
import { useAppStore } from "@/lib/store";
import { canAuthorContent, canPublishContent } from "@/lib/permissions";
import { formatBrandNames } from "@/lib/prescription-format";
import type { Drug, DoseRule } from "@/types";

export default function MedicationsFormularyPage() {
  const drugs = useAppStore((s) => s.drugs);
  const formulations = useAppStore((s) => s.formulations);
  const doseRules = useAppStore((s) => s.doseRules);
  const currentUser = useAppStore((s) => s.getCurrentUser());
  const publishDoseRule = useAppStore((s) => s.publishDoseRule);
  const unpublishDoseRule = useAppStore((s) => s.unpublishDoseRule);

  const [ruleDialog, setRuleDialog] = React.useState<{ open: boolean; existing?: DoseRule }>({ open: false });
  const [drugDialog, setDrugDialog] = React.useState(false);
  const [formulationDialog, setFormulationDialog] = React.useState<{ open: boolean; drug?: Drug }>({ open: false });

  const canAuthor = canAuthorContent(currentUser);
  const canPublish = canPublishContent(currentUser);

  return (
    <div className="mx-auto max-w-[1100px] p-6">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-[20px] font-semibold text-foreground">Medications Formulary</h1>
        {canAuthor && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setDrugDialog(true)}>
              <Plus className="size-4" /> New Drug
            </Button>
            <Button size="sm" onClick={() => setRuleDialog({ open: true })}>
              <Plus className="size-4" /> New Dose Rule
            </Button>
          </div>
        )}
      </div>
      <p className="mb-5 text-[13px] text-foreground-muted">
        Drug → Formulation → Dose Rule kept as distinct concepts. Drugs and formulations are
        master data — available immediately once added. Dose rules are versioned clinical
        content: curated system rules are fixed, faculty-configured rules go through Admin
        publish. Editing a rule never rewrites a prescription already written from it.
      </p>

      <div className="space-y-3">
        {drugs.map((drug) => {
          const drugFormulations = formulations.filter((f) => f.drugId === drug.id);
          const rules = doseRules.filter((r) => r.drugId === drug.id);
          return (
            <Card key={drug.id}>
              <CardContent className="pt-4">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-[14px] font-semibold text-foreground">{drug.name}</h3>
                  <Badge variant="outline">{drug.genericClass}</Badge>
                  <Badge variant={drug.formulary === "hospital" ? "info" : "neutral"}>
                    {drug.formulary === "both" ? "Hospital + Private" : drug.formulary === "hospital" ? "Hospital" : "Private"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-[11px] uppercase tracking-wide text-foreground-subtle">Formulations</p>
                      {canAuthor && (
                        <button
                          onClick={() => setFormulationDialog({ open: true, drug })}
                          className="text-[11px] text-primary-light hover:underline"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                    <ul className="space-y-0.5 text-[12.5px] text-foreground-muted">
                      {drugFormulations.map((f) => {
                        const brands = formatBrandNames(f.brandNames);
                        return (
                          <li key={f.id}>
                            {f.strengthLabel} <span className="text-foreground-subtle">({f.form})</span>
                            {brands && <span className="text-foreground-subtle"> — {brands}</span>}
                          </li>
                        );
                      })}
                      {drugFormulations.length === 0 && <li className="text-foreground-subtle">No formulations yet.</li>}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-foreground-subtle">Dose Rules</p>
                    <ul className="space-y-1.5 text-[12.5px] text-foreground-muted">
                      {rules.map((r) => (
                        <li key={r.id} className="flex flex-wrap items-center gap-1.5">
                          <span className="text-foreground">{r.label}</span>
                          {r.source === "system" ? (
                            <Badge variant="neutral">
                              <Lock className="size-2.5" /> System
                            </Badge>
                          ) : (
                            <>
                              <Badge variant="secondary">Faculty</Badge>
                              <Badge variant={r.status === "published" ? "success" : "neutral"}>
                                {r.status === "published" ? "Published" : "Draft"} · v{r.version}
                              </Badge>
                              {canAuthor && (
                                <button
                                  onClick={() => setRuleDialog({ open: true, existing: r })}
                                  className="text-foreground-subtle hover:text-foreground"
                                  title="Edit"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                              )}
                              {canPublish && r.status === "draft" && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-6 px-2 text-[11px]"
                                  onClick={() => {
                                    publishDoseRule(r.id, currentUser.id);
                                    toast.success(`Published "${r.label}"`);
                                  }}
                                >
                                  <Upload className="size-3" /> Publish
                                </Button>
                              )}
                              {canPublish && r.status === "published" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-[11px]"
                                  onClick={() => {
                                    unpublishDoseRule(r.id);
                                    toast.info(`Unpublished "${r.label}"`);
                                  }}
                                >
                                  <RotateCcw className="size-3" /> Unpublish
                                </Button>
                              )}
                            </>
                          )}
                        </li>
                      ))}
                      {rules.length === 0 && <li className="text-foreground-subtle">No dose rules configured.</li>}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {drugs.length === 0 && (
          <p className="py-10 text-center text-[13px] text-foreground-subtle">No drugs in the formulary yet.</p>
        )}
      </div>

      {/* key forces a fresh mount per rule edited — see the matching comment
          in advice-packs/page.tsx for why this is needed. */}
      <DoseRuleFormDialog
        key={ruleDialog.existing?.id ?? "new"}
        open={ruleDialog.open}
        onOpenChange={(open) => setRuleDialog((d) => ({ ...d, open }))}
        existing={ruleDialog.existing}
      />
      <DrugFormDialog open={drugDialog} onOpenChange={setDrugDialog} />
      <FormulationFormDialog
        open={formulationDialog.open}
        onOpenChange={(open) => setFormulationDialog((d) => ({ ...d, open }))}
        drug={formulationDialog.drug}
      />
    </div>
  );
}
