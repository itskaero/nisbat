import { redirect } from "next/navigation";

export default async function DischargeRootPage({
  params,
}: {
  params: Promise<{ dischargeId: string }>;
}) {
  const { dischargeId } = await params;
  redirect(`/discharges/${dischargeId}/diagnosis`);
}
