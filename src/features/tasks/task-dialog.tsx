"use client";

import { createContext, useCallback, useContext, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { todayKey } from "@/lib/dates";
import { usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore, tasksStore } from "@/lib/storage/stores";
import type { Priority, Task } from "@/types/domain";
import { createTask, updateTask } from "./actions";

interface Ctx {
  openTask: (opts?: { taskId?: string; dueDate?: string }) => void;
}
const TaskDialogContext = createContext<Ctx | null>(null);

export function useTaskDialog() {
  const ctx = useContext(TaskDialogContext);
  if (!ctx) throw new Error("useTaskDialog must be used within TaskDialogProvider");
  return ctx;
}

export function TaskDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; taskId?: string; dueDate?: string; key: number }>({ open: false, key: 0 });
  const openTask = useCallback<Ctx["openTask"]>((opts) => setState((s) => ({ open: true, ...opts, key: s.key + 1 })), []);
  const value = useMemo(() => ({ openTask }), [openTask]);
  return (
    <TaskDialogContext.Provider value={value}>
      {children}
      <TaskDialog key={state.key} open={state.open} taskId={state.taskId} dueDate={state.dueDate} onClose={() => setState((s) => ({ ...s, open: false }))} />
    </TaskDialogContext.Provider>
  );
}

export const TASK_TAGS = ["Personal", "Family", "Work", "Home", "Health", "Deen", "Errands"];

function TaskDialog({ open, onClose, taskId, dueDate }: { open: boolean; onClose: () => void; taskId?: string; dueDate?: string }) {
  const tasks = usePersisted(tasksStore);
  const { timezone } = usePersisted(settingsStore);
  const existing = taskId ? tasks.find((t) => t.id === taskId) : undefined;
  const { toast } = useToast();
  const id = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(() => ({
    title: existing?.title ?? "",
    description: existing?.description ?? "",
    dueDate: existing?.dueDate ?? dueDate ?? (taskId ? "" : todayKey(timezone)),
    dueTime: existing?.dueTime ?? "",
    priority: (existing?.priority ?? "medium") as Priority,
    tag: existing?.tag ?? "",
    reminder: existing?.reminder ?? "",
  }));
  const [error, setError] = useState<string>();

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    const title = form.title.trim();
    if (!title) {
      setError("Give the task a title.");
      titleRef.current?.focus();
      return;
    }
    if (title.length > 200) {
      setError("Keep the title under 200 characters.");
      titleRef.current?.focus();
      return;
    }
    const payload: Partial<Task> = {
      title,
      description: form.description.trim() || undefined,
      dueDate: form.dueDate || undefined,
      dueTime: form.dueDate && form.dueTime ? form.dueTime : undefined,
      priority: form.priority,
      tag: form.tag || undefined,
      reminder: form.reminder || undefined,
    };
    if (existing) {
      updateTask(existing.id, payload);
      toast("Task updated");
    } else {
      createTask(payload as Omit<Task, "id" | "completed" | "createdAt" | "updatedAt">);
      toast("Task created");
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={existing ? "Edit task" : "New task"}
      initialFocusRef={titleRef}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={id}>
            {existing ? "Save changes" : "Create task"}
          </Button>
        </>
      }
    >
      <form
        id={id}
        noValidate
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="Title" htmlFor={`${id}-title`} error={error}>
          <Input
            ref={titleRef}
            id={`${id}-title`}
            value={form.title}
            maxLength={200}
            placeholder="e.g. Pick up medicines"
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-title-error` : undefined}
            onChange={(e) => {
              set("title", e.target.value);
              if (error) setError(undefined);
            }}
          />
        </Field>
        <Field label="Description (optional)" htmlFor={`${id}-desc`}>
          <Textarea id={`${id}-desc`} value={form.description} maxLength={2000} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Due date" htmlFor={`${id}-date`}>
            <Input id={`${id}-date`} type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} className="[color-scheme:dark]" />
          </Field>
          <Field label="Time (optional)" htmlFor={`${id}-time`}>
            <Input
              id={`${id}-time`}
              type="time"
              value={form.dueTime}
              disabled={!form.dueDate}
              onChange={(e) => set("dueTime", e.target.value)}
              className="[color-scheme:dark]"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority" htmlFor={`${id}-priority`}>
            <Select id={`${id}-priority`} value={form.priority} onChange={(e) => set("priority", e.target.value as Priority)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </Field>
          <Field label="Tag" htmlFor={`${id}-tag`}>
            <Input id={`${id}-tag`} list={`${id}-tags`} value={form.tag} maxLength={40} placeholder="e.g. Family" onChange={(e) => set("tag", e.target.value)} />
            <datalist id={`${id}-tags`}>
              {TASK_TAGS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>
        </div>
        <Field
          label="Reminder note (optional)"
          htmlFor={`${id}-reminder`}
          hint="Saved with the task and shown in-app. Nisbat does not send push or scheduled notifications yet."
        >
          <Select id={`${id}-reminder`} value={form.reminder} onChange={(e) => set("reminder", e.target.value)}>
            <option value="">No reminder</option>
            <option value="at-time">At due time</option>
            <option value="15m">15 minutes before</option>
            <option value="1h">1 hour before</option>
            <option value="1d">1 day before</option>
          </Select>
        </Field>
      </form>
    </Dialog>
  );
}
