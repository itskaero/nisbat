/**
 * Institutional settings, users/roles. Kept separate from clinical content so
 * institutional identity can be snapshotted at finalization without touching
 * clinical data (see InstitutionalSnapshot in discharge.ts).
 */

export type UserRole = "pgr_mo" | "sr_faculty" | "admin";

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  designation: string; // e.g. "PGR, Pediatrics" / "Associate Professor"
  username: string;
  /** never hard-deleted (CLAUDE.md) — deactivate instead */
  active: boolean;
}

export type ParentLanguageMode = "urdu_only" | "urdu_english" | "english_only";
export type PaperSize = "A4" | "Legal";

export interface InstitutionalSettings {
  hospitalName: string;
  logoUrl?: string;
  department: string;
  hodName: string;
  contactPhone: string;
  contactAddress: string;
  defaultPaperSize: PaperSize;
  defaultParentLanguage: ParentLanguageMode;
}
