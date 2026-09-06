"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

/**
 * A plain type-and-Enter tag list — no domain-specific autocomplete (see
 * diagnosis-tag-input.tsx for that variant, which suggests from a fixed
 * list). Used wherever a short free-form ordered/removable list of strings
 * is the whole requirement, e.g. a complaint's associated symptoms or an
 * investigation panel's test names.
 */
export function TagInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = React.useState("");

  function add() {
    const t = query.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setQuery("");
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {value.map((v) => (
            <Badge key={v} variant="outline" className="gap-1 py-1">
              {v}
              {!disabled && (
                <button type="button" onClick={() => onChange(value.filter((x) => x !== v))}>
                  <X className="size-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
      {!disabled && (
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder={placeholder}
          className="h-8 text-[12px]"
        />
      )}
    </div>
  );
}
