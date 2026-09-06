import type { AdvicePackSection, ParentLanguageMode } from "@/types";

/**
 * Renders a pack's sections exactly as they'll appear on the discharge
 * document — shared by discharge-document.tsx (the live preview/print
 * surface) and the pack builder's preview pane, so an author sees the real
 * rendering while writing, not an approximation of it.
 *
 * Danger-signs sections use the restrained warning styling DESIGN.md calls
 * for: a clear heading, short bullets, enough whitespace — never a giant red
 * block. `isDangerSigns` is the explicit field; a heading-text match is kept
 * as a fallback only for content snapshotted before that field existed.
 *
 * Bullets and headings are bilingual — which language(s) show follows
 * `mode` (mirrors the discharge's parentLanguage: Urdu only / English only /
 * Urdu + English), matching how medication instructions already behave. A
 * bullet/heading missing the wording `mode` asks for always falls back to
 * whichever language it actually has rather than rendering blank.
 *
 * When both languages show, they sit side by side — English on the left
 * (its natural LTR reading side), Urdu on the right (its natural RTL reading
 * side) — rather than stacked, so a parent reading either language reads
 * straight across instead of hunting between two stacked lines.
 */
export function AdviceSectionsPreview({
  sections,
  mode = "urdu_english",
}: {
  sections: AdvicePackSection[];
  mode?: ParentLanguageMode;
}) {
  const showUrdu = mode !== "english_only";
  const showEnglish = mode !== "urdu_only";
  const bothShown = showUrdu && showEnglish;
  return (
    <div className="space-y-3">
      {sections.map((sec) => {
        const isDanger = sec.isDangerSigns ?? /danger/i.test(sec.heading);
        const headingHasUr = showUrdu && !!sec.headingUr;
        const headingHasEn = showEnglish || !sec.headingUr || !showUrdu;
        return (
          <div key={sec.id} className={isDanger ? "rounded-[4px] border border-[#fecaca] bg-[#fef2f2] p-2" : ""}>
            <div className={"mb-1 " + (isDanger ? "text-[#b91c1c]" : "")}>
              <BilingualLine
                en={headingHasEn ? sec.heading : undefined}
                ur={headingHasUr ? sec.headingUr : undefined}
                bothShown={bothShown}
                className="font-semibold"
              />
            </div>
            <ul className="list-disc space-y-2 pl-4">
              {sec.bullets.map((b) => {
                const hasUr = showUrdu && !!b.ur;
                const hasEn = showEnglish || !b.ur || !showUrdu;
                return (
                  <li key={b.id}>
                    <BilingualLine en={hasEn ? b.en : undefined} ur={hasUr ? b.ur : undefined} bothShown={bothShown} />
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/**
 * One bilingual line: side by side (English left, Urdu right) when both
 * are present, a single full-width line otherwise — never two empty
 * columns either side of a missing language. Exported so every bilingual
 * render site on the discharge document (medications, follow-up, advice)
 * uses this exact layout, not a re-implementation of it.
 */
export function BilingualLine({
  en,
  ur,
  bothShown,
  className = "",
}: {
  en?: string;
  ur?: string;
  bothShown: boolean;
  className?: string;
}) {
  if (bothShown && en && ur) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <p className={className}>{en}</p>
        <p className={"font-urdu text-right " + className} dir="rtl">
          {ur}
        </p>
      </div>
    );
  }
  if (ur) return <p className={"font-urdu " + className} dir="rtl">{ur}</p>;
  if (en) return <p className={className}>{en}</p>;
  return null;
}
