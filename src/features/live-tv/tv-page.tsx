"use client";

import { ChevronLeft, ChevronRight, ExternalLink, Heart, History, Info, Plus, Radio, Search, ShieldCheck, Trash2, Tv, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useId, useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Badge, Button, ChipRow, EmptyState, Field, IconButton, Input, Panel, Select, SourceNote, cn } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { CHANNEL_CATEGORIES, CHANNELS } from "@/data/channels";
import { timeAgo } from "@/lib/dates";
import { useFetch } from "@/lib/hooks";
import { uid, useHydrated, usePersisted } from "@/lib/storage/persisted-store";
import { logActivity, settingsStore, tvStore } from "@/lib/storage/stores";
import type { Channel, ChannelCategory } from "@/types/domain";
import { ChannelLogo } from "./channel-logo";
import { HlsPlayer } from "./hls-player";

type CatFilter = ChannelCategory | "all" | "favorites";

export function TvPage() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const tv = usePersisted(tvStore);
  const settings = usePersisted(settingsStore);
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CatFilter>("all");
  const [addOpen, setAddOpen] = useState(false);

  const community = useFetch<{ channels: Channel[]; fetchedAt: string }>(settings.communityStreams ? "/api/tv/community" : null);

  const userChannels: Channel[] = useMemo(
    () =>
      tv.custom.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        stream: { url: c.url, type: c.url.toLowerCase().includes(".m3u8") ? "hls" : "mp4", provenance: "user", source: "Added by you" },
      })),
    [tv.custom],
  );

  const all = useMemo(() => {
    const list = [...CHANNELS, ...userChannels];
    if (settings.communityStreams && community.data) {
      const names = new Set(list.map((c) => c.name.toLowerCase()));
      list.push(...community.data.channels.filter((c) => !names.has(c.name.toLowerCase())));
    }
    return list;
  }, [userChannels, settings.communityStreams, community.data]);

  const selectedId = params.get("ch");
  const playable = all.filter((c) => c.stream);
  const selected = all.find((c) => c.id === selectedId) ?? playable[0];

  const select = useCallback(
    (id: string) => router.replace(`${pathname}?ch=${encodeURIComponent(id)}`, { scroll: false }),
    [router, pathname],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter(
      (c) =>
        (cat === "all" || (cat === "favorites" ? tv.favorites.includes(c.id) : c.category === cat)) &&
        (!needle || c.name.toLowerCase().includes(needle) || c.language?.toLowerCase().includes(needle)),
    );
  }, [all, q, cat, tv.favorites]);

  const recent = tv.recent.map((r) => ({ ...r, channel: all.find((c) => c.id === r.id) })).filter((r) => r.channel).slice(0, 6);

  const idx = selected ? playable.findIndex((c) => c.id === selected.id) : -1;
  const step = (dir: 1 | -1) => {
    if (!playable.length) return;
    const next = playable[(idx + dir + playable.length) % playable.length];
    select(next.id);
  };

  const onPlaying = useCallback(() => {
    if (!selected) return;
    tvStore.set((s) => ({ ...s, recent: [{ id: selected.id, at: new Date().toISOString() }, ...s.recent.filter((r) => r.id !== selected.id)].slice(0, 20) }));
    logActivity("tv-watched", `Watched ${selected.name}`, `/tv?ch=${selected.id}`);
  }, [selected]);

  const toggleFav = (id: string, name: string) => {
    const on = !tv.favorites.includes(id);
    tvStore.set((s) => ({ ...s, favorites: on ? [id, ...s.favorites] : s.favorites.filter((f) => f !== id) }));
    toast(on ? `${name} added to favourites` : `${name} removed from favourites`, { tone: on ? "success" : "info" });
  };

  const fav = selected ? tv.favorites.includes(selected.id) : false;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight md:text-3xl">
            <Tv className="size-7 text-emerald" aria-hidden /> Live TV
          </h1>
          <p className="mt-1 text-sm text-ink-2">Pakistani and international channels — only streams we could verify are playable here.</p>
        </div>
        <Button variant="secondary" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" /> Add your stream
        </Button>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-4">
          <Panel className="p-3 sm:p-4">
            {selected?.stream ? (
              <HlsPlayer key={selected.id} channel={selected} onPlaying={onPlaying} onNext={() => step(1)} onPrev={() => step(-1)} />
            ) : selected ? (
              <UnavailableCard channel={selected} />
            ) : (
              <div className="grid aspect-video place-items-center rounded-2xl bg-black/40">
                <EmptyState icon={<Tv className="size-5" />} title="Choose a channel" />
              </div>
            )}
            {selected && (
              <div className="mt-4 flex flex-wrap items-center gap-3 px-1">
                <ChannelLogo name={selected.name} />
                <div className="min-w-0 flex-1">
                  <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold">
                    {selected.name}
                    {selected.stream && (
                      <Badge tone="coral">
                        <Radio className="size-3" /> Live
                      </Badge>
                    )}
                    <ProvenanceBadge channel={selected} />
                  </h2>
                  <p className="truncate text-xs text-ink-3">
                    {[CHANNEL_CATEGORIES.find((c) => c.id === selected.category)?.label, selected.language, selected.description].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <IconButton label="Previous channel" onClick={() => step(-1)} disabled={playable.length < 2}>
                    <ChevronLeft className="size-5 rtl:-scale-x-100" />
                  </IconButton>
                  <IconButton label={fav ? `Remove ${selected.name} from favourites` : `Add ${selected.name} to favourites`} aria-pressed={fav} className={cn(fav && "!text-coral")} onClick={() => toggleFav(selected.id, selected.name)}>
                    <Heart className={cn("size-5", fav && "fill-current")} />
                  </IconButton>
                  <IconButton label="Next channel" onClick={() => step(1)} disabled={playable.length < 2}>
                    <ChevronRight className="size-5 rtl:-scale-x-100" />
                  </IconButton>
                </div>
              </div>
            )}
            {selected?.stream && (
              <p className="mt-3 px-1 text-[11px] text-ink-3">
                Stream source: {selected.stream.source}
                {selected.stream.verifiedOn ? ` · checked ${selected.stream.verifiedOn}` : ""}. Programme guide (now playing) isn&apos;t available from this source.
              </p>
            )}
          </Panel>

          {hydrated && recent.length > 0 && (
            <Panel className="p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <History className="size-4 text-cyan" /> Recently watched
              </h2>
              <ul className="no-scrollbar flex gap-3 overflow-x-auto">
                {recent.map((r) => (
                  <li key={r.id}>
                    <button type="button" onClick={() => select(r.id)} className="flex w-40 items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] p-2 text-start hover:bg-white/[0.07]">
                      <ChannelLogo name={r.channel!.name} className="size-9 text-xs" />
                      <span className="min-w-0">
                        <span className="block truncate text-xs text-ink">{r.channel!.name}</span>
                        <span className="block text-[10px] text-ink-3" suppressHydrationWarning>
                          {timeAgo(r.at)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <Panel className="flex flex-col p-4 xl:sticky xl:top-4 xl:max-h-[calc(100dvh-2rem)]" aria-labelledby="channels-title">
          <h2 id="channels-title" className="sr-only">
            Channels
          </h2>
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
            <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search channels" aria-label="Search channels" className="h-10 ps-9" />
          </div>
          <ChipRow
            className="mt-3"
            label="Channel category"
            value={cat}
            onChange={setCat}
            options={[
              { value: "all" as CatFilter, label: "All" },
              { value: "favorites" as CatFilter, label: <><Heart className="size-3" /> Favourites</>, count: hydrated ? tv.favorites.length : undefined },
              ...CHANNEL_CATEGORIES.filter((c) => c.id !== "all" && all.some((ch) => ch.category === c.id)).map((c) => ({ value: c.id as CatFilter, label: c.label })),
            ]}
          />
          <ul className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto pe-1">
            {filtered.length === 0 && (
              <li>
                <EmptyState
                  icon={cat === "favorites" ? <Heart className="size-5" /> : <Search className="size-5" />}
                  title={cat === "favorites" ? "No favourites yet" : "No channels match"}
                  description={cat === "favorites" ? "Tap the heart under the player to save a channel." : "Try another search or category."}
                />
              </li>
            )}
            {filtered.map((c) => {
              const active = c.id === selected?.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => select(c.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn("flex w-full items-center gap-3 rounded-xl p-2 text-start transition-colors", active ? "bg-emerald/10 ring-1 ring-emerald/25" : "hover:bg-white/6")}
                  >
                    <ChannelLogo name={c.name} className="size-10 text-xs" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{c.name}</span>
                      <span className="block truncate text-[11px] text-ink-3">
                        {CHANNEL_CATEGORIES.find((x) => x.id === c.category)?.label}
                        {c.stream ? (c.stream.provenance === "broadcaster" ? " · Official stream" : c.stream.provenance === "user" ? " · Your stream" : " · Community (unverified)") : " · Not available here"}
                      </span>
                    </span>
                    {tv.favorites.includes(c.id) && <Heart className="size-3.5 shrink-0 fill-coral text-coral" aria-label="Favourite" />}
                    <span className={cn("size-2 shrink-0 rounded-full", c.stream ? "bg-emerald" : "bg-white/20")} aria-hidden />
                  </button>
                </li>
              );
            })}
            {settings.communityStreams && community.loading && <li className="px-2 py-3 text-xs text-ink-3">Loading community playlist…</li>}
            {settings.communityStreams && community.error && <li className="px-2 py-3 text-xs text-coral">Community playlist unavailable: {community.error}</li>}
          </ul>
          <div className="mt-3 border-t border-white/8 pt-3 text-[11px] leading-relaxed text-ink-3">
            <p className="flex items-start gap-1.5">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald" />
              Official streams are served from the broadcaster&apos;s own domain. Others link to the broadcaster&apos;s website.
            </p>
            <p className="mt-1 flex items-start gap-1.5">
              <Users className="mt-0.5 size-3.5 shrink-0" />
              Community streams ({settings.communityStreams ? "on" : "off"}) can be enabled in{" "}
              <Link href="/settings#live-tv" className="underline underline-offset-2">
                Settings
              </Link>
              .
            </p>
          </div>
        </Panel>
      </div>
      <SourceNote>
        Nisbat never bypasses DRM, logins, geo-restrictions or paywalls. Channel tiles are original monograms, not broadcaster logos. To suggest a verified
        stream, see the README&apos;s “Adding a channel” section.
      </SourceNote>
      <AddStreamDialog open={addOpen} onClose={() => setAddOpen(false)} onAdded={select} />
    </div>
  );
}

function ProvenanceBadge({ channel }: { channel: Channel }) {
  if (!channel.stream) return <Badge>No public stream</Badge>;
  if (channel.stream.provenance === "broadcaster")
    return (
      <Badge tone="emerald">
        <ShieldCheck className="size-3" /> Official
      </Badge>
    );
  if (channel.stream.provenance === "user") return <Badge tone="cyan">Your stream</Badge>;
  return <Badge tone="gold">Community · unverified</Badge>;
}

function UnavailableCard({ channel }: { channel: Channel }) {
  return (
    <div className="grid aspect-video place-items-center rounded-2xl bg-[radial-gradient(circle_at_50%_30%,#1a2840,#0b1220)] p-6 text-center">
      <div className="max-w-md space-y-3">
        <ChannelLogo name={channel.name} className="mx-auto size-16 text-lg" />
        <p className="text-base font-semibold">{channel.name} isn&apos;t playable in Nisbat</p>
        <p className="text-xs leading-relaxed text-ink-2">
          <Info className="me-1 inline size-3.5 align-[-2px]" />
          {channel.unavailableReason}
        </p>
        {channel.website && (
          <a
            href={channel.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald px-4 text-sm font-medium text-[#06231a] hover:bg-[#5fe0ab]"
          >
            Watch on official website <ExternalLink className="size-4" />
          </a>
        )}
      </div>
    </div>
  );
}

function AddStreamDialog({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (id: string) => void }) {
  const id = useId();
  const tv = usePersisted(tvStore);
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<ChannelCategory>("news");
  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});

  const submit = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Give the channel a name.";
    try {
      const u = new URL(url.trim());
      if (u.protocol !== "https:") e.url = "Use an https:// address.";
      else if (!/\.(m3u8|mp4|webm)$/i.test(u.pathname)) e.url = "Enter a direct stream address ending in .m3u8, .mp4 or .webm.";
    } catch {
      e.url = "Enter a valid URL.";
    }
    setErrors(e);
    if (Object.keys(e).length) return;
    const cid = uid("user-");
    tvStore.set((s) => ({ ...s, custom: [...s.custom, { id: cid, name: name.trim().slice(0, 60), url: url.trim(), category }] }));
    toast(`Added ${name.trim()}`);
    setName("");
    setUrl("");
    onClose();
    onAdded(cid);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add your own stream"
      description="For streams you're entitled to watch, e.g. a broadcaster's published HLS link. Shared with your family's Nisbat screens."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={id}>
            Add stream
          </Button>
        </>
      }
    >
      <form
        id={id}
        noValidate
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Channel name" htmlFor={`${id}-name`} error={errors.name}>
          <Input id={`${id}-name`} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
        </Field>
        <Field label="Stream URL" htmlFor={`${id}-url`} error={errors.url} hint="Direct HLS (.m3u8) or video file over HTTPS.">
          <Input id={`${id}-url`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/playlist.m3u8" inputMode="url" aria-invalid={!!errors.url} />
        </Field>
        <Field label="Category" htmlFor={`${id}-cat`}>
          <Select id={`${id}-cat`} value={category} onChange={(e) => setCategory(e.target.value as ChannelCategory)}>
            {CHANNEL_CATEGORIES.filter((c) => c.id !== "all").map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
      </form>
      {tv.custom.length > 0 && (
        <div className="mt-5 border-t border-white/8 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-3">Your streams</h3>
          <ul className="mt-2 space-y-1">
            {tv.custom.map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{c.name}</span>
                <IconButton
                  label={`Remove ${c.name}`}
                  size="sm"
                  onClick={() => tvStore.set((s) => ({ ...s, custom: s.custom.filter((x) => x.id !== c.id), favorites: s.favorites.filter((f) => f !== c.id) }))}
                >
                  <Trash2 className="size-4" />
                </IconButton>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Dialog>
  );
}
