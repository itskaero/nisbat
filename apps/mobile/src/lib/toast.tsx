import { useEffect, useState } from "react";

interface T {
  id: number;
  text: string;
  tone: "ok" | "info" | "error";
}
let list: T[] = [];
let id = 0;
const ls = new Set<() => void>();

export function toast(text: string, tone: T["tone"] = "ok") {
  const t = { id: ++id, text, tone };
  list = [...list.slice(-2), t];
  ls.forEach((l) => l());
  setTimeout(() => {
    list = list.filter((x) => x.id !== t.id);
    ls.forEach((l) => l());
  }, 3200);
}

export function Toasts() {
  const [, set] = useState(0);
  useEffect(() => {
    const l = () => set((n) => n + 1);
    ls.add(l);
    return () => {
      ls.delete(l);
    };
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--safe-bottom)+5.5rem)] z-[60] flex flex-col items-center gap-2 px-4">
      {list.map((t) => (
        <p key={t.id} className={`glass glass-strong fade-in px-4 py-2.5 text-sm ${t.tone === "error" ? "text-coral" : t.tone === "info" ? "text-ink-2" : ""}`}>
          {t.text}
        </p>
      ))}
    </div>
  );
}
