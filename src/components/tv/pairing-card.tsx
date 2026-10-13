"use client";

import { RefreshCw, Smartphone } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Button, cn } from "@/components/ui/primitives";
import { newPairingCode } from "@/lib/remote/protocol";
import { tvRemoteStore } from "@/lib/storage/stores";
import { usePairingCode } from "./remote-receiver";

/** Shows how to pair a phone remote with this screen: URL, code and QR. */
export function PairingCard({ className, allowReset = false }: { className?: string; allowReset?: boolean }) {
  const code = usePairingCode();
  const [origin, setOrigin] = useState("");
  const [svg, setSvg] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const url = origin && code ? `${origin}/remote?code=${code}` : "";

  useEffect(() => {
    if (!url) return;
    QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#0b1220", light: "#f5f7fa" } })
      .then(setSvg)
      .catch(() => setSvg(""));
  }, [url]);

  return (
    <div className={cn("glass flex items-center gap-5 p-5", className)}>
      {svg ? (
        <div className="size-28 shrink-0 overflow-hidden rounded-xl bg-[#f5f7fa] p-1.5" role="img" aria-label="QR code to open the phone remote" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="skeleton size-28 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Smartphone className="size-4 text-emerald" /> Control this screen from your phone
        </p>
        <p className="mt-1 text-xs text-ink-2">Scan the code, or open this address on a phone on the same network:</p>
        <p className="mt-1 break-all text-sm text-ink">{origin ? `${origin}/remote` : "…"}</p>
        <p className="mt-2 text-xs text-ink-2">
          Pairing code <span className="ms-1 font-mono text-lg font-semibold tracking-[0.2em] text-gold">{code ?? "······"}</span>
        </p>
        {allowReset && (
          <Button size="sm" variant="ghost" className="mt-2 -ms-3" onClick={() => tvRemoteStore.set({ code: newPairingCode() })}>
            <RefreshCw className="size-3.5" /> New code (disconnects paired phones)
          </Button>
        )}
      </div>
    </div>
  );
}
