import type { Metadata } from "next";
import { SuneinPage } from "@/features/sunein/sunein-page";

export const metadata: Metadata = { title: "Sunein" };

export default function Page() {
  return <SuneinPage />;
}
