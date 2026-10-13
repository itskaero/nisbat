import type { Metadata } from "next";
import { PakistanPage } from "@/features/pakistan/pakistan-page";

export const metadata: Metadata = { title: "Pakistan" };

export default function Page() {
  return <PakistanPage />;
}
