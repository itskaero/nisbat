import type { DurationValue } from "@/types";

export function formatDuration(d: DurationValue): string {
  if (d.preset === "custom") return d.customDays ? `${d.customDays} day(s)` : "Custom";
  return d.preset;
}

/**
 * "Panadol, Calpol" — a shared formatter so every display site (prescribing
 * dialog, clinician table, print) renders brand names the same way, always
 * parenthetical/secondary to the canonical strengthLabel, never in place of
 * it. Empty/undefined stays empty, not a placeholder string.
 */
export function formatBrandNames(names?: string[]): string {
  return names && names.length > 0 ? names.join(", ") : "";
}
