import type { Metadata, Viewport } from "next";
import { Amiri, Fraunces, Inter, Noto_Naskh_Arabic, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--nf-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--nf-display", display: "swap", axes: ["opsz"] });
const amiri = Amiri({ subsets: ["arabic"], weight: ["400", "700"], variable: "--nf-amiri", display: "swap" });
const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600"], variable: "--nf-naskh", display: "swap" });
const nastaliq = Noto_Nastaliq_Urdu({ subsets: ["arabic"], weight: ["400", "600"], variable: "--nf-nastaliq", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Nisbat Home", template: "%s · Nisbat Home" },
  description: "A calm personal dashboard for Quran reflection, daily news, groceries, tasks and live TV.",
  applicationName: "Nisbat Home",
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" className={`${inter.variable} ${fraunces.variable} ${amiri.variable} ${naskh.variable} ${nastaliq.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
