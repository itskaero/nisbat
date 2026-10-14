/** Hisn al-Muslim chapters offered (IDs from hisnmuslim.com's public API). */
export const AZKAR_CHAPTERS = [
  { id: 27, title: "Morning & evening", titleUr: "صبح و شام کے اذکار" },
  { id: 25, title: "After the prayer", titleUr: "نماز کے بعد" },
  { id: 28, title: "Before sleeping", titleUr: "سونے سے پہلے" },
  { id: 1, title: "On waking up", titleUr: "جاگنے پر" },
  { id: 10, title: "Leaving home", titleUr: "گھر سے نکلتے وقت" },
  { id: 11, title: "Entering home", titleUr: "گھر میں داخل ہوتے وقت" },
  { id: 69, title: "Before eating", titleUr: "کھانے سے پہلے" },
  { id: 70, title: "After eating", titleUr: "کھانے کے بعد" },
  { id: 96, title: "Travelling", titleUr: "سفر کی دعا" },
  { id: 129, title: "Seeking forgiveness", titleUr: "استغفار" },
] as const;

/**
 * Hadith of the day: short, well-known narrations from Sahih al-Bukhari,
 * referenced by number. Text (English + Urdu) is fetched from the
 * fawazahmed0/hadith-api dataset (public domain / Unlicense).
 */
export const DAILY_HADITH = [1, 10, 13, 39, 2442, 3559, 5027, 5971, 6011, 6012, 6018, 6094, 6114, 6116, 6136, 6412, 6464];
