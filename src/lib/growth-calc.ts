import { WFA_LMS, LHFA_LMS, BFA_LMS, HCFA_LMS, type LmsTable, type Sex } from "@/lib/who-growth-data";

const DAYS_PER_MONTH = 365.25 / 12; // 30.4375 — WHO's own convention for age-in-months from age-in-days

export interface GrowthZResult {
  z: number;
  indicator: "weight-for-age" | "length-height-for-age" | "bmi-for-age" | "head-circumference-for-age";
  classification: string;
  /** true when |z| exceeds the band WHO itself flags as clinically notable */
  isNotable: boolean;
}

/**
 * Linearly interpolates L, M, S between the two bracketing WHO monthly rows
 * for an exact age in days, then applies the LMS formula:
 *   Z = (((X/M)^L) - 1) / (L·S)   when L ≠ 0
 *   Z = ln(X/M) / S               when L = 0
 * Returns null outside the standard's published range (0–60 months) or for
 * a sex the standard doesn't publish a table for — never extrapolates or
 * guesses.
 */
function lmsZScore(table: LmsTable, sex: Sex, ageDays: number, measuredValue: number): number | null {
  if (ageDays < 0) return null;
  const ageMonths = ageDays / DAYS_PER_MONTH;
  if (ageMonths > 60) return null;

  const rows = sex === "male" ? table.boys : table.girls;
  const lower = Math.floor(ageMonths);
  const upper = Math.min(Math.ceil(ageMonths), 60);
  const lowerRow = rows[lower];
  const upperRow = rows[upper];
  if (!lowerRow || !upperRow) return null;

  const frac = upper === lower ? 0 : ageMonths - lower;
  const L = lowerRow[1] + (upperRow[1] - lowerRow[1]) * frac;
  const M = lowerRow[2] + (upperRow[2] - lowerRow[2]) * frac;
  const S = lowerRow[3] + (upperRow[3] - lowerRow[3]) * frac;

  if (M <= 0 || S <= 0) return null;
  const z = Math.abs(L) < 1e-6 ? Math.log(measuredValue / M) / S : ((measuredValue / M) ** L - 1) / (L * S);
  return Math.round(z * 100) / 100;
}

function classifyWeightForAge(z: number): string {
  if (z < -3) return "Severely underweight (WFA < -3 SD)";
  if (z < -2) return "Underweight (WFA -3 to -2 SD)";
  return "Normal weight-for-age";
}

function classifyLengthHeightForAge(z: number): string {
  if (z < -3) return "Severely stunted (HFA < -3 SD)";
  if (z < -2) return "Stunted (HFA -3 to -2 SD)";
  if (z > 3) return "Unusually tall for age (HFA > +3 SD)";
  return "Normal length/height-for-age";
}

function classifyBmiForAge(z: number): string {
  if (z < -3) return "Severely wasted (BFA < -3 SD)";
  if (z < -2) return "Wasted (BFA -3 to -2 SD)";
  if (z <= 1) return "Normal BMI-for-age";
  if (z <= 2) return "Possible risk of overweight (BFA +1 to +2 SD)";
  if (z <= 3) return "Overweight (BFA +2 to +3 SD)";
  return "Obese (BFA > +3 SD)";
}

function classifyHeadCircumference(z: number): string {
  if (z < -2) return "Microcephaly — small head circumference for age (HCFA < -2 SD)";
  if (z > 2) return "Macrocephaly — large head circumference for age (HCFA > +2 SD)";
  return "Normal head circumference-for-age";
}

function buildResult(
  indicator: GrowthZResult["indicator"],
  z: number | null,
  classify: (z: number) => string,
  notableAt = 2,
): GrowthZResult | null {
  if (z === null) return null;
  return { z, indicator, classification: classify(z), isNotable: Math.abs(z) >= notableAt };
}

export function weightForAgeZ(sex: Sex, ageDays: number, weightKg: number): GrowthZResult | null {
  return buildResult("weight-for-age", lmsZScore(WFA_LMS, sex, ageDays, weightKg), classifyWeightForAge);
}

export function lengthHeightForAgeZ(sex: Sex, ageDays: number, heightCm: number): GrowthZResult | null {
  return buildResult("length-height-for-age", lmsZScore(LHFA_LMS, sex, ageDays, heightCm), classifyLengthHeightForAge);
}

export function bmiForAgeZ(sex: Sex, ageDays: number, bmi: number): GrowthZResult | null {
  return buildResult("bmi-for-age", lmsZScore(BFA_LMS, sex, ageDays, bmi), classifyBmiForAge, 1);
}

export function headCircumferenceForAgeZ(sex: Sex, ageDays: number, hcCm: number): GrowthZResult | null {
  return buildResult("head-circumference-for-age", lmsZScore(HCFA_LMS, sex, ageDays, hcCm), classifyHeadCircumference);
}

/** Every point WHO publishes for a given indicator/sex, as {month, sd curves} — used to plot the percentile chart. */
export function percentileCurve(table: LmsTable, sex: Sex) {
  const rows = sex === "male" ? table.boys : table.girls;
  return rows.map(([month, L, M, S]) => ({
    month,
    sd3neg: valueAtZ(L, M, S, -3),
    sd2neg: valueAtZ(L, M, S, -2),
    median: M,
    sd2: valueAtZ(L, M, S, 2),
    sd3: valueAtZ(L, M, S, 3),
  }));
}

/** Inverse LMS — the measured value at a given Z, used to draw the SD curves. */
function valueAtZ(L: number, M: number, S: number, z: number): number {
  const v = Math.abs(L) < 1e-6 ? M * Math.exp(S * z) : M * (1 + L * S * z) ** (1 / L);
  return Math.round(v * 100) / 100;
}

export { WFA_LMS, LHFA_LMS, BFA_LMS, HCFA_LMS };
export type { Sex };
