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

## Chromecast / TV dashboard

Nisbat is designed to replace the stock Chromecast backdrop: it comes up on the TV by itself, and you control it from the TV remote or your phone.

```
 ┌──────────── Nisbat server (one Node process, e.g. home PC / Raspberry Pi) ───────────┐
 │  Next.js app  ·  /api/* data adapters  ·  /api/remote/* relay (SSE)                  │
 └───────▲──────────────────────────────▲───────────────────────────────▲───────────────┘
         │ loads /cast (receiver)        │ commands / TV state            │ checks & launches
   ┌─────┴──────┐                  ┌─────┴──────┐                  ┌──────┴────────┐
   │ Chromecast │ ◀── D-pad keys ──│ TV remote  │     phone ──▶    │ autocast.py   │
   │  TV mode   │                  └────────────┘   /remote page   └───────────────┘
   └────────────┘
```

**TV mode** turns on automatically for Chromecast and Google TV browsers (the `CrKey`/Google TV user agents), for any URL opened with `?tv=1`, or from Settings → TV & Chromecast. In TV mode Nisbat:

* scales the layout for viewing from across the room, with title-safe margins and large focus rings
* drops live blur, which Chromecast GPUs struggle with
* moves focus with the D-pad: OK selects and **Back** closes dialogs or goes back. Play/pause and track keys control Quran recitation and Live TV.
* shows an **ambient screen** after a set period of inactivity (1–60 minutes, or never). It shows a clock, Hijri date, weather, a countdown to the next prayer, the daily verse and rotating Pakistan headlines, with a slow drift to prevent burn-in. It never covers playing video or recitation.

**Phone remote:** open `http://<nisbat-server>/remote` on a phone on the same network. Then scan the QR code or type the 6-character code shown on the TV (Home in TV mode, Settings → Phone remote, or the bottom of the ambient screen). The remote offers:

* a D-pad (hold to repeat), OK, Back, Home, play/pause and previous/next
* screen shortcuts
* "type on TV", which searches or fills the focused field
* quick add for a task or a Saman item (saved on the TV)
* Live TV channels and a surah picker

It also shows what the TV is currently displaying.

Commands go through the Nisbat server (`/api/remote/*`, Server-Sent Events), so any phone browser works. The relay is in-memory, so **run Nisbat as a single long-lived Node server** (`npm run build && npm start`) rather than on multi-instance serverless hosting. Anyone on your network who knows the code can control the screen. Use **New code** in Settings to disconnect all paired phones.

### Auto-casting it to the Chromecast

`scripts/autocast.py` runs on any always-on machine on the same network. Every minute it checks the Chromecast. When the Chromecast is idle (backdrop or nothing playing), the script launches Nisbat. It never interrupts YouTube, Netflix or anything else that is casting.

```bash
pip install pychromecast
# Quickest: uses the open-source DashCast receiver to show <url>/?tv=1
python3 scripts/autocast.py --device "Living Room TV" --url http://192.168.1.20:3000
# Recommended: your own Nisbat receiver (see below)
python3 scripts/autocast.py --device "Living Room TV" --app-id ABCD1234
```

To use your own receiver:

1. Serve Nisbat over **HTTPS**. Cast receivers must be HTTPS; a reverse proxy or tunnel with a certificate works.
2. In the [Google Cast SDK Developer Console](https://cast.google.com/publish) (one-time US$5 registration), add a **Custom Receiver** whose URL is `https://<your-host>/cast`.
3. While the app is unpublished, register your Chromecast's serial number for testing. Reboot the Chromecast.
4. Pass the App ID to `autocast.py --app-id`.

The receiver runs Google's Cast Application Framework with the idle timeout turned off, shows Nisbat full screen in TV mode, and accepts `{ "type": "navigate", "path": "/quran" }` messages on `urn:x-cast:pk.nisbat.app`. Opened in an ordinary browser, `/cast` is just a preview.

On a **Chromecast with Google TV** you can also open `http://<nisbat-server>/?tv=1` in a kiosk browser app installed on the TV. Either way, the TV remote's D-pad and the phone remote both work.

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
* I couldn't test casting against real Chromecast hardware from the development environment. The receiver and autocast script follow the documented Cast SDK and pychromecast APIs; please check them on your device.
* Live TV playback relies on the TV's browser being able to decode H.264/AAC HLS. Chromecast can.
* There are no push or scheduled notifications. Task reminders are stored as notes and shown in the app only.
* Live streams can go offline or change URL at any time. The player then shows an error with Retry and a link to the official website.
