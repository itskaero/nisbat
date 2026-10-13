"use client";

import { uid } from "@/lib/storage/persisted-store";
import { logActivity, tasksStore } from "@/lib/storage/stores";
import type { Task } from "@/types/domain";

export type TaskInput = Omit<Task, "id" | "completed" | "completedAt" | "createdAt" | "updatedAt">;

export function createTask(input: TaskInput): Task {
  const now = new Date().toISOString();
  const task: Task = { ...input, id: uid("t"), completed: false, createdAt: now, updatedAt: now };
  tasksStore.set((prev) => [task, ...prev]);
  logActivity("task-created", `Created task “${task.title}”`, "/tasks");
  return task;
}

export function updateTask(id: string, patch: Partial<Task>) {
  tasksStore.set((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t)));
}

export function toggleTask(id: string) {
  const task = tasksStore.get().find((t) => t.id === id);
  if (!task) return;
  const completed = !task.completed;
  updateTask(id, { completed, completedAt: completed ? new Date().toISOString() : undefined });
  if (completed) logActivity("task-completed", `Completed “${task.title}”`, "/tasks");
}

export function deleteTask(id: string): Task | undefined {
  const task = tasksStore.get().find((t) => t.id === id);
  tasksStore.set((prev) => prev.filter((t) => t.id !== id));
  return task;
}

export function restoreTask(task: Task) {
  tasksStore.set((prev) => (prev.some((t) => t.id === task.id) ? prev : [task, ...prev]));
}

export function deleteCompleted(): number {
  const n = tasksStore.get().filter((t) => t.completed).length;
  tasksStore.set((prev) => prev.filter((t) => !t.completed));
  return n;
}
