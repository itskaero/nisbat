import { cn } from "@/components/ui/primitives";

/** Original Nisbat mark: two leaves meeting — a "connection" (nisbat). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <defs>
        <linearGradient id="nb-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6d28f" />
          <stop offset="1" stopColor="#d99a45" />
        </linearGradient>
        <linearGradient id="nb-teal" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fe3c0" />
          <stop offset="1" stopColor="#2aa3a0" />
        </linearGradient>
      </defs>
      <path d="M20 4 C 10 14 9 24 18 34 C 18 24 20 14 20 4Z" fill="url(#nb-gold)" />
      <path d="M20 4 C 30 14 31 24 22 34 C 22 24 20 14 20 4Z" fill="url(#nb-teal)" opacity="0.92" />
      <path d="M8 22 C 12 30 20 36 32 30 C 24 32 15 30 8 22Z" fill="url(#nb-gold)" opacity="0.8" />
    </svg>
  );
}
