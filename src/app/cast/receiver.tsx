"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { REMOTE_PATHS } from "@/lib/remote/protocol";

const NAMESPACE = "urn:x-cast:pk.nisbat.app";

declare global {
  interface Window {
    cast?: {
      framework: {
        CastReceiverContext: {
          getInstance(): {
            start(options: Record<string, unknown>): void;
            addCustomMessageListener(ns: string, cb: (e: { data: unknown }) => void): void;
          };
        };
      };
    };
  }
}

/**
 * Runs the Cast Application Framework (CAF) receiver and shows the Nisbat
 * dashboard full screen in TV mode. Idle timeout is disabled so the dashboard
 * stays up like the Chromecast backdrop would. A sender can switch screens by
 * sending { "type": "navigate", "path": "/quran" } on the Nisbat namespace.
 */
export function CastReceiver() {
  const [path, setPath] = useState<string>("/");
  const [sdkReady, setSdkReady] = useState(false);
  // The CAF SDK only works on a Cast device; elsewhere /cast is just a preview.
  const [onCastDevice, setOnCastDevice] = useState(false);
  useEffect(() => setOnCastDevice(/CrKey/.test(navigator.userAgent)), []);

  useEffect(() => {
    if (!sdkReady || !window.cast) return;
    const ctx = window.cast.framework.CastReceiverContext.getInstance();
    ctx.addCustomMessageListener(NAMESPACE, (e) => {
      const data = (typeof e.data === "string" ? JSON.parse(e.data) : e.data) as { type?: string; path?: string };
      if (data?.type === "navigate" && REMOTE_PATHS.includes(data.path as (typeof REMOTE_PATHS)[number])) setPath(data.path!);
    });
    // skipPlayersLoad: Nisbat plays media itself; disableIdleTimeout keeps the dashboard up.
    ctx.start({ disableIdleTimeout: true, skipPlayersLoad: true, statusText: "Nisbat Home" });
  }, [sdkReady]);

  const src = `${path}${path.includes("?") ? "&" : "?"}tv=1`;
  return (
    <>
      {onCastDevice && (
        <Script src="https://www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js" strategy="afterInteractive" onLoad={() => setSdkReady(true)} />
      )}
      <iframe
        key={src}
        src={src}
        title="Nisbat Home"
        allow="autoplay; fullscreen"
        // Give the dashboard keyboard focus so remote D-pad keys reach it.
        onLoad={(e) => e.currentTarget.contentWindow?.focus()}
        className="fixed inset-0 h-full w-full border-0 bg-[#0b1220]"
      />
    </>
  );
}
