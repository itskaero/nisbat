/**
 * The 17 cities in which the Pakistan Bureau of Statistics collects weekly
 * Sensitive Price Indicator (SPI) prices, plus the national average.
 */
export interface SpiCity {
  slug: string;
  name: string;
  nameUr: string;
  lat: number;
  lon: number;
}

export const SPI_CITIES: SpiCity[] = [
  { slug: "islamabad", name: "Islamabad", nameUr: "اسلام آباد", lat: 33.6844, lon: 73.0479 },
  { slug: "rawalpindi", name: "Rawalpindi", nameUr: "راولپنڈی", lat: 33.5651, lon: 73.0169 },
  { slug: "gujranwala", name: "Gujranwala", nameUr: "گوجرانوالہ", lat: 32.1877, lon: 74.1945 },
  { slug: "sialkot", name: "Sialkot", nameUr: "سیالکوٹ", lat: 32.4945, lon: 74.5229 },
  { slug: "lahore", name: "Lahore", nameUr: "لاہور", lat: 31.5204, lon: 74.3587 },
  { slug: "faisalabad", name: "Faisalabad", nameUr: "فیصل آباد", lat: 31.4504, lon: 73.135 },
  { slug: "sargodha", name: "Sargodha", nameUr: "سرگودھا", lat: 32.074, lon: 72.6861 },
  { slug: "multan", name: "Multan", nameUr: "ملتان", lat: 30.1575, lon: 71.5249 },
  { slug: "bahawalpur", name: "Bahawalpur", nameUr: "بہاولپور", lat: 29.3956, lon: 71.6836 },
  { slug: "karachi", name: "Karachi", nameUr: "کراچی", lat: 24.8607, lon: 67.0011 },
  { slug: "hyderabad", name: "Hyderabad", nameUr: "حیدرآباد", lat: 25.396, lon: 68.3578 },
  { slug: "sukkur", name: "Sukkur", nameUr: "سکھر", lat: 27.7052, lon: 68.8574 },
  { slug: "larkana", name: "Larkana", nameUr: "لاڑکانہ", lat: 27.557, lon: 68.2264 },
  { slug: "peshawar", name: "Peshawar", nameUr: "پشاور", lat: 34.0151, lon: 71.5249 },
  { slug: "bannu", name: "Bannu", nameUr: "بنوں", lat: 32.9889, lon: 70.6056 },
  { slug: "quetta", name: "Quetta", nameUr: "کوئٹہ", lat: 30.1798, lon: 66.975 },
  { slug: "khuzdar", name: "Khuzdar", nameUr: "خضدار", lat: 27.8, lon: 66.6167 },
];

export const NATIONAL = { slug: "national", name: "National average", nameUr: "قومی اوسط" } as const;

export const SPI_CITY_SLUGS = new Set<string>([...SPI_CITIES.map((c) => c.slug), NATIONAL.slug]);

export const spiCityName = (slug: string) => (slug === NATIONAL.slug ? NATIONAL.name : SPI_CITIES.find((c) => c.slug === slug)?.name ?? slug);

/** Nearest SPI city to a location; outside Pakistan (> 250 km away) falls back to the national average. */
export function nearestSpiCity(loc: { latitude: number; longitude: number } | null | undefined): string {
  if (!loc) return NATIONAL.slug;
  const rad = Math.PI / 180;
  let best = { slug: NATIONAL.slug as string, km: Infinity };
  for (const c of SPI_CITIES) {
    const dLat = (c.lat - loc.latitude) * rad;
    const dLon = (c.lon - loc.longitude) * rad;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(loc.latitude * rad) * Math.cos(c.lat * rad) * Math.sin(dLon / 2) ** 2;
    const km = 12742 * Math.asin(Math.sqrt(a));
    if (km < best.km) best = { slug: c.slug, km };
  }
  return best.km <= 250 ? best.slug : NATIONAL.slug;
}
