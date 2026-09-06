import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/auth/dal";
import { isDischargeEditable, canActAsReviewer } from "@/lib/permissions";
import { DISCHARGE_STATUSES, type Discharge, type DischargeStatus } from "@/types";

/**
 * Bespoke rather than the generic factory: every store action (content
 * autosave *and* status transitions — print/submit/return/complete/archive)
 * funnels through this one endpoint (src/lib/api-client.ts's syncDischarge
 * always PATCHes the whole discharge object), so this is the one place that
 * can validate the status state machine server-side.
 *
 * The transition table below mirrors exactly what src/lib/store.ts's actions
 * actually produce — not a theoretical permissive graph:
 *   draft            --recordPrint/submitForSrReview-->  ready_for_print, pending_sr_review
 *   ready_for_print   --recordPrint-->                    pending_sr_review
 *   pending_sr_review --returnForCorrection-->            draft                 (reviewer-only)
 *   pending_sr_review --completeDischarge-->              completed             (reviewer-only)
 *   completed         --reopenIfCompleted (auto, bundled with a content edit)--> pending_sr_review
 * Any other from/to pair (e.g. draft -> completed directly, or an
 * unrecognized status string) is rejected — a bug or a crafted request can no
 * longer skip a state a real client action would never produce.
 */
const REVIEWER_ONLY_TRANSITIONS: Array<[DischargeStatus, DischargeStatus]> = [
  ["pending_sr_review", "draft"],
  ["pending_sr_review", "completed"],
];
const PREPARER_TRANSITIONS: Array<[DischargeStatus, DischargeStatus]> = [
  ["draft", "ready_for_print"],
  ["draft", "pending_sr_review"],
  ["ready_for_print", "pending_sr_review"],
  ["completed", "pending_sr_review"], // reopenIfCompleted — always bundled with a content change
];

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const existing = await prisma.discharge.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  const { id: _drop, ...data } = body;
  void _drop;

  const existingAsDischarge = existing as unknown as Discharge;

  const contentChanged = JSON.stringify(existing.content) !== JSON.stringify(data.content ?? existing.content);
  if (contentChanged && !isDischargeEditable(existingAsDischarge, user)) {
    return NextResponse.json({ error: "Not permitted to edit this discharge" }, { status: 403 });
  }

  if (typeof data.status === "string" && data.status !== existing.status) {
    if (!DISCHARGE_STATUSES.includes(data.status as DischargeStatus)) {
      return NextResponse.json({ error: "Unrecognized status" }, { status: 400 });
    }
    const from = existing.status as DischargeStatus;
    const to = data.status as DischargeStatus;
    const isReviewerTransition = REVIEWER_ONLY_TRANSITIONS.some(([f, t]) => f === from && t === to);
    const isPreparerTransition = PREPARER_TRANSITIONS.some(([f, t]) => f === from && t === to);

    if (!isReviewerTransition && !isPreparerTransition) {
      return NextResponse.json({ error: `Cannot move a discharge from ${from} to ${to}` }, { status: 409 });
    }
    if (isReviewerTransition && !canActAsReviewer(user)) {
      return NextResponse.json({ error: "Only SR/Faculty or Admin can perform this action" }, { status: 403 });
    }
    if (isPreparerTransition && !isDischargeEditable(existingAsDischarge, user)) {
      return NextResponse.json({ error: "Not permitted to change this discharge's status" }, { status: 403 });
    }
  }

  const row = await prisma.discharge.update({ where: { id }, data });
  return NextResponse.json(row);
}
