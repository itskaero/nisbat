import type { Metadata } from "next";
import { AzkarPage } from "@/features/azkar/azkar-page";

export const metadata: Metadata = { title: "Azkar & Hadith" };

export default function Page() {
  return <AzkarPage />;
}
