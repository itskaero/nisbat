import { Bookmark, BookmarkCheck } from "lucide-react";
import { useState } from "preact/hooks";
import { NEWS_CATEGORIES } from "@/features/news/sources";
import { timeAgo } from "@/lib/dates";
import { usePersisted } from "@/lib/storage/persisted-store";
import { newsStore } from "@/lib/storage/stores";
import type { NewsResponse } from "@/types/domain";
import { Chips, Problem, ScreenHeader, Skeleton, Source, cx } from "../components/ui";
import { useCached } from "../lib/cached";
import { toast } from "../lib/ui-state";

/** Headlines with the excerpt alongside; full articles stay on the publisher's site. */
export function NewsScreen() {
  const [cat, setCat] = useState<string>("top");
  const { data, error, reload } = useCached<NewsResponse>(`/api/news?category=${cat}`, 10 * 60_000, 15 * 60_000);
  const saved = usePersisted(newsStore);
  const [focus, setFocus] = useState(0);
  const items = data?.items.slice(0, 30) ?? [];
  const sel = items[focus] ?? items[0];
  const isSaved = (id: string) => saved.saved.some((a) => a.id === id);

  return (
    <>
      <ScreenHeader title="Ajj ka Haal" ur="آج کا حال" sub={data ? `Updated ${timeAgo(data.fetchedAt)}` : undefined} />
      <Chips label="Section" value={cat} onChange={(v) => (setCat(v), setFocus(0))} options={NEWS_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))} />
      {error ? (
        <div class="mt-6">
          <Problem title="Headlines are unavailable" text={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <Skeleton class="mt-6 h-96" />
      ) : (
        <div class="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-6">
          <ol class="space-y-2">
            {items.map((a, i) => (
              <li key={a.id}>
                <button
                  type="button"
                  data-autofocus={i === 0 ? "" : undefined}
                  dir={a.lang === "ur" ? "rtl" : undefined}
                  class={cx("block w-full rounded-2xl px-5 py-4 text-start", i === focus ? "bg-white/[0.08]" : "bg-white/[0.03]")}
                  onFocus={() => setFocus(i)}
                  onClick={() => {
                    const on = !isSaved(a.id);
                    newsStore.set((s) => ({ ...s, saved: on ? [{ ...a, savedAt: new Date().toISOString() }, ...s.saved] : s.saved.filter((x) => x.id !== a.id) }));
                    toast(on ? "Saved for later — read it on your phone" : "Removed from saved", "info");
                  }}
                >
                  <p class={cx("text-xl leading-snug", a.lang === "ur" && "font-urdu")}>{a.title}</p>
                  <p class="mt-1 text-base text-ink-3">
                    {a.source} · {a.publishedAt ? timeAgo(a.publishedAt) : "time not given"}
                    {isSaved(a.id) && " · saved"}
                  </p>
                </button>
              </li>
            ))}
          </ol>
          {sel && (
            <aside class="card sticky top-0 h-fit overflow-hidden" dir={sel.lang === "ur" ? "rtl" : undefined}>
              {sel.imageUrl && <img src={sel.imageUrl} alt="" class="aspect-video w-full object-cover" loading="lazy" />}
              <div class="p-6">
                <p class={cx("text-2xl font-semibold leading-snug", sel.lang === "ur" && "font-urdu")}>{sel.title}</p>
                {sel.excerpt && <p class={cx("mt-3 text-xl leading-relaxed text-ink-2", sel.lang === "ur" && "font-urdu")}>{sel.excerpt}</p>}
                <p class="mt-4 flex items-center gap-2 text-base text-ink-3">
                  {isSaved(sel.id) ? <BookmarkCheck size={18} class="text-gold" /> : <Bookmark size={18} />}
                  OK saves it for later · full story on {sel.source}
                </p>
              </div>
            </aside>
          )}
        </div>
      )}
      <Source>Headlines and short excerpts from publishers&apos; RSS feeds, with attribution. Full articles stay on the publisher&apos;s site.</Source>
    </>
  );
}
