"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Circle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import { SECTION_GROUPS, WORKSPACE_SECTIONS, safeIsComplete } from "@/lib/workspace-nav";
import type { DischargeContent } from "@/types";

export function WorkspaceSidebar({
  dischargeId,
  content,
  patientId,
}: {
  dischargeId: string;
  content: DischargeContent;
  patientId: string;
}) {
  const pathname = usePathname();
  const currentId = pathname.split("/").pop();

  return (
    <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-surface/60 lg:flex">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <Logo />
      </div>

      <Link
        href={`/patients/${patientId}`}
        className="flex items-center gap-1.5 border-b border-border px-4 py-2.5 text-[12px] text-foreground-subtle hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Patient history
      </Link>

      <nav className="flex-1 space-y-4 p-3">
        {SECTION_GROUPS.map((group) => {
          const items = WORKSPACE_SECTIONS.filter((s) => s.group === group);
          return (
            <div key={group}>
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
                {group}
              </div>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active = item.id === currentId;
                  const complete = item.id !== "summary" && safeIsComplete(item, content);
                  return (
                    <Link
                      key={item.id}
                      href={`/discharges/${dischargeId}/${item.id}`}
                      className={cn(
                        "flex items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 text-[13px] font-medium transition-[color,background-color,box-shadow] duration-150",
                        active
                          ? "bg-primary/12 text-primary-light shadow-[0_0_18px_-9px_rgba(16,185,129,0.6)]"
                          : "text-foreground-muted hover:bg-surface-hover hover:text-foreground",
                      )}
                    >
                      {complete ? (
                        <CheckCircle2 className="size-3.5 shrink-0 text-success" />
                      ) : (
                        <Circle
                          className={cn(
                            "size-3.5 shrink-0",
                            active ? "text-primary" : "text-foreground-subtle",
                          )}
                          fill={active ? "currentColor" : "none"}
                        />
                      )}
                      <span className="flex-1">{item.label}</span>
                      {item.required && !complete && <span className="text-[10px] text-danger">•</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
