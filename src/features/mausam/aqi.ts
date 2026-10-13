/** US EPA AQI categories with plain-language guidance. */
export const AQI_BANDS = [
  { max: 50, label: "Good", labelUr: "اچھی", color: "#45d49a", advice: "Air is clean. A good time to be outdoors." },
  { max: 100, label: "Moderate", labelUr: "معتدل", color: "#e9d36b", advice: "Acceptable. Unusually sensitive people should limit long outdoor exertion." },
  { max: 150, label: "Unhealthy for sensitive groups", labelUr: "حساس افراد کے لیے مضر", color: "#f0a65a", advice: "Elders, children and people with asthma or heart conditions should reduce time outdoors." },
  { max: 200, label: "Unhealthy", labelUr: "مضرِ صحت", color: "#f07c65", advice: "Limit time outdoors, keep windows closed, consider a mask (N95) outside." },
  { max: 300, label: "Very unhealthy", labelUr: "انتہائی مضر", color: "#c86bd8", advice: "Avoid outdoor activity. Keep elders and children indoors." },
  { max: Infinity, label: "Hazardous", labelUr: "خطرناک", color: "#b04a5a", advice: "Health emergency conditions. Stay indoors with windows closed." },
] as const;

export function aqiBand(aqi: number) {
  return AQI_BANDS.find((b) => aqi <= b.max) ?? AQI_BANDS[AQI_BANDS.length - 1];
}
