"use client";

import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import { timeAgo } from "@/lib/dates";
import { useSyncStatus } from "@/lib/storage/sync";

/** One-line family-sync status. */
export function SyncNote({ className }: { className?: string }) {
  const { status, lastSyncedAt } = useSyncStatus();
  const Icon = status === "offline" ? CloudOff : status === "synced" ? Cloud : RefreshCw;
  return (
    <p className={cn("flex items-center justify-center gap-1.5 text-[11px] text-ink-3", className)} role="status" suppressHydrationWarning>
      <Icon className={cn("size-3.5", status === "offline" ? "text-gold" : status === "synced" ? "text-emerald" : "animate-spin")} aria-hidden />
      {status === "offline"
        ? "Can't reach the Nisbat server — changes are saved here and will sync when it's back."
        : status === "synced"
          ? `Shared with your family's Nisbat screens · synced ${lastSyncedAt ? timeAgo(lastSyncedAt) : ""}`
          : "Syncing with your family's Nisbat screens…"}
    </p>
  );
}
