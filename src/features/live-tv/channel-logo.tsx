import { cn } from "@/components/ui/primitives";

const PALETTE = [
  ["#1f6f5a", "#45d49a"],
  ["#1d5770", "#65c7e8"],
  ["#7a5524", "#e9b66b"],
  ["#7a3226", "#f07c65"],
  ["#4b3a7a", "#b9a4ff"],
  ["#2c4a7a", "#8fb6ff"],
];

/**
 * Original monogram tile for a channel. We don't hotlink or redistribute
 * broadcaster logos.
 */
export function ChannelLogo({ name, className }: { name: string; className?: string }) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const [from, to] = PALETTE[h % PALETTE.length];
  const initials = name
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => (/^\d/.test(w) ? w.slice(0, 2) : w[0]))
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      className={cn("grid size-11 shrink-0 place-items-center rounded-xl text-sm font-bold tracking-tight text-white shadow-inner", className)}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {initials}
    </span>
  );
}
