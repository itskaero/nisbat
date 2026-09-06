"use client";

import * as React from "react";
import type { LmsTable, Sex } from "@/lib/who-growth-data";
import { percentileCurve } from "@/lib/growth-calc";

const WIDTH = 560;
const HEIGHT = 240;
const PAD = { top: 14, right: 16, bottom: 30, left: 44 };

export function GrowthChart({
  table,
  sex,
  ageMonths,
  value,
  unit,
  z,
}: {
  table: LmsTable;
  sex: Sex;
  /** the child's current age, used to pick a legible window around it */
  ageMonths: number;
  value: number;
  unit: string;
  z: number;
}) {
  const curve = React.useMemo(() => percentileCurve(table, sex), [table, sex]);

  // zoom the x-window to ~18 months of context around the child's age, rather
  // than always spanning the full 0-60 month standard — keeps the point legible
  // for a neonate as well as a 4-year-old.
  const [xMin, xMax] = React.useMemo(() => {
    const span = 18;
    let lo = Math.max(0, Math.round(ageMonths - span / 2));
    const hi = Math.min(60, lo + span);
    lo = Math.max(0, hi - span);
    return [lo, hi];
  }, [ageMonths]);

  const points = curve.filter((p) => p.month >= xMin && p.month <= xMax);

  const yMin = Math.min(...points.map((p) => p.sd3neg), value) * 0.95;
  const yMax = Math.max(...points.map((p) => p.sd3), value) * 1.05;

  const xScale = (m: number) => PAD.left + ((m - xMin) / (xMax - xMin)) * (WIDTH - PAD.left - PAD.right);
  const yScale = (v: number) => HEIGHT - PAD.bottom - ((v - yMin) / (yMax - yMin)) * (HEIGHT - PAD.top - PAD.bottom);

  function linePath(key: "sd3neg" | "sd2neg" | "median" | "sd2" | "sd3") {
    return points.map((p, i) => `${i === 0 ? "M" : "L"}${xScale(p.month)},${yScale(p[key])}`).join(" ");
  }

  const pointColor = Math.abs(z) >= 3 ? "var(--danger)" : Math.abs(z) >= 2 ? "var(--warning)" : "var(--primary)";
  const pointX = xScale(Math.min(Math.max(ageMonths, xMin), xMax));
  const pointY = yScale(value);

  const xTicks = React.useMemo(() => {
    const step = xMax - xMin <= 18 ? 3 : 6;
    const ticks: number[] = [];
    for (let m = xMin; m <= xMax; m += step) ticks.push(m);
    return ticks;
  }, [xMin, xMax]);

  const [hover, setHover] = React.useState(false);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      role="img"
      aria-label={`Growth chart: ${value} ${unit} at ${ageMonths.toFixed(1)} months, Z-score ${z}`}
    >
      {/* normal-range band, -2 to +2 SD */}
      <path
        d={`${points.map((p, i) => `${i === 0 ? "M" : "L"}${xScale(p.month)},${yScale(p.sd2)}`).join(" ")} ${[...points]
          .reverse()
          .map((p) => `L${xScale(p.month)},${yScale(p.sd2neg)}`)
          .join(" ")} Z`}
        fill="var(--success)"
        fillOpacity={0.06}
      />

      {/* reference curves */}
      <path d={linePath("sd3neg")} fill="none" stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="3 3" />
      <path d={linePath("sd2neg")} fill="none" stroke="var(--foreground-subtle)" strokeWidth={1.25} />
      <path d={linePath("median")} fill="none" stroke="var(--foreground-muted)" strokeWidth={1.75} />
      <path d={linePath("sd2")} fill="none" stroke="var(--foreground-subtle)" strokeWidth={1.25} />
      <path d={linePath("sd3")} fill="none" stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="3 3" />

      {/* axes */}
      <line x1={PAD.left} y1={HEIGHT - PAD.bottom} x2={WIDTH - PAD.right} y2={HEIGHT - PAD.bottom} stroke="var(--border)" />
      {xTicks.map((m) => (
        <text key={m} x={xScale(m)} y={HEIGHT - PAD.bottom + 16} textAnchor="middle" fontSize={10} fill="var(--foreground-subtle)">
          {m}m
        </text>
      ))}
      {[yMin, (yMin + yMax) / 2, yMax].map((v, i) => (
        <text key={i} x={PAD.left - 8} y={yScale(v) + 3} textAnchor="end" fontSize={10} fill="var(--foreground-subtle)">
          {v.toFixed(0)}
        </text>
      ))}

      {/* patient point */}
      <line x1={pointX} y1={PAD.top} x2={pointX} y2={HEIGHT - PAD.bottom} stroke={pointColor} strokeOpacity={0.25} strokeWidth={1} />
      <circle
        cx={pointX}
        cy={pointY}
        r={hover ? 7 : 5.5}
        fill={pointColor}
        stroke="var(--surface)"
        strokeWidth={2}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ cursor: "pointer", transition: "r 100ms" }}
      />
      {hover && (
        <g>
          <rect x={Math.min(pointX + 8, WIDTH - 150)} y={pointY - 26} width={142} height={34} rx={6} fill="var(--surface-raised)" stroke="var(--border-strong)" />
          <text x={Math.min(pointX + 8, WIDTH - 150) + 8} y={pointY - 11} fontSize={11} fill="var(--foreground)" fontWeight={600}>
            {value} {unit} · Z {z >= 0 ? "+" : ""}
            {z}
          </text>
          <text x={Math.min(pointX + 8, WIDTH - 150) + 8} y={pointY + 3} fontSize={10} fill="var(--foreground-muted)">
            at {ageMonths.toFixed(1)} months
          </text>
        </g>
      )}
    </svg>
  );
}
