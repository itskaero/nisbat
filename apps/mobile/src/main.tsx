import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "@fontsource/amiri/arabic-400.css";
import "@fontsource/noto-nastaliq-urdu/arabic-400.css";
import "./app.css";
import { SplashScreen } from "@capacitor/splash-screen";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { apiUrl, authHeaders } from "@/lib/api-base";
import { startSync } from "@/lib/storage/sync";
import { App } from "./app";
import { loadConnection, saveConnection } from "./lib/conn";
import { isNative, setupStatusBar } from "./lib/native";
import { schedulePrayerNotifications } from "./lib/notify";
import { Onboarding } from "./onboarding";

type Boot = { s: "loading" } | { s: "onboard"; reason?: string } | { s: "ready" };

function Root() {
  const [boot, setBoot] = useState<Boot>({ s: "loading" });

  useEffect(() => {
    void (async () => {
      await setupStatusBar();
      const c = await loadConnection();
      if (!c) return setBoot({ s: "onboard" });
      // Still trusted? (A phone removed in Settings → Phones has to ask again.)
      try {
        const r = await fetch(apiUrl("/api/devices/me"), { headers: authHeaders(), cache: "no-store", signal: AbortSignal.timeout?.(4000) });
        if (r.status === 401) {
          await saveConnection(null);
          return setBoot({ s: "onboard", reason: "This phone was removed from Nisbat. Ask to join again." });
        }
      } catch {
        /* away from home Wi-Fi: open with the last synced data */
      }
      setBoot({ s: "ready" });
    })().finally(() => {
      if (isNative) void SplashScreen.hide();
    });
  }, []);

  useEffect(() => {
    if (boot.s !== "ready") return;
    startSync();
    void schedulePrayerNotifications();
  }, [boot.s]);

  if (boot.s === "loading") return null;
  if (boot.s === "onboard") return <Onboarding reason={boot.reason} onDone={() => setBoot({ s: "ready" })} />;
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
