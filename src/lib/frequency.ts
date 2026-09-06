import type { FrequencyCode, FrequencyOption, FrequencyPhrase, ParentLanguageMode } from "@/types";

/** The three parent-language modes reduce to two independent show/hide
 * flags — "english_only" couldn't be expressed by the old plain boolean
 * (which could only mean "show both" vs "show Urdu only"). */
function partsForMode(mode: ParentLanguageMode): { showUrdu: boolean; showEnglish: boolean } {
  return { showUrdu: mode !== "english_only", showEnglish: mode !== "urdu_only" };
}

/**
 * BD is not merely a label — it maps to an underlying semantic frequency
 * (twice daily) used for dose-per-day math, and to an approved bilingual
 * phrase for parent-facing output. Runtime AI translation is never the
 * authoritative wording here (CLAUDE.md).
 */
export const FREQUENCY_OPTIONS: Record<FrequencyCode, FrequencyOption> = {
  OD: {
    code: "OD",
    timesPerDay: 1,
    label: "OD — Once daily",
    parentPhraseEnglish: "Once daily",
    parentPhraseUrdu: "دن میں ایک بار",
  },
  BD: {
    code: "BD",
    timesPerDay: 2,
    label: "BD — Twice daily",
    parentPhraseEnglish: "Twice daily",
    parentPhraseUrdu: "صبح و شام (دن میں 2 مرتبہ)",
  },
  TDS: {
    code: "TDS",
    timesPerDay: 3,
    label: "TDS — Three times daily",
    parentPhraseEnglish: "Three times daily",
    parentPhraseUrdu: "دن میں 3 مرتبہ",
  },
  QID: {
    code: "QID",
    timesPerDay: 4,
    label: "QID — Four times daily",
    parentPhraseEnglish: "Four times daily",
    parentPhraseUrdu: "دن میں 4 مرتبہ",
  },
  Q6H: {
    code: "Q6H",
    timesPerDay: 4,
    intervalHours: 6,
    label: "q6h — Every 6 hours",
    parentPhraseEnglish: "Every 6 hours",
    parentPhraseUrdu: "ہر 6 گھنٹے بعد",
  },
  Q8H: {
    code: "Q8H",
    timesPerDay: 3,
    intervalHours: 8,
    label: "q8h — Every 8 hours",
    parentPhraseEnglish: "Every 8 hours",
    parentPhraseUrdu: "ہر 8 گھنٹے بعد",
  },
  PRN: {
    code: "PRN",
    timesPerDay: null,
    label: "PRN — As needed",
    parentPhraseEnglish: "As needed",
    parentPhraseUrdu: "ضرورت کے مطابق",
  },
  CUSTOM: {
    code: "CUSTOM",
    timesPerDay: null,
    label: "Custom",
    parentPhraseEnglish: "As directed",
    parentPhraseUrdu: "ہدایت کے مطابق",
  },
};

/**
 * Resolves the actual wording for a code — a published FrequencyPhrase row
 * when one exists (Faculty/Admin-editable, see src/types/content.ts), the
 * hardcoded FREQUENCY_OPTIONS value otherwise (offline-safe fallback, and
 * what's used before the seeded rows exist at all). Never the other way
 * round — a published edit always wins over the fallback.
 */
function resolvedPhrase(code: FrequencyCode, phrases?: FrequencyPhrase[]) {
  const published = phrases?.find((p) => p.frequencyCode === code && p.status === "published");
  const opt = FREQUENCY_OPTIONS[code];
  return {
    english: published?.phraseEnglish ?? opt.parentPhraseEnglish,
    urdu: published?.phraseUrdu ?? opt.parentPhraseUrdu,
  };
}

export function parentPhraseFor(code: FrequencyCode, mode: ParentLanguageMode, phrases?: FrequencyPhrase[]): string {
  const { english, urdu } = resolvedPhrase(code, phrases);
  const { showUrdu, showEnglish } = partsForMode(mode);
  if (showUrdu && showEnglish) return `${urdu} / ${english}`;
  return showUrdu ? urdu : english;
}

/**
 * Urdu and English kept as separate strings rather than one joined bidi
 * string — mixing RTL Urdu and LTR English in a single inline run wraps
 * unpredictably in narrow table cells. Render each on its own line/direction.
 * Either part can now be absent (English-only omits `urdu`, Urdu-only omits
 * `english`) — never both, `mode` always shows at least one language.
 */
export function parentPhrasePartsFor(
  code: FrequencyCode,
  mode: ParentLanguageMode,
  phrases?: FrequencyPhrase[],
): { urdu?: string; english?: string } {
  const { english, urdu } = resolvedPhrase(code, phrases);
  const { showUrdu, showEnglish } = partsForMode(mode);
  return { urdu: showUrdu ? urdu : undefined, english: showEnglish ? english : undefined };
}
