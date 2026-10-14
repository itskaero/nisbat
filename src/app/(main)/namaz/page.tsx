import type { Metadata } from "next";
import { NamazPage } from "@/features/namaz/namaz-page";

export const metadata: Metadata = { title: "Namaz" };

export default function Page() {
  return <NamazPage />;
}
