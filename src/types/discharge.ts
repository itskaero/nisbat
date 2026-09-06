import type {
  DiagnosisRecord,
  PresentingComplaintsRecord,
  HistoryRecord,
  ExaminationRecord,
  DischargeConditionRecord,
  InvestigationItem,
  TreatmentRecord,
  GrowthRecord,
  PendingTest,
  ImmunizationRecord,
} from "./clinical";
import { emptyHistoryCategories } from "./clinical";
import type { PrescriptionItem, ReconciliationItem } from "./medication";
import type { ClinicalTemplateId, AdvicePackSection } from "./content";
import type { ParentLanguageMode, PaperSize } from "./settings";
import type { AuditEvent, PrintEvent } from "./audit";

/**
 * DRAFT → READY FOR PRINT/SR REVIEW → PENDING SR REVIEW → COMPLETED/SIGNED
 * No digital signature step in V1 — completion is recorded by an authorized
 * user after a physical review + physical signature.
 */
export const DISCHARGE_STATUSES = [
  "draft",
  "ready_for_print",
  "pending_sr_review",
  "completed",
] as const;
export type DischargeStatus = (typeof DISCHARGE_STATUSES)[number];

export const STATUS_LABELS: Record<DischargeStatus, string> = {
  draft: "Draft",
  ready_for_print: "Ready for Print",
  pending_sr_review: "Pending SR Review",
  completed: "Completed / Signed",
};

/** snapshot of a source-content pack copied into the discharge at selection time */
export interface AppliedAdvicePack {
  id: string; // id of this application, not the source pack
  packId: string;
  packTitle: string;
  version: number;
  category: string;
  /**
   * The current/kept view — what print and preview actually render. Starts
   * as a full copy of `sourceSections` and gets pruned by the bullet picker
   * (sections left with zero selected bullets are dropped entirely).
   */
  sections: AdvicePackSection[];
  /**
   * The full, immutable snapshot captured at apply time — every section and
   * bullet the pack had then, regardless of what's currently selected. This
   * is what satisfies CLAUDE.md rule 11 (preserve applied content
   * snapshots) and is what the bullet picker re-opens to let a clinician
   * re-include something they pruned earlier, without re-applying the pack.
   */
  sourceSections: AdvicePackSection[];
  appliedAt: string;
  /** per-pack language override — undefined means "follow the discharge's
   * parentLanguage default" (see discharge-document.tsx's mode resolution) */
  languageOverride?: ParentLanguageMode;
}

export interface AppliedFollowUpItem {
  id: string;
  moduleId?: string;
  service: string;
  timingLabel: string;
  purpose: string;
  instructions: string;
  /** Urdu counterparts — see FollowUpModule for why only these two fields
   * (not service/timingLabel) carry a translation. */
  purposeUr?: string;
  instructionsUr?: string;
  pendingResultReview: boolean;
  isCustom: boolean;
}

/** institutional identity captured at finalization so later Settings edits never rewrite history */
export interface InstitutionalSnapshot {
  hospitalName: string;
  logoUrl?: string;
  department: string;
  hodName: string;
  srName?: string;
  contactPhone: string;
  contactAddress: string;
  capturedAt: string;
}

export interface DischargeContent {
  diagnosis: DiagnosisRecord;
  presentingComplaints: PresentingComplaintsRecord;
  history: HistoryRecord;
  examination: ExaminationRecord;
  investigations: InvestigationItem[];
  treatment: TreatmentRecord;
  dischargeCondition: DischargeConditionRecord;
  medications: PrescriptionItem[];
  reconciliation: ReconciliationItem[];
  advice: AppliedAdvicePack[];
  followUp: AppliedFollowUpItem[];
  growth: GrowthRecord;
  pendingTests: PendingTest[];
  immunization: ImmunizationRecord;
}

/** an immutable snapshot of a prior completed/signed revision */
export interface DischargeRevisionSnapshot {
  revisionNumber: number;
  content: DischargeContent;
  completedAt: string;
  completedById: string;
  completedByName: string;
  reviewerName?: string;
  institutionalSnapshot: InstitutionalSnapshot;
}

export interface Discharge {
  id: string;
  admissionId: string;
  patientId: string;
  status: DischargeStatus;
  revisionNumber: number;
  templateId: ClinicalTemplateId;
  templateAutoSelected: boolean;
  parentLanguage: ParentLanguageMode;
  /** overrides parentLanguage for the Medications section only; undefined
   * means "follow the discharge default" */
  medicationsLanguage?: ParentLanguageMode;
  /** overrides parentLanguage for the Follow-up section only; undefined
   * means "follow the discharge default" */
  followUpLanguage?: ParentLanguageMode;
  paperSize: PaperSize;

  content: DischargeContent;

  preparedById: string;
  preparedByName: string;
  reviewerId?: string;
  reviewerName?: string;
  completedById?: string;
  completedByName?: string;

  /** past completed revisions, oldest first — preserved verbatim per CLAUDE.md rule 11 */
  revisionHistory: DischargeRevisionSnapshot[];
  institutionalSnapshot?: InstitutionalSnapshot; // set once completed

  printEvents: PrintEvent[];
  auditTrail: AuditEvent[];

  /** no hard delete (CLAUDE.md) — archived/cancelled records are retained with a reason */
  archived: boolean;
  archivedReason?: string;

  createdAt: string;
  updatedAt: string;
}

export function emptyDischargeContent(
  emptyExam: () => ExaminationRecord,
  weightKg: number,
): DischargeContent {
  return {
    diagnosis: { primary: null, secondary: [] },
    presentingComplaints: { complaints: [], narrative: "" },
    history: { categories: emptyHistoryCategories(), narrative: "" },
    examination: emptyExam(),
    investigations: [],
    treatment: { events: [], courseNarrative: "" },
    dischargeCondition: { selected: [], note: "" },
    medications: [],
    reconciliation: [],
    advice: [],
    followUp: [],
    growth: { weightKg, showOnPrint: false },
    pendingTests: [],
    immunization: { status: "not_assessed" },
  };
}
