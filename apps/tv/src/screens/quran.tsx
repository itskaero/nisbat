import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useMemo } from "preact/hooks";
import { SURAHS, isBookmarked, markRead, readStats, setLastRead, surahMeta, surahReadCount, toggleBookmark } from "@/features/quran/quran-state";
import { usePersisted } from "@/lib/storage/persisted-store";
import { quranStore } from "@/lib/storage/stores";
import { focusElement } from "@/lib/tv/spatial-nav";
import { Problem, ScreenHeader, Skeleton, Source, Tile, cx } from "../components/ui";
import { useCached } from "../lib/cached";
import { useSettings } from "../lib/data";
import { play, toggle, usePlayer, type Track } from "../lib/player";
import { navigate, useRoute } from "../lib/router";
import { toast } from "../lib/ui-state";

interface Ayah {
  number: number;
  numberInSurah: number;
  arabic: string;
  translation: string;
  audio: string;
  audioSecondary?: string[];
}
interface SurahPayload {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  ayahs: Ayah[];
  editions: { arabic: string; translation: string; reciter: string };
}

export function QuranScreen() {
  const { query } = useRoute();
  const s = Number(query.get("s"));
  return s >= 1 && s <= 114 ? <Reader surah={s} ayah={Number(query.get("a")) || 0} /> : <SurahGrid />;
}

function SurahGrid() {
  const state = usePersisted(quranStore);
  const { timezone } = useSettings();
  const stats = readStats(state, timezone);
  const last = state.lastRead;
  return (
    <>
      <ScreenHeader
        title="Tadabur Quran"
        ur="تدبر قرآن"
        sub={`${stats.total.toLocaleString()} ayahs read · ${stats.percent.toFixed(1)}% of the Quran · ${stats.today} today`}
        right={
          last && (
            <Tile class="px-6 py-4 text-lg" data-autofocus onClick={() => navigate(`/quran?s=${last.surah}&a=${last.ayah}`)}>
              Continue {surahMeta(last.surah).englishName} · ayah {last.ayah}
            </Tile>
          )
        }
      />
      <div class="grid grid-cols-5 gap-3">
        {SURAHS.map((m) => {
          const read = surahReadCount(state, m.number);
          return (
            <Tile key={m.number} class="p-4" onClick={() => navigate(`/quran?s=${m.number}`)}>
              <div class="flex items-start justify-between gap-2">
                <span class="text-base tabular-nums text-ink-3">{m.number}</span>
                <span lang="ar" class="font-arabic text-xl">
                  {m.name.replace(/^سُورَةُ\s*/, "")}
                </span>
              </div>
              <p class="mt-1 truncate text-lg font-medium">{m.englishName}</p>
              <p class="text-sm text-ink-3">
                {m.numberOfAyahs} ayahs{read ? ` · ${read} read` : ""}
              </p>
              {read > 0 && (
                <div class="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <div class="h-full origin-left rounded-full bg-emerald" style={{ transform: `scaleX(${read / m.numberOfAyahs})` }} />
                </div>
              )}
            </Tile>
          );
        })}
      </div>
    </>
  );
}

