import { Check, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "preact/hooks";
import { AZKAR_CHAPTERS } from "@/features/azkar/sources";
import { todayKey } from "@/lib/dates";
import { usePersisted } from "@/lib/storage/persisted-store";
import { azkarStore } from "@/lib/storage/stores";
import { Card, Chips, Problem, ScreenHeader, Skeleton, Source, cx } from "../components/ui";
import { useCached } from "../lib/cached";
import { useSettings } from "../lib/data";
import { play, stop, usePlayer } from "../lib/player";

interface Dhikr {
  id: number;
  arabic: string;
  transliteration: string;
  translation: string;
  repeat: number;
  audio?: string;
}

const PHRASES = [
  { ar: "سُبْحَانَ ٱللَّٰهِ", en: "SubhanAllah" },
  { ar: "ٱلْحَمْدُ لِلَّٰهِ", en: "Alhamdulillah" },
  { ar: "ٱللَّٰهُ أَكْبَرُ", en: "Allahu Akbar" },
  { ar: "أَسْتَغْفِرُ ٱللَّٰهَ", en: "Astaghfirullah" },
];

export function AzkarScreen() {
  const { timezone } = useSettings();
  const state = usePersisted(azkarStore);
  const today = todayKey(timezone);
  const h = new Date().getHours();
  const [chapter, setChapter] = useState(String(h >= 21 || h < 4 ? 28 : 27));
  const { data, error, reload } = useCached<{ items: Dhikr[]; source: string }>(`/api/azkar?chapter=${chapter}`, 30 * 24 * 3600_000);
  const p = usePlayer();

  // Counts belong to one day; start fresh each morning (shared with every screen).
  useEffect(() => {
    if (state.date !== today) azkarStore.set((s) => ({ ...s, date: today, counts: {}, tasbeeh: { ...s.tasbeeh, count: 0, total: 0 } }));
  }, [today, state.date]);

  const bump = (key: string, repeat: number) => azkarStore.set((s) => ({ ...s, counts: { ...s.counts, [key]: Math.min(repeat, (s.counts[key] ?? 0) + 1) } }));
  const items = data?.items ?? [];
  const done = items.filter((d) => (state.counts[`${chapter}:${d.id}`] ?? 0) >= d.repeat).length;

  return (
    <>
      <ScreenHeader title="Azkar" ur="اذکار" sub={items.length ? `${done} of ${items.length} completed today` : undefined} />
      <div class="grid grid-cols-[minmax(0,1fr)_420px] gap-6">
        <div>
          <Chips label="Chapter" value={chapter} onChange={setChapter} options={AZKAR_CHAPTERS.slice(0, 6).map((c) => ({ value: String(c.id), label: c.title }))} />
          <div class="mt-5 space-y-4">
            {error ? (
              <Problem title="Adhkar are unavailable right now" text={error} onRetry={reload} />
            ) : !data ? (
              [0, 1, 2].map((i) => <Skeleton key={i} class="h-40" />)
            ) : (
              items.map((d, i) => {
                const key = `${chapter}:${d.id}`;
                const count = state.counts[key] ?? 0;
                const complete = count >= d.repeat;
                const playingThis = p.track?.key === `azkar:${key}`;
                return (
                  <div key={d.id} class={cx("card p-6", complete && "!border-emerald/40 !bg-emerald/[0.06]")}>
                    <p lang="ar" dir="rtl" class="font-arabic text-[1.9rem] leading-[2.1]">
                      {d.arabic}
                    </p>
                    <p class="mt-3 text-xl leading-relaxed text-ink-2">{d.translation}</p>
                    <div class="mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        data-autofocus={i === 0 ? "" : undefined}
                        class={cx("chip flex min-w-[8rem] items-center justify-center gap-2 text-xl tabular-nums", complete && "!border-emerald/60 !text-emerald")}
                        onClick={() => !complete && bump(key, d.repeat)}
                      >
                        {complete && <Check size={20} />}
                        {count}/{d.repeat}
                      </button>
                      {d.audio && (
                        <button
                          type="button"
                          class="chip flex items-center gap-2 text-lg"
                          onClick={() => (playingThis ? stop() : play([{ key: `azkar:${key}`, src: d.audio!, title: d.transliteration.slice(0, 60) || "Dhikr", sub: "Hisn al-Muslim", kind: "quran" }]))}
                        >
                          {playingThis && p.playing ? <Pause size={18} /> : <Play size={18} />} Listen
                        </button>
                      )}
                      {count > 0 && (
                        <button type="button" class="chip flex items-center gap-2 text-lg" onClick={() => azkarStore.set((s) => ({ ...s, counts: { ...s.counts, [key]: 0 } }))}>
                          <RotateCcw size={18} /> Reset
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <Source>Hisn al-Muslim (Fortress of the Muslim), via hisnmuslim.com. Counts are shared with the family&apos;s screens and reset daily.</Source>
        </div>
        <Tasbeeh />
      </div>
    </>
  );
}

function Tasbeeh() {
  const { tasbeeh } = usePersisted(azkarStore);
  const [phrase, setPhrase] = useState(0);
  const reached = tasbeeh.count >= tasbeeh.target;
  const pct = Math.min(1, tasbeeh.count / tasbeeh.target);
  const r = 150;
  const c = 2 * Math.PI * r;
  return (
    <Card title="Tasbeeh" class="h-fit">
      <button
        type="button"
        class="relative mx-auto grid size-[340px] place-items-center rounded-full"
        aria-label={`Count ${PHRASES[phrase].en}. ${tasbeeh.count} of ${tasbeeh.target}`}
        onClick={() => azkarStore.set((s) => ({ ...s, tasbeeh: { ...s.tasbeeh, count: s.tasbeeh.count + 1, total: s.tasbeeh.total + 1 } }))}
      >
        <svg width="340" height="340" class="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="170" cy="170" r={r} stroke="rgba(255,255,255,.1)" stroke-width="10" fill="none" />
          <circle cx="170" cy="170" r={r} stroke={reached ? "var(--gold)" : "var(--emerald)"} stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray={c} stroke-dashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset 300ms var(--ease)" }} />
        </svg>
        <span class="text-center">
          <span lang="ar" class="font-arabic block text-[2rem]">
            {PHRASES[phrase].ar}
          </span>
          <span class="block font-display text-[5rem] font-semibold leading-none tabular-nums">{tasbeeh.count}</span>
          <span class="text-lg text-ink-3">
            of {tasbeeh.target}
            {reached ? " ✓" : ""}
          </span>
        </span>
      </button>
      <p class="mt-3 text-center text-lg text-ink-3">OK on the remote counts · {tasbeeh.total} today</p>
      <div class="mt-4 flex flex-wrap justify-center gap-2">
        {PHRASES.map((ph, i) => (
          <button key={ph.en} type="button" class="chip text-base" aria-pressed={i === phrase} onClick={() => setPhrase(i)}>
            {ph.en}
          </button>
        ))}
        <button type="button" class="chip flex items-center gap-1 text-base" onClick={() => azkarStore.set((s) => ({ ...s, tasbeeh: { ...s.tasbeeh, count: 0 } }))}>
          <RotateCcw size={16} /> Reset
        </button>
      </div>
    </Card>
  );
}
