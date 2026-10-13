"use client";

import { AlertTriangle, Headphones, Loader2, Pause, Play, Plus, Radio, Search, Trash2, MonitorPlay, Tv2 } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Badge, Button, EmptyState, IconButton, Input, Panel, Segmented, Skeleton, SourceNote, cn } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/dates";
import { useDebounced, useFetch } from "@/lib/hooks";
import { useHydrated, usePersisted } from "@/lib/storage/persisted-store";
import { suneinStore } from "@/lib/storage/stores";
import { fmtTime, useListening } from "./listening";
import { RADIO_STATIONS, type PodcastFeed, type Video } from "./sources";

type Tab = "podcasts" | "youtube" | "radio";

export function SuneinPage() {
  const [tab, setTab] = useState<Tab>("podcasts");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight md:text-3xl">
          <Headphones className="size-7 text-emerald" aria-hidden /> Sunein <span className="font-urdu text-xl text-ink-2" lang="ur">سنیں</span>
        </h1>
        <p className="mt-1 text-sm text-ink-2">Urdu stories, poetry, talks and Radio Pakistan — picks up where you left off, on any screen.</p>
      </div>
      <ContinueListening />
      <Segmented
        label="Sunein sections"
        value={tab}
        onChange={setTab}
        options={[
          { value: "podcasts", label: <><Headphones className="size-3.5" /> Podcasts</> },
          { value: "youtube", label: <><MonitorPlay className="size-3.5" /> YouTube</> },
          { value: "radio", label: <><Radio className="size-3.5" /> Radio</> },
        ]}
      />
      {tab === "podcasts" && <Podcasts />}
      {tab === "youtube" && <YouTube />}
      {tab === "radio" && <RadioList />}
    </div>
  );
}

