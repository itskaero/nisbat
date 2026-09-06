/**
 * Medication domain — deliberately layered per CLAUDE.md:
 *   Drug (what it is) → Formulation (how it's supplied/concentrated) →
 *   DoseRule (how much, governed content) → PrescriptionItem (an actual order,
 *   with a fully explainable calculation trace) → ReconciliationItem (the
 *   home/inpatient → discharge decision that produced it).
 *
 * Never assume concentration: a PrescriptionItem cannot compute a volume until
 * an exact Formulation is selected.
 */

export type Formulary = "hospital" | "private" | "both";

export interface Drug {
  id: string;
  name: string; // canonical English name
  genericClass?: string;
  formulary: Formulary;
}

export type FormulationForm =
  | "syrup"
  | "suspension"
  | "tablet"
  | "capsule"
  | "injection"
  | "drops"
  | "sachet"
  | "topical" // cream/ointment/lotion — applied, not dosed by weight (see DoseBasis "topical_instruction")
  | "eye_drops" // ophthalmic — kept distinct from "drops" (oral/nasal), which IS dosed by weight
  | "nebule"; // nebulized solution — dosing math is unchanged (fixed or per-kg), just the correct route label

export interface Formulation {
  id: string;
  drugId: string;
  form: FormulationForm;
  strengthLabel: string; // e.g. "125 mg/5 mL" — always shown, never inferred
  /** for liquids: mg of drug per mL of liquid. Required for volume calculation. */
  mgPerMl?: number;
  /** for solids: mg per tablet/capsule/sachet */
  mgPerUnit?: number;
  /**
   * Market brand names for this exact form+strength (e.g. Panadol/Calpol for
   * a 120 mg/5 mL Paracetamol suspension) — a recognition aid for
   * prescribing/dispensing only. Never a second source of truth for
   * concentration (CLAUDE.md rules 4/5): the dose calculation trace
   * (DoseCalculationTrace.formulationStrengthLabel) always reads
   * `strengthLabel`, never a brand name.
   */
  brandNames?: string[];
}

export type DoseBasis = "mg_per_kg_per_dose" | "mg_per_kg_per_day" | "fixed" | "topical_instruction";
export type DoseRuleStatus = "draft" | "published";
export type DoseRuleSource = "system" | "faculty";

export interface DoseRule {
  id: string;
  drugId: string;
  label: string; // e.g. "Amoxicillin — standard (45 mg/kg/day)"
  basis: DoseBasis;
  /** used when basis is mg_per_kg_per_dose or mg_per_kg_per_day — the exact
   * value for a fixed rule, or the low end of the range when mgPerKgMax is
   * also set (many pediatric doses are published as a range, e.g.
   * "10-15 mg/kg/dose", not one point). */
  mgPerKg?: number;
  /** presence of this field is what makes a rule a range — the clinician
   * picks a point in [mgPerKg, mgPerKgMax] via a slider rather than getting
   * one fixed number; always still overridable per CLAUDE.md rule 7 regardless. */
  mgPerKgMax?: number;
  fixedMg?: number; // used when basis is fixed
  /** used when basis is "topical_instruction" — a topical/ophthalmic
   * application isn't a calculable mg dose (CLAUDE.md rule 1: never invent
   * a number where none exists), so the "dose" is this instruction text
   * directly, e.g. "Apply a thin layer to the affected area" — no
   * mgPerKg/fixedMg is used for this basis. */
  instructionText?: string;
  defaultFrequencyCode: FrequencyCode;
  maxMgPerDose?: number;
  maxMgPerDay?: number;
  /** weight-scaled daily ceiling (mg/kg/day) — distinct from the flat maxMgPerDay
   * backstop above. Most published pediatric max-dose guidance (e.g. paracetamol's
   * "max 60 mg/kg/day") is expressed this way, not as one absolute number that's
   * right for every weight. Enforced against the IMPLIED daily total even for a
   * mg_per_kg_per_dose rule (calculatedMgPerDose × the chosen frequency's times/day),
   * once a frequency is known — never guessed before then. */
  maxMgPerKgPerDay?: number;
  minAgeMonths?: number;
  maxAgeMonths?: number;
  source: DoseRuleSource;
  status: DoseRuleStatus;
  version: number;
  /** "system" for curated system rules — those are never editable via the UI */
  createdBy: string;
  publishedBy?: string;
  updatedAt: string;
}

