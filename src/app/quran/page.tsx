import type { Metadata } from "next";
import { Suspense } from "react";
import { QuranPage } from "@/features/quran/quran-page";

export const metadata: Metadata = { title: "Tadabur Quran" };

export default function Page() {
  return (
    <Suspense>
      <QuranPage />
    </Suspense>
  );
}
