/**
 * Couplets of Allama Iqbal (d. 1938) and Mirza Ghalib (d. 1869) — public
 * domain. Each line was checked against rekhta.org on 2026-10-14.
 */
export interface Sher {
  poet: "Allama Iqbal" | "Mirza Ghalib";
  poetUr: string;
  lines: [string, string];
  /** Roman Urdu search query used to find it on Rekhta. */
  query: string;
}

const IQBAL = { poet: "Allama Iqbal", poetUr: "علامہ اقبال" } as const;
const GHALIB = { poet: "Mirza Ghalib", poetUr: "مرزا غالب" } as const;

export const ASHAAR: Sher[] = [
  { ...IQBAL, lines: ["خودی کو کر بلند اتنا کہ ہر تقدیر سے پہلے", "خدا بندے سے خود پوچھے بتا تیری رضا کیا ہے"], query: "khudi ko kar buland itna" },
  { ...GHALIB, lines: ["ہزاروں خواہشیں ایسی کہ ہر خواہش پہ دم نکلے", "بہت نکلے مرے ارمان لیکن پھر بھی کم نکلے"], query: "hazaron khvahishen aisi ki har khvahish pe dam nikle" },
  { ...IQBAL, lines: ["ستاروں سے آگے جہاں اور بھی ہیں", "ابھی عشق کے امتحاں اور بھی ہیں"], query: "sitaron se aage jahan aur bhi hain" },
  { ...GHALIB, lines: ["دل ناداں تجھے ہوا کیا ہے", "آخر اس درد کی دوا کیا ہے"], query: "dil-e-nadan tujhe hua kya hai" },
  { ...IQBAL, lines: ["نہیں ہے ناامید اقبالؔ اپنی کشت ویراں سے", "ذرا نم ہو تو یہ مٹی بہت زرخیز ہے ساقی"], query: "nahin hai na-umid iqbal apni kisht-e-viran se" },
  { ...GHALIB, lines: ["رنج سے خوگر ہوا انساں تو مٹ جاتا ہے رنج", "مشکلیں مجھ پر پڑیں اتنی کہ آساں ہو گئیں"], query: "ranj se khugar hua insan to mit jata hai ranj" },
  { ...IQBAL, lines: ["لب پہ آتی ہے دعا بن کے تمنا میری", "زندگی شمع کی صورت ہو خدایا میری"], query: "lab pe aati hai dua ban ke tamanna meri" },
  { ...GHALIB, lines: ["بازیچۂ اطفال ہے دنیا مرے آگے", "ہوتا ہے شب و روز تماشا مرے آگے"], query: "bazicha-e-atfal hai duniya mire aage" },
  { ...IQBAL, lines: ["تو شاہیں ہے پرواز ہے کام تیرا", "ترے سامنے آسماں اور بھی ہیں"], query: "tu shahin hai parvaz hai kaam tera" },
  { ...GHALIB, lines: ["ہم کو معلوم ہے جنت کی حقیقت لیکن", "دل کے خوش رکھنے کو غالبؔ یہ خیال اچھا ہے"], query: "ham ko maalum hai jannat ki haqiqat lekin" },
  { ...IQBAL, lines: ["یقیں محکم عمل پیہم محبت فاتح عالم", "جہاد زندگانی میں ہیں یہ مردوں کی شمشیریں"], query: "yaqin mohkam amal paiham mohabbat fateh-e-alam" },
  { ...GHALIB, lines: ["کوئی امید بر نہیں آتی", "کوئی صورت نظر نہیں آتی"], query: "koi ummid bar nahin aati" },
  { ...IQBAL, lines: ["اپنے من میں ڈوب کر پا جا سراغ زندگی", "تو اگر میرا نہیں بنتا نہ بن اپنا تو بن"], query: "apne man mein doob kar pa ja suragh-e-zindagi" },
  { ...GHALIB, lines: ["عشق نے غالبؔ نکما کر دیا", "ورنہ ہم بھی آدمی تھے کام کے"], query: "ishq ne ghalib nikamma kar diya" },
  { ...IQBAL, lines: ["نگہ بلند سخن دل نواز جاں پرسوز", "یہی ہے رخت سفر میر کارواں کے لیے"], query: "nigah buland sukhan dil-navaz jaan pur-soz" },
  { ...IQBAL, lines: ["سبق پھر پڑھ صداقت کا عدالت کا شجاعت کا", "لیا جائے گا تجھ سے کام دنیا کی امامت کا"], query: "sabaq phir padh sadaqat ka adalat ka shujaat ka" },
];

export function sherForDate(dateKey: string, offset = 0): Sher {
  const [y, m, d] = dateKey.split("-").map(Number);
  const day = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  return ASHAAR[(((day + offset) % ASHAAR.length) + ASHAAR.length) % ASHAAR.length];
}

export const rekhtaLink = (s: Sher) => `https://www.rekhta.org/search/all?lang=ur&q=${encodeURIComponent(s.query)}`;

