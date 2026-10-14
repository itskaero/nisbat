import { Bookmark, BookmarkCheck, Pause, Play, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SURAHS, isBookmarked, markRead, readStats, setLastRead, surahMeta, surahReadCount, toggleBookmark } from "@/features/quran/quran-state";
import { usePersisted } from "@/lib/storage/persisted-store";
import { quranStore } from "@/lib/storage/stores";
import { Page, Problem, Skeleton, Source, cx, inputCls } from "../components/ui";
import { useCached } from "../lib/cached";
import { useSettings } from "../lib/data";
import { tap } from "../lib/native";
import { push } from "../lib/nav";
import { play, toggle, usePlayer, type Track } from "../lib/player";
import { toast } from "../lib/toast";

export function QuranScreen() {
  const state = usePersisted(quranStore);
  const { timezone } = useSettings();
  const stats = readStats(state, timezone);
  const [q, setQ] = useState("");
  const last = state.lastRead;
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return SURAHS;
    return SURAHS.filter((s) => String(s.number) === n || s.englishName.toLowerCase().includes(n) || s.englishNameTranslation.toLowerCase().includes(n) || s.name.includes(q.trim()));
  }, [q]);
  const open = (s: number, a?: number) => push({ name: "reader", params: a ? { s: String(s), a: String(a) } : { s: String(s) } });

  return (
    <Page title="Quran" ur="تدبر قرآن">
      <div className="glass p-4">
        <p className="text-xs uppercase tracking-wider text-ink-3">Your progress</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.total.toLocaleString()} ayahs</p>
        <p className="text-sm text-ink-2">
          {stats.percent.toFixed(1)}% of the Quran · {stats.today} today · goal {state.dailyGoal}/day
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-emerald" style={{ width: `${Math.min(100, (stats.today / Math.max(1, state.dailyGoal)) * 100)}%` }} />
        </div>
        {last && (
          <button type="button" className="press mt-3 w-full rounded-2xl bg-emerald py-3 font-semibold text-[#06231a]" onClick={() => open(last.surah, last.ayah)}>
            Continue {surahMeta(last.surah).englishName} · ayah {last.ayah}
          </button>
        )}
      </div>

      {state.bookmarks.length > 0 && (
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {state.bookmarks.slice(0, 12).map((b) => (
            <button key={`${b.surah}:${b.ayah}`} type="button" className="chip press flex items-center gap-1.5" onClick={() => open(b.surah, b.ayah)}>
              <BookmarkCheck size={14} className="text-gold" /> {surahMeta(b.surah).englishName} {b.surah}:{b.ayah}
            </button>
          ))}
        </div>
      )}

      <div className="relative mt-3">
        <Search size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-ink-3" />
        <input className={`${inputCls} ps-11`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search surahs (name, number, meaning)" />
      </div>

      <ul className="mt-3 space-y-2">
        {list.map((s) => {
          const read = surahReadCount(state, s.number);
          return (
            <li key={s.number}>
              <button type="button" className="glass press flex w-full items-center gap-3 p-3 text-start" onClick={() => open(s.number)}>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-sm tabular-nums">{s.number}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{s.englishName}</span>
                  <span className="block truncate text-xs text-ink-3">
                    {s.englishNameTranslation} · {s.numberOfAyahs} ayahs{read ? ` · ${read} read` : ""}
                  </span>
                </span>
                <span lang="ar" className="font-arabic text-lg">
                  {s.name.replace(/^سُورَةُ\s*/, "")}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Page>
  );
}

interface Ayah {
  number: number;
  numberInSurah: number;
  arabic: string;
  translation: string;
  audio: string;
  audioSecondary?: string[];
}
interface SurahPayload {
  ayahs: Ayah[];
  editions: { arabic: string; translation: string; reciter: string };
}

export function ReaderScreen({ params }: { params: Record<string, string> }) {
  const surah = Math.min(114, Math.max(1, Number(params.s) || 1));
  const startAyah = Number(params.a) || 0;
  const { quranTranslation, quranReciter } = useSettings();
  const state = usePersisted(quranStore);
  const p = usePlayer();
  const meta = surahMeta(surah);
  const { data, error, reload } = useCached<SurahPayload>(`/api/quran/surah/${surah}?translation=${quranTranslation}&reciter=${quranReciter}`, 7 * 24 * 3600_000);
  const listRef = useRef<HTMLOListElement>(null);

  const tracks: Track[] = useMemo(
    () =>
      (data?.ayahs ?? []).map((a) => ({
        key: `quran:${surah}:${a.numberInSurah}`,
        src: a.audio,
        fallback: a.audioSecondary,
        title: `${meta.englishName} ${surah}:${a.numberInSurah}`,
        sub: data!.editions.reciter,
        kind: "quran" as const,
        onStart: () => {
          setLastRead(surah, a.numberInSurah);
          markRead(surah, [a.numberInSurah]);
          document.getElementById(`ayah-${a.numberInSurah}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        },
      })),
    [data, surah],
  );

  // Open at the requested ayah.
  useEffect(() => {
    if (!data || !startAyah) return;
    requestAnimationFrame(() => document.getElementById(`ayah-${startAyah}`)?.scrollIntoView({ block: "center" }));
  }, [data, startAyah]);

  // An ayah that stays on screen for 2 s counts as read and becomes "last read".
  useEffect(() => {
    if (!data || !listRef.current) return;
    const timers = new Map<number, ReturnType<typeof setTimeout>>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const n = Number((e.target as HTMLElement).dataset.ayah);
          if (e.isIntersecting) {
            timers.set(
              n,
              setTimeout(() => {
                markRead(surah, [n]);
                setLastRead(surah, n);
              }, 2000),
            );
          } else {
            clearTimeout(timers.get(n));
            timers.delete(n);
          }
        }
      },
      { threshold: 0.6 },
    );
    listRef.current.querySelectorAll("[data-ayah]").forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [data, surah]);

  const here = p.track?.kind === "quran" && p.track.key.startsWith(`quran:${surah}:`);
  const currentAyah = here ? Number(p.track!.key.split(":")[2]) : 0;

  return (
    <Page
      title={meta.englishName}
      ur={meta.name}
      back
      right={
        <button
          type="button"
          aria-label={here && p.playing ? "Pause" : "Play surah"}
          disabled={!data}
          className="press grid size-11 place-items-center rounded-full bg-emerald text-[#06231a] disabled:opacity-40"
          onClick={() => {
            void tap();
            if (here) toggle();
            else play(tracks, startAyah ? Math.max(0, startAyah - 1) : 0);
          }}
        >
          {here && p.playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
      }
    >
      <p className="-mt-1 mb-3 text-sm text-ink-2">
        {surah}. {meta.englishNameTranslation} · {meta.numberOfAyahs} ayahs · {meta.revelationType}
      </p>
      {error ? (
        <Problem title="The surah couldn't be loaded" text={error} onRetry={reload} />
      ) : !data ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : (
        <ol ref={listRef} className="space-y-3">
          {data.ayahs.map((a, i) => {
            const marked = isBookmarked(state, surah, a.numberInSurah);
            const on = currentAyah === a.numberInSurah;
            return (
              <li key={a.number} id={`ayah-${a.numberInSurah}`} data-ayah={a.numberInSurah} className={cx("glass scroll-mt-24 p-4", on && "!border-emerald/60 !bg-emerald/[0.08]")}>
                <div className="mb-2 flex items-center gap-2 text-xs text-ink-3">
                  <span className="grid size-7 place-items-center rounded-full border border-line tabular-nums">{a.numberInSurah}</span>
                  <span className="flex-1" />
                  <button type="button" aria-label={on && p.playing ? "Pause" : "Recite from here"} className="press grid size-9 place-items-center rounded-full bg-white/[0.06]" onClick={() => (on ? toggle() : play(tracks, i))}>
                    {on && p.playing ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    type="button"
                    aria-label={marked ? "Remove bookmark" : "Bookmark"}
                    className="press grid size-9 place-items-center rounded-full bg-white/[0.06]"
                    onClick={() => {
                      void tap();
                      toast(toggleBookmark(surah, a.numberInSurah) ? "Bookmarked" : "Bookmark removed", "info");
                    }}
                  >
                    {marked ? <BookmarkCheck size={16} className="text-gold" /> : <Bookmark size={16} />}
                  </button>
                </div>
                <p lang="ar" dir="rtl" className="font-arabic text-[1.65rem] leading-[2.15]">
                  {a.arabic}
                </p>
                <p className="mt-2 leading-relaxed text-ink-2">{a.translation}</p>
              </li>
            );
          })}
        </ol>
      )}
      {data && (
        <Source>
          {data.editions.arabic} · {data.editions.translation} · recitation {data.editions.reciter}. Via AlQuran Cloud.
        </Source>
      )}
    </Page>
  );
}
