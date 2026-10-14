"use client";

import { Bookmark, BookmarkCheck, ExternalLink, ImageOff, Share2 } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button, IconButton, cn } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/dates";
import { usePersisted } from "@/lib/storage/persisted-store";
import { logActivity, newsStore } from "@/lib/storage/stores";
import type { NewsArticle } from "@/types/domain";

export function isSaved(saved: { id: string }[], id: string) {
  return saved.some((s) => s.id === id);
}

export function toggleSaved(article: NewsArticle): boolean {
  const on = !isSaved(newsStore.get().saved, article.id);
  newsStore.set((s) => ({
    saved: on ? [{ ...article, savedAt: new Date().toISOString() }, ...s.saved].slice(0, 200) : s.saved.filter((x) => x.id !== article.id),
  }));
  if (on) logActivity("news-saved", `Saved “${article.title.slice(0, 70)}”`, `/news?saved=1&article=${article.id}`);
  return on;
}

export async function shareArticle(article: NewsArticle, toast: ReturnType<typeof useToast>["toast"]) {
  try {
    if (navigator.share) {
      await navigator.share({ title: article.title, url: article.url });
      return;
    }
    await navigator.clipboard.writeText(`${article.title}\n${article.url}`);
    toast("Link copied to clipboard");
  } catch (e) {
    if ((e as Error).name !== "AbortError") toast("Couldn't share this article", { tone: "error" });
  }
}

export function ArticleImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={cn("grid place-items-center bg-[linear-gradient(135deg,#17243a,#0f1828)] text-ink-3", className)} aria-hidden>
        <ImageOff className="size-6 opacity-60" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={cn("object-cover", className)} />
  );
}

export function ArticleMeta({ article, className }: { article: NewsArticle; className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 text-[11px] text-ink-3", className)} dir="ltr">
      <span className="font-semibold text-ink-2">{article.source}</span>
      <span aria-hidden>·</span>
      {article.publishedAt ? (
        <time dateTime={article.publishedAt} title={new Date(article.publishedAt).toLocaleString("en-PK")} suppressHydrationWarning>
          {timeAgo(article.publishedAt)}
        </time>
      ) : (
        <span>Time not provided by source</span>
      )}
    </p>
  );
}

export function SaveButton({ article, size = "sm" }: { article: NewsArticle; size?: "sm" | "md" }) {
  const { saved } = usePersisted(newsStore);
  const { toast } = useToast();
  const on = isSaved(saved, article.id);
  return (
    <IconButton
      size={size}
      label={on ? "Remove from saved" : "Save for later"}
      aria-pressed={on}
      className={cn(on && "!text-gold")}
      onClick={(e) => {
        e.stopPropagation();
        const now = toggleSaved(article);
        toast(now ? "Saved for later" : "Removed from saved", { tone: now ? "success" : "info" });
      }}
    >
      {on ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
    </IconButton>
  );
}

export function ArticleReader({ article, onClose }: { article: NewsArticle | null; onClose: () => void }) {
  const { toast } = useToast();
  const { saved } = usePersisted(newsStore);
  const rtl = article?.lang === "ur";
  return (
    <Dialog open={!!article} onClose={onClose} title={article?.source ?? "Article"} size="lg">
      {article && (
        <article dir={rtl ? "rtl" : "ltr"} lang={article.lang}>
          {article.imageUrl && <ArticleImage src={article.imageUrl} alt="" className="mb-5 aspect-video w-full rounded-2xl" />}
          <h1 className={cn("text-xl font-semibold leading-snug text-ink sm:text-2xl", rtl && "font-urdu text-2xl leading-[2.2]")}>{article.title}</h1>
          <ArticleMeta article={article} className="mt-2" />
          <p className={cn("mt-4 text-[0.95rem] leading-relaxed text-ink-2", rtl && "font-urdu text-lg leading-[2.3]")}>{article.excerpt}</p>
          <p className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-ink-3" dir="ltr">
            This is a short excerpt from the publisher&apos;s RSS feed. Read the full story on {article.source}&apos;s website.
          </p>
          <div className="mt-5 flex flex-wrap gap-2" dir="ltr">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald px-4 text-sm font-medium text-[#06231a] hover:bg-[#5fe0ab]"
            >
              Read on {article.source} <ExternalLink className="size-4" />
            </a>
            <Button
              variant="secondary"
              onClick={() => {
                const on = toggleSaved(article);
                toast(on ? "Saved for later" : "Removed from saved", { tone: on ? "success" : "info" });
              }}
            >
              {isSaved(saved, article.id) ? <BookmarkCheck className="size-4 text-gold" /> : <Bookmark className="size-4" />}
              {isSaved(saved, article.id) ? "Saved" : "Save"}
            </Button>
            <Button variant="secondary" onClick={() => shareArticle(article, toast)}>
              <Share2 className="size-4" /> Share
            </Button>
          </div>
        </article>
      )}
    </Dialog>
  );
}