export const FREQUENCY_CODES = [
  "OD",
  "BD",
  "TDS",
  "QID",
  "Q6H",
  "Q8H",
  "PRN",
  "CUSTOM",
] as const;
export type FrequencyCode = (typeof FREQUENCY_CODES)[number];

export interface FrequencyOption {
  code: FrequencyCode;
  /** underlying semantic meaning — BD is not just a label, it IS twice daily */
  timesPerDay: number | null;
  intervalHours?: number;
  label: string;
  parentPhraseEnglish: string;
  parentPhraseUrdu: string;
}

export const DURATION_PRESETS = ["3d", "5d", "7d", "10d", "14d", "custom"] as const;
export type DurationPreset = (typeof DURATION_PRESETS)[number];

export interface DurationValue {
  preset: DurationPreset;
  customDays?: number;
}

/**
 * The explainable calculation trace CLAUDE.md requires:
 * weight → rule → calculated amount → formulation → calculated volume → final dose.
 * No step is hidden; every PrescriptionItem carries this even when a formulation
 * hasn't been picked yet (volume/final stay undefined until it is).
 */
export interface DoseCalculationTrace {
  weightKg: number;
  doseRuleId?: string;
  ruleLabel?: string;
  /** the actual mg/kg used for this calculation — the rule's fixed value, or
   * the clinician's chosen point within [mgPerKg, ruleMgPerKgMax] for a range rule */
  mgPerKg?: number;
  /** present only when the rule is a range — lets the UI show "12.5 mg/kg
   * (range 10–15 mg/kg)" instead of hiding that a range existed */
  ruleMgPerKgMin?: number;
  ruleMgPerKgMax?: number;
  basis?: DoseBasis;
  /** raw day total (mgPerKg × weight, clamped to maxMgPerDay) — only meaningful when basis is mg_per_kg_per_day */
  calculatedMgPerDay?: number;
  /** the chosen frequency's times/day, needed to derive a per-dose amount from a per-day rule */
  timesPerDay?: number;
  /** the actual per-administration mg amount used for volume/unit conversion — always a per-dose figure */
  calculatedMgPerDose?: number;
  formulationId?: string;
  formulationStrengthLabel?: string;
  calculatedVolumeMl?: number; // for liquids
  calculatedUnits?: number; // for tablets/capsules
  finalDoseLabel: string; // human-readable final dose, e.g. "5 mL" or "1 tablet"
  isOverridden: boolean;
  overrideReason?: string;
  /** true when the manual override differs substantially (>20%) from the calculated dose */
  hasSubstantialDiscrepancy: boolean;
  /** set when rule.maxMgPerKgPerDay existed and actually reduced the calculated
   * dose below what mgPerKg × weight (÷ frequency) would otherwise have given —
   * i.e. the weight-scaled daily ceiling bound, not just the flat maxMgPerDay/
   * maxMgPerDose backstops. Surfaced so the UI never silently caps without saying so. */
  cappedByMaxMgPerKgPerDay?: boolean;
}

export type PrescriptionRoute = "PO" | "IV" | "IM" | "PR" | "Topical" | "Inhaled" | "Other";
export type PrescriptionSource = "reconciliation" | "new";

export interface PrescriptionItem {
  id: string;
  drugId: string;
  formulationId?: string; // required before volume can be calculated
  doseRuleId?: string;
  source: PrescriptionSource;
  reconciliationItemId?: string;
  trace: DoseCalculationTrace;
  route: PrescriptionRoute;
  frequencyCode: FrequencyCode;
  customFrequencyLabel?: string;
  duration: DurationValue;
  prn: boolean;
  prnIndication?: string;
  parentInstructionUrduOverride?: string;
  parentInstructionEnglishOverride?: string;
}

export type ReconciliationSourceType = "home" | "inpatient";
export type ReconciliationDecision = "continue" | "stop" | "change" | "new" | "not_applicable";

export interface ReconciliationItem {
  id: string;
  sourceType: ReconciliationSourceType;
  drugName: string;
  detailAsTaken: string; // free text: dose/form/frequency as documented
  decision: ReconciliationDecision;
  linkedPrescriptionItemId?: string;
  /** set when this row was auto-carried from a drug-linked Treatment event
   * (see DRUG_LINKED_TREATMENT_TYPES) — distinct from linkedPrescriptionItemId,
   * a different relationship (inpatient-treatment source vs. discharge-item
   * target). Manual reconciliation rows never have this set. */
  linkedTreatmentEventId?: string;
  note?: string;
}
