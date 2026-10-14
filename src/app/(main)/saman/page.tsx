import type { Metadata } from "next";
import { SamanPage } from "@/features/groceries/saman-page";

export const metadata: Metadata = { title: "Saman" };

export default function Page() {
  return <SamanPage />;
}
