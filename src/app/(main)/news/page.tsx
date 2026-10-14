import type { Metadata } from "next";
import { Suspense } from "react";
import { NewsPage } from "@/features/news/news-page";

export const metadata: Metadata = { title: "Ajj ka Haal" };

export default function Page() {
  return (
    <Suspense>
      <NewsPage />
    </Suspense>
  );
}
