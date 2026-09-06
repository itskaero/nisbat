"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  FolderCheck,
  Search,
  Library,
  Pill,
  BarChart3,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import { useAppStore } from "@/lib/store";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admissions", label: "Admissions", icon: ClipboardList },
  { href: "/my-discharges", label: "My Discharges", icon: FolderCheck },
  { href: "/search", label: "Search Patient", icon: Search },
  { href: "/advice-packs", label: "Content Library", icon: Library },
  { href: "/medications", label: "Medications", icon: Pill },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const ADMIN_NAV_ITEMS = [{ href: "/users", label: "Users", icon: Users }];

export function AppSidebar() {
  const pathname = usePathname();
  const isAdmin = useAppStore((s) => s.getCurrentUser().role === "admin");
  const items = isAdmin ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS;

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface/60 md:flex">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Logo />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-[var(--radius-md)] px-2.5 py-2 text-[13px] font-medium transition-[color,background-color,box-shadow] duration-150",
                active
                  ? "bg-primary/12 text-primary-light shadow-[0_0_18px_-9px_rgba(16,185,129,0.6)]"
                  : "text-foreground-muted hover:bg-surface-hover hover:text-foreground",
              )}
            >
              <Icon className="size-[17px]" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
