import { Banknote, BookOpen, CloudSun, Flag, Headphones, Home, MoonStar, Newspaper, Settings, ShoppingCart, Sparkles, SquareCheckBig, Tv } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

export interface NavItem {
  href: string;
  key: TranslationKey;
  icon: typeof Home;
  short: string;
  /** Shown in the phone bottom bar (others live under "More"). */
  mobile?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", key: "nav.home", icon: Home, short: "Home", mobile: true },
  { href: "/quran", key: "nav.quran", icon: BookOpen, short: "Quran", mobile: true },
  { href: "/namaz", key: "nav.namaz", icon: MoonStar, short: "Namaz", mobile: true },
  { href: "/azkar", key: "nav.azkar", icon: Sparkles, short: "Azkar" },
  { href: "/sunein", key: "nav.sunein", icon: Headphones, short: "Sunein", mobile: true },
  { href: "/pakistan", key: "nav.pakistan", icon: Flag, short: "Pakistan" },
  { href: "/news", key: "nav.news", icon: Newspaper, short: "News" },
  { href: "/mausam", key: "nav.mausam", icon: CloudSun, short: "Mausam" },
  { href: "/bazaar", key: "nav.bazaar", icon: Banknote, short: "Bazaar" },
  { href: "/saman", key: "nav.saman", icon: ShoppingCart, short: "Saman", mobile: true },
  { href: "/tasks", key: "nav.tasks", icon: SquareCheckBig, short: "Tasks" },
  { href: "/tv", key: "nav.tv", icon: Tv, short: "Live TV" },
];

export const SETTINGS_ITEM = { href: "/settings", key: "nav.settings" as TranslationKey, icon: Settings };

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}
