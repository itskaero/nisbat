import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = { title: "Remote" };
export const viewport: Viewport = { themeColor: "#0b1220", width: "device-width", initialScale: 1, maximumScale: 1, viewportFit: "cover" };

export default function RemoteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-dvh bg-[radial-gradient(120%_70%_at_50%_0%,#16233a_0%,#0b1220_60%)]">{children}</div>
    </ToastProvider>
  );
}
