"use client";

import * as React from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { PatientSearchPalette } from "@/components/layout/patient-search-palette";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onSearchClick={() => setSearchOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <PatientSearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
