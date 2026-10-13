"use client";

import { AlertTriangle, Bookmark, CloudOff, Newspaper, RefreshCw, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, ChipRow, EmptyState, Input, Panel, Skeleton, SourceNote, cn } from "@/components/ui/primitives";
import { timeAgo } from "@/lib/dates";
import { useFetch } from "@/lib/hooks";
import { useHydrated, usePersisted } from "@/lib/storage/persisted-store";
import { newsStore } from "@/lib/storage/stores";
import type { NewsArticle, NewsResponse } from "@/types/domain";
import { ArticleImage, ArticleMeta, ArticleReader, SaveButton } from "./news-ui";
import { NEWS_CATEGORIES, isNewsCategory, type NewsCategoryId } from "./sources";

type View = NewsCategoryId | "saved";

export function NewsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const { saved } = usePersisted(newsStore);
  const catParam = params.get("cat");
  const view: View = params.get("saved") ? "saved" : isNewsCategory(catParam) ? catParam : "top";
  const [q, setQ] = useState("");
  const [reader, setReader] = useState<NewsArticle | null>(null);

  const { data, error, loading, reload } = useFetch<NewsResponse>(view === "saved" ? null : `/api/news?category=${view}`);

  const setView = (v: View) => {
    setQ("");
    router.replace(v === "saved" ? `${pathname}?saved=1` : v === "top" ? pathname : `${pathname}?cat=${v}`, { scroll: false });
  };

  // Deep link to a saved article (from universal search / recent activity).
  const articleParam = params.get("article");
  useEffect(() => {
    if (!articleParam || !hydrated) return;
    const a = saved.find((s) => s.id === articleParam) ?? data?.items.find((s) => s.id === articleParam);
    if (a) setReader(a);
  }, [articleParam, hydrated, saved, data]);

  const items: NewsArticle[] = useMemo(() => {
    const list = view === "saved" ? saved : (data?.items ?? []);
    const needle = q.trim().toLowerCase();
    return needle ? list.filter((a) => a.title.toLowerCase().includes(needle) || a.excerpt.toLowerCase().includes(needle) || a.source.toLowerCase().includes(needle)) : list;
  }, [view, saved, data, q]);

  const featured = !q && view !== "saved" ? items.find((a) => a.imageUrl) : undefined;
  const rest = items.filter((a) => a !== featured);
  const failed = data?.sources.filter((s) => !s.ok) ?? [];
  const allFailed = !!data && failed.length === data.sources.length;
  const isUrdu = view === "urdu";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight md:text-3xl">
            <Newspaper className="size-7 text-emerald" aria-hidden />
            Ajj ka Haal <span className="font-urdu text-xl text-ink-2" lang="ur">آج کا حال</span>
          </h1>
          <p className="mt-1 text-sm text-ink-2">Pakistan first, with world headlines — straight from publisher feeds.</p>
        </div>
        <div className="flex items-center gap-2">
          {data && view !== "saved" && (
            <span className="hidden text-xs text-ink-3 sm:inline" suppressHydrationWarning>
              Updated {timeAgo(data.fetchedAt)}
            </span>
          )}
          <Button size="sm" variant="secondary" onClick={reload} disabled={view === "saved"} loading={loading && !!data}>
            {!(loading && data) && <RefreshCw className="size-4" />} Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <ChipRow
          className="min-w-0 flex-1"
          label="News category"
          value={view}
          onChange={setView}
          options={[
            ...NEWS_CATEGORIES.map((c) => ({ value: c.id as View, label: c.id === "urdu" ? <span className="font-naskh">{c.label}</span> : c.label })),
            { value: "saved" as View, label: <><Bookmark className="size-3.5" /> Saved</>, count: hydrated ? saved.length : undefined },
          ]}
        />
        <div className="relative lg:w-64">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search headlines" aria-label="Search headlines" className="h-9 ps-9" />
        </div>
      </div>

      {view !== "saved" && failed.length > 0 && !allFailed && (
        <p role="status" className="flex items-center gap-2 rounded-xl border border-gold/25 bg-gold/8 px-3 py-2 text-xs text-gold">
          <CloudOff className="size-4 shrink-0" />
          {failed.map((f) => f.publisher).join(", ")} {failed.length === 1 ? "is" : "are"} unavailable right now; showing other sources.
        </p>
      )}

      {view === "saved" ? null : error || allFailed ? (
        <Panel>
          <EmptyState
            tone="error"
            icon={<AlertTriangle className="size-5" />}
            title="News feeds are unavailable"
            description={error ?? "None of the publisher feeds for this section responded. This is a connection problem, not an empty news day."}
            action={
              <Button size="sm" onClick={reload}>
                <RefreshCw className="size-4" /> Try again
              </Button>
            }
          />
        </Panel>
      ) : !data ? (
        <NewsSkeleton />
      ) : null}

      {(view === "saved" || (data && !allFailed && !error)) &&
        (items.length === 0 ? (
          <Panel>
            {view === "saved" ? (
              <EmptyState icon={<Bookmark className="size-5" />} title={q ? "No saved articles match" : "Nothing saved yet"} description="Tap the bookmark on any story to read it later." />
            ) : (
              <EmptyState
                icon={<Search className="size-5" />}
                title={q ? `No headlines match “${q}”` : "No recent stories in this section"}
                description={q ? "Try another word or category." : "The sources responded but had no stories from the last 10 days for this section."}
              />
            )}
          </Panel>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div className="space-y-5">
              {featured && (
                <Panel as="article" className="group overflow-hidden" dir={isUrdu ? "rtl" : undefined}>
                  <button type="button" onClick={() => setReader(featured)} className="block w-full text-start">
                    <div className="relative">
                      <ArticleImage src={featured.imageUrl} alt="" className="aspect-[16/8] w-full transition-transform duration-700 group-hover:scale-[1.02]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-[#0b1220]/40 to-transparent" />
                      <Badge tone="emerald" className="absolute start-4 top-4 bg-[#0b1220]/70">
                        Featured
                      </Badge>
                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <h2 className={cn("text-xl font-semibold leading-snug text-white sm:text-2xl", isUrdu && "font-urdu leading-[2.1]")}>{featured.title}</h2>
                      </div>
                    </div>
                  </button>
                  <div className="flex items-start justify-between gap-3 px-5 pb-5 pt-1">
                    <div>
                      <p className={cn("line-clamp-2 text-sm text-ink-2", isUrdu && "font-urdu")}>{featured.excerpt}</p>
                      <ArticleMeta article={featured} className="mt-2" />
                    </div>
                    <SaveButton article={featured} />
                  </div>
                </Panel>
              )}
              <ul className="grid gap-3 sm:grid-cols-2">
                {rest.slice(0, featured ? 8 : 12).map((a) => (
                  <ArticleCard key={a.id} article={a} onOpen={() => setReader(a)} />
                ))}
              </ul>
            </div>
            <Panel className="h-fit p-4 sm:p-5" aria-labelledby="latest-title">
              <h2 id="latest-title" className="mb-2 text-sm font-semibold">
                {view === "saved" ? "Saved for later" : "Latest headlines"}
              </h2>
              <ul className="divide-y divide-white/6">
                {(view === "saved" ? items : rest.slice(featured ? 8 : 12)).slice(0, 40).map((a) => (
                  <li key={a.id} className="flex items-start gap-3 py-3" dir={a.lang === "ur" ? "rtl" : undefined}>
                    <button type="button" onClick={() => setReader(a)} className="min-w-0 flex-1 text-start">
                      <p className={cn("text-sm leading-snug text-ink hover:text-emerald", a.lang === "ur" && "font-urdu leading-[2]")}>{a.title}</p>
                      <ArticleMeta article={a} className="mt-1" />
                    </button>
                    <SaveButton article={a} />
                  </li>
                ))}
                {view !== "saved" && rest.length <= (featured ? 8 : 12) && <li className="py-3 text-xs text-ink-3">That&apos;s everything from the last 10 days in this section.</li>}
              </ul>
            </Panel>
          </div>
        ))}

      {data && view !== "saved" && (
        <SourceNote>
          Sources for this section:{" "}
          {data.sources.map((s, i) => (
            <span key={s.id}>
              {i > 0 && ", "}
              <a href={s.homepage} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                {s.publisher}
              </a>
              {!s.ok && " (unavailable)"}
            </span>
          ))}
          . Headlines and short excerpts come from each publisher&apos;s public RSS feed; full articles stay on the publisher&apos;s site.
          Stories older than 10 days are hidden.
        </SourceNote>
      )}
      <ArticleReader article={reader} onClose={() => setReader(null)} />
    </div>
  );
}

