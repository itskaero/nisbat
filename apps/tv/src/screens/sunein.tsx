import { Pause, Play, Radio } from "lucide-react";
import { RADIO_STATIONS, type PodcastFeed } from "@/features/sunein/sources";
import { usePersisted } from "@/lib/storage/persisted-store";
import { suneinStore } from "@/lib/storage/stores";
import { Card, Problem, ScreenHeader, Skeleton, Source, Tile, cx } from "../components/ui";
import { useCached } from "../lib/cached";
import { fmtTime, play, toggle, usePlayer, type Track } from "../lib/player";
import { navigate, useRoute } from "../lib/router";

export function SuneinScreen() {
  const { query } = useRoute();
  const feed = query.get("feed");
  return feed ? <Episodes feedUrl={feed} /> : <Hub />;
}

function Hub() {
  const sunein = usePersisted(suneinStore);
  const p = usePlayer();
  const resume = Object.entries(sunein.progress)
    .sort(([, a], [, b]) => b.at.localeCompare(a.at))
    .filter(([, v]) => v.pos < v.dur - 30)
    .slice(0, 4);
  return (
    <>
      <ScreenHeader title="Sunein" ur="سنیں" sub="Urdu podcasts and Radio Pakistan — listening positions are shared with the family's phones." />
      {resume.length > 0 && (
        <Card title="Continue listening" class="mb-6">
          <div class="grid grid-cols-2 gap-4">
            {resume.map(([key, v], i) => (
              <Tile
                key={key}
                class="p-5"
                data-autofocus={i === 0 ? "" : undefined}
                onClick={() => play([{ key, src: v.url, title: v.title, sub: v.show, kind: "podcast", feedUrl: v.feedUrl }])}
              >
                <p class="line-clamp-1 text-xl font-medium">{v.title}</p>
                <p class="mt-1 text-base text-ink-3">
                  {v.show} · {fmtTime(v.pos)} of {fmtTime(v.dur)}
                </p>
                <div class="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                  <div class="h-full origin-left rounded-full bg-emerald" style={{ transform: `scaleX(${v.pos / v.dur})` }} />
                </div>
              </Tile>
            ))}
          </div>
        </Card>
      )}
      <div class="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6">
        <Card title="Podcasts">
          <div class="grid grid-cols-2 gap-3">
            {sunein.podcasts.map((pod, i) => (
              <Tile key={pod.feedUrl} class="p-5" data-autofocus={!resume.length && i === 0 ? "" : undefined} onClick={() => navigate(`/sunein?feed=${encodeURIComponent(pod.feedUrl)}`)}>
                <p class="line-clamp-2 text-lg font-medium">{pod.title}</p>
              </Tile>
            ))}
          </div>
          <p class="mt-4 text-base text-ink-3">Add podcasts from the website or the phone app; they appear here for everyone.</p>
        </Card>
        <Card title="Radio Pakistan" icon={<Radio size={18} />}>
          <ul class="space-y-2">
            {RADIO_STATIONS.map((st) => {
              const on = p.track?.key === st.id;
              return (
                <li key={st.id}>
                  <button
                    type="button"
                    class={cx("flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-start", on ? "bg-emerald/15 text-emerald" : "bg-white/[0.04]")}
                    onClick={() => (on ? toggle() : play([{ key: st.id, src: st.url, title: st.name, sub: "Radio Pakistan", kind: "radio" }]))}
                  >
                    {on && p.playing ? <Pause size={20} /> : <Play size={20} />}
                    <span class="flex-1 text-lg">{st.name.replace("Radio Pakistan ", "")}</span>
                    <span lang="ur" class="font-urdu text-base opacity-70">
                      {st.nameUr.replace("ریڈیو پاکستان ", "")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
      <Source>Audio streams from each publisher&apos;s own servers; nothing is downloaded or re-hosted.</Source>
    </>
  );
}

function Episodes({ feedUrl }: { feedUrl: string }) {
  const { data, error, reload } = useCached<PodcastFeed>(`/api/sunein/feed?url=${encodeURIComponent(feedUrl)}`, 60 * 60_000);
  const sunein = usePersisted(suneinStore);
  const p = usePlayer();
  const eps = (data?.episodes ?? []).filter((e) => e.audioUrl).slice(0, 40);
  const tracks: Track[] = eps.map((e) => ({ key: `${feedUrl}#${e.id}`, src: e.audioUrl!, title: e.title, sub: data?.title ?? "", kind: "podcast", feedUrl }));
  return (
    <>
      <ScreenHeader title={data?.title ?? "Podcast"} sub={data?.author} />
      {error ? (
        <Problem title="This podcast couldn't be loaded" text={error} onRetry={reload} />
      ) : !data ? (
        <Skeleton class="h-96" />
      ) : (
        <ol class="space-y-3">
          {eps.map((e, i) => {
            const key = `${feedUrl}#${e.id}`;
            const saved = sunein.progress[key];
            const on = p.track?.key === key;
            return (
              <li key={key}>
                <button
                  type="button"
                  data-autofocus={i === 0 ? "" : undefined}
                  class={cx("card flex w-full items-center gap-5 p-5 text-start", on && "!border-emerald/60")}
                  onClick={() => (on ? toggle() : play(tracks, i))}
                >
                  <span class={cx("grid size-12 shrink-0 place-items-center rounded-full", on ? "bg-emerald text-[#06231a]" : "bg-white/[0.06]")}>
                    {on && p.playing ? <Pause size={22} /> : <Play size={22} />}
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-xl">{e.title}</span>
                    <span class="block text-base text-ink-3">
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
    </>
  );
}
