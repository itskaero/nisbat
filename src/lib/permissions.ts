import type { AppUser, Discharge } from "@/types";

/**
 * PENDING SR REVIEW is a frozen state — the printed card is physically out for
 * SR review/signature, so content editing is locked for everyone except the SR
 * review actions themselves (Return for Correction / Mark Completed).
 * Editing a completed/signed discharge is allowed (it auto-opens a new
 * revision — see store.ts reopenIfCompleted) but only for preparers/admins,
 * never the SR reviewer, whose role in V1 is read-only review.
 */
export function isDischargeEditable(discharge: Discharge, user: AppUser): boolean {
  if (discharge.archived) return false;
  if (user.role === "sr_faculty") return false;
  if (discharge.status === "pending_sr_review") return false;
  return true;
}

export function canActAsReviewer(user: AppUser): boolean {
  return user.role === "sr_faculty" || user.role === "admin";
}

/** Content governance per CLAUDE.md: Faculty/SR create & edit, Admin publishes. */
export function canAuthorContent(user: AppUser): boolean {
  return user.role === "sr_faculty" || user.role === "admin";
}

export function canPublishContent(user: AppUser): boolean {
  return user.role === "admin";
}
