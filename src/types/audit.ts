/**
 * Internal audit trail — never exposed on the parent-facing print, kept per
 * discharge. Print events are recorded distinctly from status-change/edit events
 * so "printed for SR review" vs "completed" are each independently traceable.
 */

export type AuditAction =
  | "created"
  | "edited"
  | "submitted_for_review"
  | "printed"
  | "returned_by_reviewer"
  | "completed"
  | "revision_opened"
  | "archived";

export interface AuditEvent {
  id: string;
  dischargeId: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  timestamp: string; // ISO
  revisionNumber: number;
  statusFrom?: string;
  statusTo?: string;
  detail?: string;
}

export interface PrintEvent {
  id: string;
  dischargeId: string;
  printedById: string;
  printedByName: string;
  timestamp: string;
  revisionNumber: number;
  markedPendingReview: boolean;
}
