import type { Metadata } from "next";
import { BazaarPage } from "@/features/bazaar/bazaar-page";

export const metadata: Metadata = { title: "Bazaar" };

export default function Page() {
  return <BazaarPage />;
}
