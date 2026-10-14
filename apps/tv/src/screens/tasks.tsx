import { Check } from "lucide-react";
import { useState } from "preact/hooks";
import { toggleTask } from "@/features/tasks/actions";
import { filterTasks, isOverdue, sortTasks, taskStats, type TaskFilter } from "@/features/tasks/logic";
import { formatHHMM, relativeDayLabel } from "@/lib/dates";
import { usePersisted } from "@/lib/storage/persisted-store";
import { tasksStore } from "@/lib/storage/stores";
import { Card, Chips, ScreenHeader, cx } from "../components/ui";
import { useSettings } from "../lib/data";

const PRIORITY = { high: "text-coral", medium: "text-gold", low: "text-ink-3" } as const;

export function TasksScreen() {
  const tasks = usePersisted(tasksStore);
  const { timezone } = useSettings();
  const [view, setView] = useState<TaskFilter>("today");
  const list = sortTasks(filterTasks(tasks, view, timezone), "due");
  const stats = taskStats(tasks, timezone);

  return (
    <>
      <ScreenHeader title="Tasks" sub={`${stats.todayDone} of ${stats.todayTotal} done today · ${stats.pending} pending`} />
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
      <Card class="mt-5">
        {list.length === 0 ? (
          <p class="text-xl text-ink-2">{view === "today" ? "Nothing due today. Add tasks from the phone app." : "No tasks here."}</p>
        ) : (
          <ul class="space-y-2">
            {list.slice(0, 40).map((t, i) => (
              <li key={t.id}>
                <button
                  type="button"
                  data-autofocus={i === 0 ? "" : undefined}
                  class={cx("flex w-full items-center gap-4 rounded-2xl bg-white/[0.04] px-5 py-4 text-start", t.completed && "opacity-60")}
                  onClick={() => toggleTask(t.id)}
                >
                  <span class={cx("grid size-9 shrink-0 place-items-center rounded-full border-2", t.completed ? "border-emerald bg-emerald text-[#06231a]" : "border-white/30")}>
                    {t.completed && <Check size={20} strokeWidth={3} />}
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class={cx("block truncate text-xl", t.completed && "line-through")}>{t.title}</span>
                    <span class="block text-base text-ink-3">
                      {t.dueDate ? relativeDayLabel(t.dueDate, timezone) : "No date"}
                      {t.dueTime ? ` · ${formatHHMM(t.dueTime)}` : ""}
                      {t.tag ? ` · ${t.tag}` : ""}
                      {!t.completed && isOverdue(t, timezone) && <span class="text-coral"> · overdue</span>}
                    </span>
                  </span>
                  <span class={cx("text-base capitalize", PRIORITY[t.priority])}>{t.priority}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
