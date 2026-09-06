/**
 * Clinical content captured during the discharge workflow: diagnosis, presenting
 * complaints, history, examination, investigations, treatment/hospital course,
 * growth, pending tests and immunization.
 *
 * These are kept as distinct concepts per CLAUDE.md rather than one generic blob,
 * even though they render together in the CLINICAL / HOSPITAL COURSE sidebar groups.
 */

export interface DiagnosisEntry {
  id: string;
  label: string;
  code?: string; // structured code when selected from the curated list
  isCustom: boolean;
}

export interface DiagnosisRecord {
  primary: DiagnosisEntry | null;
  secondary: DiagnosisEntry[];
}

export interface ChipNote {
  /** chip ids currently selected */
  selected: string[];
  /** free text, always available alongside chips */
  note: string;
}

export interface ComplaintEntry {
  id: string;
  symptom: string;
  duration?: string;
  onset?: string;
  progression?: string;
  associatedSymptoms?: string[];
  /** relevant history specific to *this* complaint — distinct from the
   * broader History section, e.g. "similar episode 2 months ago" */
  relevantHistory?: string;
  isCustom: boolean;
}

export interface PresentingComplaintsRecord {
  complaints: ComplaintEntry[];
  narrative: string;
}

export const HISTORY_CATEGORIES = [
  "birth",
  "immunization",
  "past_medical",
  "family",
  "allergy",
  "developmental",
] as const;
export type HistoryCategory = (typeof HISTORY_CATEGORIES)[number];

export interface HistoryRecord {
  /** relevant-history chips, grouped by category rather than one flat list —
   * mirrors ExaminationRecord's per-system shape (see emptyExaminationRecord) */
  categories: Record<HistoryCategory, ChipNote>;
  narrative: string;
}

export function emptyHistoryCategories(): Record<HistoryCategory, ChipNote> {
  return HISTORY_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = { selected: [], note: "" };
      return acc;
    },
    {} as Record<HistoryCategory, ChipNote>,
  );
}

export const EXAM_SYSTEMS = [
  "general",
  "respiratory",
  "cvs",
  "cns",
  "abdomen",
  "ent",
  "skin",
  "musculoskeletal",
  "other",
] as const;
export type ExamSystem = (typeof EXAM_SYSTEMS)[number];

export type ExaminationRecord = Record<ExamSystem, ChipNote>;

export function emptyExaminationRecord(): ExaminationRecord {
  return EXAM_SYSTEMS.reduce((acc, sys) => {
    acc[sys] = { selected: [], note: "" };
    return acc;
  }, {} as ExaminationRecord);
}

export type DischargeConditionRecord = ChipNote;

export type InvestigationSource = "manual" | "system";

export interface InvestigationItem {
  id: string;
  test: string;
  result: string;
  source: InvestigationSource;
  includeOnPrint: boolean;
}

export const TREATMENT_EVENT_TYPES = [
  "oxygen",
  "nebulization",
  "iv_fluids",
  "antibiotics",
  "blood_transfusion",
  "steroids",
  "anticonvulsants",
  "other",
] as const;
export type TreatmentEventType = (typeof TREATMENT_EVENT_TYPES)[number];

export interface TreatmentEvent {
  id: string;
  type: TreatmentEventType;
  detail: string;
  /** only for drug-linked types (see DRUG_LINKED_TREATMENT_TYPES) — a real
   * formulary Drug rather than free text, source for the Reconciliation
   * carry-over */
  drugId?: string;
  /** free text "as given" — dose/route/frequency, since Treatment doesn't
   * model a full PrescriptionItem the way discharge Medications does */
  drugDoseLabel?: string;
}

export interface TreatmentRecord {
  events: TreatmentEvent[];
  /** narrative response/course — clinician-written, never auto-generated */
  courseNarrative: string;
}

export interface GrowthRecord {
  weightKg: number;
  heightCm?: number;
  lengthCm?: number;
  headCircumferenceCm?: number;
  bmi?: number;
  muacCm?: number;
  /** objective computed classification against configured WHO standards — never clinician judgment */
  whoInterpretation?: string;
  showOnPrint: boolean;
}

export interface PendingTest {
  id: string;
  test: string;
  followUpAction: string;
}

export type ImmunizationStatus =
  | "up_to_date"
  | "catch_up_required"
  | "not_assessed"
  | "not_applicable";

export interface ImmunizationRecord {
  status: ImmunizationStatus;
  vaccinesDue?: string;
  note?: string;
}
