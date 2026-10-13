# Nisbat Home

A calm, immersive personal and family dashboard for Pakistani households. It brings Quran reflection, daily news, groceries, tasks and live TV together in one place.

| Module | What works |
| --- | --- |
| **Home** | Greeting and date in your time zone, daily Quran verse (with source), quick capture for tasks and groceries, live weather (hourly forecast, sunrise and sunset), prayer times with the next prayer highlighted, five module cards, today's plan, Tadabur progress, quick actions and recent activity |
| **Tadabur Quran** | All 114 surahs and Juz navigation, Uthmani Arabic text, 9 English and Urdu translations, verse-by-verse recitation from 8 reciters (play/pause, seek, previous/next, speed, volume, continuous play, fallback audio), bookmarks, last-read position, verse-level reading progress against a daily goal, "Verse by verse" and "Mushaf page" layouts, and a reflection workspace (create, edit and delete notes) |
| **Ajj ka Haal (آج کا حال)** | Pakistan-first news from publisher RSS feeds in 9 sections, including Urdu (RTL). Includes a featured story, latest headlines, a reader view with excerpt and publisher link, save for later, share, search, refresh, and a status line for each source |
| **Saman (سامان)** | A starter catalog of 120+ items of Pakistani groceries with English and Urdu names and category tiles. The add-item dialog prefills from the catalog, validates input, handles duplicates (merge or keep separate) and supports adding several items in a row. The shopping list supports purchased state, quantities, grouping and custom order, search and filter, an estimated PKR total, share, `.txt` export, and clear with confirmation |
| **Tasks** | Create, edit and delete tasks with due date and time, priority, tag and a reminder note. Includes Today, Upcoming, Completed and All views, search, sorting, overdue indicators, a progress ring, undo, bulk delete with confirmation, and in-app notifications in the header |
| **Live TV** | Channel directory with search, categories, favourites, recently watched, and previous/next. HLS player (hls.js, or native HLS on Safari) with loading, error and retry states. Also supports adding your own stream and an opt-in community playlist |
| **Settings** | Name, English or Urdu interface (RTL), time zone, background, text size, reduced motion, city search for weather and prayer times, calculation method and Asr school, Quran defaults, sample prices, community streams, a live check of each data source, and export, import or reset of local data |

Universal search (**Ctrl/⌘ K** or **/**) covers pages, surahs, verse references (e.g. `2:255`), Quran translation text (through the API), saved news, groceries and tasks.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint
```

You don't need any API keys. See `.env.example`.

## Stack and structure

The app uses Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, lucide-react, hls.js, zod and fast-xml-parser.

```
src/
  app/                     routes (/, /quran, /news, /saman, /tasks, /tv, /settings) + api/ route handlers
  components/layout/       app shell, sidebar/mobile nav, top bar, atmospheric backdrop
  components/ui/           buttons, inputs, dialog (native <dialog>), toasts, chips, tabs, empty states…
  features/<module>/       domain UI + logic: dashboard, quran, news, groceries, tasks, live-tv, search, settings
  lib/storage/             versioned, zod-validated localStorage stores (SSR-safe)
  lib/api/http.ts          server fetch helper (timeouts, revalidation)
  lib/dates, lib/i18n.ts   time-zone helpers, English/Urdu strings
  data/                    grocery catalog, Quran metadata, TV channel directory, image credits
scripts/                   grocery image pipeline (Openverse → reviewed → public/groceries)
```

### Data and persistence

Tasks, the Saman list, Quran bookmarks, progress and reflections, saved news, TV favourites and settings are stored in **this browser's localStorage only**. Nothing syncs across devices or family members. **Settings → Your data** can export and import a JSON backup.

Each store is versioned (`{ v, data }`) and validated with zod when it's read. If a value is malformed it falls back to defaults, and the bad payload is kept under `<key>:corrupt`. Feature code only talks to `createPersistedStore`, so moving to a real database later means replacing that layer, not the features.

## Data sources and policies

| Data | Source | Notes |
| --- | --- | --- |
| Quran text | [Tanzil](https://tanzil.net) Uthmani via [AlQuran Cloud](https://alquran.cloud/api) | Shown verbatim with attribution. The bismillah is displayed as a header, not as part of verse 1, except in Al-Fatiha and At-Tawbah. No tafsir is added. |
| Translations and audio | AlQuran Cloud / Islamic Network CDN | Only allow-listed editions are proxied. |
| News | Public RSS from [Sixty](https://sixty.pk/rss.xml) (EN and [UR](https://sixty.pk/ur/rss.xml)), Dawn, The Express Tribune, Al Jazeera, BBC Urdu | Stores only the headline, an excerpt of 48 words or fewer, the image URL, the time and the link. Full articles stay on the publisher's site. Sponsored items and stories older than 10 days are dropped. Items with no timestamp are labelled, not given an invented one. |
| Weather and geocoding | [Open-Meteo](https://open-meteo.com) (CC BY 4.0) | The provider and observation time are shown. |
| Prayer times | [AlAdhan](https://aladhan.com/prayer-times-api) | The method and Asr school are shown and configurable. |
| Grocery photos | [Openverse](https://openverse.org): CC BY, CC BY-SA, CC0 | Each photo was reviewed by hand. Credits appear in the app (Saman → "view image credits") and in `src/data/grocery-images.json`. |
| Grocery prices | — | Rough **sample estimates**, always labelled. They can be turned off in Settings and are not market prices. |

The "Islamic & Community" news section is not offered yet, because no suitable publisher feed has been verified. Add one in `src/features/news/sources.ts` to enable it.

### Live TV policy and adding a channel

Channels live in `src/data/channels.ts`, separate from the player.

* **Official** streams are HTTPS HLS links on the broadcaster's own domain. They were checked on the date stored with each channel and need no login, token, DRM or geo-unlock.
* For channels without a verified public stream, Nisbat shows a link to the broadcaster's website instead of the player.
* **Community streams** come from iptv-org, are off by default, and are clearly labelled as unverified. HTTPS-only links without tokens or referrer requirements are used. Sports channels are excluded.
* Users can add their own stream URL. Only direct `.m3u8`, `.mp4` and `.webm` addresses are accepted, never web pages.

To add a channel, confirm the broadcaster (or its official distribution partner) publishes the stream, that it is HTTPS, that it plays in a browser without authentication, and that its terms allow playback. Then add it with `provenance: "broadcaster"` and `verifiedOn`.

Channel tiles are original monograms; broadcaster logos are not redistributed.

### Grocery images

```bash
python3 -I scripts/fetch-grocery-images.py candidates /tmp/gimg   # downloads 3 candidates per product + contact sheets
# review sheets, write /tmp/gimg/choices.json  {"tomato": 0, ...}
python3 -I scripts/fetch-grocery-images.py apply /tmp/gimg        # writes public/groceries + credits JSON
```

## Known limitations

* The Urdu interface covers navigation, headings, greetings and common actions. Some secondary labels are still in English.
* Language and direction are applied after hydration, so Urdu users may see a brief flash of the English layout.
* There are no push or scheduled notifications. Task reminders are stored as notes and shown in the app only.
* Live streams can go offline or change URL at any time. The player then shows an error with Retry and a link to the official website.
