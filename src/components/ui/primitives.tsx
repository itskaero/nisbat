"use client";

import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type ComponentProps,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/* Buttons --------------------------------------------------------------- */

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-[background,color,border,box-shadow,transform] duration-200 select-none disabled:opacity-45 disabled:pointer-events-none active:scale-[0.98] whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-emerald text-[#06231a] hover:bg-[#5fe0ab] shadow-[0_8px_24px_-10px_rgba(69,212,154,0.7)]",
  secondary: "bg-white/8 text-ink border border-white/10 hover:bg-white/12 hover:border-white/16",
  outline: "border border-white/14 text-ink hover:bg-white/6",
  ghost: "text-ink-2 hover:text-ink hover:bg-white/6",
  danger: "bg-coral/15 text-coral border border-coral/30 hover:bg-coral/25",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-[0.95rem]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export function ButtonLink({
  variant = "secondary",
  size = "md",
  className,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={cn(base, variants[variant], sizes[size], className)} {...rest} />;
}

export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: "sm" | "md" | "lg"; tone?: "default" | "accent" }
>(function IconButton({ label, size = "md", tone = "default", className, children, type = "button", ...rest }, ref) {
  const s = size === "sm" ? "size-8" : size === "lg" ? "size-12" : "size-10";
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl transition-colors duration-200 disabled:opacity-40 disabled:pointer-events-none",
        tone === "accent"
          ? "bg-emerald text-[#06231a] hover:bg-[#5fe0ab]"
          : "text-ink-2 hover:text-ink hover:bg-white/8 border border-transparent",
        s,
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

/* Surfaces -------------------------------------------------------------- */

export function Panel({
  as: Tag = "section",
  className,
  children,
  ...rest
}: { as?: "section" | "div" | "article" | "aside"; className?: string; children?: ReactNode } & Omit<
  ComponentProps<"section">,
  "ref"
>) {
  return (
    <Tag className={cn("glass", className)} {...rest}>
      {children}
    </Tag>
  );
}

export function SectionHeader({
  title,
  icon,
  action,
  className,
  id,
}: {
  title: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <h2 id={id} className="flex items-center gap-2 text-[0.95rem] font-semibold text-ink">
        {icon}
        {title}
      </h2>
      {action}
    </div>
  );
}

/* Form controls --------------------------------------------------------- */

const fieldBase =
  "w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 text-sm text-ink placeholder:text-ink-3 transition-colors hover:border-white/20 focus:border-cyan/70 focus:bg-white/[0.06] focus:outline-none aria-[invalid=true]:border-coral/70";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={cn(fieldBase, "h-11", className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={cn(fieldBase, "min-h-24 py-3 leading-relaxed", className)} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        fieldBase,
        "h-11 appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pe-9 [&>option]:bg-[#121c2b]",
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a9b5c5' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
});

export function Field({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
  htmlFor: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-ink-2">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-coral">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <label htmlFor={id} className="text-sm text-ink">
          {label}
        </label>
        {description && <p className="mt-0.5 text-xs text-ink-3">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors",
          checked ? "border-emerald/60 bg-emerald/80" : "border-white/15 bg-white/10",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-[18px] rounded-full bg-white shadow transition-[inset-inline-start] duration-200",
            checked ? "start-[22px]" : "start-0.5",
          )}
        />
      </button>
    </div>
  );
}

/* Chips & segmented tabs ---------------------------------------------- */

export function ChipRow<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: ReactNode; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors",
              active
                ? "border-emerald/50 bg-emerald/15 text-emerald"
                : "border-white/10 bg-white/[0.03] text-ink-2 hover:border-white/20 hover:text-ink",
            )}
          >
            {o.label}
            {typeof o.count === "number" && (
              <span className={cn("rounded-full px-1.5 text-[10px]", active ? "bg-emerald/20" : "bg-white/8")}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: ReactNode; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-white/8 bg-black/20 p-1", className)}
      onKeyDown={(e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const idx = options.findIndex((o) => o.value === value);
        const dir = (e.key === "ArrowRight") !== (document.dir === "rtl") ? 1 : -1;
        const next = options[(idx + dir + options.length) % options.length];
        onChange(next.value);
        const btn = e.currentTarget.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`);
        btn?.focus();
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            data-value={o.value}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors",
              active ? "bg-white/12 text-ink shadow-sm" : "text-ink-2 hover:text-ink",
            )}
          >
            {o.label}
            {typeof o.count === "number" && <span className="text-[10px] text-ink-3">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* Feedback -------------------------------------------------------------- */

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" className={cn("inline-flex items-center gap-2 text-ink-2", className)}>
      <Loader2 className="size-4 animate-spin" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  tone = "neutral",
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  tone?: "neutral" | "error";
}) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn("flex flex-col items-center justify-center gap-3 px-6 py-10 text-center", className)}
    >
      {icon && (
        <div
          className={cn(
            "grid size-12 place-items-center rounded-2xl border",
            tone === "error" ? "border-coral/30 bg-coral/10 text-coral" : "border-white/10 bg-white/5 text-ink-2",
          )}
        >
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description && <p className="mx-auto max-w-sm text-xs leading-relaxed text-ink-2">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "emerald" | "cyan" | "gold" | "coral";
  className?: string;
}) {
  const tones = {
    neutral: "bg-white/8 text-ink-2 border-white/10",
    emerald: "bg-emerald/12 text-emerald border-emerald/25",
    cyan: "bg-cyan/12 text-cyan border-cyan/25",
    gold: "bg-gold/12 text-gold border-gold/25",
    coral: "bg-coral/12 text-coral border-coral/25",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide", tones[tone], className)}>
      {children}
    </span>
  );
}

export function ProgressRing({
  value,
  max,
  size = 64,
  stroke = 6,
  label,
  children,
  color = "var(--emerald)",
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  label: string;
  children?: ReactNode;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 600ms var(--ease)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function ProgressBar({ value, max, label, className }: { value: number; max: number; label: string; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/10", className)}
    >
      <div className="h-full rounded-full bg-emerald transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function SourceNote({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[11px] leading-relaxed text-ink-3", className)}>{children}</p>;
}
