import { Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import { useState } from "react";
import { NEWS_CATEGORIES } from "@/features/news/sources";
import { timeAgo } from "@/lib/dates";
import { usePersisted } from "@/lib/storage/persisted-store";
import { newsStore } from "@/lib/storage/stores";
import type { NewsArticle, NewsResponse } from "@/types/domain";
import { Chips, Page, Problem, Sheet, Skeleton, Source, cx } from "../components/ui";
import { useCached } from "../lib/cached";
import { share, tap } from "../lib/native";
import { toast } from "../lib/toast";

export function NewsScreen() {
  const [cat, setCat] = useState<string>("top");
  const saved = usePersisted(newsStore);
  const { data, error, reload } = useCached<NewsResponse>(cat === "saved" ? null : `/api/news?category=${cat}`, 10 * 60_000);
  const [open, setOpen] = useState<NewsArticle | null>(null);
  const items = cat === "saved" ? saved.saved : (data?.items ?? []);
  const isSaved = (id: string) => saved.saved.some((a) => a.id === id);
  const toggleSave = (a: NewsArticle) => {
    void tap();
    const on = !isSaved(a.id);
    newsStore.set((s) => ({ ...s, saved: on ? [{ ...a, savedAt: new Date().toISOString() }, ...s.saved] : s.saved.filter((x) => x.id !== a.id) }));
    toast(on ? "Saved for later" : "Removed from saved", "info");
  };

  return (
    <Page title="Ajj ka Haal" ur="آج کا حال" back>
      <Chips label="Section" value={cat} onChange={setCat} options={[...NEWS_CATEGORIES.map((c) => ({ value: c.id as string, label: c.label })), { value: "saved", label: `Saved · ${saved.saved.length}` }]} />
      <div className="mt-3 space-y-2">
        {error && cat !== "saved" ? (
          <Problem title="Headlines are unavailable" text={error} onRetry={reload} />
        ) : !data && cat !== "saved" ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)
        ) : items.length === 0 ? (
          <p className="glass p-4 text-ink-2">Nothing saved yet.</p>
        ) : (
          items.slice(0, 40).map((a) => (
            <button key={a.id} type="button" dir={a.lang === "ur" ? "rtl" : undefined} className="glass press flex w-full gap-3 p-3 text-start" onClick={() => setOpen(a)}>
              {a.imageUrl && <img src={a.imageUrl} alt="" loading="lazy" className="size-20 shrink-0 rounded-xl object-cover" />}
              <span className="min-w-0 flex-1">
                <span className={cx("line-clamp-3 font-medium leading-snug", a.lang === "ur" && "font-urdu text-[0.95rem]")}>{a.title}</span>
                <span className="mt-1 block text-xs text-ink-3">
                  {a.source} · {a.publishedAt ? timeAgo(a.publishedAt) : "time not given"}
                  {isSaved(a.id) && " · saved"}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
      {data && cat !== "saved" && <Source>Headlines and short excerpts from publishers&apos; RSS feeds. Full stories open on the publisher&apos;s site. Updated {timeAgo(data.fetchedAt)}.</Source>}
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.source ?? ""}>
        {open && (
          <div dir={open.lang === "ur" ? "rtl" : undefined} className="pb-4">
            {open.imageUrl && <img src={open.imageUrl} alt="" className="mb-3 aspect-video w-full rounded-2xl object-cover" />}
            <p className={cx("text-xl font-semibold leading-snug", open.lang === "ur" && "font-urdu")}>{open.title}</p>
            {open.excerpt && <p className={cx("mt-2 leading-relaxed text-ink-2", open.lang === "ur" && "font-urdu")}>{open.excerpt}</p>}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <a href={open.url} target="_blank" rel="noreferrer" className="press flex items-center justify-center gap-1.5 rounded-2xl bg-emerald py-3 text-sm font-semibold text-[#06231a]">
                <ExternalLink size={16} /> Read
              </a>
              <button type="button" className="press flex items-center justify-center gap-1.5 rounded-2xl border border-line bg-white/[0.06] py-3 text-sm" onClick={() => toggleSave(open)}>
                {isSaved(open.id) ? <BookmarkCheck size={16} className="text-gold" /> : <Bookmark size={16} />} {isSaved(open.id) ? "Saved" : "Save"}
              </button>
              <button type="button" className="press rounded-2xl border border-line bg-white/[0.06] py-3 text-sm" onClick={() => share(open.title, `${open.title}\n${open.url}`)}>
                Share
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </Page>
  );
}
