"use client";

import { LayoutGrid, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/primitives";
import { useT } from "@/lib/i18n";
import { usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore } from "@/lib/storage/stores";
import { BrandMark } from "./brand";
import { NAV_ITEMS, SETTINGS_ITEM, isActive } from "./nav";

/** Navigation rail: collapsed on tablets, collapsible on desktop, hidden on phones. */
export function Sidebar() {
  const pathname = usePathname();
  const t = useT();
  const { sidebarCollapsed } = usePersisted(settingsStore);
  const items = [...NAV_ITEMS];

  const linkClass = (active: boolean) =>
    cn(
      "group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
      active
        ? "bg-gradient-to-r from-emerald/25 to-emerald/5 text-ink shadow-[inset_0_0_0_1px_rgba(69,212,154,0.25)]"
        : "text-ink-2 hover:bg-white/6 hover:text-ink",
    );

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "tv-show glass sticky top-4 m-4 me-0 hidden h-[calc(100dvh-2rem)] shrink-0 flex-col p-3 md:flex",
        "w-[76px]",
        !sidebarCollapsed && "lg:w-[232px]",
        "transition-[width] duration-300",
      )}
    >
      <Link href="/" className="mb-6 flex items-center gap-2.5 px-1.5 pt-1" aria-label="Nisbat Home">
        <BrandMark />
        <span className={cn("hidden flex-col leading-tight", !sidebarCollapsed && "lg:flex")}>
          <span className="text-lg font-semibold tracking-tight">Nisbat</span>
          <span className="text-[11px] text-ink-3">Home</span>
        </span>
      </Link>

      <ul className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={active ? "page" : undefined} className={linkClass(active)} title={t(item.key)}>
                {active && <span className="absolute inset-y-2 start-0 w-1 rounded-full bg-emerald" aria-hidden />}
                <Icon className={cn("size-5 shrink-0", active ? "text-emerald" : "")} aria-hidden />
                <span className={cn("hidden truncate", !sidebarCollapsed && "lg:inline")}>{t(item.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 flex flex-col gap-1 border-t border-white/8 pt-3">
        <Link
          href={SETTINGS_ITEM.href}
          aria-current={isActive(pathname, SETTINGS_ITEM.href) ? "page" : undefined}
          className={linkClass(isActive(pathname, SETTINGS_ITEM.href))}
          title={t(SETTINGS_ITEM.key)}
        >
          <SETTINGS_ITEM.icon className="size-5 shrink-0" aria-hidden />
          <span className={cn("hidden", !sidebarCollapsed && "lg:inline")}>{t(SETTINGS_ITEM.key)}</span>
        </Link>
        <button
          type="button"
          onClick={() => settingsStore.set((s) => ({ ...s, sidebarCollapsed: !s.sidebarCollapsed }))}
          className="hidden h-10 items-center gap-3 rounded-xl px-3 text-xs text-ink-3 hover:bg-white/6 hover:text-ink lg:flex"
          aria-label={sidebarCollapsed ? t("nav.expand") : t("nav.collapse")}
          aria-expanded={!sidebarCollapsed}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="size-5 rtl:-scale-x-100" /> : <PanelLeftClose className="size-5 rtl:-scale-x-100" />}
          {!sidebarCollapsed && <span>{t("nav.collapse")}</span>}
        </button>
      </div>
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const t = useT();
  const { language } = usePersisted(settingsStore);
  const [moreOpen, setMoreOpen] = useState(false);
  const label = (item: { key: Parameters<typeof t>[0]; short: string }) => (language === "ur" ? t(item.key) : item.short);
  const primary = NAV_ITEMS.filter((i) => i.mobile);
  const moreActive = !primary.some((i) => isActive(pathname, i.href));
  const cell = (active: boolean) => cn("flex h-16 w-full flex-col items-center justify-center gap-1 text-[10px] font-medium", active ? "text-emerald" : "text-ink-3");
  return (
    <nav
      aria-label="Primary"
      className="tv-hide fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[rgba(10,16,28,0.94)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="grid grid-cols-6">
        {primary.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={active ? "page" : undefined} className={cell(active)}>
                <Icon className="size-5" aria-hidden />
                <span className="max-w-full truncate px-0.5">{label(item)}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <button type="button" className={cell(moreActive)} aria-haspopup="dialog" onClick={() => setMoreOpen(true)}>
            <LayoutGrid className="size-5" aria-hidden />
            <span>{language === "ur" ? t("nav.more") : "More"}</span>
          </button>
        </li>
      </ul>
      <Dialog open={moreOpen} onClose={() => setMoreOpen(false)} title={t("nav.more")} size="sm">
        <ul className="grid grid-cols-3 gap-2">
          {[...NAV_ITEMS, { ...SETTINGS_ITEM, short: "Settings" }].map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn("glass-soft flex flex-col items-center gap-1.5 px-1 py-3 text-center text-xs", active ? "border-emerald/40 text-emerald" : "text-ink-2")}
                >
                  <Icon className="size-5" aria-hidden />
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </Dialog>
    </nav>
  );
}
