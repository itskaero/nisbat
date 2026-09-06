import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest, publicUserSelect } from "@/lib/auth/dal";

/** Everything the client needs on first load, in one round trip — including
 * the caller's own identity (`currentUser`), so the store never has to trust
 * a client-persisted "which user am I" choice again (see the old demo
 * user-switcher this replaced). Requires a valid session; the `users` list
 * itself is scoped with `publicUserSelect()` so `passwordHash` never reaches
 * the client even though the underlying Prisma row carries it. */
export async function GET(req: NextRequest) {
  const currentUser = await getSessionUserFromRequest(req);
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    patients,
    admissions,
    discharges,
    drugs,
    formulations,
    doseRules,
    advicePacks,
    followUpModules,
    investigationPanels,
    frequencyPhrases,
    vocabularyLists,
    institutionalSettings,
    users,
  ] = await Promise.all([
    prisma.patient.findMany(),
    prisma.admission.findMany(),
    prisma.discharge.findMany(),
    prisma.drug.findMany(),
    prisma.formulation.findMany(),
    prisma.doseRule.findMany(),
    prisma.advicePack.findMany(),
    prisma.followUpModule.findMany(),
    prisma.investigationPanel.findMany(),
    prisma.frequencyPhrase.findMany(),
    prisma.vocabularyList.findMany(),
    prisma.institutionalSettings.findUnique({ where: { id: "singleton" } }),
    prisma.appUser.findMany({ select: publicUserSelect() }),
  ]);

  return NextResponse.json({
    patients,
    admissions,
    discharges,
    drugs,
    formulations,
    doseRules,
    advicePacks,
    followUpModules,
    investigationPanels,
    frequencyPhrases,
    vocabularyLists,
    institutionalSettings,
    users,
    currentUser,
  });
}
