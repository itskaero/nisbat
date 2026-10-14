# Nisbat Home

A calm, immersive personal and family dashboard for Pakistani households. It brings Quran reflection, prayer times, azkar, Urdu listening, Pakistan's history and poetry, daily news, weather and smog, groceries, tasks, family photos and live TV together in one place, on a Chromecast-connected TV and every phone in the house.

| Module | What works |
| --- | --- |
| **Home** | Greeting and date in your time zone, daily Quran verse (with source), quick capture for tasks and groceries, live weather (hourly forecast, sunrise and sunset), prayer times with the next prayer highlighted, AQI chip, sher of the day, five module cards, today's plan, Tadabur progress, quick actions and recent activity |
| **Tadabur Quran** | All 114 surahs and Juz navigation, Uthmani Arabic text, 9 English and Urdu translations, verse-by-verse recitation from 8 reciters (play/pause, seek, previous/next, speed, volume, continuous play, fallback audio), bookmarks, last-read position, verse-level reading progress against a daily goal, "Verse by verse" and "Mushaf page" layouts, and a reflection workspace (create, edit and delete notes) |
| **Ajj ka Haal (آج کا حال)** | Pakistan-first news from publisher RSS feeds in 9 sections, including Urdu (RTL). Includes a featured story, latest headlines, a reader view with excerpt and publisher link, save for later, share, search, refresh, and a status line for each source |
| **Saman (سامان)** | A starter catalog of 120+ items of Pakistani groceries with English and Urdu names and category tiles. **Official weekly prices** from the Pakistan Bureau of Statistics for about 25 staples in your city (atta, sugar, daals, oil, ghee, milk, eggs, onions, tomatoes…), with the week, the range and the change since last week. The add-item dialog prefills from the catalog, validates input, handles duplicates (merge or keep separate) and supports adding several items in a row. The shopping list supports purchased state, quantities, grouping and custom order, search and filter, an estimated PKR total that says how many prices are PBS, sample or your own, share, `.txt` export, and clear with confirmation |
| **Tasks** | Create, edit and delete tasks with due date and time, priority, tag and a reminder note. Includes Today, Upcoming, Completed and All views, search, sorting, overdue indicators, a progress ring, undo, bulk delete with confirmation, and in-app notifications in the header |
| **Live TV** | Channel directory with search, categories, favourites, recently watched, and previous/next. HLS player (hls.js, or native HLS on Safari) with loading, error and retry states. Also supports adding your own stream and an opt-in community playlist |
| **Namaz (نماز)** | Today's times with a next-prayer countdown, a monthly timetable (AlAdhan), the Hijri month with major Islamic dates, and an on-screen reminder at each prayer you enable (full-screen in TV mode, optional soft chime synthesised in the browser; no azan recording is shipped) |
| **Azkar & Hadith** | Morning, evening and other Hisn al-Muslim chapters (Arabic, transliteration, English, recitation audio) with per-dhikr counters, a large tasbeeh counter that the TV remote's OK button or a phone tap advances, and a hadith of the day in English and Urdu with its sunnah.com reference. Counts are shared across the family's screens and reset daily |
| **Sunein (سنیں)** | An Urdu listening hub: curated Urdu podcasts (add more by iTunes search or by pasting an RSS link), YouTube channels the family follows (latest videos in YouTube's privacy-enhanced player), and Radio Pakistan stations. One player persists across screens with resume per episode, speed, ±15/30 s and media-key/remote control; "Continue listening" is shared across devices |
| **Pakistan — Tareekh & Kalam** | The national calendar (16 dates, each linked to Wikipedia) with a countdown to the next one, a hero card on the day itself, Wikipedia's "On this day" filtered for Pakistan, and a sher of the day from Allama Iqbal or Mirza Ghalib in large Nastaliq (also on Home and the ambient screen) |
| **Mausam & Smog** | Current conditions, 24-hour strip, 7-day forecast, sunrise/sunset arc, and US AQI with PM2.5/PM10 and health guidance (Open-Meteo / CAMS model estimates, labelled as such) |
| **Bazaar (بازار)** | Exchange rates for USD, SAR, AED, GBP, EUR and Gulf currencies with a rupee converter: the State Bank's official rates when a free PakDataHub key is configured, otherwise an open daily reference rate, clearly labelled. Plus all 51 PBS SPI essentials for any of the 17 SPI cities, compared with another city or the national average. A rates-and-prices row on Home and a USD/SAR line on the ambient screen |
| **Settings** | Name, English or Urdu interface (RTL), time zone, background, text size, reduced motion, city search for weather and prayer times, calculation method and Asr school, prayer reminders, family photos (upload, delete, slideshow), Quran defaults, price city and sample prices, community streams, a live check of each data source, and export, import or reset of local data |

Universal search (**Ctrl/⌘ K** or **/**) covers pages, surahs, verse references (e.g. `2:255`), Quran translation text (through the API), saved news, groceries and tasks.

## Three frontends, one server

| Frontend | Where | What it is |
| --- | --- | --- |
| Website | `src/` (Next.js) | The full dashboard in any browser, and the server: API, family store, remote relay. |
| TV app | `apps/tv` → served at `/screen` | Preact app built for the Chromecast's Chrome 90: instant start from a cached snapshot, no reloads between screens, a single gliding focus ring, ambient screen as the idle state. Phones drive it by name. |
| Android app | `apps/mobile` (Capacitor 8 + React) | Its own phone UI bundled in the APK. Finds the server on the Wi-Fi (`_nisbat._tcp`, announced by the autocast service, with a subnet sweep as fallback), asks once to join, then syncs the same family store. Remote mode, "Show on TV", prayer notifications, offline snapshots. |

**Phones join once.** The app asks; the TV shows *"Allow …?"* (or Settings → Phones on the website, or the household PIN). The phone gets a token (only its hash is stored, in `data/devices.json`); requests from the app's origin need it for family data. Pages served by Nisbat itself (website, TV app) work as before.

### Building the Android app

```bash
npm run build:mobile && (cd apps/mobile && npx cap sync android)
docker build -f apps/mobile/Dockerfile.android -t nisbat-android apps/mobile
docker run --rm -v "$PWD:/work" -v nisbat-gradle:/root/.gradle nisbat-android   # -> apps/mobile/release/
```

Release builds are signed with `apps/mobile/.keystore/` (git-ignored). **Back it up**: updates only install over the old app when signed with the same key.

`scripts/publish-release.ps1` pushes the branch, creates the GitHub release with `nisbat.apk`, and deploys `site/` (the project page) to GitHub Pages.

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
  app/                     routes (/, /quran, /namaz, /azkar, /sunein, /pakistan, /news, /mausam, /saman, /tasks, /tv, /remote, /cast, /settings) + api/
  components/layout/       app shell, sidebar/mobile nav, top bar, atmospheric backdrop
  components/ui/           buttons, inputs, dialog (native <dialog>), toasts, chips, tabs, empty states…
  features/<module>/       domain UI + logic: dashboard, quran, news, groceries, tasks, live-tv, search, settings
  lib/storage/             versioned, zod-validated stores (localStorage + server sync)
  lib/server/              JSON file store, photo storage, URL safety checks
  lib/api/http.ts          server fetch helper (timeouts, revalidation)
  lib/dates, lib/i18n.ts   time-zone helpers, English/Urdu strings
  data/                    grocery catalog, Quran metadata, TV channel directory, image credits
scripts/                   grocery image pipeline (Openverse → reviewed → public/groceries)
```

### Data and persistence (family sync)

Tasks, the Saman list, Quran bookmarks, progress and reflections, saved news, TV favourites, recent activity, azkar counts and Sunein subscriptions/progress are **shared by every screen that uses the same Nisbat server**: the TV, phones and laptops all see one list. Settings stay per device.

* The server keeps one JSON file per store in `NISBAT_DATA_DIR` (default `./data`, git-ignored), written atomically with a version counter. Family photos live in `<data dir>/photos`.
* `GET/PUT /api/store/<key>` validate against the same zod schemas the client uses; `/api/store/events` (Server-Sent Events) tells other screens to refresh.
* Each browser keeps a localStorage copy, so the app works offline; changes made offline are pushed when the server is reachable again. The first time a device joins, its local items are merged with the server's (by id). After that, the last write wins per store.
* There are no accounts: anyone who can reach the server can read and change the shared data. Keep it on your home network (or behind your own VPN/tunnel with authentication).

**Settings → Your data** can still export and import a JSON backup.

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
| Prayer timetable and Hijri dates | AlAdhan `calendar` | Islamic dates shown are a short curated list; the moon-sighting date in Pakistan can differ by a day, which the page notes. |
| Air quality | [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) (CAMS, CC BY 4.0) | Model estimate, not station readings; labelled. |
| Adhkar | [hisnmuslim.com](https://www.hisnmuslim.com) API (Hisn al-Muslim) | Arabic, English and audio, attributed on the page. |
| Hadith of the day | [fawazahmed0/hadith-api](https://github.com/fawazahmed0/hadith-api) (Unlicense) via jsDelivr | A curated list of Sahih al-Bukhari numbers; each links to sunnah.com. |
| Podcasts | Publisher RSS feeds; discovery via the iTunes Search API | Audio streams from the publisher. Nothing is downloaded or rehosted. Feed URLs must be public HTTPS (no IP addresses or local hosts) and are capped at 5 MB. |
| YouTube | Channel RSS (`youtube.com/feeds/videos.xml`) + `youtube-nocookie.com` embed | Official player only; no downloading or ad removal. |
| Radio | Radio Pakistan's own streams (`radio.gov.pk`) | Broadcaster provenance. |
| On this day | [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/) (CC BY-SA 4.0) | Filtered to Pakistan-related entries, attributed and linked. |
| Poetry | Allama Iqbal (d. 1938) and Mirza Ghalib (d. 1869), public domain | 16 couplets, each checked against [Rekhta](https://www.rekhta.org) and linked there. |
| Backgrounds | Flickr via Openverse (CC BY 2.0 / Public Domain Mark) | Four photos (dawn, day, dusk, night), reviewed by hand. Credits: Settings → Background and `src/data/background-credits.json`; regenerate with `scripts/fetch-backgrounds.py`. |
| Grocery and essentials prices | [PBS weekly Sensitive Price Indicator](https://www.pbs.gov.pk/price-statistics/) (official, free) | Nisbat reads the weekly `Annex_DD.MM.YYYY.xlsx` (sheet Appendix-A: 51 items × 17 cities, lowest/average/highest retail price) exactly as published, found via pbs.gov.pk's own WordPress API. Parsed weeks are kept in `<data dir>/spi` (last 8), so prices still show if PBS is down. Only catalog items with a true SPI counterpart get a PBS price (see `src/data/spi-map.ts`); the rest keep a labelled **sample estimate** (optional) or the family's own price. These are city averages; shops vary. |
| Exchange rates (official) | State Bank of Pakistan via [PakDataHub](https://pakdatahub.com) | Optional: set `PAKDATAHUB_API_KEY` on the server. The free plan (500 calls a month) is enough; Nisbat uses about 100 a month (daily SBP M2M dollar rate, monthly SBP averages), caches them in `<data dir>/fx-official.json`, and pauses on quota or key errors. PakDataHub's terms allow use in your own dashboards on every plan; showing the data to other people's customers needs their Business plan. |
| Exchange rates (reference) | [fawazahmed0/exchange-api](https://github.com/fawazahmed0/exchange-api) (CC0) | Daily mid-market rates, always labelled as **not** the SBP rate. Banks and exchange companies quote their own. |

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

* Some sources could not be fully verified from the development sandbox: Radio Pakistan streams use non-443 ports that the sandbox blocks, YouTube channel feeds intermittently returned errors, and Wikipedia rate-limited some requests (some national-calendar article links were not checked). The app shows a clear error with Retry whenever a source fails.
* Family sync and the phone remote need **one long-lived Node server**; they will not work on multi-instance serverless hosting.
* PBS prices are weekly city averages (published on Fridays for the week ending Thursday); individual shops differ. If PBS changes the spreadsheet layout, the parser refuses it and the last good week keeps showing.
* Official SBP exchange rates could not be tested with a real key from the development sandbox (an invalid key is handled and falls back to the reference rate).
* Prayer reminders appear only while Nisbat is open on a screen (there are no push notifications).

* The Urdu interface covers navigation, headings, greetings and common actions. Some secondary labels are still in English.
* Language and direction are applied after hydration, so Urdu users may see a brief flash of the English layout.
* I couldn't test casting against real Chromecast hardware from the development environment. The receiver and autocast script follow the documented Cast SDK and pychromecast APIs; please check them on your device.
* Live TV playback relies on the TV's browser being able to decode H.264/AAC HLS. Chromecast can.
* There are no push or scheduled notifications. Task reminders are stored as notes and shown in the app only.
* Live streams can go offline or change URL at any time. The player then shows an error with Retry and a link to the official website.
