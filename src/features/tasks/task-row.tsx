"use client";

import { AlarmClock, Bell, Check, Pencil, Trash2 } from "lucide-react";
import { Badge, IconButton, cn } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { formatHHMM, relativeDayLabel } from "@/lib/dates";
import type { Task } from "@/types/domain";
import { deleteTask, restoreTask, toggleTask } from "./actions";
import { isOverdue } from "./logic";
import { useTaskDialog } from "./task-dialog";

const PRIORITY_STYLE = {
  high: { dot: "bg-coral", label: "High priority" },
  medium: { dot: "bg-gold", label: "Medium priority" },
  low: { dot: "bg-cyan/70", label: "Low priority" },
};

export function TaskRow({ task, tz, compact = false }: { task: Task; tz: string; compact?: boolean }) {
  const { openTask } = useTaskDialog();
  const { toast } = useToast();
  const overdue = isOverdue(task, tz);
  const p = PRIORITY_STYLE[task.priority];

  return (
    <li
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-transparent px-2 py-2.5 transition-colors hover:border-white/8 hover:bg-white/[0.03]",
        !compact && "sm:px-3",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={task.completed}
        aria-label={`Mark “${task.title}” as ${task.completed ? "not done" : "done"}`}
        onClick={() => toggleTask(task.id)}
        className={cn(
          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
          task.completed ? "border-emerald bg-emerald text-[#06231a]" : overdue ? "border-coral/70 hover:border-coral" : "border-white/25 hover:border-emerald",
        )}
      >
        {task.completed && <Check className="size-3.5" strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm leading-snug", task.completed ? "text-ink-3 line-through" : "text-ink")}>{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-3">
          <span className={cn("inline-flex size-1.5 rounded-full", p.dot)} title={p.label} aria-label={p.label} role="img" />
          {task.dueDate && (
            <span className={cn(overdue && "font-medium text-coral")}>
              {overdue && <AlarmClock className="me-0.5 inline size-3 align-[-2px]" aria-hidden />}
              {overdue ? "Overdue · " : ""}
              {relativeDayLabel(task.dueDate, tz)}
              {task.dueTime ? ` · ${formatHHMM(task.dueTime)}` : ""}
            </span>
          )}
          {task.tag && <Badge className="py-0">{task.tag}</Badge>}
          {task.reminder && !task.completed && (
            <span className="inline-flex items-center gap-0.5" title="Reminder metadata (in-app only)">
              <Bell className="size-3" aria-hidden />
              <span className="sr-only">Has reminder note</span>
            </span>
          )}
        </div>
        {!compact && task.description && <p className="mt-1 line-clamp-2 text-xs text-ink-2">{task.description}</p>}
      </div>
      <div className={cn("flex shrink-0 items-center gap-0.5", compact ? "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100" : "")}>
        <IconButton label={`Edit “${task.title}”`} size="sm" onClick={() => openTask({ taskId: task.id })}>
          <Pencil className="size-3.5" />
        </IconButton>
        {!compact && (
          <IconButton
            label={`Delete “${task.title}”`}
            size="sm"
            className="hover:!text-coral"
            onClick={() => {
              const removed = deleteTask(task.id);
              if (removed) toast("Task deleted", { tone: "info", action: { label: "Undo", onClick: () => restoreTask(removed) } });
            }}
          >
            <Trash2 className="size-3.5" />
          </IconButton>
        )}
      </div>
    </li>
  );
}
