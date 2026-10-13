"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { goBack } from "@/lib/tv/actions";
import { isAmbientOpen, markActivity, setAmbientOpen } from "@/lib/tv/ambient-state";
import { mediaCommand } from "@/lib/tv/media-registry";
import { focusElement, focusables, isBackKey, moveFocus, shouldNavigate } from "@/lib/tv/spatial-nav";
import { useTvMode } from "@/lib/tv/tv-mode";

/**
 * Turns the app into a TV (10-foot) experience: D-pad focus movement, the
 * remote's Back button, media keys, and a sensible starting focus on each
 * screen.
 */
export function TvController() {
  const tv = useTvMode();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    if (tv) html.dataset.tv = "";
    else delete html.dataset.tv;
  }, [tv]);

  useEffect(() => {
    if (!tv) return;
    const onKey = (e: KeyboardEvent) => {
      // The key that wakes the ambient screen only wakes it.
      if (isAmbientOpen()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setAmbientOpen(false);
        markActivity();
        return;
      }
      markActivity();
      if (e.defaultPrevented) return;
      if (isBackKey(e)) {
        e.preventDefault();
        goBack(router);
        return;
      }
      if (e.key === "MediaPlayPause" || e.key === "MediaPlay" || e.key === "MediaPause") {
        if (mediaCommand("toggle")) e.preventDefault();
        return;
      }
      if (e.key === "MediaTrackNext" || e.key === "MediaFastForward") {
        if (mediaCommand("next")) e.preventDefault();
        return;
      }
      if (e.key === "MediaTrackPrevious" || e.key === "MediaRewind") {
        if (mediaCommand("prev")) e.preventDefault();
        return;
      }
      if (e.key === "Enter" && e.target instanceof HTMLSelectElement) {
        e.preventDefault();
        try {
          e.target.showPicker();
        } catch {
          /* picker unsupported */
        }
        return;
      }
      const dir = shouldNavigate(e);
      if (dir) {
        e.preventDefault();
        e.stopPropagation();
        moveFocus(dir);
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [tv, router]);

  // Give each screen a starting focus so the first D-pad press does something visible.
  useEffect(() => {
    if (!tv) return;
    const t = setTimeout(() => {
      // Each new screen starts with focus in its content (not the sidebar or skip link).
      const active = document.activeElement;
      if (active && active.closest("main") && document.contains(active)) return;
      if (document.querySelector("dialog[open]")) return;
      const first = focusables().find((el) => el.closest("main"));
      if (first) focusElement(first);
    }, 400);
    return () => clearTimeout(t);
  }, [tv, pathname]);

  return null;
}
