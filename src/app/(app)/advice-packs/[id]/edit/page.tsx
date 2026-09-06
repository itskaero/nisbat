"use client";

import { use } from "react";
import Link from "next/link";
import { AdvicePackBuilder } from "@/components/content/advice-pack-builder";
import { useAppStore } from "@/lib/store";

export default function EditAdvicePackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pack = useAppStore((s) => s.advicePacks.find((p) => p.id === id));

  if (!pack) {
    return (
      <div className="p-6 text-foreground-muted">
        Advice pack not found.{" "}
        <Link href="/advice-packs" className="text-primary-light">
          Back to Advice Packs
        </Link>
      </div>
    );
  }

  return <AdvicePackBuilder existing={pack} />;
}
