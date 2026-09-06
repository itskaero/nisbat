import type { Discharge, DischargeContent } from "@/types";

export interface WorkspaceSection {
  id: string;
  label: string;
  group: "PATIENT" | "CLINICAL" | "HOSPITAL COURSE" | "DISCHARGE" | "REVIEW";
  required: boolean;
  isComplete: (content: DischargeContent) => boolean;
}

export const WORKSPACE_SECTIONS: WorkspaceSection[] = [
  { id: "overview", label: "Overview", group: "PATIENT", required: true, isComplete: () => true },

  {
    id: "diagnosis",
    label: "Diagnosis",
    group: "CLINICAL",
    required: true,
    isComplete: (c) => !!c.diagnosis.primary,
  },
  {
    id: "presenting-complaints",
    label: "Presenting Complaints",
    group: "CLINICAL",
    required: true,
    isComplete: (c) => c.presentingComplaints.complaints.length > 0 || !!c.presentingComplaints.narrative.trim(),
  },
  {
    id: "history",
    label: "History",
    group: "CLINICAL",
    required: false,
    // `categories`/`examination` guarded below (`?? {}`) — a discharge
    // written under an older content shape (before a field was added) is
    // real, persisted JSON, not something a migration ever rewrites, so this
    // reads as "incomplete" instead of crashing the whole sidebar/workspace
    // (see also the try/catch around every isComplete call, defense in depth).
    isComplete: (c) => !!c.history.narrative.trim() || Object.values(c.history.categories ?? {}).some((cat) => cat.selected.length > 0 || cat.note.trim()),
  },
  {
    id: "examination",
    label: "Examination",
    group: "CLINICAL",
    required: true,
    isComplete: (c) => Object.values(c.examination ?? {}).some((e) => e.selected.length > 0 || e.note.trim()),
  },

  {
    id: "investigations",
    label: "Investigations",
    group: "HOSPITAL COURSE",
    required: false,
    isComplete: (c) => c.investigations.length > 0,
  },
  {
    id: "treatment",
    label: "Treatment",
    group: "HOSPITAL COURSE",
    required: false,
    isComplete: (c) => c.treatment.events.length > 0 || !!c.treatment.courseNarrative.trim(),
  },
  {
    id: "clinical-course",
    label: "Clinical Course",
    group: "HOSPITAL COURSE",
    required: true,
    isComplete: (c) => !!c.treatment.courseNarrative.trim(),
  },

  {
    id: "medications",
    label: "Medications",
    group: "DISCHARGE",
    required: true,
    isComplete: (c) => c.medications.length > 0,
  },
  {
    id: "reconciliation",
    label: "Reconciliation",
    group: "DISCHARGE",
    required: true,
    isComplete: (c) => c.reconciliation.length > 0,
  },
  {
    id: "advice",
    label: "Advice",
    group: "DISCHARGE",
    required: false,
    isComplete: (c) => c.advice.length > 0,
  },
  {
    id: "follow-up",
    label: "Follow-up",
    group: "DISCHARGE",
    required: false,
    isComplete: (c) => c.followUp.length > 0,
  },
  {
    id: "growth",
    label: "Growth",
    group: "DISCHARGE",
    required: false,
    isComplete: (c) => !!c.growth.heightCm || !!c.growth.bmi || !!c.growth.muacCm,
  },
  {
    id: "pending-tests",
    label: "Pending Tests",
    group: "DISCHARGE",
    required: false,
    isComplete: (c) => c.pendingTests.length > 0,
  },
  {
    id: "immunization",
    label: "Immunization",
    group: "DISCHARGE",
    required: false,
    isComplete: (c) => c.immunization.status !== "not_assessed",
  },

  {
    id: "summary",
    label: "Summary & Preview",
    group: "REVIEW",
    required: true,
    isComplete: () => false,
  },
];

export const SECTION_GROUPS: WorkspaceSection["group"][] = [
  "PATIENT",
  "CLINICAL",
  "HOSPITAL COURSE",
  "DISCHARGE",
  "REVIEW",
];

/**
 * Defense in depth beyond the inline `?? {}` guards above: a section's
 * `isComplete` assumes the CURRENT content shape, but a discharge persisted
 * under an older shape (a field added since) is real JSON that no migration
 * rewrites. One section throwing on an unforeseen shape gap must never crash
 * the whole sidebar/workspace for that discharge — surfacing as "incomplete"
 * is a warning, not a block, per CLAUDE.md rule 15.
 */
export function safeIsComplete(section: WorkspaceSection, content: DischargeContent): boolean {
  try {
    return section.isComplete(content);
  } catch (err) {
    console.warn(`isComplete threw for section "${section.id}" — treating as incomplete`, err);
    return false;
  }
}

export function sectionIndex(id: string): number {
  return WORKSPACE_SECTIONS.findIndex((s) => s.id === id);
}

export function nextSection(id: string): WorkspaceSection | undefined {
  return WORKSPACE_SECTIONS[sectionIndex(id) + 1];
}

export function prevSection(id: string): WorkspaceSection | undefined {
  return WORKSPACE_SECTIONS[sectionIndex(id) - 1];
}

export function workspaceProgress(discharge: Discharge): number {
  const required = WORKSPACE_SECTIONS.filter((s) => s.required && s.id !== "summary");
  const done = required.filter((s) => safeIsComplete(s, discharge.content)).length;
  return Math.round((done / required.length) * 100);
}
