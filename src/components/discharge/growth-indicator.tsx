import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GrowthChart } from "@/components/discharge/growth-chart";
import type { GrowthZResult } from "@/lib/growth-calc";
import type { LmsTable, Sex } from "@/lib/who-growth-data";

export function GrowthIndicatorCard({
  title,
  result,
  table,
  sex,
  ageMonths,
  value,
  unit,
}: {
  title: string;
  result: GrowthZResult;
  table: LmsTable;
  sex: Sex;
  ageMonths: number;
  value: number;
  unit: string;
}) {
  const severity = Math.abs(result.z) >= 3 ? "danger" : Math.abs(result.z) >= 2 ? "warning" : "success";

  return (
    <div className="rounded-[var(--radius-md)] border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-foreground">{title}</span>
        <Badge variant={severity}>
          {severity !== "success" && <AlertTriangle className="size-3" />}
          Z {result.z >= 0 ? "+" : ""}
          {result.z.toFixed(2)}
        </Badge>
      </div>
      <p className="mb-2 text-[12.5px] text-foreground-muted">{result.classification}</p>
      <GrowthChart table={table} sex={sex} ageMonths={ageMonths} value={value} unit={unit} z={result.z} />
      <p className="mt-1 text-[10px] text-foreground-subtle">
        WHO Child Growth Standards (2006), 0–5 years · median, ±2 SD, ±3 SD shown
      </p>
    </div>
  );
}
