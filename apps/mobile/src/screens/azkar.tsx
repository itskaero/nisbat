import { Check, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { AZKAR_CHAPTERS } from "@/features/azkar/sources";
import { todayKey } from "@/lib/dates";
import { usePersisted } from "@/lib/storage/persisted-store";
import { azkarStore } from "@/lib/storage/stores";
import { Chips, Page, Problem, Skeleton, Source, cx } from "../components/ui";
import { useCached } from "../lib/cached";
import { useSettings } from "../lib/data";
import { tap } from "../lib/native";
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
  const [tab, setTab] = useState<"adhkar" | "tasbeeh">("adhkar");
  const [chapter, setChapter] = useState(String(h >= 21 || h < 4 ? 28 : 27));
  const { data, error, reload } = useCached<{ items: Dhikr[] }>(`/api/azkar?chapter=${chapter}`, 30 * 24 * 3600_000);
  const p = usePlayer();

  useEffect(() => {
    if (state.date !== today) azkarStore.set((s) => ({ ...s, date: today, counts: {}, tasbeeh: { ...s.tasbeeh, count: 0, total: 0 } }));
  }, [today, state.date]);

  const bump = (key: string, repeat: number) => {
    const next = Math.min(repeat, (state.counts[key] ?? 0) + 1);
    void tap(next >= repeat ? "heavy" : "light");
    azkarStore.set((s) => ({ ...s, counts: { ...s.counts, [key]: next } }));
  };
  const items = data?.items ?? [];
  const done = items.filter((d) => (state.counts[`${chapter}:${d.id}`] ?? 0) >= d.repeat).length;

  return (
    <Page title="Azkar" ur="اذکار" back>
      <Chips
        label="View"
        value={tab}
        onChange={setTab}
        options={[
          { value: "adhkar", label: items.length ? `Adhkar · ${done}/${items.length}` : "Adhkar" },
          { value: "tasbeeh", label: `Tasbeeh · ${state.tasbeeh.total}` },
        ]}
      />
      {tab === "tasbeeh" ? (
        <Tasbeeh />
      ) : (
        <>
          <div className="mt-2">
            <Chips label="Chapter" value={chapter} onChange={setChapter} options={AZKAR_CHAPTERS.map((c) => ({ value: String(c.id), label: c.title }))} />
          </div>
          <div className="mt-3 space-y-3">
            {error ? (
              <Problem title="Adhkar are unavailable right now" text={error} onRetry={reload} />
            ) : !data ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)
            ) : (
              items.map((d) => {
                const key = `${chapter}:${d.id}`;
                const count = state.counts[key] ?? 0;
                const complete = count >= d.repeat;
                const on = p.track?.key === `azkar:${key}`;
                return (
                  <div key={d.id} className={cx("glass p-4", complete && "!border-emerald/40 !bg-emerald/[0.07]")}>
                    <p lang="ar" dir="rtl" className="font-arabic text-[1.4rem] leading-[2.1]">
                      {d.arabic}
                    </p>
                    {d.transliteration && <p className="mt-2 text-sm italic text-ink-3">{d.transliteration}</p>}
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">{d.translation}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        className={cx("press flex h-11 min-w-[7rem] items-center justify-center gap-2 rounded-full border px-4 font-semibold tabular-nums", complete ? "border-emerald/50 bg-emerald/20 text-emerald" : "border-white/15 bg-white/[0.06]")}
                        onClick={() => !complete && bump(key, d.repeat)}
                      >
                        {complete && <Check size={16} />}
                        {count}/{d.repeat}
                      </button>
                      {d.audio && (
                        <button
                          type="button"
                          aria-label={on && p.playing ? "Pause" : "Listen"}
                          className="press grid size-11 place-items-center rounded-full bg-white/[0.06]"
                          onClick={() => (on ? stop() : play([{ key: `azkar:${key}`, src: d.audio!, title: "Dhikr", sub: "Hisn al-Muslim", kind: "dhikr" }]))}
                        >
                          {on && p.playing ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                      )}
                      {count > 0 && (
                        <button type="button" aria-label="Reset count" className="press grid size-11 place-items-center rounded-full text-ink-3" onClick={() => azkarStore.set((s) => ({ ...s, counts: { ...s.counts, [key]: 0 } }))}>
                          <RotateCcw size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <Source>Hisn al-Muslim via hisnmuslim.com. Counts are shared with the family&apos;s screens and reset each day.</Source>
        </>
      )}
    </Page>
  );
}

function Tasbeeh() {
  const { tasbeeh } = usePersisted(azkarStore);
  const [phrase, setPhrase] = useState(0);
  const reached = tasbeeh.count >= tasbeeh.target;
  const pct = Math.min(1, tasbeeh.count / tasbeeh.target);
  const r = 120;
  const c = 2 * Math.PI * r;
  return (
    <div className="mt-4 text-center">
      <button
        type="button"
        className="press relative mx-auto grid size-[272px] place-items-center rounded-full"
        aria-label={`Count ${PHRASES[phrase].en}. ${tasbeeh.count} of ${tasbeeh.target}`}
        onClick={() => {
          void tap(tasbeeh.count + 1 === tasbeeh.target ? "heavy" : "light");
          azkarStore.set((s) => ({ ...s, tasbeeh: { ...s.tasbeeh, count: s.tasbeeh.count + 1, total: s.tasbeeh.total + 1 } }));
        }}
      >
        <svg width="272" height="272" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="136" cy="136" r={r} stroke="rgba(255,255,255,.1)" strokeWidth="10" fill="none" />
          <circle cx="136" cy="136" r={r} stroke={reached ? "var(--gold)" : "var(--emerald)"} strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset 250ms var(--ease)" }} />
        </svg>
        <span>
          <span lang="ar" className="font-arabic block text-2xl">
            {PHRASES[phrase].ar}
          </span>
          <span className="font-display block text-6xl font-semibold tabular-nums">{tasbeeh.count}</span>
          <span className="text-sm text-ink-3">
            of {tasbeeh.target}
            {reached ? " ✓" : ""}
          </span>
        </span>
      </button>
      <p className="mt-2 text-sm text-ink-3">Tap anywhere on the circle · {tasbeeh.total} today (shared with the TV)</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {PHRASES.map((ph, i) => (
          <button key={ph.en} type="button" className="chip press" aria-pressed={i === phrase} onClick={() => setPhrase(i)}>
            {ph.en}
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {[33, 99, 100].map((t) => (
          <button key={t} type="button" className="chip press" aria-pressed={tasbeeh.target === t} onClick={() => azkarStore.set((s) => ({ ...s, tasbeeh: { ...s.tasbeeh, target: t } }))}>
            Target {t}
          </button>
        ))}
        <button type="button" className="chip press flex items-center gap-1" onClick={() => azkarStore.set((s) => ({ ...s, tasbeeh: { ...s.tasbeeh, count: 0 } }))}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  );
}
