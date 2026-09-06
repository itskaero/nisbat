"use client";

import * as React from "react";
import { Search, Bell, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppStore } from "@/lib/store";

const ROLE_LABEL: Record<string, string> = {
  pgr_mo: "PGR/MO",
  sr_faculty: "SR/Faculty",
  admin: "Admin",
};

export function Topbar({ onSearchClick }: { onSearchClick: () => void }) {
  const currentUser = useAppStore((s) => s.getCurrentUser());
  const logout = useAppStore((s) => s.logout);
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    // Reading the system clock is an external-system read, not derived
    // state — this is the sanctioned effect use case, kept null until
    // mount so SSR and first client paint agree (no clock to read on the
    // server) rather than mismatching on a server-rendered time.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const initials = currentUser.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
      <button
        onClick={onSearchClick}
        className="flex h-9 w-full max-w-sm items-center gap-2 rounded-[var(--radius-md)] border border-border-strong bg-surface px-3 text-[13px] text-foreground-subtle transition-colors hover:border-border-strong hover:bg-surface-hover"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search patient or MR number…</span>
        <kbd className="rounded-[var(--radius-sm)] border border-border-strong bg-muted px-1.5 py-0.5 text-[10px] text-foreground-subtle">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-3">
        {now && (
          <span className="hidden text-[12px] text-foreground-subtle lg:inline">
            {now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })},{" "}
            {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}

        <button className="relative flex size-8 items-center justify-center rounded-[var(--radius-md)] text-foreground-muted hover:bg-surface-hover hover:text-foreground">
          <Bell className="size-[17px]" />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-[var(--radius-md)] px-1.5 py-1 hover:bg-surface-hover">
            <Avatar className="size-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-left sm:block">
              <span className="block text-[13px] font-medium leading-tight text-foreground">
                {currentUser.name.replace(/^(Dr\.|Prof\.)\s*/, "")}
              </span>
              <span className="block text-[11px] leading-tight text-foreground-subtle">
                {ROLE_LABEL[currentUser.role]}
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="normal-case">
              <span className="block text-[13px] font-medium text-foreground">{currentUser.name}</span>
              <span className="block text-[11px] font-normal text-foreground-subtle">
                @{currentUser.username} · {ROLE_LABEL[currentUser.role]}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-danger focus:text-danger">
              <LogOut className="size-3.5" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
