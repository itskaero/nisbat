import { useEffect, useRef } from "preact/hooks";

/**
 * One focus ring that glides between controls (transform only), instead of
 * every element drawing its own outline. Cheap on a Chromecast GPU.
 */
export function FocusRing() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ring = ref.current!;
    let raf = 0;
    const place = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body || el.dataset.noRing !== undefined) {
          ring.style.opacity = "0";
          return;
        }
        const r = el.getBoundingClientRect();
        const radius = getComputedStyle(el).borderRadius || "16px";
        const pad = 4;
        ring.style.opacity = "1";
        ring.style.width = `${r.width + pad * 2}px`;
        ring.style.height = `${r.height + pad * 2}px`;
        ring.style.borderRadius = radius === "0px" ? "12px" : `calc(${radius} + ${pad}px)`;
        ring.style.transform = `translate3d(${r.left - pad}px, ${r.top - pad}px, 0)`;
      });
    };
    document.addEventListener("focusin", place);
    document.addEventListener("focusout", place);
    document.addEventListener("scroll", place, true);
    document.addEventListener("transitionend", place, true);
    document.addEventListener("animationend", place, true);
    window.addEventListener("resize", place);
    const t = setInterval(place, 1000); // layout shifts from late data
    return () => {
      document.removeEventListener("focusin", place);
      document.removeEventListener("focusout", place);
      document.removeEventListener("scroll", place, true);
      document.removeEventListener("transitionend", place, true);
      document.removeEventListener("animationend", place, true);
      window.removeEventListener("resize", place);
      clearInterval(t);
    };
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      class="pointer-events-none fixed left-0 top-0 z-[150] opacity-0"
      style={{
        boxShadow: "0 0 0 3px var(--emerald), 0 0 28px 2px rgba(69,212,154,.45)",
        transition: "transform 180ms var(--ease), width 180ms var(--ease), height 180ms var(--ease), opacity 150ms ease",
        willChange: "transform",
      }}
    />
  );
}
