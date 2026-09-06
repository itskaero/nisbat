import type { Metadata } from "next";
import { Inter, Noto_Nastaliq_Urdu } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreHydrator } from "@/components/layout/store-hydrator";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
  variable: "--font-nastaliq",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nisbat — Pediatric Discharge Workspace",
  description: "Pediatric discharge, simplified.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${nastaliq.variable}`}>
      <body className="app-atmosphere min-h-screen">
        <TooltipProvider delayDuration={200}>
          <StoreHydrator>{children}</StoreHydrator>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