function Reader({ surah, ayah }: { surah: number; ayah: number }) {
  const { quranTranslation, quranReciter } = useSettings();
  const state = usePersisted(quranStore);
  const p = usePlayer();
  const { data, error, reload } = useCached<SurahPayload>(`/api/quran/surah/${surah}?translation=${quranTranslation}&reciter=${quranReciter}`, 7 * 24 * 3600_000);
  const meta = surahMeta(surah);

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
          const el = document.getElementById(`ayah-${a.numberInSurah}`);
          if (el && document.activeElement?.id?.startsWith("ayah-")) focusElement(el);
        },
      })),
    [data, surah],
  );

  // Open at the requested ayah, or on Play once the surah has loaded.
  useEffect(() => {
    if (!data) return;
    if (!ayah) {
      const play = document.getElementById("quran-play");
      if (play && !document.activeElement?.closest("main")) focusElement(play);
      return;
    }
    const t = setTimeout(() => {
      const el = document.getElementById(`ayah-${ayah}`);
      if (el) focusElement(el);
    }, 150);
    return () => clearTimeout(t);
  }, [data, ayah]);

  const playingHere = p.track?.kind === "quran" && p.track.key.startsWith(`quran:${surah}:`);
  const currentAyah = playingHere ? Number(p.track!.key.split(":")[2]) : 0;

  return (
    <>
      <ScreenHeader
        title={`${surah}. ${meta.englishName}`}
        ur={meta.name}
        sub={`${meta.englishNameTranslation} · ${meta.numberOfAyahs} ayahs · ${meta.revelationType}`}
        right={
          <div class="flex gap-3">
            <Tile class="grid size-14 place-items-center" aria-label="Previous surah" onClick={() => surah > 1 && navigate(`/quran?s=${surah - 1}`)}>
              <ChevronLeft size={26} />
            </Tile>
            <Tile
              id="quran-play"
              class="flex items-center gap-2 px-6 py-3 text-lg !bg-emerald font-semibold !text-[#06231a]"
              data-autofocus={!ayah ? "" : undefined}
              disabled={!data}
              onClick={() => (playingHere ? toggle() : play(tracks, 0))}
            >
              {playingHere && p.playing ? <Pause size={22} /> : <Play size={22} />}
              {playingHere ? (p.playing ? "Pause" : "Resume") : "Play surah"}
            </Tile>
            <Tile class="grid size-14 place-items-center" aria-label="Next surah" onClick={() => surah < 114 && navigate(`/quran?s=${surah + 1}`)}>
              <ChevronRight size={26} />
            </Tile>
          </div>
        }
      />
      {error ? (
        <Problem title="The surah couldn't be loaded" text={error} onRetry={reload} />
      ) : !data ? (
        <div class="space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} class="h-40" />
          ))}
        </div>
      ) : (
        <ol class="space-y-4">
          {data.ayahs.map((a, i) => {
            const marked = isBookmarked(state, surah, a.numberInSurah);
            return (
              <li key={a.number}>
                <button
                  id={`ayah-${a.numberInSurah}`}
                  type="button"
                  class={cx("card block w-full p-6 text-start transition-colors", currentAyah === a.numberInSurah && "!border-emerald/60 !bg-emerald/[0.08]")}
                  onClick={() => (currentAyah === a.numberInSurah ? toggle() : play(tracks, i))}
                  onFocus={() => setLastRead(surah, a.numberInSurah)}
                >
                  <div class="mb-3 flex items-center gap-3 text-base text-ink-3">
                    <span class="grid size-9 place-items-center rounded-full border border-line tabular-nums">{a.numberInSurah}</span>
                    {marked && <BookmarkCheck size={20} class="text-gold" />}
                    <span class="ms-auto">OK to {currentAyah === a.numberInSurah && p.playing ? "pause" : "recite from here"}</span>
                  </div>
                  <p lang="ar" dir="rtl" class="font-arabic text-[2.3rem] leading-[2.1]">
                    {a.arabic}
                  </p>
                  <p class="mt-3 text-[1.35rem] leading-relaxed text-ink-2">{a.translation}</p>
                </button>
                <div class="mt-2 flex justify-end">
                  <button
                    type="button"
                    class="chip flex items-center gap-2 text-base"
                    onClick={() => toast(toggleBookmark(surah, a.numberInSurah) ? "Bookmarked" : "Bookmark removed", "info")}
                  >
                    {marked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                    {marked ? "Bookmarked" : "Bookmark"}
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {data && (
        <Source>
          Text: {data.editions.arabic} · Translation: {data.editions.translation} · Recitation: {data.editions.reciter}. Via AlQuran Cloud.
        </Source>
      )}
    </>
  );
}
