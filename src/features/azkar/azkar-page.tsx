"use client";

import { Check, ExternalLink, Pause, Play, RefreshCw, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, ChipRow, EmptyState, IconButton, Panel, Segmented, Skeleton, SourceNote, cn } from "@/components/ui/primitives";
import { todayKey } from "@/lib/dates";
import { useFetch, useNow } from "@/lib/hooks";
import { useHydrated, usePersisted } from "@/lib/storage/persisted-store";
import { azkarStore, settingsStore } from "@/lib/storage/stores";
import { AZKAR_CHAPTERS } from "./sources";

interface Dhikr {
  id: number;
  arabic: string;
  transliteration: string;
  translation: string;
  repeat: number;
  audio?: string;
}

/** Counts reset at the start of each day in the user's time zone. */
function useTodayCounts() {
  const state = usePersisted(azkarStore);
  const { timezone } = usePersisted(settingsStore);
  const now = useNow();
  const today = now ? todayKey(timezone) : "";
  useEffect(() => {
    if (today && state.date !== today) azkarStore.set((s) => ({ ...s, date: today, counts: {}, tasbeeh: { ...s.tasbeeh, count: 0, total: 0 } }));
  }, [today, state.date]);
  return state;
}

export function AzkarPage() {
  const state = useTodayCounts();
  const hydrated = useHydrated();
  const [chapter, setChapter] = useState<number>(() => {
    const h = new Date().getHours();
    return h >= 4 && h < 12 ? 27 : h >= 21 || h < 4 ? 28 : 27;
  });
  const { data, error, loading, reload } = useFetch<{ items: Dhikr[]; source: string }>(`/api/azkar?chapter=${chapter}`);
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  useEffect(() => () => audio.current?.pause(), []);

  const play = (d: Dhikr) => {
    if (!d.audio) return;
    if (playing === d.id) {
      audio.current?.pause();
      setPlaying(null);
      return;
    }
    audio.current?.pause();
    const a = new Audio(d.audio);
    a.onended = () => setPlaying(null);
    a.onerror = () => setPlaying(null);
    audio.current = a;
    void a.play().then(() => setPlaying(d.id)).catch(() => setPlaying(null));
  };

  const bump = (key: string, repeat: number) =>
    azkarStore.set((s) => ({ ...s, counts: { ...s.counts, [key]: Math.min(repeat, (s.counts[key] ?? 0) + 1) } }));

  const items = data?.items ?? [];
  const doneCount = items.filter((d) => (state.counts[`${chapter}:${d.id}`] ?? 0) >= d.repeat).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight md:text-3xl">
          <Sparkles className="size-7 text-emerald" aria-hidden /> Azkar &amp; Hadith <span className="font-urdu text-xl text-ink-2" lang="ur">اذکار و حدیث</span>
        </h1>
        <p className="mt-1 text-sm text-ink-2">Daily remembrance with a counter, and a hadith for today.</p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <HadithOfTheDay />
          <Panel className="glass-reading p-4 sm:p-5" aria-labelledby="adhkar-title">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="adhkar-title" className="text-sm font-semibold">
                Adhkar · {AZKAR_CHAPTERS.find((c) => c.id === chapter)?.title}
              </h2>
              {items.length > 0 && hydrated && (
                <span className="text-xs text-ink-3">
                  {doneCount}/{items.length} completed today
                </span>
              )}
            </div>
            <ChipRow
              className="mt-3"
              label="Adhkar chapter"
              value={String(chapter)}
              onChange={(v) => setChapter(Number(v))}
              options={AZKAR_CHAPTERS.map((c) => ({ value: String(c.id), label: c.title }))}
            />
            {error ? (
              <EmptyState tone="error" title="Adhkar are unavailable right now" description={error} action={<Button size="sm" onClick={reload}><RefreshCw className="size-4" /> Try again</Button>} />
            ) : loading && !data ? (
              <div className="mt-4 space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32" />)}</div>
            ) : (
              <ol className="mt-4 space-y-3">
                {items.map((d) => {
                  const key = `${chapter}:${d.id}`;
                  const count = hydrated ? (state.counts[key] ?? 0) : 0;
                  const done = count >= d.repeat;
                  return (
                    <li key={d.id} className={cn("rounded-2xl border p-4 transition-colors sm:p-5", done ? "border-emerald/30 bg-emerald/[0.06]" : "border-white/8 bg-white/[0.02]")}>
                      <p lang="ar" dir="rtl" className="font-quran text-[1.5rem] leading-[2.1] text-ink sm:text-[1.7rem]">
                        {d.arabic}
                      </p>
                      {d.transliteration && <p className="mt-2 text-sm italic text-ink-3">{d.transliteration}</p>}
                      <p className="mt-2 text-sm leading-relaxed text-ink-2">{d.translation}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => !done && bump(key, d.repeat)}
                          aria-label={done ? `Completed ${d.repeat} times` : `Count, ${count} of ${d.repeat}`}
                          className={cn(
                            "inline-flex h-10 min-w-[7rem] items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold tabular-nums transition-colors",
                            done ? "border-emerald/50 bg-emerald/20 text-emerald" : "border-white/15 bg-white/[0.06] text-ink hover:border-emerald/50",
                          )}
                        >
                          {done ? <Check className="size-4" /> : null}
                          {count}/{d.repeat}
                        </button>
                        {count > 0 && (
                          <IconButton label="Reset this count" size="sm" onClick={() => azkarStore.set((s) => ({ ...s, counts: { ...s.counts, [key]: 0 } }))}>
                            <RotateCcw className="size-4" />
                          </IconButton>
                        )}
                        {d.audio && (
                          <IconButton label={playing === d.id ? "Pause recitation" : "Play recitation"} size="sm" onClick={() => play(d)}>
                            {playing === d.id ? <Pause className="size-4" /> : <Play className="size-4" />}
                          </IconButton>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            <SourceNote className="mt-4">
              Text, translation and audio: Hisn al-Muslim (Fortress of the Muslim) by Sa&apos;id ibn Wahf al-Qahtani, via hisnmuslim.com. Counts are shared with your family&apos;s screens and reset daily.
            </SourceNote>
          </Panel>
        </div>
        <Tasbeeh />
      </div>
    </div>
  );
}

function HadithOfTheDay() {
  const { timezone } = usePersisted(settingsStore);
  const now = useNow();
  const date = now ? todayKey(timezone) : null;
  const { data, error } = useFetch<{ collection: string; number: number; english: string; urdu: string | null; link: string; source: string }>(date ? `/api/hadith?date=${date}` : null);
  const [lang, setLang] = useState<"en" | "ur">("en");
  if (error) return null;
  return (
    <Panel className="p-5 sm:p-6" aria-labelledby="hadith-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="hadith-title" className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Hadith of the day
        </h2>
        {data?.urdu && (
          <Segmented label="Hadith language" value={lang} onChange={setLang} options={[{ value: "en", label: "English" }, { value: "ur", label: "اردو" }]} />
        )}
      </div>
      {!data ? (
        <Skeleton className="mt-4 h-24" />
      ) : (
        <>
          {lang === "ur" && data.urdu ? (
            <p lang="ur" dir="rtl" className="font-urdu mt-4 text-lg leading-[2.4] text-ink">{data.urdu}</p>
          ) : (
            <p className="mt-4 text-lg leading-relaxed text-ink">{data.english}</p>
          )}
          <p className="mt-3 flex flex-wrap items-center gap-x-2 text-xs text-ink-3">
            {data.collection} {data.number} ·{" "}
            <a href={data.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-ink">
              sunnah.com <ExternalLink className="size-3" />
            </a>{" "}
            · text from {data.source}
          </p>
        </>
      )}
    </Panel>
  );
}

const PHRASES = [
  { ar: "سُبْحَانَ ٱللَّٰهِ", en: "SubhanAllah" },
  { ar: "ٱلْحَمْدُ لِلَّٰهِ", en: "Alhamdulillah" },
  { ar: "ٱللَّٰهُ أَكْبَرُ", en: "Allahu Akbar" },
  { ar: "أَسْتَغْفِرُ ٱللَّٰهَ", en: "Astaghfirullah" },
  { ar: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ", en: "La ilaha illallah" },
];

/** Big tasbeeh counter: OK on a TV remote or a tap on a phone counts. */
function Tasbeeh() {
  const { tasbeeh } = usePersisted(azkarStore);
  const hydrated = useHydrated();
  const [phrase, setPhrase] = useState(0);
  const reached = tasbeeh.count >= tasbeeh.target;
  const count = () => {
    if (navigator.vibrate) navigator.vibrate(reached ? [30, 40, 30] : 10);
    azkarStore.set((s) => ({ ...s, tasbeeh: { ...s.tasbeeh, count: s.tasbeeh.count + 1, total: s.tasbeeh.total + 1 } }));
  };
  const pct = Math.min(1, tasbeeh.count / tasbeeh.target);
  return (
    <Panel className="h-fit p-5 xl:sticky xl:top-4" aria-labelledby="tasbeeh-title">
      <h2 id="tasbeeh-title" className="text-sm font-semibold">Tasbeeh</h2>
      <ChipRow className="mt-3" label="Phrase" value={String(phrase)} onChange={(v) => setPhrase(Number(v))} options={PHRASES.map((p, i) => ({ value: String(i), label: p.en }))} />
      <p lang="ar" dir="rtl" className="font-quran mt-3 text-center text-3xl text-ink">{PHRASES[phrase].ar}</p>
      <button
        type="button"
        onClick={count}
        aria-label={`Count ${PHRASES[phrase].en}. ${tasbeeh.count} of ${tasbeeh.target}`}
        className="relative mx-auto mt-4 grid size-56 place-items-center rounded-full border border-white/12 bg-[radial-gradient(circle_at_50%_35%,rgba(69,212,154,0.18),rgba(255,255,255,0.03))] transition-transform active:scale-95"
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle cx="50" cy="50" r="46" fill="none" stroke="var(--emerald)" strokeWidth="3" strokeLinecap="round" strokeDasharray={289} strokeDashoffset={289 * (1 - pct)} style={{ transition: "stroke-dashoffset 300ms" }} />
        </svg>
        <span className="text-center">
          <span className="block font-display text-6xl font-semibold tabular-nums">{hydrated ? tasbeeh.count : 0}</span>
          <span className="text-sm text-ink-3">of {tasbeeh.target}{reached ? " ✓" : ""}</span>
        </span>
      </button>
      <div className="mt-4 flex items-center justify-between gap-2">
        <Segmented
          label="Target"
          value={String(tasbeeh.target)}
          onChange={(v) => azkarStore.set((s) => ({ ...s, tasbeeh: { ...s.tasbeeh, target: Number(v) } }))}
          options={["33", "34", "100"].map((v) => ({ value: v, label: v }))}
        />
        <Button size="sm" variant="ghost" onClick={() => azkarStore.set((s) => ({ ...s, tasbeeh: { ...s.tasbeeh, count: 0 } }))}>
          <RotateCcw className="size-4" /> Reset
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-ink-3">{hydrated ? tasbeeh.total : 0} counted today on all screens</p>
    </Panel>
  );
}
