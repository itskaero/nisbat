"use client";

import {
  AlertTriangle,
  BookMarked,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Check,
  CheckCheck,
  NotebookPen,
  Play,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import {
  Badge,
  Button,
  EmptyState,
  IconButton,
  Input,
  Panel,
  ProgressBar,
  Segmented,
  Select,
  Skeleton,
  SourceNote,
  cn,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/dates";
import { useFetch, useMediaQuery } from "@/lib/hooks";
import { notifyMediaChange, registerMedia } from "@/lib/tv/media-registry";
import { useHydrated, usePersisted } from "@/lib/storage/persisted-store";
import { logActivity, quranStore, settingsStore } from "@/lib/storage/stores";
import { AudioDock } from "./audio-dock";
import { TRANSLATIONS, translationMeta, type SurahPayload } from "./editions";
import {
  JUZ_STARTS,
  SURAHS,
  isBookmarked,
  juzOf,
  markRead,
  readStats,
  refKey,
  setLastRead,
  surahMeta,
  surahReadCount,
  toggleBookmark,
  unmarkRead,
} from "./quran-state";
import { ReflectionCard, ReflectionPanel } from "./reflection-panel";
import { useVersePlayer } from "./use-verse-player";

type Tab = "read" | "bookmarks" | "reflections";

export function QuranPage() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const settings = usePersisted(settingsStore);
  const quran = usePersisted(quranStore);
  const { toast } = useToast();
  const wide = useMediaQuery("(min-width: 1280px)");

  const sParam = Number(params.get("s"));
  const aParam = Number(params.get("a"));
  const surahNumber = sParam >= 1 && sParam <= 114 ? sParam : 1;
  const meta = surahMeta(surahNumber);
  const targetAyah = aParam >= 1 && aParam <= meta.numberOfAyahs ? aParam : undefined;

  // With no surah in the URL, continue from the last-read position.
  const redirected = useRef(false);
  useEffect(() => {
    if (!hydrated || redirected.current) return;
    redirected.current = true;
    if (!params.get("s") && quran.lastRead) {
      router.replace(`${pathname}?s=${quran.lastRead.surah}&a=${quran.lastRead.ayah}`, { scroll: false });
    }
  }, [hydrated, params, quran.lastRead, router, pathname]);

  const [tab, setTab] = useState<Tab>("read");
  const [mode, setMode] = useState<"verses" | "mushaf">("verses");
  const translation = translationMeta(settings.quranTranslation);
  const translationDir = translation.lang === "ur" ? "rtl" : "ltr";
  const { data, error, loading, reload } = useFetch<SurahPayload>(
    `/api/quran/surah/${surahNumber}?translation=${settings.quranTranslation}&reciter=${settings.quranReciter}`,
  );
  const ayahs = data?.number === surahNumber ? data.ayahs : undefined;

  const player = useVersePlayer(
    ayahs,
    useCallback((i: number) => markRead(surahNumber, [i + 1]), [surahNumber]),
  );

  // Let TV/phone remotes and media keys control recitation.
  const playerRef = useRef(player);
  playerRef.current = player;
  useEffect(
    () =>
      registerMedia({
        id: "quran",
        label: `Recitation · ${meta.englishName}`,
        isPlaying: () => playerRef.current.status === "playing" || playerRef.current.status === "loading",
        toggle: () => playerRef.current.toggle(),
        next: () => playerRef.current.next(),
        prev: () => playerRef.current.prev(),
      }),
    [meta.englishName],
  );
  useEffect(() => notifyMediaChange(), [player.status]);

  const [reflectIdx, setReflectIdx] = useState<number | null>(null);
  const [reflectOpen, setReflectOpen] = useState(false);
  const [highlight, setHighlight] = useState<number | undefined>();

  const navigate = useCallback(
    (s: number, a?: number) => {
      router.push(`${pathname}?s=${s}${a ? `&a=${a}` : ""}`, { scroll: false });
      setTab("read");
    },
    [router, pathname],
  );

  // Log once per surah opened.
  useEffect(() => {
    if (ayahs) logActivity("quran-read", `Read Surah ${meta.englishName}`, `/quran?s=${surahNumber}`);
  }, [ayahs, meta.englishName, surahNumber]);

  // Scroll to a requested verse once the surah is loaded.
  useEffect(() => {
    if (!ayahs || tab !== "read") return;
    const target = targetAyah ?? 1;
    const el = document.getElementById(`ayah-${target}`);
    if (targetAyah && el) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduced";
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      setHighlight(targetAyah);
      const t = setTimeout(() => setHighlight(undefined), 2400);
      return () => clearTimeout(t);
    }
  }, [ayahs, targetAyah, tab]);

  // Default reflection target: requested verse, else first verse.
  useEffect(() => {
    if (ayahs) setReflectIdx((targetAyah ?? 1) - 1);
  }, [ayahs, targetAyah]);

  // Track the reading position: the top-most verse in view becomes "last read".
  useEffect(() => {
    if (!ayahs || tab !== "read") return;
    let timer: ReturnType<typeof setTimeout>;
    const visible = new Set<number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const n = Number((e.target as HTMLElement).dataset.ayah);
          if (e.isIntersecting) visible.add(n);
          else visible.delete(n);
        }
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (visible.size) setLastRead(surahNumber, Math.min(...visible));
        }, 1200);
      },
      { rootMargin: "-25% 0px -55% 0px" },
    );
    document.querySelectorAll<HTMLElement>("[data-ayah]").forEach((el) => io.observe(el));
    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, [ayahs, surahNumber, tab]);

  // Keep the playing verse in view.
  useEffect(() => {
    if (player.index == null) return;
    const el = document.getElementById(`ayah-${player.index + 1}`);
    const rect = el?.getBoundingClientRect();
    if (el && rect && (rect.top < 80 || rect.bottom > window.innerHeight - 160)) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [player.index]);

  const stats = readStats(quran, settings.timezone);
  const readInSurah = surahReadCount(quran, surahNumber);

  const openReflection = (i: number) => {
    setReflectIdx(i);
    if (!wide) setReflectOpen(true);
  };

  const reflectAyah = ayahs && reflectIdx != null ? ayahs[reflectIdx] : undefined;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight md:text-3xl">
            <BookOpen className="size-7 text-emerald" aria-hidden /> Tadabur Quran
          </h1>
          <p className="mt-1 text-sm text-ink-2">Read, listen and reflect — one verse at a time.</p>
        </div>
        <div className="glass flex items-center gap-5 !rounded-2xl px-4 py-3 text-xs">
          <div>
            <p className="text-ink-3">Today</p>
            <p className="text-sm font-semibold text-ink">
              {hydrated ? stats.today : 0}/{quran.dailyGoal} verses
            </p>
          </div>
          <div>
            <p className="text-ink-3">Reflections today</p>
            <p className="text-sm font-semibold text-ink">{hydrated ? stats.reflectionsToday : 0}</p>
          </div>
          <div className="w-28">
            <p className="text-ink-3">Overall {hydrated ? stats.percent.toFixed(1) : "0.0"}%</p>
            <ProgressBar className="mt-1.5" value={hydrated ? stats.total : 0} max={6236} label="Overall Quran reading progress" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)_330px]">
        <SurahNavigator current={surahNumber} onSelect={(n) => navigate(n)} />

        <div className="min-w-0">
          <Panel className="glass-reading overflow-hidden">
            <div className="relative border-b border-white/8 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(233,182,107,0.14),transparent_60%)] px-5 pb-5 pt-6 text-center">
              <p lang="ar" dir="rtl" className="font-quran text-4xl text-ink md:text-5xl">
                {meta.name}
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                {meta.number}. {meta.englishName} <span className="font-normal text-ink-2">· {meta.englishNameTranslation}</span>
              </h2>
              <p className="mt-1 text-xs text-ink-3">
                {meta.numberOfAyahs} verses · {meta.revelationType === "Meccan" ? "Makki" : "Madani"} · Juz {juzOf(surahNumber, 1)}
                {hydrated && readInSurah > 0 && ` · ${readInSurah}/${meta.numberOfAyahs} read`}
              </p>
              <div className="mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-center gap-2">
                <div className="lg:hidden">
                  <Select aria-label="Choose surah" value={surahNumber} onChange={(e) => navigate(Number(e.target.value))} className="h-9 w-48 text-xs">
                    {SURAHS.map((s) => (
                      <option key={s.number} value={s.number}>
                        {s.number}. {s.englishName}
                      </option>
                    ))}
                  </Select>
                </div>
                <Select
                  aria-label="Jump to juz"
                  value=""
                  onChange={(e) => {
                    const j = JUZ_STARTS[Number(e.target.value) - 1];
                    if (j) navigate(j.surah, j.ayah);
                  }}
                  className="h-9 w-32 text-xs"
                >
                  <option value="" disabled>
                    Go to Juz…
                  </option>
                  {JUZ_STARTS.map((j, i) => (
                    <option key={i} value={i + 1}>
                      Juz {i + 1} ({j.surah}:{j.ayah})
                    </option>
                  ))}
                </Select>
                <Select
                  aria-label="Translation"
                  value={settings.quranTranslation}
                  onChange={(e) => settingsStore.set((s) => ({ ...s, quranTranslation: e.target.value }))}
                  className="h-9 w-56 text-xs"
                >
                  {TRANSLATIONS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-6">
              <Segmented
                label="Quran view"
                value={tab}
                onChange={setTab}
                options={[
                  { value: "read", label: "Read" },
                  { value: "bookmarks", label: "Bookmarks", count: hydrated ? quran.bookmarks.length : undefined },
                  { value: "reflections", label: "Reflections", count: hydrated ? quran.reflections.length : undefined },
                ]}
              />
              {tab === "read" && (
                <Segmented
                  label="Reading layout"
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: "verses", label: "Verse by verse" },
                    { value: "mushaf", label: "Mushaf page" },
                  ]}
                />
              )}
              {tab === "read" && ayahs && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    markRead(surahNumber, ayahs.map((a) => a.numberInSurah));
                    toast(`Marked all of ${meta.englishName} as read`);
                  }}
                >
                  <CheckCheck className="size-4" /> Mark surah read
                </Button>
              )}
            </div>

            <div className="px-3 pb-6 pt-3 sm:px-6">
              {tab === "read" &&
                (error ? (
                  <EmptyState
                    tone="error"
                    icon={<AlertTriangle className="size-5" />}
                    title="Couldn't load this surah"
                    description={`${error} Quran text is fetched from the AlQuran Cloud API; check your connection and try again.`}
                    action={
                      <Button size="sm" onClick={reload}>
                        <RefreshCw className="size-4" /> Try again
                      </Button>
                    }
                  />
                ) : !ayahs || loading ? (
                  <div className="space-y-6 py-4" aria-busy="true" aria-label="Loading surah">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="ms-auto h-8 w-4/5" />
                        <Skeleton className="h-4 w-3/5" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {data?.bismillah && (
                      <p lang="ar" dir="rtl" className="font-quran py-4 text-center text-3xl text-gold">
                        {data.bismillah}
                      </p>
                    )}
                    {mode === "mushaf" ? (
                      <MushafPage
                        ayahs={ayahs}
                        playingIndex={player.index}
                        selectedIndex={reflectIdx}
                        onSelect={(i) => {
                          setReflectIdx(i);
                          setLastRead(surahNumber, i + 1);
                        }}
                        onPlay={(i) => player.playAt(i)}
                        onReflect={openReflection}
                      />
                    ) : (
                    <ol className="mx-auto max-w-3xl divide-y divide-white/6">
                      {ayahs.map((a, i) => {
                        const bookmarked = isBookmarked(quran, surahNumber, a.numberInSurah);
                        const isRead = !!quran.read[refKey(surahNumber, a.numberInSurah)];
                        const isPlaying = player.index === i;
                        return (
                          <li
                            key={a.number}
                            id={`ayah-${a.numberInSurah}`}
                            data-ayah={a.numberInSurah}
                            className={cn(
                              "scroll-mt-24 rounded-2xl px-2 py-5 transition-colors duration-500 sm:px-4",
                              isPlaying && "bg-emerald/[0.07] ring-1 ring-emerald/25",
                              highlight === a.numberInSurah && !isPlaying && "bg-gold/[0.08]",
                              reflectIdx === i && wide && !isPlaying && "bg-white/[0.025]",
                            )}
                            aria-current={isPlaying ? "true" : undefined}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={cn(
                                  "mt-2 grid size-9 shrink-0 place-items-center rounded-full border text-xs font-semibold tabular-nums",
                                  isRead ? "border-emerald/40 bg-emerald/10 text-emerald" : "border-white/15 text-ink-2",
                                )}
                                aria-label={`Verse ${a.numberInSurah}${isRead ? ", read" : ""}`}
                              >
                                {a.numberInSurah}
                              </span>
                              <p lang="ar" dir="rtl" className="font-quran min-w-0 flex-1 text-[1.65rem] text-ink sm:text-[2rem]">
                                {a.arabic}
                                {a.sajda && (
                                  <Badge tone="gold" className="ms-2 align-middle font-sans">
                                    Sajdah
                                  </Badge>
                                )}
                              </p>
                            </div>
                            <p
                              dir={translationDir}
                              lang={translation.lang}
                              className={cn("mt-3 ps-12 text-ink-2", translationDir === "rtl" ? "font-urdu text-base" : "text-[0.95rem] leading-relaxed")}
                            >
                              {a.translation}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-1 ps-10">
                              <IconButton size="sm" label={`Play verse ${a.numberInSurah}`} onClick={() => player.playAt(i)} className={cn(isPlaying && "!text-emerald")}>
                                <Play className="size-4" />
                              </IconButton>
                              <IconButton
                                size="sm"
                                label={bookmarked ? `Remove bookmark ${surahNumber}:${a.numberInSurah}` : `Bookmark ${surahNumber}:${a.numberInSurah}`}
                                aria-pressed={bookmarked}
                                className={cn(bookmarked && "!text-gold")}
                                onClick={() => {
                                  const on = toggleBookmark(surahNumber, a.numberInSurah);
                                  toast(on ? `Bookmarked ${meta.englishName} ${surahNumber}:${a.numberInSurah}` : "Bookmark removed", { tone: on ? "success" : "info" });
                                }}
                              >
                                {bookmarked ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                              </IconButton>
                              <IconButton
                                size="sm"
                                label={isRead ? `Mark verse ${a.numberInSurah} unread` : `Mark verse ${a.numberInSurah} read`}
                                aria-pressed={isRead}
                                className={cn(isRead && "!text-emerald")}
                                onClick={() => (isRead ? unmarkRead(surahNumber, a.numberInSurah) : markRead(surahNumber, [a.numberInSurah]))}
                              >
                                <Check className="size-4" />
                              </IconButton>
                              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => openReflection(i)}>
                                <NotebookPen className="size-3.5" /> Reflect
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                    )}
                  </>
                ))}

              {tab === "bookmarks" && <BookmarksList onOpen={navigate} />}
              {tab === "reflections" && <AllReflections onOpen={navigate} />}
            </div>
          </Panel>

          <AudioDock
            player={player}
            surahName={meta.englishName}
            surahNumber={surahNumber}
            totalAyahs={meta.numberOfAyahs}
            reciterId={settings.quranReciter}
            onReciterChange={(id) => settingsStore.set((s) => ({ ...s, quranReciter: id }))}
            disabled={!ayahs}
          />

          <SourceNote className="mt-4 px-1">
            Arabic text: Tanzil Uthmani (tanzil.net), used verbatim. Translation: {data?.editions.translation ?? translation.name}. Text,
            translations and verse-by-verse audio{data?.editions.reciter ? ` (${data.editions.reciter})` : ""} are served by the{" "}
            <a className="underline underline-offset-2" href="https://alquran.cloud/api" target="_blank" rel="noreferrer">
              AlQuran Cloud API
            </a>{" "}
            and Islamic Network CDN. Nisbat does not alter Quranic text or add tafsir.
          </SourceNote>
        </div>

        {wide && (
          <Panel as="aside" className="sticky top-4 hidden max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 xl:block" aria-label="Reflection workspace">
            {reflectAyah ? (
              <ReflectionPanel
                surah={surahNumber}
                surahName={meta.englishName}
                ayah={reflectAyah}
                translationName={data?.editions.translation ?? translation.name}
                translationId={translation.id}
                translationDir={translationDir}
              />
            ) : (
              <EmptyState icon={<NotebookPen className="size-5" />} title="Choose a verse to reflect on" description="Tap “Reflect” under any verse." />
            )}
          </Panel>
        )}
      </div>

      {!wide && (
        <Dialog open={reflectOpen && !!reflectAyah} onClose={() => setReflectOpen(false)} title="Reflection" size="lg">
          {reflectAyah && (
            <ReflectionPanel
              surah={surahNumber}
              surahName={meta.englishName}
              ayah={reflectAyah}
              translationName={data?.editions.translation ?? translation.name}
              translationId={translation.id}
              translationDir={translationDir}
            />
          )}
        </Dialog>
      )}
    </div>
  );
}

function SurahNavigator({ current, onSelect }: { current: number; onSelect: (n: number) => void }) {
  const [q, setQ] = useState("");
  const quran = usePersisted(quranStore);
  const hydrated = useHydrated();
  const listRef = useRef<HTMLUListElement>(null);
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase().replace(/[-'\s]/g, "");
    if (!n) return SURAHS;
    return SURAHS.filter(
      (s) => String(s.number) === n || s.englishName.toLowerCase().replace(/[-'\s]/g, "").includes(n) || s.englishNameTranslation.toLowerCase().includes(q.trim().toLowerCase()) || s.name.includes(q.trim()),
    );
  }, [q]);

  // Scroll only the list itself (scrollIntoView would also scroll the page).
  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-surah="${current}"]`);
    if (list && el) list.scrollTop = el.offsetTop - list.offsetTop - list.clientHeight / 2 + el.clientHeight / 2;
  }, [current]);

  return (
    <Panel as="aside" className="sticky top-4 hidden max-h-[calc(100dvh-2rem)] flex-col p-3 lg:flex" aria-label="Surahs">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search surah" aria-label="Search surahs" className="h-9 ps-9 text-xs" type="search" />
      </div>
      {hydrated && quran.lastRead && (
        <Link
          href={`/quran?s=${quran.lastRead.surah}&a=${quran.lastRead.ayah}`}
          className="mt-3 flex items-center gap-2 rounded-xl border border-emerald/25 bg-emerald/10 px-3 py-2 text-xs text-emerald hover:bg-emerald/15"
        >
          <BookMarked className="size-4" />
          <span className="truncate">
            Continue {surahMeta(quran.lastRead.surah).englishName} {quran.lastRead.surah}:{quran.lastRead.ayah}
          </span>
        </Link>
      )}
      <ul ref={listRef} className="mt-3 min-h-0 flex-1 space-y-0.5 overflow-y-auto pe-1">
        {filtered.map((s) => {
          const read = hydrated ? surahReadCount(quran, s.number) : 0;
          const active = s.number === current;
          return (
            <li key={s.number}>
              <button
                type="button"
                data-surah={s.number}
                onClick={() => onSelect(s.number)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-start transition-colors",
                  active ? "bg-emerald/12 text-ink ring-1 ring-emerald/25" : "text-ink-2 hover:bg-white/6",
                )}
              >
                <span className="w-6 shrink-0 text-center text-[11px] tabular-nums text-ink-3">{s.number}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{s.englishName}</span>
                  <span className="block truncate text-[10px] text-ink-3">
                    {s.numberOfAyahs} verses{read ? ` · ${read} read` : ""}
                  </span>
                </span>
                <span lang="ar" dir="rtl" className="font-quran shrink-0 text-base leading-none text-ink-2">
                  {s.name.replace(/^سُورَةُ\s*/, "")}
                </span>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && <li className="px-3 py-6 text-center text-xs text-ink-3">No surah matches “{q}”.</li>}
      </ul>
    </Panel>
  );
}

function BookmarksList({ onOpen }: { onOpen: (s: number, a: number) => void }) {
  const { bookmarks } = usePersisted(quranStore);
  if (!bookmarks.length)
    return <EmptyState icon={<Bookmark className="size-5" />} title="No bookmarks yet" description="Tap the bookmark icon under any verse to save it here." />;
  return (
    <ul className="mx-auto max-w-3xl space-y-2 py-2">
      {bookmarks.map((b) => {
        const m = surahMeta(b.surah);
        return (
          <li key={refKey(b.surah, b.ayah)} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3">
            <BookmarkCheck className="size-5 shrink-0 text-gold" aria-hidden />
            <button type="button" onClick={() => onOpen(b.surah, b.ayah)} className="min-w-0 flex-1 text-start">
              <span className="block text-sm text-ink">
                {m.englishName} {b.surah}:{b.ayah}
              </span>
              <span className="text-xs text-ink-3">Saved {timeAgo(b.createdAt)}</span>
            </button>
            <IconButton label="Remove bookmark" size="sm" onClick={() => toggleBookmark(b.surah, b.ayah)}>
              <Bookmark className="size-4" />
            </IconButton>
          </li>
        );
      })}
    </ul>
  );
}

function AllReflections({ onOpen }: { onOpen: (s: number, a: number) => void }) {
  const { reflections } = usePersisted(quranStore);
  if (!reflections.length)
    return <EmptyState icon={<NotebookPen className="size-5" />} title="No reflections yet" description="Tap “Reflect” under a verse to begin your Tadabur journal." />;
  return (
    <ul className="mx-auto max-w-3xl space-y-3 py-2">
      {reflections.map((r) => (
        <li key={r.id}>
          <button type="button" className="mb-1 text-xs font-medium text-emerald hover:underline" onClick={() => onOpen(r.surah, r.ayah)}>
            {surahMeta(r.surah).englishName} {r.surah}:{r.ayah} →
          </button>
          <ul>
            <ReflectionCard r={r} />
          </ul>
        </li>
      ))}
    </ul>
  );
}

const toArabicDigits = (n: number) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

/** Continuous Arabic text on a paper-like page, with tappable verse markers. */
function MushafPage({
  ayahs,
  playingIndex,
  selectedIndex,
  onSelect,
  onPlay,
  onReflect,
}: {
  ayahs: SurahPayload["ayahs"];
  playingIndex: number | null;
  selectedIndex: number | null;
  onSelect: (i: number) => void;
  onPlay: (i: number) => void;
  onReflect: (i: number) => void;
}) {
  const sel = selectedIndex != null ? ayahs[selectedIndex] : undefined;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-[20px] bg-[#f7f1e3] px-5 py-7 shadow-[inset_0_0_0_6px_#efe4cc,0_20px_50px_-20px_rgba(0,0,0,0.7)] sm:px-9">
        <p lang="ar" dir="rtl" className="font-quran text-justify text-[1.6rem] leading-[2.6] text-[#1d1a14] sm:text-[1.85rem]">
          {ayahs.map((a, i) => (
            <span key={a.number} id={`ayah-${a.numberInSurah}`} data-ayah={a.numberInSurah}>
              <span className={cn("rounded-md transition-colors", playingIndex === i ? "bg-[#45d49a]/30" : selectedIndex === i ? "bg-[#e9b66b]/30" : "")}>{a.arabic}</span>{" "}
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-label={`Verse ${a.numberInSurah}: select`}
                className="mx-0.5 inline-grid min-w-[1.6em] place-items-center rounded-full font-quran text-[0.8em] text-[#8a6a2c] hover:bg-[#e9b66b]/25 focus-visible:outline-[#8a6a2c]"
              >
                ﴿{toArabicDigits(a.numberInSurah)}﴾
              </button>{" "}
            </span>
          ))}
        </p>
      </div>
      {sel && selectedIndex != null && (
        <div className="glass-soft mt-4 flex flex-wrap items-center gap-3 p-3">
          <p className="min-w-0 flex-1 text-sm text-ink-2">
            <span className="me-2 font-semibold text-gold">{sel.numberInSurah}</span>
            {sel.translation}
          </p>
          <div className="flex gap-1">
            <IconButton size="sm" label={`Play verse ${sel.numberInSurah}`} onClick={() => onPlay(selectedIndex)}>
              <Play className="size-4" />
            </IconButton>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => onReflect(selectedIndex)}>
              <NotebookPen className="size-3.5" /> Reflect
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
