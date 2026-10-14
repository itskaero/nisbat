import { Pause, Play, Plus, Radio, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { RADIO_STATIONS, type PodcastFeed } from "@/features/sunein/sources";
import { usePersisted } from "@/lib/storage/persisted-store";
import { suneinStore } from "@/lib/storage/stores";
import { Btn, Card, Page, Problem, Sheet, Skeleton, Source, cx, inputCls } from "../components/ui";
import { api, useCached } from "../lib/cached";
import { tap } from "../lib/native";
import { push } from "../lib/nav";
import { fmtTime, play, seek, setRate, toggle, usePlayer, type Track } from "../lib/player";
import { toast } from "../lib/toast";

export function SuneinScreen() {
  const sunein = usePersisted(suneinStore);
  const p = usePlayer();
  const [adding, setAdding] = useState(false);
  const resume = Object.entries(sunein.progress)
    .sort(([, a], [, b]) => b.at.localeCompare(a.at))
    .filter(([, v]) => v.pos < v.dur - 30)
    .slice(0, 3);

  return (
    <Page title="Sunein" ur="سنیں" back>
      {p.track && p.track.kind !== "quran" && <NowPlaying />}
      {resume.length > 0 && (
        <Card title="Continue listening" className="mt-3">
          <ul className="space-y-2">
            {resume.map(([key, v]) => (
              <li key={key}>
                <button
                  type="button"
                  className="press w-full rounded-2xl bg-white/[0.04] p-3 text-start"
                  onClick={() => {
                    void tap();
                    play([{ key, src: v.url, title: v.title, sub: v.show, kind: "podcast", feedUrl: v.feedUrl }]);
                  }}
                >
                  <p className="truncate font-medium">{v.title}</p>
                  <p className="truncate text-xs text-ink-3">
                    {v.show} · {fmtTime(v.pos)} of {fmtTime(v.dur)}
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-emerald" style={{ width: `${(v.pos / v.dur) * 100}%` }} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card
        title="Podcasts"
        className="mt-3"
        right={
          <button type="button" className="flex items-center gap-1 text-xs text-emerald" onClick={() => setAdding(true)}>
            <Plus size={14} /> Add
          </button>
        }
      >
        <ul className="space-y-1">
          {sunein.podcasts.map((pod) => (
            <li key={pod.feedUrl} className="flex items-center gap-2">
              <button type="button" className="press min-w-0 flex-1 truncate rounded-xl px-2 py-2.5 text-start" onClick={() => push({ name: "podcast", params: { feed: pod.feedUrl } })}>
                {pod.title}
              </button>
              <button
                type="button"
                aria-label={`Remove ${pod.title}`}
                className="press grid size-9 place-items-center text-ink-3"
                onClick={() => {
                  suneinStore.set((s) => ({ ...s, podcasts: s.podcasts.filter((x) => x.feedUrl !== pod.feedUrl) }));
                  toast(`Removed ${pod.title}`, "info");
                }}
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Radio Pakistan" className="mt-3">
        <ul className="space-y-1.5">
          {RADIO_STATIONS.map((st) => {
            const on = p.track?.key === st.id;
            return (
              <li key={st.id}>
                <button
                  type="button"
                  className={cx("press flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-start", on ? "bg-emerald/15 text-emerald" : "bg-white/[0.04]")}
                  onClick={() => (on ? toggle() : play([{ key: st.id, src: st.url, title: st.name, sub: "Radio Pakistan", kind: "radio" }]))}
                >
                  {on && p.playing ? <Pause size={18} /> : <Radio size={18} />}
                  <span className="min-w-0 flex-1 truncate">{st.name.replace("Radio Pakistan ", "")}</span>
                  <span lang="ur" className="font-urdu text-xs opacity-70">
                    {st.nameUr.replace("ریڈیو پاکستان ", "")}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>
      <Source>Audio streams from each publisher&apos;s own servers. Where you stopped is shared with the TV and the family&apos;s phones.</Source>
      <AddPodcast open={adding} onClose={() => setAdding(false)} />
    </Page>
  );
}

function NowPlaying() {
  const p = usePlayer();
  if (!p.track) return null;
  const live = p.track.kind === "radio";
  return (
    <div className="glass mt-1 p-4">
      <p className="truncate font-medium">{p.track.title}</p>
      <p className="truncate text-xs text-ink-3">{p.error ?? p.track.sub}</p>
      {!live && (
        <>
          <input type="range" min={0} max={p.dur || 1} value={p.pos} onChange={(e) => seek(Number(e.target.value) - p.pos)} className="mt-3 w-full accent-[var(--emerald)]" aria-label="Position" />
          <div className="flex justify-between text-xs tabular-nums text-ink-3">
            <span>{fmtTime(p.pos)}</span>
            <span>{fmtTime(p.dur)}</span>
          </div>
        </>
      )}
      <div className="mt-2 flex items-center justify-center gap-3">
        {!live && (
          <button type="button" className="chip press" onClick={() => seek(-15)}>
            −15s
          </button>
        )}
        <button type="button" aria-label={p.playing ? "Pause" : "Play"} className="press grid size-12 place-items-center rounded-full bg-emerald text-[#06231a]" onClick={toggle}>
          {p.playing ? <Pause size={22} /> : <Play size={22} />}
        </button>
        {!live && (
          <button type="button" className="chip press" onClick={() => seek(30)}>
            +30s
          </button>
        )}
        {!live && (
          <button type="button" className="chip press" onClick={() => setRate(p.rate >= 1.5 ? 1 : p.rate + 0.25)}>
            {p.rate}×
          </button>
        )}
      </div>
    </div>
  );
}

export function PodcastScreen({ params }: { params: Record<string, string> }) {
  const feedUrl = params.feed;
  const { data, error, reload } = useCached<PodcastFeed>(`/api/sunein/feed?url=${encodeURIComponent(feedUrl)}`, 60 * 60_000);
  const sunein = usePersisted(suneinStore);
  const p = usePlayer();
  const eps = (data?.episodes ?? []).filter((e) => e.audioUrl).slice(0, 60);
  const tracks: Track[] = eps.map((e) => ({ key: `${feedUrl}#${e.id}`, src: e.audioUrl!, title: e.title, sub: data?.title ?? "", kind: "podcast", feedUrl }));
  return (
    <Page title={data?.title ?? "Podcast"} back>
      {data?.author && <p className="-mt-1 mb-3 text-sm text-ink-2">{data.author}</p>}
      {error ? (
        <Problem title="This podcast couldn't be loaded" text={error} onRetry={reload} />
      ) : !data ? (
        <Skeleton className="h-96" />
      ) : (
        <ol className="space-y-2">
          {eps.map((e, i) => {
            const key = `${feedUrl}#${e.id}`;
            const saved = sunein.progress[key];
            const on = p.track?.key === key;
            return (
              <li key={key}>
                <button type="button" className={cx("glass press flex w-full items-center gap-3 p-3 text-start", on && "!border-emerald/60")} onClick={() => (on ? toggle() : play(tracks, i))}>
                  <span className={cx("grid size-10 shrink-0 place-items-center rounded-full", on ? "bg-emerald text-[#06231a]" : "bg-white/[0.06]")}>
                    {on && p.playing ? <Pause size={18} /> : <Play size={18} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-medium">{e.title}</span>
                    <span className="block text-xs text-ink-3">
                      {e.publishedAt ? new Date(e.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
                      {e.durationSec ? ` · ${fmtTime(e.durationSec)}` : ""}
                      {saved ? ` · stopped at ${fmtTime(saved.pos)}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </Page>
  );
}

interface Result {
  title: string;
  author?: string;
  feedUrl: string;
}

function AddPodcast({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (q.trim().length < 2 || /^https?:\/\//.test(q.trim())) return setResults([]);
    const t = setTimeout(() => {
      setBusy(true);
      api<{ results: Result[] }>(`/api/sunein/search?q=${encodeURIComponent(q.trim())}`)
        .then((r) => setResults(r.results.filter((x, i, a) => a.findIndex((y) => y.feedUrl === x.feedUrl) === i)))
        .catch(() => setResults([]))
        .finally(() => setBusy(false));
    }, 400);
    return () => clearTimeout(t);
  }, [q]);
  const add = (feedUrl: string, title: string) => {
    suneinStore.set((s) => (s.podcasts.some((x) => x.feedUrl === feedUrl) ? s : { ...s, podcasts: [...s.podcasts, { feedUrl, title: title.slice(0, 200) }] }));
    toast(`Added ${title}`);
    setQ("");
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title="Add a podcast">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-ink-3" />
        <input autoFocus className={`${inputCls} ps-10`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, or paste an RSS link" />
      </div>
      {/^https:\/\//.test(q.trim()) && (
        <Btn tone="primary" className="mt-3 w-full" onClick={() => add(q.trim(), "Podcast")}>
          Add this feed
        </Btn>
      )}
      {busy && <p className="mt-3 text-sm text-ink-3">Searching…</p>}
      <ul className="mt-2 max-h-[50vh] space-y-1 overflow-y-auto pb-4">
        {results.map((r) => (
          <li key={r.feedUrl}>
            <button type="button" className="press w-full rounded-xl px-3 py-2.5 text-start hover:bg-white/[0.05]" onClick={() => add(r.feedUrl, r.title)}>
              <span className="block truncate">{r.title}</span>
              {r.author && <span className="block truncate text-xs text-ink-3">{r.author}</span>}
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
