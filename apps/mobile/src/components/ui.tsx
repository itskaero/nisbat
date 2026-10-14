import { ChevronLeft, RefreshCw, X } from "lucide-react";
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { pop, pushOverlay } from "../lib/nav";
import { tap } from "../lib/native";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/** A page: sticky title bar (with Back when stacked) and scrolling content. */
export function Page({ title, ur, back, right, children }: { title: string; ur?: string; back?: boolean; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="page-in flex min-h-full flex-col">
      <header className="pt-safe sticky top-0 z-20 flex items-center gap-2 px-4 pb-3" style={{ background: "linear-gradient(180deg, rgba(11,18,32,.92) 60%, rgba(11,18,32,0))" }}>
        {back && (
          <button type="button" aria-label="Back" className="press -ms-2 grid size-10 place-items-center rounded-full" onClick={() => pop()}>
            <ChevronLeft size={26} />
          </button>
        )}
        <h1 className="flex min-w-0 flex-1 items-baseline gap-2 truncate text-[1.6rem] font-semibold tracking-tight">
          {title}
          {ur && (
            <span lang="ur" className="font-urdu truncate text-lg font-normal text-ink-2">
              {ur}
            </span>
          )}
        </h1>
        {right}
      </header>
      <div className="flex-1 px-4 pb-28">{children}</div>
    </div>
  );
}

export function Card({ title, right, children, className }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("glass p-4", className)}>
      {title && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-2">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Btn({ className, tone = "plain", children, onClick, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "plain" | "primary" | "ghost" | "danger" }) {
  return (
    <button
      type="button"
      className={cx(
        "press inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-[0.95rem] font-medium disabled:opacity-40",
        tone === "primary" && "bg-emerald text-[#06231a]",
        tone === "plain" && "border border-line bg-white/[0.06]",
        tone === "ghost" && "text-ink-2",
        tone === "danger" && "border border-coral/40 text-coral",
        className,
      )}
      onClick={(e) => {
        void tap();
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Chips<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="chip press"
          aria-pressed={o.value === value}
          onClick={() => {
            void tap();
            onChange(o.value);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Problem({ title, text, onRetry }: { title: string; text?: string | null; onRetry?: () => void }) {
  return (
    <div className="glass flex items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        {text && <p className="mt-0.5 text-sm text-ink-2">{text}</p>}
      </div>
      {onRetry && (
        <Btn onClick={onRetry} aria-label="Try again">
          <RefreshCw size={16} />
        </Btn>
      )}
    </div>
  );
}

export const Skeleton = ({ className }: { className?: string }) => <div className={cx("animate-pulse rounded-2xl bg-white/[0.06]", className)} />;

export const Source = ({ children }: { children: ReactNode }) => <p className="mt-3 text-[11px] leading-relaxed text-ink-3">{children}</p>;

/** Bottom sheet (Back and the backdrop close it). */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    return pushOverlay(onClose);
  }, [open, onClose]);
  if (!open) return null;
  // Portal: page transitions create stacking contexts that would trap the sheet under the tab bar.
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" className="fade-in absolute inset-0 bg-black/55" onClick={onClose} />
      <div className="sheet-in glass glass-strong pb-safe relative max-h-[88vh] overflow-y-auto rounded-b-none px-4 pt-3">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/20" />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" aria-label="Close" className="press grid size-9 place-items-center rounded-full bg-white/[0.06]" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-3">{hint}</span>}
    </label>
  );
}

export const inputCls = "w-full rounded-2xl border border-line bg-white/[0.05] px-4 py-3 text-base text-ink outline-none placeholder:text-ink-3 focus:border-emerald/60";
