/**
 * Starting points for Sunein (سنیں). Families add their own podcasts (iTunes
 * search or RSS link) and YouTube channels; these defaults were checked on
 * 2026-10-14. We stream from the publishers' own URLs — nothing is re-hosted.
 */
export interface PodcastRef {
  feedUrl: string;
  title: string;
}

export const DEFAULT_PODCASTS: PodcastRef[] = [
  { feedUrl: "https://anchor.fm/s/10a635640/podcast/rss", title: "Urdu Literature Classics (Manto, Mumtaz Mufti…)" },
  { feedUrl: "https://anchor.fm/s/612618ec/podcast/rss", title: "The Urdu Poetry Podcast" },
  { feedUrl: "https://rss.buzzsprout.com/1976917.rss", title: "The Urdu Ghazal Podcast" },
  { feedUrl: "https://feeds.transistor.fm/urdu-aaj-kal", title: "Urdu Aaj Kal (IBM)" },
  { feedUrl: "https://anchor.fm/s/3af8ced0/podcast/rss", title: "The Urdu Audiobooks" },
  { feedUrl: "https://sbs-ondemand.streamguys1.com/sbs-urdu/", title: "SBS Urdu" },
];

export interface RadioStation {
  id: string;
  name: string;
  nameUr: string;
  url: string;
  note?: string;
}

/** Radio Pakistan's own HTTPS streams (radio.gov.pk), as listed on radio-browser.info. */
export const RADIO_STATIONS: RadioStation[] = [
  { id: "rp-islamabad", name: "Radio Pakistan Islamabad", nameUr: "ریڈیو پاکستان اسلام آباد", url: "https://whmsonic.radio.gov.pk:7003/stream" },
  { id: "rp-world", name: "Radio Pakistan World Service", nameUr: "ریڈیو پاکستان ورلڈ سروس", url: "https://whmsonic.radio.gov.pk:7005/stream" },
  { id: "rp-lahore-news", name: "Radio Pakistan Lahore News & Current Affairs", nameUr: "ریڈیو پاکستان لاہور", url: "https://whmsonic.radio.gov.pk:7004/stream" },
  { id: "rp-peshawar", name: "Radio Pakistan Peshawar", nameUr: "ریڈیو پاکستان پشاور", url: "https://whmsonic.radio.gov.pk:8072/relay" },
  { id: "rp-multan", name: "Radio Pakistan Multan", nameUr: "ریڈیو پاکستان ملتان", url: "https://whmsonic.radio.gov.pk:8034/stream" },
  { id: "rp-hyderabad", name: "Radio Pakistan Hyderabad", nameUr: "ریڈیو پاکستان حیدرآباد", url: "https://whmsonic.radio.gov.pk:8042/stream" },
  { id: "rp-quetta", name: "Radio Pakistan Quetta", nameUr: "ریڈیو پاکستان کوئٹہ", url: "https://whmsonic.radio.gov.pk:8060/relay" },
];

export interface Episode {
  id: string;
  title: string;
  audioUrl: string | null;
  publishedAt?: string;
  durationSec?: number;
  image?: string;
  description?: string;
}

export interface PodcastFeed {
  title: string;
  author?: string;
  image?: string;
  episodes: Episode[];
}

export interface Video {
  id: string;
  title: string;
  publishedAt?: string;
  thumbnail: string;
}
