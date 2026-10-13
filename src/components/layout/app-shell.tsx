"use client";

import { useEffect, type ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { GroceryDialogProvider } from "@/features/groceries/add-item-dialog";
import { CommandPaletteProvider } from "@/features/search/command-palette";
import { TaskDialogProvider } from "@/features/tasks/task-dialog";
import { usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore } from "@/lib/storage/stores";
import { Atmosphere } from "./atmosphere";
import { MobileNav, Sidebar } from "./sidebar";
import { TopBar } from "./topbar";

/** Mirrors user preferences onto <html> (language, direction, text size, motion). */
function DocumentPreferences() {
  const { language, textSize, motion } = usePersisted(settingsStore);
  useEffect(() => {
    const html = document.documentElement;
    html.lang = language === "ur" ? "ur" : "en";
    html.dir = language === "ur" ? "rtl" : "ltr";
    html.dataset.textSize = textSize;
    html.dataset.motion = motion;
  }, [language, textSize, motion]);
  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <GroceryDialogProvider>
        <TaskDialogProvider>
          <CommandPaletteProvider>
            <DocumentPreferences />
            <Atmosphere />
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[80] focus:rounded-xl focus:bg-emerald focus:px-4 focus:py-2 focus:text-[#06231a]"
            >
              Skip to content
            </a>
            <div className="mx-auto flex min-h-dvh w-full max-w-[1680px]">
              <Sidebar />
              <div className="flex min-w-0 flex-1 flex-col px-4 pb-24 md:px-6 md:pb-8">
                <TopBar />
                <main id="main" className="min-w-0 flex-1" tabIndex={-1}>
                  {children}
                </main>
              </div>
            </div>
            <MobileNav />
          </CommandPaletteProvider>
        </TaskDialogProvider>
      </GroceryDialogProvider>
    </ToastProvider>
  );
}
