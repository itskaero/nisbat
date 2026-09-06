"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Pencil, Upload, RotateCcw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowUpModuleFormDialog } from "@/components/content/follow-up-module-form-dialog";
import { InvestigationPanelFormDialog } from "@/components/content/investigation-panel-form-dialog";
import { FrequencyPhraseFormDialog } from "@/components/content/frequency-phrase-form-dialog";
import { VocabularyListFormDialog } from "@/components/content/vocabulary-list-form-dialog";
import { useAppStore } from "@/lib/store";
import { canAuthorContent, canPublishContent } from "@/lib/permissions";
import type { AdvicePackCategory, AppUser, FollowUpModule, InvestigationPanel, FrequencyPhrase, VocabularyList } from "@/types";

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

function userName(id: string | undefined, users: AppUser[]) {
  return users.find((u) => u.id === id)?.name ?? "—";
}

export default function AdvicePacksPage() {
  const [tab, setTab] = React.useState<"advice" | "followup" | "investigations" | "frequency" | "vocab">("advice");
  const advicePacks = useAppStore((s) => s.advicePacks);
  const followUpModules = useAppStore((s) => s.followUpModules);
  const investigationPanels = useAppStore((s) => s.investigationPanels);
  const frequencyPhrases = useAppStore((s) => s.frequencyPhrases);
  const vocabularyLists = useAppStore((s) => s.vocabularyLists);
  const users = useAppStore((s) => s.users);
  const currentUser = useAppStore((s) => s.getCurrentUser());
  const publishAdvicePack = useAppStore((s) => s.publishAdvicePack);
  const unpublishAdvicePack = useAppStore((s) => s.unpublishAdvicePack);
  const publishFollowUpModule = useAppStore((s) => s.publishFollowUpModule);
  const unpublishFollowUpModule = useAppStore((s) => s.unpublishFollowUpModule);
  const publishInvestigationPanel = useAppStore((s) => s.publishInvestigationPanel);
  const unpublishInvestigationPanel = useAppStore((s) => s.unpublishInvestigationPanel);
  const publishFrequencyPhrase = useAppStore((s) => s.publishFrequencyPhrase);
  const unpublishFrequencyPhrase = useAppStore((s) => s.unpublishFrequencyPhrase);
  const publishVocabularyList = useAppStore((s) => s.publishVocabularyList);
  const unpublishVocabularyList = useAppStore((s) => s.unpublishVocabularyList);

  const [moduleDialog, setModuleDialog] = React.useState<{ open: boolean; existing?: FollowUpModule }>({ open: false });
  const [panelDialog, setPanelDialog] = React.useState<{ open: boolean; existing?: InvestigationPanel }>({ open: false });
  const [phraseDialog, setPhraseDialog] = React.useState<{ open: boolean; existing?: FrequencyPhrase }>({ open: false });
  const [vocabDialog, setVocabDialog] = React.useState<{ open: boolean; existing?: VocabularyList }>({ open: false });

  const canAuthor = canAuthorContent(currentUser);
  const canPublish = canPublishContent(currentUser);

  return (
    <div className="mx-auto max-w-[1100px] p-6">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-[20px] font-semibold text-foreground">Content Library</h1>
        {canAuthor && tab === "advice" && (
          <Link href="/advice-packs/new">
            <Button size="sm">
              <Plus className="size-4" /> New Advice Pack
            </Button>
          </Link>
        )}
        {canAuthor && tab === "followup" && (
          <Button size="sm" onClick={() => setModuleDialog({ open: true })}>
            <Plus className="size-4" /> New Follow-up Module
          </Button>
        )}
        {canAuthor && tab === "investigations" && (
          <Button size="sm" onClick={() => setPanelDialog({ open: true })}>
            <Plus className="size-4" /> New Investigation Panel
          </Button>
        )}
        {canAuthor && tab === "frequency" && (
          <Button size="sm" onClick={() => setPhraseDialog({ open: true })}>
            <Plus className="size-4" /> New Phrase
          </Button>
        )}
        {/* Vocabulary Lists have a fixed, pre-seeded set of rows (one per
            list) — editing is the only action, there's no "new" to create.
            Frequency Phrases can have more than one phrase per code (see the
            dialog/store) — "new" adds another phrasing, not a new code. */}
      </div>
      <p className="mb-5 text-[13px] text-foreground-muted">
        Advice Packs, Follow-up Modules, Investigation Panels, Frequency Phrases, and Vocabulary
        Lists are all versioned. Faculty/SR create and edit; Admin publishes. Only published
        content is available for routine clinical selection.
      </p>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "advice" | "followup" | "investigations" | "frequency" | "vocab")}
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="advice">Advice Packs</TabsTrigger>
          <TabsTrigger value="followup">Follow-up Modules</TabsTrigger>
          <TabsTrigger value="investigations">Investigation Panels</TabsTrigger>
          <TabsTrigger value="frequency">Frequency Phrases</TabsTrigger>
          <TabsTrigger value="vocab">Vocabulary Lists</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "advice" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {advicePacks.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <div>
                  <CardTitle>{p.title}</CardTitle>
                  <p className="mt-0.5 text-[11px] text-foreground-subtle">{CATEGORY_LABELS[p.category]}</p>
                </div>
                <Badge variant={p.status === "published" ? "success" : "neutral"}>
                  {p.status === "published" ? "Published" : "Draft"} · v{p.version}
                </Badge>
              </CardHeader>
              <CardContent>
                <ul className="mb-2 space-y-0.5 text-[12px] text-foreground-muted">
                  {p.sections.map((s) => (
                    <li key={s.id} className="flex items-center gap-1">
                      • {s.heading} ({s.bullets.length})
                      {(s.isDangerSigns ?? /danger/i.test(s.heading)) && (
                        <ShieldAlert className="size-3 text-danger" />
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mb-3 text-[11px] text-foreground-subtle">
                  Created by {userName(p.createdBy, users)}
                  {p.publishedBy && ` · Published by ${userName(p.publishedBy, users)}`}
                </p>
                {(canAuthor || canPublish) && (
                  <div className="flex items-center gap-2">
                    {canAuthor && (
                      <Link href={`/advice-packs/${p.id}/edit`}>
                        <Button size="sm" variant="secondary">
                          <Pencil className="size-3.5" /> Edit
                        </Button>
                      </Link>
                    )}
                    {canPublish && p.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          publishAdvicePack(p.id, currentUser.id);
                          toast.success(`Published "${p.title}"`);
                        }}
                      >
                        <Upload className="size-3.5" /> Publish
                      </Button>
                    )}
                    {canPublish && p.status === "published" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          unpublishAdvicePack(p.id);
                          toast.info(`Unpublished "${p.title}"`);
                        }}
                      >
                        <RotateCcw className="size-3.5" /> Unpublish
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {advicePacks.length === 0 && (
            <p className="py-10 text-center text-[13px] text-foreground-subtle sm:col-span-2">No advice packs yet.</p>
          )}
        </div>
      ) : tab === "followup" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {followUpModules.map((m) => (
            <Card key={m.id}>
              <CardHeader>
                <div>
                  <CardTitle>{m.service}</CardTitle>
                  <p className="mt-0.5 text-[11px] text-foreground-subtle">{m.purpose}</p>
                </div>
                <Badge variant={m.status === "published" ? "success" : "neutral"}>
                  {m.status === "published" ? "Published" : "Draft"} · v{m.version}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-[12px] text-foreground-muted">{m.instructions || "No instructions yet."}</p>
                <div className="mb-3 flex items-center gap-2">
                  <Badge variant="outline">{m.defaultTimingLabel}</Badge>
                  {m.hasPendingResultReview && <Badge variant="warning">Pending result review</Badge>}
                </div>
                {(canAuthor || canPublish) && (
                  <div className="flex items-center gap-2">
                    {canAuthor && (
                      <Button size="sm" variant="secondary" onClick={() => setModuleDialog({ open: true, existing: m })}>
                        <Pencil className="size-3.5" /> Edit
                      </Button>
                    )}
                    {canPublish && m.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          publishFollowUpModule(m.id, currentUser.id);
                          toast.success(`Published "${m.service}"`);
                        }}
                      >
                        <Upload className="size-3.5" /> Publish
                      </Button>
                    )}
                    {canPublish && m.status === "published" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          unpublishFollowUpModule(m.id);
                          toast.info(`Unpublished "${m.service}"`);
                        }}
                      >
                        <RotateCcw className="size-3.5" /> Unpublish
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {followUpModules.length === 0 && (
            <p className="py-10 text-center text-[13px] text-foreground-subtle sm:col-span-2">No follow-up modules yet.</p>
          )}
        </div>
      ) : tab === "investigations" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {investigationPanels.map((panel) => (
            <Card key={panel.id}>
              <CardHeader>
                <div>
                  <CardTitle>{panel.name}</CardTitle>
                  {panel.category && <p className="mt-0.5 text-[11px] text-foreground-subtle">{panel.category}</p>}
                </div>
                <Badge variant={panel.status === "published" ? "success" : "neutral"}>
                  {panel.status === "published" ? "Published" : "Draft"} · v{panel.version}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-[12px] text-foreground-muted">{panel.tests.map((t) => t.name).join(", ")}</p>
                <p className="mb-3 text-[11px] text-foreground-subtle">
                  Created by {userName(panel.createdBy, users)}
                  {panel.publishedBy && ` · Published by ${userName(panel.publishedBy, users)}`}
                </p>
                {(canAuthor || canPublish) && (
                  <div className="flex items-center gap-2">
                    {canAuthor && (
                      <Button size="sm" variant="secondary" onClick={() => setPanelDialog({ open: true, existing: panel })}>
                        <Pencil className="size-3.5" /> Edit
                      </Button>
                    )}
                    {canPublish && panel.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          publishInvestigationPanel(panel.id, currentUser.id);
                          toast.success(`Published "${panel.name}"`);
                        }}
                      >
                        <Upload className="size-3.5" /> Publish
                      </Button>
                    )}
                    {canPublish && panel.status === "published" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          unpublishInvestigationPanel(panel.id);
                          toast.info(`Unpublished "${panel.name}"`);
                        }}
                      >
                        <RotateCcw className="size-3.5" /> Unpublish
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {investigationPanels.length === 0 && (
            <p className="py-10 text-center text-[13px] text-foreground-subtle sm:col-span-2">No investigation panels yet.</p>
          )}
        </div>
      ) : tab === "frequency" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {frequencyPhrases.map((fp) => (
            <Card key={fp.id}>
              <CardHeader>
                <div>
                  <CardTitle>{fp.frequencyCode}</CardTitle>
                  <p className="mt-0.5 text-[11px] text-foreground-subtle">{fp.phraseEnglish}</p>
                </div>
                <Badge variant={fp.status === "published" ? "success" : "neutral"}>
                  {fp.status === "published" ? "Published" : "Draft"} · v{fp.version}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="font-urdu mb-3 text-[13px] text-foreground" dir="rtl">
                  {fp.phraseUrdu}
                </p>
                {(canAuthor || canPublish) && (
                  <div className="flex items-center gap-2">
                    {canAuthor && (
                      <Button size="sm" variant="secondary" onClick={() => setPhraseDialog({ open: true, existing: fp })}>
                        <Pencil className="size-3.5" /> Edit
                      </Button>
                    )}
                    {canPublish && fp.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          const sibling = frequencyPhrases.find(
                            (p) => p.id !== fp.id && p.frequencyCode === fp.frequencyCode && p.status === "published",
                          );
                          publishFrequencyPhrase(fp.id, currentUser.id);
                          toast.success(`Published "${fp.frequencyCode}"`, {
                            description: sibling
                              ? `Retired the previously-published ${fp.frequencyCode} phrase — only one is live per code.`
                              : undefined,
                          });
                        }}
                      >
                        <Upload className="size-3.5" /> Publish
                      </Button>
                    )}
                    {canPublish && fp.status === "published" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          unpublishFrequencyPhrase(fp.id);
                          toast.info(`Unpublished "${fp.frequencyCode}"`);
                        }}
                      >
                        <RotateCcw className="size-3.5" /> Unpublish
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {vocabularyLists.map((v) => (
            <Card key={v.id}>
              <CardHeader>
                <div>
                  <CardTitle>{v.label}</CardTitle>
                  <p className="mt-0.5 text-[11px] text-foreground-subtle">
                    {v.flatItems ? `${v.flatItems.length} items` : `${Object.keys(v.chipsBySystem ?? {}).length} systems`}
                  </p>
                </div>
                <Badge variant={v.status === "published" ? "success" : "neutral"}>
                  {v.status === "published" ? "Published" : "Draft"} · v{v.version}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-[11px] text-foreground-subtle">
                  Created by {userName(v.createdBy, users)}
                  {v.publishedBy && ` · Published by ${userName(v.publishedBy, users)}`}
                </p>
                {(canAuthor || canPublish) && (
                  <div className="flex items-center gap-2">
                    {canAuthor && (
                      <Button size="sm" variant="secondary" onClick={() => setVocabDialog({ open: true, existing: v })}>
                        <Pencil className="size-3.5" /> Edit
                      </Button>
                    )}
                    {canPublish && v.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          publishVocabularyList(v.id, currentUser.id);
                          toast.success(`Published "${v.label}"`);
                        }}
                      >
                        <Upload className="size-3.5" /> Publish
                      </Button>
                    )}
                    {canPublish && v.status === "published" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          unpublishVocabularyList(v.id);
                          toast.info(`Unpublished "${v.label}"`);
                        }}
                      >
                        <RotateCcw className="size-3.5" /> Unpublish
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* key forces a fresh mount per row edited — these dialogs are single
          persistent instances the page toggles open/closed for whichever row
          was clicked, and each one's useState(existing?.x ?? default) only
          runs its initializer once per mount, so without this a different row
          (or "new") reused whatever was left over from the previous edit.
          Prefixed per dialog (not just existing?.id ?? "new") — these 4 are
          JSX siblings in the same fragment, and React's key uniqueness rule
          applies across ALL siblings at that level regardless of type: with
          no dialog open, every one of them computes the bare key "new"
          simultaneously, which is exactly the duplicate-key warning this fixes. */}
      <FollowUpModuleFormDialog
        key={`module-${moduleDialog.existing?.id ?? "new"}`}
        open={moduleDialog.open}
        onOpenChange={(open) => setModuleDialog((d) => ({ ...d, open }))}
        existing={moduleDialog.existing}
      />
      <InvestigationPanelFormDialog
        key={`panel-${panelDialog.existing?.id ?? "new"}`}
        open={panelDialog.open}
        onOpenChange={(open) => setPanelDialog((d) => ({ ...d, open }))}
        existing={panelDialog.existing}
      />
      <FrequencyPhraseFormDialog
        key={`phrase-${phraseDialog.existing?.id ?? "new"}`}
        open={phraseDialog.open}
        onOpenChange={(open) => setPhraseDialog((d) => ({ ...d, open }))}
        existing={phraseDialog.existing}
      />
      <VocabularyListFormDialog
        key={`vocab-${vocabDialog.existing?.id ?? "new"}`}
        open={vocabDialog.open}
        onOpenChange={(open) => setVocabDialog((d) => ({ ...d, open }))}
        existing={vocabDialog.existing}
      />
    </div>
  );
}