function ContinueListening() {
  const { progress } = usePersisted(suneinStore);
  const hydrated = useHydrated();
  const l = useListening();
  const items = Object.entries(progress)
    .filter(([, p]) => p.pos < p.dur - 30)
    .sort(([, a], [, b]) => b.at.localeCompare(a.at))
    .slice(0, 6);
  if (!hydrated || !items.length) return null;
  return (
    <Panel className="p-4" aria-labelledby="continue-title">
      <h2 id="continue-title" className="mb-3 text-sm font-semibold">Continue listening</h2>
      <ul className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1">
        {items.map(([key, p]) => (
          <li key={key} className="w-64 shrink-0">
            <button
              type="button"
              onClick={() => l.play({ key, url: p.url, title: p.title, show: p.show, feedUrl: p.feedUrl })}
              className="glass-soft flex w-full items-center gap-3 p-3 text-start hover:bg-white/8"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald/15 text-emerald">
                <Play className="ms-0.5 size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{p.title}</span>
                <span className="block truncate text-[11px] text-ink-3">{p.show} · {fmtTime(p.dur - p.pos)} left</span>
                <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full bg-emerald" style={{ width: `${(p.pos / p.dur) * 100}%` }} />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* Podcasts ----------------------------------------------------------- */

function Podcasts() {
  const { podcasts } = usePersisted(suneinStore);
  const [selected, setSelected] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const feedUrl = selected ?? podcasts[0]?.feedUrl ?? null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Panel className="p-3 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto" aria-label="Your podcasts">
        <ul className="space-y-1">
          {podcasts.map((p) => (
            <li key={p.feedUrl} className="group flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelected(p.feedUrl)}
                aria-current={feedUrl === p.feedUrl ? "true" : undefined}
                className={cn("min-w-0 flex-1 truncate rounded-xl px-3 py-2.5 text-start text-sm", feedUrl === p.feedUrl ? "bg-emerald/12 text-ink ring-1 ring-emerald/25" : "text-ink-2 hover:bg-white/6")}
              >
                {p.title}
              </button>
              <IconButton
                label={`Remove ${p.title}`}
                size="sm"
                className="opacity-60 hover:!text-coral group-hover:opacity-100"
                onClick={() => suneinStore.set((s) => ({ ...s, podcasts: s.podcasts.filter((x) => x.feedUrl !== p.feedUrl) }))}
              >
                <Trash2 className="size-3.5" />
              </IconButton>
            </li>
          ))}
        </ul>
        <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" /> Add a podcast
        </Button>
      </Panel>
      {feedUrl ? <Episodes feedUrl={feedUrl} /> : <Panel><EmptyState icon={<Headphones className="size-5" />} title="No podcasts yet" description="Add one to start listening." /></Panel>}
      <AddPodcastDialog open={addOpen} onClose={() => setAddOpen(false)} onAdded={setSelected} />
    </div>
  );
}

function Episodes({ feedUrl }: { feedUrl: string }) {
  const { data, error, loading, reload } = useFetch<PodcastFeed>(`/api/sunein/feed?url=${encodeURIComponent(feedUrl)}`);
  const { progress } = usePersisted(suneinStore);
  const l = useListening();
  if (error)
    return (
      <Panel>
        <EmptyState tone="error" icon={<AlertTriangle className="size-5" />} title="This podcast couldn't be loaded" description={error} action={<Button size="sm" onClick={reload}>Try again</Button>} />
      </Panel>
    );
  if (!data || loading)
    return (
      <Panel className="space-y-3 p-5">
        <Skeleton className="h-24" />
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
      </Panel>
    );
  return (
    <Panel className="glass-reading p-4 sm:p-5" aria-labelledby="show-title">
      <div className="flex items-center gap-4">
        {data.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.image} alt="" className="size-20 shrink-0 rounded-2xl object-cover" referrerPolicy="no-referrer" />
        )}
        <div className="min-w-0">
          <h2 id="show-title" className="text-lg font-semibold">{data.title}</h2>
          {data.author && <p className="text-sm text-ink-2">{data.author}</p>}
          <p className="text-xs text-ink-3">{data.episodes.length} episodes</p>
        </div>
      </div>
      <ol className="mt-4 divide-y divide-white/6">
        {data.episodes.map((ep) => {
          const key = `${feedUrl}#${ep.id}`;
          const saved = progress[key];
          const isCurrent = l.current?.key === key;
          const playing = isCurrent && (l.status === "playing" || l.status === "loading");
          const done = saved && saved.pos >= saved.dur - 30;
          return (
            <li key={key} className="flex items-start gap-3 py-3">
              <button
                type="button"
                disabled={!ep.audioUrl}
                onClick={() => (isCurrent ? l.toggle() : ep.audioUrl && l.play({ key, url: ep.audioUrl, title: ep.title, show: data.title, artwork: ep.image ?? data.image, feedUrl }))}
                aria-label={playing ? `Pause ${ep.title}` : `Play ${ep.title}`}
                className={cn("mt-0.5 grid size-11 shrink-0 place-items-center rounded-full border transition-colors disabled:opacity-30", isCurrent ? "border-emerald bg-emerald text-[#06231a]" : "border-white/15 bg-white/5 text-ink hover:border-emerald")}
              >
                {isCurrent && l.status === "loading" ? <Loader2 className="size-4 animate-spin" /> : playing ? <Pause className="size-4" /> : <Play className="ms-0.5 size-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[0.95rem] leading-snug text-ink" dir="auto">{ep.title}</p>
                <p className="mt-0.5 text-xs text-ink-3">
                  {ep.publishedAt ? timeAgo(ep.publishedAt) : ""}
                  {ep.durationSec ? ` · ${fmtTime(ep.durationSec)}` : ""}
                  {saved && !done ? ` · ${fmtTime(saved.dur - saved.pos)} left` : ""}
                  {done ? " · Finished" : ""}
                  {!ep.audioUrl ? " · Not playable (insecure link)" : ""}
                </p>
                {ep.description && <p className="mt-1 line-clamp-2 text-xs text-ink-2" dir="auto">{ep.description}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      <SourceNote className="mt-3">Streamed from the publisher&apos;s feed; Nisbat doesn&apos;t download or re-host episodes.</SourceNote>
    </Panel>
  );
}

function AddPodcastDialog({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (feedUrl: string) => void }) {
  const [q, setQ] = useState("urdu");
  const debounced = useDebounced(q.trim(), 400);
  const { data, loading } = useFetch<{ results: { title: string; author?: string; feedUrl: string; artwork?: string; episodes?: number; latest?: string }[] }>(
    open && debounced.length >= 2 && !debounced.startsWith("https://") ? `/api/sunein/search?q=${encodeURIComponent(debounced)}` : null,
  );
  const { podcasts } = usePersisted(suneinStore);
  const { toast } = useToast();
  const add = (feedUrl: string, title: string) => {
    suneinStore.set((s) => (s.podcasts.some((p) => p.feedUrl === feedUrl) ? s : { ...s, podcasts: [...s.podcasts, { feedUrl, title: title.slice(0, 200) }] }));
    toast(`Added ${title}`);
    onAdded(feedUrl);
    onClose();
  };
  const isUrl = q.trim().startsWith("https://");
  return (
    <Dialog open={open} onClose={onClose} title="Add a podcast" description="Search Apple Podcasts' directory, or paste a podcast's RSS link." size="lg">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Urdu stories, Manto, history…" aria-label="Search podcasts or paste RSS link" className="ps-9" />
      </div>
      {isUrl ? (
        <Button className="mt-4" variant="primary" onClick={() => add(q.trim(), new URL(q.trim()).hostname)}>
          <Plus className="size-4" /> Add this RSS feed
        </Button>
      ) : loading && !data ? (
        <div className="mt-4 space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : (
        <ul className="mt-4 space-y-1">
          {(data?.results ?? []).filter((r, i, all) => all.findIndex((x) => x.feedUrl === r.feedUrl) === i).map((r) => {
            const added = podcasts.some((p) => p.feedUrl === r.feedUrl);
            return (
              <li key={r.feedUrl} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5">
                {r.artwork ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.artwork} alt="" className="size-12 shrink-0 rounded-lg" />
                ) : (
                  <span className="size-12 shrink-0 rounded-lg bg-white/8" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm" dir="auto">{r.title}</span>
                  <span className="block truncate text-xs text-ink-3">
                    {r.author}
                    {r.episodes ? ` · ${r.episodes} episodes` : ""}
                    {r.latest ? ` · latest ${timeAgo(r.latest)}` : ""}
                  </span>
                </span>
                <Button size="sm" variant={added ? "ghost" : "secondary"} disabled={added} onClick={() => add(r.feedUrl, r.title)}>
                  {added ? "Added" : "Add"}
                </Button>
              </li>
            );
          })}
          {data && !data.results.length && <li className="py-6 text-center text-sm text-ink-3">No podcasts found.</li>}
        </ul>
      )}
    </Dialog>
  );
}

/* YouTube -------------------------------------------------------------- */

function YouTube() {
  const { channels } = usePersisted(suneinStore);
  const [selected, setSelected] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [video, setVideo] = useState<Video | null>(null);
  const { toast } = useToast();
  const channel = selected ?? channels[0]?.id ?? null;
  const feed = useFetch<{ title: string; videos: Video[] }>(channel ? `/api/sunein/youtube?channel=${channel}` : null);

  const add = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/sunein/resolve?q=${encodeURIComponent(link.trim())}`);
      const body = await r.json();
      if (!r.ok) throw new Error(body.error);
      suneinStore.set((s) => (s.channels.some((c) => c.id === body.id) ? s : { ...s, channels: [...s.channels, { id: body.id, title: body.title }] }));
      setSelected(body.id);
      setLink("");
      toast(`Added ${body.title}`);
    } catch (e) {
      toast((e as Error).message || "Couldn't add that channel", { tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel className="p-4">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (link.trim()) void add();
          }}
        >
          <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste a YouTube channel link or @handle (lectures, history, documentaries…)" aria-label="YouTube channel" className="min-w-0 flex-1" />
          <Button type="submit" variant="primary" loading={busy} disabled={!link.trim()}>
            <Plus className="size-4" /> Add channel
          </Button>
        </form>
        {channels.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {channels.map((c) => (
              <li key={c.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setSelected(c.id)}
                  aria-current={channel === c.id ? "true" : undefined}
                  className={cn("h-8 rounded-s-full border px-3 text-xs", channel === c.id ? "border-emerald/50 bg-emerald/15 text-emerald" : "border-white/12 text-ink-2")}
                >
                  {c.title}
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${c.title}`}
                  onClick={() => suneinStore.set((s) => ({ ...s, channels: s.channels.filter((x) => x.id !== c.id) }))}
                  className="grid h-8 w-8 place-items-center rounded-e-full border border-s-0 border-white/12 text-ink-3 hover:text-coral"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {!channel ? (
        <Panel>
          <EmptyState icon={<Tv2 className="size-5" />} title="Add the channels your family likes" description="Islamic lectures, Pakistan history, documentaries, cooking — paste the channel link above. Videos play in YouTube's own player." />
        </Panel>
      ) : feed.error ? (
        <Panel><EmptyState tone="error" title="This channel's videos couldn't be loaded" description={feed.error} action={<Button size="sm" onClick={feed.reload}>Try again</Button>} /></Panel>
      ) : !feed.data ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-video" />)}</div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {feed.data.videos.map((v) => (
            <li key={v.id}>
              <button type="button" onClick={() => setVideo(v)} className="glass group block w-full overflow-hidden !rounded-2xl text-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.thumbnail} alt="" loading="lazy" className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                <span className="block p-3">
                  <span className="line-clamp-2 text-sm text-ink" dir="auto">{v.title}</span>
                  <span className="mt-1 block text-xs text-ink-3">{v.publishedAt ? timeAgo(v.publishedAt) : ""}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={!!video} onClose={() => setVideo(null)} title={video?.title ?? ""} size="xl">
        {video && (
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
              title={video.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="h-full w-full border-0"
            />
          </div>
        )}
      </Dialog>
    </div>
  );
}

/* Radio ---------------------------------------------------------------- */

function RadioList() {
  const l = useListening();
  return (
    <Panel className="p-4 sm:p-5" aria-labelledby="radio-title">
      <h2 id="radio-title" className="text-sm font-semibold">Radio Pakistan</h2>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {RADIO_STATIONS.map((s) => {
          const isCurrent = l.current?.key === s.id;
          const playing = isCurrent && (l.status === "playing" || l.status === "loading");
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => (isCurrent ? l.toggle() : l.play({ key: s.id, url: s.url, title: s.name, show: "Radio Pakistan", live: true }))}
                className={cn("glass-soft flex w-full items-center gap-3 p-3 text-start hover:bg-white/8", isCurrent && "border-emerald/40")}
              >
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", isCurrent ? "bg-emerald text-[#06231a]" : "bg-white/8 text-ink")}>
                  {isCurrent && l.status === "loading" ? <Loader2 className="size-4 animate-spin" /> : playing ? <Pause className="size-4" /> : <Radio className="size-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{s.name}</span>
                  <span lang="ur" className="block font-urdu text-sm text-ink-3">{s.nameUr}</span>
                </span>
                {playing && <Badge tone="coral">Live</Badge>}
              </button>
            </li>
          );
        })}
      </ul>
      <SourceNote className="mt-3">Official Radio Pakistan streams (radio.gov.pk). Availability depends on the broadcaster; if a station doesn&apos;t start, try another.</SourceNote>
    </Panel>
  );
}
