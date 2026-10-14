"use client";

import { AlarmClock, Bell, CalendarClock, Search, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconButton, cn } from "@/components/ui/primitives";
import { useCommandPalette } from "@/features/search/command-palette";
import { isDueToday, isOverdue } from "@/features/tasks/logic";
import { dayPart, formatHHMM, formatLongDate } from "@/lib/dates";
import { useNow } from "@/lib/hooks";
import { useT } from "@/lib/i18n";
import { usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore, tasksStore } from "@/lib/storage/stores";
import { BrandMark } from "./brand";

export function TopBar() {
  const t = useT();
  const settings = usePersisted(settingsStore);
  const now = useNow();
  const { open } = useCommandPalette();
  const greeting = now ? t(`greet.${dayPart(settings.timezone, now)}` as const) : "";

  return (
    <header className="sticky top-0 z-30 -mx-4 mb-2 flex items-center gap-3 bg-gradient-to-b from-[#0b1220]/90 via-[#0b1220]/60 to-transparent px-4 pb-3 pt-3 md:static md:mx-0 md:bg-none md:px-0 md:pt-4">
      <Link href="/" className="flex items-center gap-2 md:hidden" aria-label="Nisbat Home">
        <BrandMark className="size-8" />
      </Link>

      <button
        type="button"
        onClick={() => open()}
        className="glass group flex h-11 min-w-0 flex-1 items-center gap-3 !rounded-2xl px-4 text-start text-sm text-ink-3 transition-colors hover:text-ink-2 md:max-w-md"
        aria-label="Open search"
        aria-keyshortcuts="Control+K Meta+K"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate">{t("search.placeholder")}</span>
        <kbd className="hidden rounded-md border border-white/12 px-1.5 py-0.5 font-sans text-[10px] text-ink-3 sm:inline">Ctrl K</kbd>
      </button>

      <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
        <div className="hidden text-end leading-tight lg:block" aria-live="off">
          <p className="text-xs text-ink-2" suppressHydrationWarning>
            {now ? formatLongDate(now, settings.timezone) : " "}
          </p>
          <p className="text-sm font-medium text-ink">
            {greeting}
            {settings.name ? `, ${settings.name}` : ""}
          </p>
        </div>
        <NotificationsButton />
        <Link
          href="/settings"
          aria-label="Profile and settings"
          className="grid size-10 place-items-center rounded-full border border-white/15 bg-gradient-to-br from-gold/40 to-emerald/30 text-sm font-semibold text-ink transition-transform hover:scale-105"
        >
          {settings.name ? settings.name.trim().charAt(0).toUpperCase() : <Settings className="size-4" aria-hidden />}
        </Link>
      </div>
    </header>
  );
}

function NotificationsButton() {
  const t = useT();
  const tasks = usePersisted(tasksStore);
  const { timezone } = usePersisted(settingsStore);
  const now = useNow();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const overdue = now ? tasks.filter((x) => isOverdue(x, timezone)) : [];
  const dueToday = now ? tasks.filter((x) => !x.completed && isDueToday(x, timezone) && !isOverdue(x, timezone)) : [];
  const count = overdue.length + dueToday.length;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <IconButton
        label={`${t("notifications")}${count ? ` (${count})` : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
        className="relative border-white/10 bg-white/5"
      >
        <Bell className="size-[18px]" />
        {count > 0 && (
          <span className="absolute -end-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
            {count}
          </span>
        )}
      </IconButton>
      {open && (
        <div
          role="dialog"
          data-popover-open
          aria-label={t("notifications")}
          className="glass animate-fade-up absolute end-0 top-12 z-50 w-[min(340px,calc(100vw-2rem))] !bg-[rgba(14,22,35,0.97)] p-2"
        >
          <p className="px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-wider text-ink-3">{t("notifications")}</p>
          {count === 0 ? (
            <p className="px-3 pb-3 text-sm text-ink-2">You&apos;re all caught up. Nothing overdue or due today.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {[...overdue, ...dueToday].map((task) => {
                const late = overdue.includes(task);
                return (
                  <li key={task.id}>
                    <Link
                      href="/tasks"
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-white/6"
                    >
                      {late ? (
                        <AlarmClock className="mt-0.5 size-4 shrink-0 text-coral" aria-hidden />
                      ) : (
                        <CalendarClock className="mt-0.5 size-4 shrink-0 text-cyan" aria-hidden />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-ink">{task.title}</span>
                        <span className={cn("text-xs", late ? "text-coral" : "text-ink-3")}>
                          {late ? "Overdue" : "Due today"}
                          {task.dueTime ? ` · ${formatHHMM(task.dueTime)}` : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="border-t border-white/8 px-3 pb-1 pt-2 text-[11px] text-ink-3">
            In-app reminders only — Nisbat does not send push notifications yet.
          </p>
        </div>
      )}
    </div>
  );
}
