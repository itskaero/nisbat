import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type DischargeStatus } from "@/types";

const VARIANT: Record<DischargeStatus, "neutral" | "warning" | "info" | "success"> = {
  draft: "neutral",
  ready_for_print: "info",
  pending_sr_review: "warning",
  completed: "success",
};

export function DischargeStatusBadge({ status }: { status: DischargeStatus }) {
  return <Badge variant={VARIANT[status]}>{STATUS_LABELS[status]}</Badge>;
}
