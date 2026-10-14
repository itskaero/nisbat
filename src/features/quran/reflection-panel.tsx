"use client";

import { NotebookPen, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button, Field, IconButton, Textarea } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/dates";
import { usePersisted } from "@/lib/storage/persisted-store";
import { quranStore } from "@/lib/storage/stores";
import type { Reflection } from "@/types/domain";
import type { Ayah } from "./editions";
import { deleteReflection, restoreReflection, saveReflection } from "./quran-state";

const EMPTY = { lesson: "", application: "", notes: "" };

/** Tadabur workspace for one verse: prompts, notes, and past reflections. */
export function ReflectionPanel({
  surah,
  surahName,
  ayah,
  translationName,
  translationId,
  translationDir,
  onClose,
}: {
  surah: number;
  surahName: string;
  ayah: Ayah;
  translationName: string;
  translationId: string;
  translationDir: "ltr" | "rtl";
  onClose?: () => void;
}) {
  const { reflections } = usePersisted(quranStore);
  const { toast } = useToast();
  const id = useId();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string>();

  const previous = reflections.filter((r) => r.surah === surah && r.ayah === ayah.numberInSurah);

  useEffect(() => {
    setEditing(null);
    setForm(EMPTY);
    setError(undefined);
  }, [surah, ayah.numberInSurah]);

  const save = () => {
    if (!form.lesson.trim() && !form.application.trim() && !form.notes.trim()) {
      setError("Write at least one thought before saving.");
      return;
    }
    saveReflection(
      {
        surah,
        ayah: ayah.numberInSurah,
        arabic: ayah.arabic,
        translation: ayah.translation,
        translationEdition: translationName,
        lesson: form.lesson.trim(),
        application: form.application.trim(),
        notes: form.notes.trim(),
      },
      editing ?? undefined,
    );
    toast(editing ? "Reflection updated" : "Reflection saved");
    setEditing(null);
    setForm(EMPTY);
    setError(undefined);
  };

  const edit = (r: Reflection) => {
    setEditing(r.id);
    setForm({ lesson: r.lesson, application: r.application, notes: r.notes });
    document.getElementById(`${id}-lesson`)?.focus();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
            <NotebookPen className="size-4" /> Tadabur
          </p>
          <h2 className="mt-1 text-base font-semibold text-ink">
            {surahName} · {surah}:{ayah.numberInSurah}
          </h2>
        </div>
        {onClose && (
          <IconButton label="Close reflection" size="sm" onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        )}
      </div>

      <div className="mt-3 rounded-2xl border border-white/8 bg-black/20 p-4">
        <p lang="ar" dir="rtl" className="font-quran text-2xl text-ink">
          {ayah.arabic}
        </p>
        <p dir={translationDir} lang={translationId.slice(0, 2)} className={translationDir === "rtl" ? "font-urdu mt-2 text-sm text-ink-2" : "mt-2 text-sm leading-relaxed text-ink-2"}>
          {ayah.translation}
        </p>
        <p className="mt-2 text-[11px] text-ink-3">Translation: {translationName}</p>
      </div>

      <form
        className="mt-4 grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="What does this teach me?" htmlFor={`${id}-lesson`}>
          <Textarea id={`${id}-lesson`} className="min-h-20" value={form.lesson} onChange={(e) => setForm((f) => ({ ...f, lesson: e.target.value }))} />
        </Field>
        <Field label="How can I apply this today?" htmlFor={`${id}-apply`}>
          <Textarea id={`${id}-apply`} className="min-h-20" value={form.application} onChange={(e) => setForm((f) => ({ ...f, application: e.target.value }))} />
        </Field>
        <Field label="Personal notes" htmlFor={`${id}-notes`} error={error}>
          <Textarea id={`${id}-notes`} className="min-h-16" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </Field>
        <div className="flex justify-end gap-2">
          {editing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(null);
                setForm(EMPTY);
              }}
            >
              Cancel edit
            </Button>
          )}
          <Button variant="primary" size="sm" type="submit">
            {editing ? "Update reflection" : "Save reflection"}
          </Button>
        </div>
      </form>

      <div className="mt-5 border-t border-white/8 pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-3">Previous reflections ({previous.length})</h3>
        {previous.length === 0 ? (
          <p className="mt-2 text-xs text-ink-3">Your reflections on this verse will appear here.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {previous.map((r) => (
              <ReflectionCard
                key={r.id}
                r={r}
                onEdit={() => edit(r)}
                onDelete={() => {
                  const removed = deleteReflection(r.id);
                  if (removed) toast("Reflection deleted", { tone: "info", action: { label: "Undo", onClick: () => restoreReflection(removed) } });
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function ReflectionCard({ r, onEdit, onDelete, showRef }: { r: Reflection; onEdit?: () => void; onDelete?: () => void; showRef?: boolean }) {
  return (
    <li className="rounded-xl border border-white/8 bg-white/[0.03] p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] text-ink-3">
          {showRef && <span className="me-1 font-semibold text-gold">{r.surah}:{r.ayah}</span>}
          {timeAgo(r.updatedAt)}
          {r.updatedAt !== r.createdAt ? " (edited)" : ""}
        </p>
        <div className="flex gap-0.5">
          {onEdit && (
            <IconButton label="Edit reflection" size="sm" className="size-7" onClick={onEdit}>
              <Pencil className="size-3.5" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton label="Delete reflection" size="sm" className="size-7 hover:!text-coral" onClick={onDelete}>
              <Trash2 className="size-3.5" />
            </IconButton>
          )}
        </div>
      </div>
      {r.lesson && (
        <p className="mt-1 text-ink-2">
          <span className="text-ink-3">Teaches: </span>
          {r.lesson}
        </p>
      )}
      {r.application && (
        <p className="mt-1 text-ink-2">
          <span className="text-ink-3">Apply: </span>
          {r.application}
        </p>
      )}
      {r.notes && <p className="mt-1 whitespace-pre-line text-ink-2">{r.notes}</p>}
    </li>
  );
}
