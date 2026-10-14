import type { Metadata } from "next";
import { MausamPage } from "@/features/mausam/mausam-page";

export const metadata: Metadata = { title: "Mausam" };

export default function Page() {
  return <MausamPage />;
}
