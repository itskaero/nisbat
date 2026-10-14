import type { Metadata } from "next";
import { CastReceiver } from "./receiver";

export const metadata: Metadata = { title: "Nisbat on TV" };

/**
 * Google Cast Web Receiver for Nisbat Home. Register this page's HTTPS URL as a
 * Custom Receiver in the Google Cast SDK Developer Console; the resulting App
 * ID is what scripts/autocast.py launches. See README → "Chromecast".
 */
export default function Page() {
  return <CastReceiver />;
}
