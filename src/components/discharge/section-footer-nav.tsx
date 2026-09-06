"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { nextSection, prevSection } from "@/lib/workspace-nav";
import { useAppStore } from "@/lib/store";
import { useWorkspace } from "@/components/discharge/workspace-context";

export function SectionFooterNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { discharge, editable } = useWorkspace();
  const submitForSrReview = useAppStore((s) => s.submitForSrReview);
  const currentId = pathname.split("/").pop()!;

  const prev = prevSection(currentId);
  const next = nextSection(currentId);

  if (currentId === "summary") return null;

  return (
    <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
      <Button
        variant="outline"
        disabled={!prev}
        onClick={() => prev && router.push(`/discharges/${discharge.id}/${prev.id}`)}
      >
        <ArrowLeft className="size-4" /> Previous
      </Button>

      <span className="text-[12px] text-foreground-subtle">
        {editable ? "Changes save automatically" : "Read-only — Pending SR Review"}
      </span>

      {next ? (
        <Button onClick={() => router.push(`/discharges/${discharge.id}/${next.id}`)}>
          Next <ArrowRight className="size-4" />
        </Button>
      ) : (
        <Button
          disabled={!editable}
          onClick={() => {
            submitForSrReview(discharge.id);
            toast.success("Ready for SR review", {
              description: "Continue to Summary & Preview to print for SR review.",
            });
            router.push(`/discharges/${discharge.id}/summary`);
          }}
        >
          Continue to Summary <ArrowRight className="size-4" />
        </Button>
      )}
    </div>
  );
}
