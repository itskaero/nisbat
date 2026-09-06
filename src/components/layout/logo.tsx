import Image from "next/image";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-gradient-to-br from-primary to-secondary text-[13px] font-bold text-white shadow-[0_0_16px_-4px_rgba(16,185,129,0.65)]",
        className,
      )}
      aria-hidden
    >
      N
    </div>
  );
}

/**
 * Compact nav mark (default) vs. the real logo.png artwork ("full") — the
 * full mark's illustration (kids, Rx pad, wordmark) reads fine at the size a
 * login/splash screen affords but turns to mush shrunk into a ~28px sidebar
 * icon, so the sidebars keep the generated mark (colored from the same
 * --primary/--secondary tokens the logo's palette was matched to) and only
 * the prominent, low-density screens show the artwork itself.
 */
export function Logo({
  collapsed,
  className,
  variant = "compact",
}: {
  collapsed?: boolean;
  className?: string;
  variant?: "compact" | "full";
}) {
  if (variant === "full") {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        <Image src="/logo.png" alt="Nisbat" width={220} height={220} priority className="h-auto w-[140px]" />
      </div>
    );
  }
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark />
      {!collapsed && (
        <div className="leading-tight">
          <div className="text-[14px] font-semibold text-foreground">Nisbat</div>
        </div>
      )}
    </div>
  );
}
