import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Moon, Sun, type LucideIcon } from "lucide-react";

/* Pure helpers shared by the website, the TV app and the Android app. */

/** WMO weather interpretation codes (Open-Meteo). */
export function describeWeather(code: number, isDay: boolean): { label: string; icon: LucideIcon } {
  if (code === 0) return { label: "Clear sky", icon: isDay ? Sun : Moon };
  if (code <= 2) return { label: code === 1 ? "Mainly clear" : "Partly cloudy", icon: isDay ? CloudSun : CloudMoon };
  if (code === 3) return { label: "Overcast", icon: Cloud };
  if (code === 45 || code === 48) return { label: "Fog / smog", icon: CloudFog };
  if (code >= 51 && code <= 57) return { label: "Drizzle", icon: CloudDrizzle };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { label: "Rain", icon: CloudRain };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: "Snow", icon: CloudSnow };
  if (code >= 95) return { label: "Thunderstorm", icon: CloudLightning };
  return { label: "—", icon: Cloud };
}

// References only — text always comes from the Quran API.
const DAILY_REFS = ["65:3", "94:5", "13:28", "2:152", "3:139", "39:53", "2:186", "29:69", "16:97", "20:114", "2:45", "25:63", "49:13", "93:5", "64:16", "31:17", "40:60", "14:7", "33:41", "3:200", "11:88", "12:86", "17:24", "18:10", "21:87", "28:24", "67:2", "103:1"];

export function dailyVerseRef(dateKeyStr: string): string {
  const [y, m, d] = dateKeyStr.split("-").map(Number);
  const day = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  return DAILY_REFS[day % DAILY_REFS.length];
}
