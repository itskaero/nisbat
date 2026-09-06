import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PATIENTS,
  ADMISSIONS,
  DISCHARGES,
  DRUGS,
  FORMULATIONS,
  DOSE_RULES,
  ADVICE_PACKS,
  FOLLOW_UP_MODULES,
  INVESTIGATION_PANELS,
  FREQUENCY_PHRASES,
  VOCABULARY_LISTS,
  INSTITUTIONAL_SETTINGS,
  USERS,
} from "../src/lib/seed-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Default passwords for the seeded demo accounts — plaintext lives ONLY here
// (never in src/lib/seed-data.ts, which the client bundle also imports) and
// gets hashed before it ever reaches Postgres. Change these before any real
// deployment — see README.
const SEED_USER_CREDENTIALS: Record<string, string> = {
  u_rehan: "changeme123",
  u_ayesha: "changeme123",
  u_faisal: "changeme123",
  u_admin: "changeme123",
};

// Prisma's generated Json input type wants a structural index signature that
// our typed domain interfaces (AdvicePackSection[], AllergyRecord,
// DischargeContent, …) don't nominally carry, even though at runtime they're
// plain JSON. Seeding is the one place a blunt cast is the pragmatic choice
// over threading Prisma's Json types through the whole app's domain model.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asData<T>(x: T): any {
  return x;
}

async function main() {
  console.log("Seeding Nisbat database…");

  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(SEED_USER_CREDENTIALS[u.id] ?? "changeme123", 10);
    const row = { ...u, passwordHash };
    await prisma.appUser.upsert({ where: { id: u.id }, create: row, update: row });
  }

  await prisma.institutionalSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...INSTITUTIONAL_SETTINGS },
    update: { ...INSTITUTIONAL_SETTINGS },
  });

  for (const d of DRUGS) {
    await prisma.drug.upsert({ where: { id: d.id }, create: d, update: d });
  }
  for (const f of FORMULATIONS) {
    await prisma.formulation.upsert({ where: { id: f.id }, create: f, update: f });
  }
  for (const r of DOSE_RULES) {
    await prisma.doseRule.upsert({ where: { id: r.id }, create: r, update: r });
  }

  for (const p of ADVICE_PACKS) {
    await prisma.advicePack.upsert({ where: { id: p.id }, create: asData(p), update: asData(p) });
  }
  for (const m of FOLLOW_UP_MODULES) {
    await prisma.followUpModule.upsert({ where: { id: m.id }, create: asData(m), update: asData(m) });
  }
  for (const p of INVESTIGATION_PANELS) {
    await prisma.investigationPanel.upsert({ where: { id: p.id }, create: asData(p), update: asData(p) });
  }
  for (const p of FREQUENCY_PHRASES) {
    await prisma.frequencyPhrase.upsert({ where: { id: p.id }, create: asData(p), update: asData(p) });
  }
  for (const v of VOCABULARY_LISTS) {
    await prisma.vocabularyList.upsert({ where: { id: v.id }, create: asData(v), update: asData(v) });
  }

  for (const p of PATIENTS) {
    await prisma.patient.upsert({ where: { id: p.id }, create: p, update: p });
  }
  for (const a of ADMISSIONS) {
    await prisma.admission.upsert({ where: { id: a.id }, create: asData(a), update: asData(a) });
  }
  for (const d of DISCHARGES) {
    await prisma.discharge.upsert({ where: { id: d.id }, create: asData(d), update: asData(d) });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
