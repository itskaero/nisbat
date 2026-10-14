import { Check, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { createTask, deleteTask, toggleTask } from "@/features/tasks/actions";
import { filterTasks, isOverdue, sortTasks, taskStats, type TaskFilter } from "@/features/tasks/logic";
import { addDays, formatHHMM, relativeDayLabel, todayKey } from "@/lib/dates";
import { usePersisted } from "@/lib/storage/persisted-store";
import { tasksStore } from "@/lib/storage/stores";
import type { Priority } from "@/types/domain";
import { Btn, Chips, Field, Page, Sheet, cx, inputCls } from "../components/ui";
import { useSettings } from "../lib/data";
import { tap } from "../lib/native";
import { toast } from "../lib/toast";

const PRIORITY_COLOR: Record<Priority, string> = { high: "text-coral", medium: "text-gold", low: "text-ink-3" };

export function TasksScreen() {
  const tasks = usePersisted(tasksStore);
  const { timezone } = useSettings();
  const [view, setView] = useState<TaskFilter>("today");
  const [adding, setAdding] = useState(false);
  const list = sortTasks(filterTasks(tasks, view, timezone), "due");
  const stats = taskStats(tasks, timezone);

  return (
    <Page title="Tasks" back>
      <p className="-mt-1 mb-3 text-sm text-ink-2">
        {stats.todayDone} of {stats.todayTotal} done today · {stats.pending} pending{stats.overdue ? ` · ${stats.overdue} overdue` : ""}
      </p>
      <Chips
        label="Show"
        value={view}
        onChange={setView}
        options={[
          { value: "today", label: "Today" },
          { value: "upcoming", label: "Upcoming" },
          { value: "completed", label: "Done" },
          { value: "all", label: "All" },
        ]}
      />
      <ul className="mt-3 space-y-2">
        {list.length === 0 && <li className="glass p-4 text-ink-2">{view === "today" ? "Nothing due today." : "No tasks here."}</li>}
        {list.map((t) => (
          <li key={t.id} className="glass flex items-center gap-3 p-3">
            <button
              type="button"
              aria-label={t.completed ? "Mark not done" : "Mark done"}
              className={cx("press grid size-8 shrink-0 place-items-center rounded-full border-2", t.completed ? "border-emerald bg-emerald text-[#06231a]" : "border-white/30")}
              onClick={() => {
                void tap(t.completed ? "light" : "medium");
                toggleTask(t.id);
              }}
            >
              {t.completed && <Check size={16} strokeWidth={3} />}
            </button>
            <div className="min-w-0 flex-1">
              <p className={cx("truncate font-medium", t.completed && "text-ink-3 line-through")}>{t.title}</p>
              <p className="truncate text-xs text-ink-3">
                {t.dueDate ? relativeDayLabel(t.dueDate, timezone) : "No date"}
                {t.dueTime ? ` · ${formatHHMM(t.dueTime)}` : ""}
                {t.tag ? ` · ${t.tag}` : ""}
                {!t.completed && isOverdue(t, timezone) && <span className="text-coral"> · overdue</span>}
                <span className={cx("capitalize", PRIORITY_COLOR[t.priority])}> · {t.priority}</span>
              </p>
            </div>
            <button
              type="button"
              aria-label={`Delete ${t.title}`}
              className="press grid size-9 place-items-center rounded-full text-ink-3"
              onClick={() => {
                deleteTask(t.id);
                toast("Task deleted", "info");
              }}
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" aria-label="Add task" className="press fixed bottom-[calc(var(--safe-bottom)+5.2rem)] start-4 z-30 grid size-14 place-items-center rounded-full bg-gold text-[#2a1a05] shadow-lg" onClick={() => setAdding(true)}>
        <Plus size={26} />
      </button>
      <AddTask open={adding} onClose={() => setAdding(false)} />
    </Page>
  );
}

function AddTask({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { timezone } = useSettings();
  const today = todayKey(timezone);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState<"today" | "tomorrow" | "none" | "pick">("today");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const save = () => {
    const t = title.trim();
    if (!t) return;
    const dueDate = due === "today" ? today : due === "tomorrow" ? addDays(today, 1) : due === "pick" ? date : undefined;
    createTask({ title: t.slice(0, 200), dueDate, dueTime: time || undefined, priority });
    void tap("medium");
    toast(`Added: ${t}`);
    setTitle("");
    setTime("");
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title="New task">
      <form
        className="space-y-3 pb-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <input autoFocus className={inputCls} value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="Call Phuppo, pay the gas bill…" />
        <Chips
          label="Due"
          value={due}
          onChange={setDue}
          options={[
            { value: "today", label: "Today" },
            { value: "tomorrow", label: "Tomorrow" },
            { value: "pick", label: "Pick a date" },
            { value: "none", label: "No date" },
          ]}
        />
        <div className="grid grid-cols-2 gap-2">
          {due === "pick" && (
            <Field label="Date">
              <input type="date" className={inputCls} value={date} min={today} onChange={(e) => setDate(e.target.value)} />
            </Field>
          )}
          {due !== "none" && (
            <Field label="Time (optional)">
              <input type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} />
            </Field>
          )}
        </div>
        <Chips
          label="Priority"
          value={priority}
          onChange={setPriority}
          options={[
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
          ]}
        />
        <Btn tone="primary" type="submit" className="w-full py-3" disabled={!title.trim()}>
          Add task
        </Btn>
      </form>
    </Sheet>
  );
}
