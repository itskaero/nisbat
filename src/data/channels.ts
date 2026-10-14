import type { Channel } from "@/types/domain";

/**
 * Live TV channel directory.
 *
 * Stream policy:
 * - `provenance: "broadcaster"` — the HLS URL is served from a domain operated
 *   by the broadcaster itself (checked on the date in `verifiedOn`). It is
 *   publicly reachable with no login, token, DRM or geo-unlock.
 * - Channels without a verified public stream are listed with an
 *   `unavailableReason` and a link to the broadcaster's own website. We never
 *   embed restreams, scraped tokens or DRM-protected sources.
 * - Community playlists (iptv-org) are opt-in from Settings, clearly labelled,
 *   and loaded separately (see /api/tv/community).
 *
 * To add a channel: confirm the stream is published by the broadcaster (or its
 * official distribution partner), is HTTPS, needs no auth, and plays in a
 * browser; then add it here with the date you verified it.
 */

const NO_PUBLIC_STREAM = "No public stream verified for third-party playback. Watch on the broadcaster's own website or app.";

export const CHANNELS: Channel[] = [
  // News
  {
    id: "dunya-news",
    name: "Dunya News",
    category: "news",
    language: "Urdu",
    country: "PK",
    website: "https://dunyanews.tv/live",
    description: "24-hour Urdu news from Dunya Media Group.",
    stream: {
      url: "https://imob.dunyanews.tv/livehd/ngrp:dunyalivehd_2_all/playlist.m3u8",
      type: "hls",
      provenance: "broadcaster",
      source: "dunyanews.tv (broadcaster domain)",
      verifiedOn: "2026-10-13",
    },
  },
  {
    id: "lahore-news",
    name: "Lahore News",
    category: "regional",
    language: "Urdu / Punjabi",
    country: "PK",
    website: "https://lahorenews.tv/",
    description: "Lahore-focused local news, part of Dunya Media Group.",
    stream: {
      url: "https://vcdn.dunyanews.tv/lahorelive/ngrp:lnews_1_all/playlist.m3u8",
      type: "hls",
      provenance: "broadcaster",
      source: "dunyanews.tv (Dunya Media Group domain)",
      verifiedOn: "2026-10-13",
    },
  },
  {
    id: "al-jazeera-english",
    name: "Al Jazeera English",
    category: "news",
    language: "English",
    country: "QA",
    website: "https://www.aljazeera.com/live",
    description: "International news from Doha.",
    stream: {
      url: "https://live-hls-apps-aje-fa.getaj.net/AJE/index.m3u8",
      type: "hls",
      provenance: "broadcaster",
      source: "getaj.net (Al Jazeera streaming domain)",
      verifiedOn: "2026-10-13",
    },
  },
  { id: "ptv-news", name: "PTV News", category: "news", language: "Urdu", country: "PK", website: "https://ptv.com.pk/", unavailableReason: NO_PUBLIC_STREAM },
  { id: "geo-news", name: "Geo News", category: "news", language: "Urdu", country: "PK", website: "https://live.geo.tv/", unavailableReason: NO_PUBLIC_STREAM },
  { id: "ary-news", name: "ARY News", category: "news", language: "Urdu", country: "PK", website: "https://arynews.tv/live/", unavailableReason: NO_PUBLIC_STREAM },
  { id: "samaa", name: "Samaa TV", category: "news", language: "Urdu", country: "PK", website: "https://www.samaa.tv/live", unavailableReason: NO_PUBLIC_STREAM },
  { id: "express-news", name: "Express News", category: "news", language: "Urdu", country: "PK", website: "https://www.express.pk/live/", unavailableReason: NO_PUBLIC_STREAM },
  { id: "hum-news", name: "Hum News", category: "news", language: "Urdu", country: "PK", website: "https://humnews.pk/live/", unavailableReason: NO_PUBLIC_STREAM },

  // Sports
  { id: "ptv-sports", name: "PTV Sports", category: "sports", language: "Urdu / English", country: "PK", website: "https://ptv.com.pk/", unavailableReason: "Sports rights are licensed per event; no public stream is offered for third-party playback." },
  { id: "a-sports", name: "A Sports", category: "sports", language: "Urdu / English", country: "PK", website: "https://www.asports.tv/", unavailableReason: "Sports rights are licensed per event; watch on the broadcaster's official platform." },
  { id: "geo-super", name: "Geo Super", category: "sports", language: "Urdu", country: "PK", website: "https://www.geosuper.tv/", unavailableReason: NO_PUBLIC_STREAM },

  // Entertainment
  { id: "hum-tv", name: "Hum TV", category: "entertainment", language: "Urdu", country: "PK", website: "https://hum.tv/", unavailableReason: NO_PUBLIC_STREAM },
  { id: "ary-digital", name: "ARY Digital", category: "entertainment", language: "Urdu", country: "PK", website: "https://arydigital.tv/", unavailableReason: NO_PUBLIC_STREAM },
  { id: "geo-entertainment", name: "Geo Entertainment", category: "entertainment", language: "Urdu", country: "PK", website: "https://harpalgeo.tv/", unavailableReason: NO_PUBLIC_STREAM },
  { id: "ptv-home", name: "PTV Home", category: "entertainment", language: "Urdu", country: "PK", website: "https://ptv.com.pk/", unavailableReason: NO_PUBLIC_STREAM },

  // Islamic
  {
    id: "madani-channel",
    name: "Madani Channel",
    category: "islamic",
    language: "Urdu",
    country: "PK",
    website: "https://www.madanichannel.tv/",
    description: "Islamic programming in Urdu.",
    stream: {
      url: "https://streaming.madanichannel.tv/static/streaming-playlists/hls/b9790f10-cb0d-4e30-82bf-84a756234e58/master.m3u8",
      type: "hls",
      provenance: "broadcaster",
      source: "madanichannel.tv (broadcaster domain)",
      verifiedOn: "2026-10-13",
    },
  },
  { id: "qtv", name: "QTV", category: "islamic", language: "Urdu", country: "PK", website: "https://arydigital.tv/", unavailableReason: NO_PUBLIC_STREAM },
  { id: "paigham-tv", name: "Paigham TV", category: "islamic", language: "Urdu", country: "PK", website: "https://paigham.tv/", unavailableReason: NO_PUBLIC_STREAM },

  // Educational
  { id: "ptv-teleschool", name: "PTV Teleschool", category: "educational", language: "Urdu / English", country: "PK", website: "https://ptv.com.pk/", unavailableReason: NO_PUBLIC_STREAM },

  // Regional
  { id: "ptv-national", name: "PTV National", category: "regional", language: "Regional languages", country: "PK", website: "https://ptv.com.pk/", unavailableReason: NO_PUBLIC_STREAM },
  { id: "ktn", name: "KTN", category: "regional", language: "Sindhi", country: "PK", website: "https://www.ktntv.tv/", unavailableReason: NO_PUBLIC_STREAM },
  { id: "khyber-news", name: "Khyber News", category: "regional", language: "Pashto", country: "PK", website: "https://www.khybernews.tv/", unavailableReason: NO_PUBLIC_STREAM },
];

export const CHANNEL_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "news", label: "News" },
  { id: "sports", label: "Sports" },
  { id: "entertainment", label: "Entertainment" },
  { id: "islamic", label: "Islamic" },
  { id: "educational", label: "Educational" },
  { id: "regional", label: "Regional" },
  { id: "kids", label: "Kids" },
  { id: "other", label: "Other" },
] as const;
