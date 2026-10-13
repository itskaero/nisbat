"use client";

import { settingsStore } from "@/lib/storage/stores";
import { usePersisted } from "@/lib/storage/persisted-store";

/**
 * Original atmospheric backdrop: dusky sky gradient with a stylised mosque and
 * city skyline drawn in SVG. Kept behind a dark overlay so text stays legible.
 */
export function Atmosphere() {
  const { background } = usePersisted(settingsStore);

  if (background === "plain") {
    return <div aria-hidden className="fixed inset-0 -z-10 bg-[radial-gradient(120%_80%_at_20%_0%,#14223a_0%,#0b1220_55%,#070c16_100%)]" />;
  }

  const dusk = background === "dusk";

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0b1220]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a1222" />
            <stop offset="0.38" stopColor={dusk ? "#1c2340" : "#0f1a30"} />
            <stop offset="0.6" stopColor={dusk ? "#4a3150" : "#16223b"} />
            <stop offset="0.74" stopColor={dusk ? "#a5574a" : "#1d2b45"} />
            <stop offset="0.82" stopColor={dusk ? "#d98a55" : "#22324c"} />
            <stop offset="1" stopColor="#0b1220" />
          </linearGradient>
          <radialGradient id="glow" cx="0.68" cy="0.74" r="0.5">
            <stop offset="0" stopColor={dusk ? "#ffc27a" : "#5c7aa8"} stopOpacity={dusk ? 0.55 : 0.18} />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0b1220" stopOpacity="0" />
            <stop offset="1" stopColor="#0b1220" stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect width="1600" height="1000" fill="url(#sky)" />
        <rect width="1600" height="1000" fill="url(#glow)" />

        {!dusk &&
          Array.from({ length: 70 }).map((_, i) => {
            const x = (i * 337) % 1600;
            const y = (i * 151) % 520;
            return <circle key={i} cx={x} cy={y} r={i % 7 === 0 ? 1.4 : 0.8} fill="#fff" opacity={0.25 + ((i * 13) % 50) / 100} />;
          })}

        {/* distant hills */}
        <path d="M0 760 C 200 700 380 720 560 690 C 760 660 900 720 1100 700 C 1300 680 1450 720 1600 700 L1600 1000 L0 1000Z" fill="#1a1d33" opacity="0.7" />

        {/* skyline */}
        <g fill="#0d1324">
          <rect x="0" y="800" width="1600" height="200" />
          <rect x="60" y="760" width="90" height="60" />
          <rect x="170" y="740" width="60" height="80" />
          <rect x="250" y="772" width="110" height="48" />
          <rect x="390" y="750" width="70" height="70" />
          <rect x="1300" y="756" width="80" height="64" />
          <rect x="1400" y="736" width="60" height="84" />
          <rect x="1480" y="770" width="120" height="50" />

          {/* mosque: central dome, side domes and minarets */}
          <rect x="900" y="700" width="380" height="120" />
          <path d="M1010 700 C 1010 610 1090 580 1090 540 C 1090 580 1170 610 1170 700 Z" />
          <rect x="1086" y="512" width="8" height="30" />
          <circle cx="1090" cy="508" r="6" />
          <path d="M925 700 C 925 660 960 650 960 630 C 960 650 995 660 995 700 Z" />
          <path d="M1185 700 C 1185 660 1220 650 1220 630 C 1220 650 1255 660 1255 700 Z" />
          <rect x="868" y="520" width="22" height="300" />
          <path d="M864 520 L879 470 L894 520 Z" />
          <rect x="862" y="590" width="34" height="8" />
          <rect x="1292" y="520" width="22" height="300" />
          <path d="M1288 520 L1303 470 L1318 520 Z" />
          <rect x="1286" y="590" width="34" height="8" />
        </g>

        {/* warm window lights */}
        <g fill={dusk ? "#ffcf8a" : "#9fc6ff"} opacity="0.55">
          {Array.from({ length: 26 }).map((_, i) => (
            <rect key={i} x={70 + ((i * 59) % 1500)} y={782 + ((i * 17) % 30)} width="4" height="5" rx="1" />
          ))}
          <rect x="1040" y="740" width="8" height="16" rx="4" />
          <rect x="1086" y="740" width="8" height="16" rx="4" />
          <rect x="1132" y="740" width="8" height="16" rx="4" />
        </g>
        <rect y="600" width="1600" height="400" fill="url(#fade)" />
      </svg>
      {/* legibility overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,18,32,0.55)_0%,rgba(11,18,32,0.35)_35%,rgba(11,18,32,0.82)_70%,#0b1220_100%)]" />
    </div>
  );
}
