/**
 * Saman catalog items that have a genuine counterpart in the PBS weekly SPI
 * (sheet Appendix-A item numbers). `factor` converts the PBS price to the
 * catalog's unit; `note` says how the PBS item differs, shown in the UI.
 *
 * Items without a true match (e.g. sela rice, tea 950 g, dressed chicken)
 * are deliberately left out rather than approximated.
 */
export interface SpiLink {
  no: number;
  factor: number;
  note?: string;
}

export const SPI_MAP: Record<string, SpiLink> = {
  atta: { no: 1, factor: 1 / 20, note: "from the 20 kg bag price" },
  "broken-rice": { no: 2, factor: 1, note: "basmati broken, average quality" },
  masoor: { no: 17, factor: 1, note: "washed" },
  moong: { no: 18, factor: 1, note: "washed" },
  mash: { no: 19, factor: 1, note: "washed" },
  "chana-daal": { no: 20, factor: 1, note: "pulse gram" },
  "cooking-oil": { no: 13, factor: 1 / 5, note: "from the 5 L tin price (Dalda or similar)" },
  ghee: { no: 15, factor: 1, note: "banaspati 1 kg pouch (Dalda/Habib or similar)" },
  salt: { no: 26, factor: 1, note: "800 g packet (National/Shan)" },
  sugar: { no: 24, factor: 1 },
  gur: { no: 25, factor: 1 },
  "red-chilli": { no: 27, factor: 1 / 200, note: "from the 200 g National packet" },
  potato: { no: 21, factor: 1 },
  onion: { no: 22, factor: 1 },
  tomato: { no: 23, factor: 1 },
  garlic: { no: 28, factor: 1 / 4, note: "from the per-kg price" },
  banana: { no: 16, factor: 1, note: "local" },
  milk: { no: 8, factor: 1, note: "fresh, unboiled" },
  yogurt: { no: 9, factor: 1, note: "loose" },
  beef: { no: 5, factor: 1, note: "with bone" },
  mutton: { no: 6, factor: 1 },
  eggs: { no: 11, factor: 1, note: "farm" },
  bread: { no: 4, factor: 1, note: "plain, small size" },
  soap: { no: 51, factor: 1, note: "Lifebuoy 115 g" },
};

/** SPI items shown first in "This week's prices". */
export const SPI_HEADLINE = [1, 24, 7, 11, 8, 22, 23, 21, 13, 17, 47, 49];
