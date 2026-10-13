import type { Metadata } from "next";
import { Suspense } from "react";
import { TvPage } from "@/features/live-tv/tv-page";

export const metadata: Metadata = { title: "Live TV" };

export default function Page() {
  return (
    <Suspense>
      <TvPage />
    </Suspense>
  );
}
