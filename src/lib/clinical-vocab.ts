import type { ExamSystem, HistoryCategory, VocabularyList, VocabularyListKey } from "@/types";

/** Examination chip catalog, per system. Free text always remains available alongside. */
export const EXAM_CHIPS: Record<ExamSystem, string[]> = {
  general: [
    "Conscious",
    "Alert",
    "Irritable",
    "Lethargic",
    "Pale",
    "Cyanosed",
    "Dehydrated",
    "Febrile",
  ],
  respiratory: [
    "Air entry equal",
    "Crepitations",
    "Wheeze",
    "Bronchial breathing",
    "Retractions",
    "Normal",
  ],
  cvs: ["S1 S2 normal", "No murmur", "Murmur present", "Tachycardia", "Bradycardia", "Normal"],
  cns: [
    "Conscious & oriented",
    "GCS 15/15",
    "No focal deficit",
    "Normal tone",
    "Normal reflexes",
    "Normal",
  ],
  abdomen: ["Soft", "Non-tender", "No organomegaly", "Distended", "Bowel sounds normal", "Normal"],
  ent: ["Throat normal", "Tonsils normal", "Ear exam normal", "Nasal congestion", "Normal"],
  skin: ["No rash", "Rash present", "No jaundice", "Jaundice present", "Normal turgor"],
  musculoskeletal: ["Normal gait", "No deformity", "Full range of motion", "Normal"],
  other: [],
};

/**
 * These EXAM_CHIPS/PRESENTING_COMPLAINT_CHIPS/HISTORY_CHIPS/DIAGNOSIS_LIST
 * constants (and their equivalents in seed-data.ts) now serve only as the
 * seeded starting values and an offline-safe fallback — the live,
 * admin-editable content lives in the `VocabularyList` rows these seed (see
 * src/lib/seed-data.ts's VOCABULARY_LISTS and src/types/content.ts). Call
 * sites resolve through these two helpers rather than importing the
 * constants directly, so a Faculty edit takes effect without a code deploy.
 */
export function resolveChipsBySystem(
  vocabularyLists: VocabularyList[],
  key: VocabularyListKey,
  fallback: Record<string, string[]>,
): Record<string, string[]> {
  const list = vocabularyLists.find((v) => v.key === key && v.status === "published");
  return list?.chipsBySystem ?? fallback;
}

export function resolveFlatItems(vocabularyLists: VocabularyList[], key: VocabularyListKey, fallback: string[]): string[] {
  const list = vocabularyLists.find((v) => v.key === key && v.status === "published");
  return list?.flatItems ?? fallback;
}

/** lightweight prefix autocomplete, e.g. "crep" → "Crepitations" */
export function autocompleteChip(system: ExamSystem, query: string): string[] {
  if (!query.trim()) return [];
  const q = query.trim().toLowerCase();
  return EXAM_CHIPS[system].filter((c) => c.toLowerCase().includes(q));
}

export const DISCHARGE_CONDITION_CHIPS = [
  "Conscious",
  "Afebrile",
  "Feeding well",
  "Respiratory distress resolved",
  "Maintaining SpO₂ on room air",
  "Hemodynamically stable",
  "Tolerating oral intake",
];

/**
 * Presenting-complaint chip catalog, per body system — broad on purpose
 * (CLAUDE.md/PRODUCT.md: routine work should be fast, but a diagnosis like
 * pneumonia doesn't mean every complaint will be respiratory). Grouped by
 * `ExamSystem`, the same taxonomy Examination already uses, rather than a
 * parallel one — a clinician already thinks in these systems when
 * examining, and reuses the same mental model complaining.
 */
export const PRESENTING_COMPLAINT_CHIPS: Record<ExamSystem, string[]> = {
  general: ["Fever", "Poor feeding", "Lethargy", "Irritability", "Weight loss", "Failure to thrive"],
  respiratory: ["Cough", "Breathlessness", "Wheeze", "Noisy breathing", "Chest indrawing", "Runny/blocked nose"],
  cvs: ["Chest pain", "Palpitations", "Cyanosis", "Easy fatigability", "Swelling (limbs/face)"],
  cns: ["Seizure", "Headache", "Altered consciousness", "Weakness/paralysis", "Abnormal movements"],
  abdomen: ["Vomiting", "Diarrhea", "Abdominal pain", "Constipation", "Abdominal distension", "Blood in stool"],
  ent: ["Ear pain", "Ear discharge", "Sore throat", "Hearing difficulty"],
  skin: ["Rash", "Itching", "Swelling/lump", "Bruising", "Yellowish discoloration"],
  musculoskeletal: ["Joint pain", "Limb swelling", "Limping", "Bone pain"],
  other: [],
};

/** History chip catalog, per category — mirrors EXAM_CHIPS's per-system
 * shape (broad and modular, not one flat 6-item list). */
export const HISTORY_CHIPS: Record<HistoryCategory, string[]> = {
  birth: [
    "Term delivery",
    "Preterm delivery",
    "Normal antenatal period",
    "NICU admission",
    "Birth asphyxia",
    "Birth history unremarkable",
  ],
  immunization: [
    "Immunization up to date per history",
    "Catch-up required",
    "Not immunized",
    "Immunization status unknown",
  ],
  past_medical: [
    "No similar illness in the past",
    "No significant past illness",
    "Previous hospitalization",
    "Chronic illness",
    "Previous surgery",
  ],
  family: [
    "Family history non-contributory",
    "Consanguineous marriage",
    "Similar illness in family",
    "Family history of asthma/atopy",
    "Family history of TB",
  ],
  allergy: ["No known drug allergy", "Known drug allergy", "Food allergy"],
  developmental: ["Development age-appropriate", "Developmental delay", "Not yet assessed"],
};

/** Prompts for a single presenting complaint (PRODUCT.md's "Presenting
 * complaints / history" example prompts) — complaint-scoped, not a general
 * History-section concept, so this lives only on the Presenting Complaints
 * page (see ComplaintEntry's onset/progression/associatedSymptoms/
 * relevantHistory fields). */
export const COMPLAINT_PROMPTS = ["Onset", "Duration", "Progression", "Associated symptoms", "Relevant history"];

/**
 * Treatment event types that get a formulary drug picker instead of plain
 * free text — and, when a drug is actually selected, auto-carry into
 * Reconciliation as an inpatient item. `blood_transfusion` is deliberately
 * excluded: a blood product isn't a formulary Drug/Formulation, forcing it
 * in would be a category error. oxygen/iv_fluids/nebulization/other stay
 * free-text-only, unchanged.
 */
export const DRUG_LINKED_TREATMENT_TYPES = ["antibiotics", "steroids", "anticonvulsants"] as const;

export const TREATMENT_EVENT_LABELS: Record<string, string> = {
  oxygen: "Oxygen",
  nebulization: "Nebulization",
  iv_fluids: "IV Fluids",
  antibiotics: "Antibiotics",
  blood_transfusion: "Blood Transfusion",
  steroids: "Steroids",
  anticonvulsants: "Anticonvulsants",
  other: "Other",
};