function ArticleCard({ article, onOpen }: { article: NewsArticle; onOpen: () => void }) {
  const rtl = article.lang === "ur";
  return (
    <li>
      <article className="glass group flex h-full flex-col overflow-hidden !rounded-2xl transition-[border] hover:border-white/20" dir={rtl ? "rtl" : undefined}>
        <button type="button" onClick={onOpen} className="flex flex-1 flex-col text-start">
          {article.imageUrl && <ArticleImage src={article.imageUrl} alt="" className="aspect-video w-full" />}
          <div className="flex flex-1 flex-col p-4">
            <h3 className={cn("text-[0.95rem] font-medium leading-snug text-ink group-hover:text-emerald", rtl && "font-urdu leading-[2]")}>{article.title}</h3>
            {!article.imageUrl && <p className={cn("mt-2 line-clamp-3 text-xs leading-relaxed text-ink-2", rtl && "font-urdu")}>{article.excerpt}</p>}
          </div>
        </button>
        <div className="flex items-center justify-between gap-2 px-4 pb-3">
          <ArticleMeta article={article} />
          <SaveButton article={article} />
        </div>
      </article>
    </li>
  );
}

function NewsSkeleton() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]" aria-busy="true" aria-label="Loading news">
      <div className="space-y-4">
        <Skeleton className="aspect-[16/8] w-full !rounded-[22px]" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 !rounded-2xl" />
          ))}
        </div>
      </div>
      <Skeleton className="h-96 !rounded-[22px]" />
    </div>
  );
}
