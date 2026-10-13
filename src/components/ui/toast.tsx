"use client";

import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "./primitives";

type Tone = "success" | "info" | "error";
interface Toast {
  id: number;
  message: string;
  tone: Tone;
  action?: { label: string; onClick: () => void };
}

interface ToastApi {
  toast: (message: string, opts?: { tone?: Tone; action?: Toast["action"]; duration?: number }) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback<ToastApi["toast"]>(
    (message, opts) => {
      const id = ++counter.current;
      setToasts((t) => [...t.slice(-2), { id, message, tone: opts?.tone ?? "success", action: opts?.action }]);
      window.setTimeout(() => dismiss(id), opts?.duration ?? (opts?.action ? 6000 : 3500));
    },
    [dismiss],
  );

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[70] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:pe-6"
      >
        {toasts.map((t) => {
          const Icon = t.tone === "success" ? CheckCircle2 : t.tone === "error" ? TriangleAlert : Info;
          return (
            <div
              key={t.id}
              role={t.tone === "error" ? "alert" : "status"}
              className="animate-fade-up pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-white/12 bg-[rgba(16,26,40,0.96)] px-4 py-3 text-sm text-ink shadow-2xl"
            >
              <Icon
                className={cn(
                  "size-5 shrink-0",
                  t.tone === "success" ? "text-emerald" : t.tone === "error" ? "text-coral" : "text-cyan",
                )}
                aria-hidden
              />
              <span className="min-w-0 flex-1">{t.message}</span>
              {t.action && (
                <button
                  type="button"
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-emerald hover:bg-white/8"
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                >
                  {t.action.label}
                </button>
              )}
              <button
                type="button"
                aria-label="Dismiss notification"
                className="shrink-0 rounded-lg p-1 text-ink-3 hover:bg-white/8 hover:text-ink"
                onClick={() => dismiss(t.id)}
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
