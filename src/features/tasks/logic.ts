import { nowHHMM, todayKey } from "@/lib/dates";
import type { Priority, Task } from "@/types/domain";

export type TaskFilter = "today" | "upcoming" | "completed" | "all";
export type TaskSort = "due" | "priority" | "created";

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function isOverdue(task: Task, tz: string): boolean {
  if (task.completed || !task.dueDate) return false;
  const today = todayKey(tz);
  if (task.dueDate < today) return true;
  if (task.dueDate === today && task.dueTime) return task.dueTime < nowHHMM(tz);
  return false;
}

export function isDueToday(task: Task, tz: string): boolean {
  return !!task.dueDate && task.dueDate === todayKey(tz);
}

export function filterTasks(tasks: Task[], filter: TaskFilter, tz: string): Task[] {
  const today = todayKey(tz);
  switch (filter) {
    case "today":
      // Today's plan includes anything overdue that is still open.
      return tasks.filter((t) => t.dueDate && (t.dueDate === today || (!t.completed && t.dueDate < today)));
    case "upcoming":
      return tasks.filter((t) => !t.completed && (!t.dueDate || t.dueDate > today));
    case "completed":
      return tasks.filter((t) => t.completed);
    default:
      return tasks;
  }
}

export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  const copy = [...tasks];
  const dueKey = (t: Task) => (t.dueDate ? `${t.dueDate}T${t.dueTime ?? "99:99"}` : "9999");
  copy.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (sort === "priority") {
      const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (p) return p;
      return dueKey(a).localeCompare(dueKey(b));
    }
    if (sort === "created") return b.createdAt.localeCompare(a.createdAt);
    const d = dueKey(a).localeCompare(dueKey(b));
    return d || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  });
  return copy;
}

export function taskStats(tasks: Task[], tz: string) {
  const today = todayKey(tz);
  const todays = tasks.filter((t) => t.dueDate === today);
  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.completed).length,
    pending: tasks.filter((t) => !t.completed).length,
    overdue: tasks.filter((t) => isOverdue(t, tz)).length,
    todayTotal: todays.length,
    todayDone: todays.filter((t) => t.completed).length,
  };
}
