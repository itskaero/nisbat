"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DIAGNOSIS_LIST } from "@/lib/seed-data";
import { resolveFlatItems } from "@/lib/clinical-vocab";
import { useAppStore } from "@/lib/store";

/** Tag input for linking content to diagnoses that should suggest it — never
 * auto-applies anything, just narrows what gets suggested later. */
export function DiagnosisTagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const vocabularyLists = useAppStore((s) => s.vocabularyLists);
  const diagnosisList = resolveFlatItems(vocabularyLists, "diagnosis_catalogue", DIAGNOSIS_LIST);
  const [query, setQuery] = React.useState("");
  const matches = query.trim()
    ? diagnosisList.filter((d) => d.toLowerCase().includes(query.toLowerCase()) && !value.includes(d)).slice(0, 6)
    : [];

  function add(label: string) {
    if (!value.includes(label)) onChange([...value, label]);
    setQuery("");
  }

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap gap-1.5">
        {value.map((d) => (
          <Badge key={d} variant="outline" className="gap-1 py-1">
            {d}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== d))}>
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              e.preventDefault();
              add(query.trim());
            }
          }}
          placeholder="Link a diagnosis that should suggest this…"
        />
        {matches.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-[var(--radius-md)] border border-border-strong bg-surface-raised shadow-2xl">
            {matches.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => add(d)}
                className="block w-full px-3 py-1.5 text-left text-[13px] hover:bg-surface-hover"
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
