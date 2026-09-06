"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useAppStore } from "@/lib/store";
import { calculateAgeLabel } from "@/types";

export function PatientSearchPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const patients = useAppStore((s) => s.patients);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search by patient name, MR number, or guardian name…" />
      <CommandList>
        <CommandEmpty>No patients found.</CommandEmpty>
        <CommandGroup heading="Patients">
          {patients.map((p) => (
            <CommandItem
              key={p.id}
              value={`${p.name} ${p.mrNumber} ${p.fatherGuardianName}`}
              onSelect={() => {
                onOpenChange(false);
                router.push(`/patients/${p.id}`);
              }}
            >
              <User className="size-4 text-foreground-subtle" />
              <span className="flex-1">
                <span className="font-medium text-foreground">{p.name}</span>
                <span className="ml-2 text-foreground-subtle">
                  MR {p.mrNumber} · {calculateAgeLabel(p.dob)} · S/o‑D/o {p.fatherGuardianName}
                </span>
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
