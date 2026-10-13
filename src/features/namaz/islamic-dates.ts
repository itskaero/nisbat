/**
 * Major Islamic dates observed in Pakistan, by Hijri month/day. Dates come
 * from AlAdhan's calculated Hijri calendar; Pakistan's official dates follow
 * the Ruet-e-Hilal moon-sighting committee and can differ by a day.
 */
export const ISLAMIC_DATES: { month: number; day: number; name: string; nameUr: string }[] = [
  { month: 1, day: 1, name: "Islamic New Year", nameUr: "اسلامی نیا سال" },
  { month: 1, day: 10, name: "Ashura (9–10 Muharram)", nameUr: "یومِ عاشور" },
  { month: 3, day: 12, name: "12 Rabi' al-Awwal", nameUr: "۱۲ ربیع الاول" },
  { month: 7, day: 27, name: "Shab-e-Miraj", nameUr: "شبِ معراج" },
  { month: 8, day: 15, name: "Shab-e-Barat", nameUr: "شبِ برات" },
  { month: 9, day: 1, name: "Ramadan begins", nameUr: "آغازِ رمضان" },
  { month: 9, day: 27, name: "27th night of Ramadan", nameUr: "ستائیسویں شب" },
  { month: 10, day: 1, name: "Eid al-Fitr", nameUr: "عید الفطر" },
  { month: 12, day: 9, name: "Day of Arafah", nameUr: "یومِ عرفہ" },
  { month: 12, day: 10, name: "Eid al-Adha", nameUr: "عید الاضحیٰ" },
];

export function islamicDateFor(month: number, day: number) {
  return ISLAMIC_DATES.find((d) => d.month === month && d.day === day);
}

export const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
export type PrayerName = (typeof PRAYER_NAMES)[number];
export const PRAYER_UR: Record<string, string> = { Fajr: "فجر", Sunrise: "طلوعِ آفتاب", Dhuhr: "ظہر", Asr: "عصر", Maghrib: "مغرب", Isha: "عشاء" };
