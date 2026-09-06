"use client";

import * as React from "react";
import Link from "next/link";
import { Search as SearchIcon, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { calculateAgeLabel } from "@/types";

export default function SearchPage() {
  const [query, setQuery] = React.useState("");
  const patients = useAppStore((s) => s.patients);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.mrNumber.toLowerCase().includes(q) ||
        p.fatherGuardianName.toLowerCase().includes(q),
    );
  }, [query, patients]);

  return (
    <div className="mx-auto max-w-[720px] p-6">
      <h1 className="mb-1 text-[20px] font-semibold text-foreground">Search Patient</h1>
      <p className="mb-5 text-[13px] text-foreground-muted">
        Search by MR number, patient name, or father/guardian name.
      </p>

      <div className="relative mb-5">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-subtle" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="MR number, patient name, or guardian name…"
          className="h-11 pl-9 text-[14px]"
        />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {results.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/patients/${p.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
                >
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary-light">
                    <User className="size-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-foreground">{p.name}</div>
                    <div className="text-[12px] text-foreground-subtle">
                      MR {p.mrNumber} · {calculateAgeLabel(p.dob)} · {p.sex === "male" ? "Male" : "Female"} · Guardian:{" "}
                      {p.fatherGuardianName}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
            {results.length === 0 && (
              <li className="px-4 py-10 text-center text-[13px] text-foreground-subtle">No patients match your search.</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
