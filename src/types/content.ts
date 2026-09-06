/**
 * Content architecture — kept as distinct concepts per CLAUDE.md, never collapsed
 * into one generic "pack":
 *   Advice Packs        — family education / danger signs / home care
 *   Follow-up Modules    — clinical continuation / follow-up
 *   Clinical Templates   — document structure
 *   Medication Rules      — see medication.ts (DoseRule)
 *
 * Advice Packs and Follow-up Modules are versioned. When applied to a discharge,
 * their content is copied/snapshotted (see AppliedAdvicePack / AppliedFollowUpItem
 * in discharge.ts) so later edits to the source content never change historical
 * documents.
 */

export type ContentStatus = "draft" | "published";

export const ADVICE_PACK_CATEGORIES = [
  "general_pediatric",
  "respiratory",
  "gi",
  "neurology",
  "cardiac",
  "hematology",
  "infectious",
  "neonatal",
  "nutrition",
  "disease_specific",
] as const;
export type AdvicePackCategory = (typeof ADVICE_PACK_CATEGORIES)[number];

export interface AdvicePackBullet {
  id: string;
  /** canonical English wording */
  en: string;
  /** curated Urdu wording — authored content, never runtime-translated
   * (CLAUDE.md: "Do not use runtime AI translation as the authoritative
   * wording of standard clinical instructions"). */
  ur: string;
}

export interface AdvicePackSection {
  id: string;
  heading: string;
  /** Urdu wording of the heading — parents reading danger signs at home need
   * the heading itself in Urdu, not just the bullets. */
  headingUr?: string;
  /** explicit, not inferred from heading text — drives the restrained warning
   * styling DESIGN.md specifies for danger signs, on both preview and print. */
  isDangerSigns?: boolean;
  bullets: AdvicePackBullet[];
}

export interface AdvicePack {
  id: string;
  title: string;
  category: AdvicePackCategory;
  version: number;
  status: ContentStatus;
  /** diagnosis labels/codes that suggest this pack — suggestion only, never auto-applied */
  linkedDiagnoses: string[];
  sections: AdvicePackSection[]; // home care, feeding, medication-related, danger signs, follow-up
  createdBy: string;
  publishedBy?: string;
  updatedAt: string;
}

export interface FollowUpModule {
  id: string;
  service: string;
  version: number;
  status: ContentStatus;
  defaultTimingLabel: string; // e.g. "1 week", "2 weeks", relative
  purpose: string;
  instructions: string;
  /** Urdu counterparts for the two fields a parent actually reads as prose —
   * Service/timing stay English-only, same as a Drug name or frequency code
   * elsewhere in the app: short structural labels, not translated content.
   * Faculty-authored directly, same as Advice Pack bullets — never a runtime
   * translation of the English text. */
  purposeUr?: string;
  instructionsUr?: string;
  hasPendingResultReview: boolean;
  linkedDiagnoses: string[];
  createdBy: string;
  publishedBy?: string;
  updatedAt: string;
}

/**
 * Investigation Panels — a modular rapid-fill template for the
 * Investigations workspace section (e.g. "CBC" → Hb/TLC/Platelets/DLC/ESR).
 * Same governance shape as Advice Packs/Follow-up Modules (versioned,
 * Faculty create, Admin publish), but structurally simpler — a name plus an
 * ordered list of test names — so it gets the modal-form authoring pattern
 * Follow-up Modules use, not a dedicated page-builder.
 */
export interface InvestigationPanelTest {
  id: string;
  name: string;
}

export interface InvestigationPanel {
  id: string;
  name: string;
  /** free-text grouping only (e.g. "Hematology") — not a governed enum like AdvicePackCategory */
  category?: string;
  version: number;
  status: ContentStatus;
  tests: InvestigationPanelTest[];
  createdBy: string;
  publishedBy?: string;
  updatedAt: string;
}

/**
 * Frequency parent-phrases — the wording a parent actually reads for a
 * frequency code (e.g. BD → "صبح و شام" / "Twice daily"), separated from
 * `FrequencyOption` in `medication.ts` (which stays fixed/hardcoded — it
 * encodes the underlying clinical semantics BD's calculation math depends on,
 * timesPerDay/intervalHours, not parent-facing wording). Faculty/Admin
 * governed and versioned like every other content type here, rather than a
 * hardcoded constant, so a wording change doesn't need a code deploy.
 * One row per FrequencyCode — a future extension could allow more than one
 * published phrasing per code (the user's own Nabz app supports this), not
 * built in this pass.
 */
export interface FrequencyPhrase {
  id: string;
  frequencyCode: string; // FrequencyCode from medication.ts, kept as string here to avoid a circular type import
  phraseEnglish: string;
  phraseUrdu: string;
  version: number;
  status: ContentStatus;
  createdBy: string;
  publishedBy?: string;
  updatedAt: string;
}

/**
 * Governed, versioned replacement for the previously-hardcoded chip/
 * catalogue constants (`EXAM_CHIPS`, `PRESENTING_COMPLAINT_CHIPS`,
 * `HISTORY_CHIPS`, `DIAGNOSIS_LIST`) — Faculty can now edit these without a
 * code deploy, mirroring every other content type's governance shape.
 *
 * One row per whole list (not per system/category) — matching the natural
 * editing grain: a Faculty member reviewing "Examination Chips" edits the
 * whole catalog in one sitting and submits it as one new version, the same
 * way an Advice Pack's several sections are edited and published together.
 *
 * `chipsBySystem` is used for the three lists keyed by ExamSystem/
 * HistoryCategory (exam_chips, presenting_complaint_chips, history_chips);
 * `flatItems` is used for the one flat list (diagnosis_catalogue). Exactly
 * one of the two is populated, determined by `key`.
 */
export type VocabularyListKey =
  | "exam_chips"
  | "presenting_complaint_chips"
  | "history_chips"
  | "diagnosis_catalogue";

export interface VocabularyList {
  id: string;
  key: VocabularyListKey;
  label: string; // human-readable, e.g. "Examination Chips"
  chipsBySystem?: Record<string, string[]>;
  flatItems?: string[];
  version: number;
  status: ContentStatus;
  createdBy: string;
  publishedBy?: string;
  updatedAt: string;
}

export type ClinicalTemplateId = "standard_pediatric" | "infant_neonatal" | "complex_long_stay";

export interface ClinicalTemplate {
  id: ClinicalTemplateId;
  name: string;
  description: string;
  /** section keys emphasized/expanded by default for this template */
  emphasizedSections: string[];
}
