import type { DoseCalculationTrace, DoseRule, Formulation } from "@/types";

/**
 * Explainable, non-black-box dose calculation.
 * weight → rule → calculated amount → formulation → calculated volume → final dose.
 *
 * A "mg/kg/day" rule cannot become a volume on its own — the day total must be
 * divided by the chosen frequency's times/day to get a per-dose amount first.
 * Until a frequency is chosen, the day total is shown but the per-dose figure
 * (and therefore volume) stays unset rather than silently guessing.
 *
 * Each step is retained on the trace even when incomplete (e.g. no formulation
 * selected yet) so the UI can render exactly what is and isn't known — never a
 * silently-assumed concentration.
 */
export function calculateDose(params: {
  weightKg: number;
  rule?: DoseRule;
  timesPerDay?: number | null;
  formulation?: Formulation;
  /** the point within [rule.mgPerKg, rule.mgPerKgMax] the clinician picked via
   * the range slider — ignored for non-range rules, defaults to rule.mgPerKg
   * (the low end) for range rules when not yet provided, never silently to
   * the high end. */
  selectedMgPerKg?: number;
  manualOverrideDose?: number; // in mg — always interpreted as a per-dose amount
  overrideReason?: string;
}): DoseCalculationTrace {
  const { weightKg, rule, timesPerDay, formulation, selectedMgPerKg, manualOverrideDose, overrideReason } = params;

  let calculatedMgPerDay: number | undefined;
  let calculatedMgPerDose: number | undefined;
  let cappedByMaxMgPerKgPerDay = false;
  const isRange = rule?.mgPerKgMax != null;
  const effectiveMgPerKg = isRange ? (selectedMgPerKg ?? rule?.mgPerKg) : rule?.mgPerKg;
  // Weight-scaled daily ceiling, e.g. paracetamol's "max 60 mg/kg/day" — distinct
  // from the flat maxMgPerDay/maxMgPerDose backstops below, and the one that
  // actually binds for most pediatric weights (a flat adult-sized cap rarely does).
  const dayCapMg = rule?.maxMgPerKgPerDay ? weightKg * rule.maxMgPerKgPerDay : undefined;

  if (rule) {
    if (rule.basis === "topical_instruction") {
      // Not a calculable mg dose at all — see finalDoseLabel below, which is
      // set directly from the rule's own instructionText instead of any of
      // the mg/volume machinery in this function.
    } else if (rule.basis === "fixed") {
      // a fixed rule is defined as a per-dose amount (V1's only fixed rule is OD)
      calculatedMgPerDose = rule.fixedMg;
    } else if (effectiveMgPerKg) {
      const raw = effectiveMgPerKg * weightKg;
      if (rule.basis === "mg_per_kg_per_day") {
        calculatedMgPerDay = rule.maxMgPerDay ? Math.min(raw, rule.maxMgPerDay) : raw;
        if (dayCapMg != null && calculatedMgPerDay > dayCapMg) {
          calculatedMgPerDay = dayCapMg;
          cappedByMaxMgPerKgPerDay = true;
        }
        if (timesPerDay && timesPerDay > 0) {
          calculatedMgPerDose = calculatedMgPerDay / timesPerDay;
        }
      } else {
        // mg_per_kg_per_dose — the rule only gives a per-administration amount, so
        // the day-total cap can only be checked once a frequency tells us how many
        // administrations there are; before that, don't guess.
        calculatedMgPerDose = raw;
        if (dayCapMg != null && timesPerDay && timesPerDay > 0) {
          const perDoseCapFromDayCap = dayCapMg / timesPerDay;
          if (calculatedMgPerDose > perDoseCapFromDayCap) {
            calculatedMgPerDose = perDoseCapFromDayCap;
            cappedByMaxMgPerKgPerDay = true;
          }
        }
      }
    }
    if (calculatedMgPerDose != null && rule.maxMgPerDose) {
      calculatedMgPerDose = Math.min(calculatedMgPerDose, rule.maxMgPerDose);
    }
  }

  let calculatedVolumeMl: number | undefined;
  let calculatedUnits: number | undefined;
  const targetMg = manualOverrideDose ?? calculatedMgPerDose;

  if (formulation && targetMg != null) {
    if (formulation.mgPerMl) {
      calculatedVolumeMl = round(targetMg / formulation.mgPerMl, 2);
    } else if (formulation.mgPerUnit) {
      calculatedUnits = round(targetMg / formulation.mgPerUnit, 2);
    }
  }

  let finalDoseLabel = "Not yet calculable";
  if (rule?.basis === "topical_instruction") {
    finalDoseLabel = rule.instructionText?.trim() || "No instruction text set for this rule";
  } else if (calculatedVolumeMl != null) {
    finalDoseLabel = `${calculatedVolumeMl} mL`;
  } else if (calculatedUnits != null) {
    finalDoseLabel = `${calculatedUnits} ${calculatedUnits === 1 ? "unit" : "units"}`;
  } else if (targetMg != null) {
    finalDoseLabel = `${round(targetMg, 1)} mg (select formulation to convert to volume)`;
  } else if (calculatedMgPerDay != null) {
    finalDoseLabel = `${round(calculatedMgPerDay, 1)} mg/day (select frequency to get per-dose amount)`;
  }

  const isOverridden = manualOverrideDose != null;
  let hasSubstantialDiscrepancy = false;
  if (isOverridden && calculatedMgPerDose) {
    const diff = Math.abs(manualOverrideDose! - calculatedMgPerDose) / calculatedMgPerDose;
    hasSubstantialDiscrepancy = diff > 0.2; // >20% difference
  }

  return {
    weightKg,
    doseRuleId: rule?.id,
    ruleLabel: rule?.label,
    mgPerKg: effectiveMgPerKg,
    ruleMgPerKgMin: isRange ? rule?.mgPerKg : undefined,
    ruleMgPerKgMax: isRange ? rule?.mgPerKgMax : undefined,
    basis: rule?.basis,
    calculatedMgPerDay,
    timesPerDay: timesPerDay ?? undefined,
    calculatedMgPerDose,
    formulationId: formulation?.id,
    formulationStrengthLabel: formulation?.strengthLabel,
    calculatedVolumeMl,
    calculatedUnits,
    finalDoseLabel,
    isOverridden,
    overrideReason,
    hasSubstantialDiscrepancy,
    cappedByMaxMgPerKgPerDay: cappedByMaxMgPerKgPerDay || undefined,
  };
}

function round(n: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
