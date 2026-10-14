import type { ComponentChildren, JSX } from "preact";
import { RefreshCw } from "lucide-react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function ScreenHeader({ title, ur, sub, right }: { title: string; ur?: string; sub?: string; right?: ComponentChildren }) {
  return (
    <header class="mb-6 flex items-end justify-between gap-6">
      <div>
        <h1 class="flex items-baseline gap-4 text-[2.4rem] font-semibold leading-tight tracking-tight">
          {title}
          {ur && (
            <span lang="ur" class="font-urdu text-[1.6rem] font-normal text-ink-2">
              {ur}
            </span>
          )}
        </h1>
        {sub && <p class="mt-1 text-lg text-ink-2">{sub}</p>}
      </div>
      {right}
    </header>
  );
}

export function Card({ title, icon, children, class: c, right }: { title?: ComponentChildren; icon?: ComponentChildren; children: ComponentChildren; class?: string; right?: ComponentChildren }) {
  return (
    <section class={cx("card p-6", c)}>
      {title && (
        <div class="mb-4 flex items-center justify-between gap-3">
          <h2 class="flex items-center gap-2.5 text-[0.95rem] font-semibold uppercase tracking-[0.16em] text-ink-2">
            {icon}
            {title}
          </h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Tile({ class: c, children, ...rest }: JSX.IntrinsicElements["button"]) {
  return (
    <button type="button" class={cx("tile block text-start", c as string)} {...rest}>
      {children}
    </button>
  );
}

export function Chips<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} class="flex flex-wrap gap-3">
      {options.map((o) => (
        <button key={o.value} type="button" class="chip text-lg" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Problem({ title, text, onRetry }: { title: string; text?: string | null; onRetry?: () => void }) {
  return (
    <div class="card flex items-center gap-6 p-6">
      <div class="flex-1">
        <p class="text-xl font-semibold">{title}</p>
        {text && <p class="mt-1 text-ink-2">{text}</p>}
      </div>
      {onRetry && (
        <button type="button" class="tile flex items-center gap-2 px-5 py-3 text-lg" onClick={onRetry}>
          <RefreshCw size={20} /> Try again
        </button>
      )}
    </div>
  );
}

export function Skeleton({ class: c }: { class?: string }) {
  return <div class={cx("animate-pulse rounded-2xl bg-white/[0.06]", c)} />;
}

export function Source({ children }: { children: ComponentChildren }) {
  return <p class="mt-4 text-sm text-ink-3">{children}</p>;
}