/** National days and milestones, each linked to its Wikipedia article. */
export interface NationalDate {
  month: number;
  day: number;
  title: string;
  titleUr: string;
  year?: number;
  note: string;
  wiki: string;
}

export const NATIONAL_DATES: NationalDate[] = [
  { month: 2, day: 5, title: "Kashmir Solidarity Day", titleUr: "یومِ یکجہتیٔ کشمیر", note: "Observed across Pakistan in solidarity with the people of Kashmir.", wiki: "Kashmir_Solidarity_Day" },
  { month: 3, day: 23, title: "Pakistan Day", titleUr: "یومِ پاکستان", year: 1940, note: "The Lahore Resolution was passed on 23 March 1940; on the same date in 1956 Pakistan adopted its first constitution.", wiki: "Pakistan_Day" },
  { month: 3, day: 25, title: "Cricket World Cup won", titleUr: "عالمی کپ کی فتح", year: 1992, note: "Pakistan won the 1992 Cricket World Cup final in Melbourne under Imran Khan's captaincy.", wiki: "1992_Cricket_World_Cup_final" },
  { month: 4, day: 21, title: "Allama Iqbal's death anniversary", titleUr: "یومِ وفات علامہ اقبال", year: 1938, note: "The poet-philosopher who envisioned a homeland for the Muslims of South Asia passed away in Lahore.", wiki: "Muhammad_Iqbal" },
  { month: 5, day: 28, title: "Youm-e-Takbeer", titleUr: "یومِ تکبیر", year: 1998, note: "Pakistan conducted its nuclear tests at Chagai, Balochistan, on 28 May 1998.", wiki: "Youm-e-Takbeer" },
  { month: 7, day: 8, title: "Abdul Sattar Edhi's death anniversary", titleUr: "یومِ وفات عبدالستار ایدھی", year: 2016, note: "The humanitarian whose Edhi Foundation built one of the world's largest volunteer ambulance networks.", wiki: "Abdul_Sattar_Edhi" },
  { month: 7, day: 9, title: "Fatima Jinnah's death anniversary", titleUr: "یومِ وفات مادرِ ملت", year: 1967, note: "Madar-e-Millat, sister of the Quaid and a leading figure of the Pakistan Movement.", wiki: "Fatima_Jinnah" },
  { month: 8, day: 11, title: "Quaid's address to the Constituent Assembly", titleUr: "قائد کا دستور ساز اسمبلی سے خطاب", year: 1947, note: "Jinnah's landmark speech to the first Constituent Assembly of Pakistan.", wiki: "Jinnah's_11_August_Speech" },
  { month: 8, day: 14, title: "Independence Day", titleUr: "یومِ آزادی", year: 1947, note: "Pakistan came into being on 14 August 1947.", wiki: "Independence_Day_(Pakistan)" },
  { month: 9, day: 6, title: "Defence Day", titleUr: "یومِ دفاع", year: 1965, note: "Commemorates the defence of the country during the 1965 war.", wiki: "Defence_Day_(Pakistan)" },
  { month: 9, day: 11, title: "Quaid-e-Azam's death anniversary", titleUr: "یومِ وفات قائداعظم", year: 1948, note: "Muhammad Ali Jinnah, founder of Pakistan, passed away in Karachi.", wiki: "Muhammad_Ali_Jinnah" },
  { month: 9, day: 30, title: "Pakistan joins the United Nations", titleUr: "اقوامِ متحدہ کی رکنیت", year: 1947, note: "Pakistan became a member of the United Nations on 30 September 1947.", wiki: "Pakistan_and_the_United_Nations" },
  { month: 10, day: 8, title: "2005 earthquake remembrance", titleUr: "۲۰۰۵ کے زلزلے کی یاد", year: 2005, note: "The Kashmir earthquake of 8 October 2005 claimed tens of thousands of lives in the north.", wiki: "2005_Kashmir_earthquake" },
  { month: 10, day: 16, title: "Liaquat Ali Khan's assassination", titleUr: "یومِ شہادت لیاقت علی خان", year: 1951, note: "Pakistan's first Prime Minister was assassinated in Rawalpindi.", wiki: "Liaquat_Ali_Khan" },
  { month: 11, day: 9, title: "Iqbal Day", titleUr: "یومِ اقبال", year: 1877, note: "Birth anniversary of Allama Muhammad Iqbal, Pakistan's national poet, born in Sialkot.", wiki: "Muhammad_Iqbal" },
  { month: 12, day: 25, title: "Quaid-e-Azam Day", titleUr: "یومِ قائداعظم", year: 1876, note: "Birth anniversary of Muhammad Ali Jinnah, born in Karachi.", wiki: "Muhammad_Ali_Jinnah" },
];

export const wikiUrl = (slug: string) => `https://en.wikipedia.org/wiki/${slug}`;
