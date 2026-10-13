import { BookOpen, Home, Newspaper, Settings, ShoppingCart, SquareCheckBig, Tv } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

export const NAV_ITEMS: { href: string; key: TranslationKey; icon: typeof Home; short: string }[] = [
  { href: "/", key: "nav.home", icon: Home, short: "Home" },
  { href: "/quran", key: "nav.quran", icon: BookOpen, short: "Quran" },
  { href: "/news", key: "nav.news", icon: Newspaper, short: "News" },
  { href: "/saman", key: "nav.saman", icon: ShoppingCart, short: "Saman" },
  { href: "/tasks", key: "nav.tasks", icon: SquareCheckBig, short: "Tasks" },
  { href: "/tv", key: "nav.tv", icon: Tv, short: "Live TV" },
];

export const SETTINGS_ITEM = { href: "/settings", key: "nav.settings" as TranslationKey, icon: Settings };

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}
