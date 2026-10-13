"use client";

import { CalendarCheck2, CheckCheck, ListTodo, Plus, Search, SquareCheckBig, Sunrise } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Button, EmptyState, Input, Panel, ProgressRing, Segmented, Select } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { formatLongDate, todayKey } from "@/lib/dates";
import { useNow } from "@/lib/hooks";
import { useT } from "@/lib/i18n";
import { useHydrated, usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore, tasksStore } from "@/lib/storage/stores";
import { createTask, deleteCompleted } from "./actions";
import { filterTasks, sortTasks, taskStats, type TaskFilter, type TaskSort } from "./logic";
import { useTaskDialog } from "./task-dialog";
import { TaskRow } from "./task-row";

export function TasksPage() {
  const t = useT();
  const tasks = usePersisted(tasksStore);
  const { timezone } = usePersisted(settingsStore);
  const hydrated = useHydrated();
  const now = useNow();
  const { openTask } = useTaskDialog();
  const { toast } = useToast();
  const [filter, setFilter] = useState<TaskFilter>("today");
  const [sort, setSort] = useState<TaskSort>("due");
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState(false);

  const stats = taskStats(tasks, timezone);
  const counts = useMemo(
    () => ({
      today: filterTasks(tasks, "today", timezone).length,
      upcoming: filterTasks(tasks, "upcoming", timezone).length,
      completed: filterTasks(tasks, "completed", timezone).length,
      all: tasks.length,
    }),
    [tasks, timezone],
  );

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = filterTasks(tasks, filter, timezone).filter(
      (task) => !needle || task.title.toLowerCase().includes(needle) || task.description?.toLowerCase().includes(needle) || task.tag?.toLowerCase().includes(needle),
    );
    return sortTasks(list, sort);
  }, [tasks, filter, timezone, q, sort]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight md:text-3xl">
            <SquareCheckBig className="size-7 text-emerald" aria-hidden /> {t("nav.tasks")}
          </h1>
          <p className="mt-1 text-sm text-ink-2">Personal and family to-dos, shared across your Nisbat screens.</p>
        </div>
        <Button variant="primary" onClick={() => openTask()}>
          <Plus className="size-4" /> {t("action.addTask")}
        </Button>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Panel className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              label="Task filter"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "today", label: t("tasks.today"), count: hydrated ? counts.today : undefined },
                { value: "upcoming", label: t("tasks.upcoming"), count: hydrated ? counts.upcoming : undefined },
                { value: "completed", label: t("tasks.completed"), count: hydrated ? counts.completed : undefined },
                { value: "all", label: t("tasks.all"), count: hydrated ? counts.all : undefined },
              ]}
            />
            <div className="ms-auto flex w-full gap-2 sm:w-auto">
              <div className="relative flex-1 sm:w-52">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
                <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks" aria-label="Search tasks" className="h-9 ps-9" />
              </div>
              <Select aria-label="Sort tasks" value={sort} onChange={(e) => setSort(e.target.value as TaskSort)} className="h-9 w-32 text-xs">
                <option value="due">By due date</option>
                <option value="priority">By priority</option>
                <option value="created">Newest first</option>
              </Select>
            </div>
          </div>

          <QuickAdd
            onAdd={(title) => {
              createTask({ title, priority: "medium", dueDate: filter === "upcoming" ? undefined : todayKey(timezone) });
              toast(filter === "upcoming" ? "Task added (no date)" : "Task added for today");
            }}
          />

          <div className="mt-2">
            {!hydrated ? (
              <div className="space-y-2" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-12" />
                ))}
              </div>
            ) : visible.length === 0 ? (
              <EmptyState
                icon={q ? <Search className="size-5" /> : filter === "completed" ? <CheckCheck className="size-5" /> : <Sunrise className="size-5" />}
                title={
                  q
                    ? "No tasks match your search"
                    : filter === "today"
                      ? "Nothing planned for today"
                      : filter === "upcoming"
                        ? "No upcoming tasks"
                        : filter === "completed"
                          ? "No completed tasks yet"
                          : "No tasks yet"
                }
                description={q ? "Try another word." : "Use the quick add above or create a detailed task."}
              />
            ) : (
              <ul className="divide-y divide-white/5">
                {visible.map((task) => (
                  <TaskRow key={task.id} task={task} tz={timezone} />
                ))}
              </ul>
            )}
          </div>

          {hydrated && counts.completed > 0 && (
            <div className="mt-4 flex justify-end border-t border-white/8 pt-4">
              <Button size="sm" variant="danger" onClick={() => setConfirm(true)}>
                Delete {counts.completed} completed
              </Button>
            </div>
          )}
        </Panel>

        <aside className="space-y-5">
          <Panel className="p-5">
            <h2 className="text-sm font-semibold text-ink-2" suppressHydrationWarning>
              {now ? formatLongDate(now, timezone) : "Today"}
            </h2>
            <div className="mt-4 flex items-center gap-4">
              <ProgressRing value={stats.todayDone} max={stats.todayTotal} size={84} stroke={7} label={`${stats.todayDone} of ${stats.todayTotal} tasks done today`}>
                <span className="text-lg font-semibold">
                  {hydrated ? stats.todayDone : 0}/{hydrated ? stats.todayTotal : 0}
                </span>
              </ProgressRing>
              <dl className="grid gap-1.5 text-sm">
                <div className="flex gap-2">
                  <dt className="text-ink-3">Pending</dt>
                  <dd className="font-medium">{hydrated ? stats.pending : "–"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-ink-3">Overdue</dt>
                  <dd className={stats.overdue ? "font-medium text-coral" : "font-medium"}>{hydrated ? stats.overdue : "–"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-ink-3">Done (all)</dt>
                  <dd className="font-medium">{hydrated ? stats.completed : "–"}</dd>
                </div>
              </dl>
            </div>
          </Panel>
          <Panel className="p-5 text-xs leading-relaxed text-ink-2">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <CalendarCheck2 className="size-4 text-cyan" /> How dates work
            </h2>
            <p>
              Due dates follow your time zone ({timezone}). Overdue tasks stay in <em>Today</em> until you finish them. Reminder choices are
              saved as notes — Nisbat doesn&apos;t send notifications yet.
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-ink-3">
              <ListTodo className="size-3.5" /> Tasks sync through your Nisbat server and still work offline.
            </p>
          </Panel>
        </aside>
      </div>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          const n = deleteCompleted();
          toast(`Deleted ${n} completed task${n === 1 ? "" : "s"}`, { tone: "info" });
        }}
        title="Delete completed tasks?"
        description={`This permanently removes ${counts.completed} completed task${counts.completed === 1 ? "" : "s"} from every synced screen.`}
      />
    </div>
  );
}

export function QuickAdd({ onAdd, placeholder = "Quick add a task for today — press Enter" }: { onAdd: (title: string) => void; placeholder?: string }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="mt-4 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const title = value.trim();
        if (!title) return;
        onAdd(title.slice(0, 200));
        setValue("");
      }}
    >
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} aria-label="Quick add task" maxLength={200} />
      <Button type="submit" variant="secondary" disabled={!value.trim()} aria-label="Add quick task">
        <Plus className="size-4" />
        <span className="hidden sm:inline">Add</span>
      </Button>
    </form>
  );
}
