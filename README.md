# Nisbat (نسبت)

A standalone pediatric discharge workspace: **Patient → Admission → Discharge.**
It prepares, reviews, and prints a pediatric discharge summary/prescription —
built to be genuinely usable on a ward, not a demo.

See [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md) for the original
product spec and visual direction this build follows (the development rules —
clinical safety, workflow, architecture constraints — live in the project's
internal `CLAUDE.md`, not tracked in this repo).

## What it does

Nisbat models three things and keeps them distinct on purpose:

- **Patient** — demographics, and a history of admissions/discharges.
- **Admission** — one hospital stay. Today these are seed/reference data (no
  "New Admission" button in the UI) — V1 is deliberately not an inpatient EMR;
  admissions are the integration point a future inpatient feed would populate.
- **Discharge** — the actual document being prepared, one per admission being
  discharged. This is where almost all the work happens.

A discharge moves through a fixed workflow, matched to how it actually happens
on paper:

```
DRAFT → PENDING SR REVIEW → COMPLETED / SIGNED
        (returned for correction goes back to DRAFT)
```

- **PGR/MO** prepares the discharge, then **prints for SR review** — the
  printed card visibly says **PENDING SR REVIEW** until this happens.
- **SR/Faculty** reviews the printed card, physically signs it (there is no
  digital signature in V1 — that's deliberate, not a gap), and can return it
  for correction.
- Completion is recorded by an authorized user once the physical process is
  done. A completed discharge is immutable — editing it creates a new
  revision and sends it back to SR review, it never silently mutates a signed
  record.

Three roles, enforced both in the UI and server-side (see
[Authentication](#authentication)): **PGR/MO**, **SR/Faculty**, **Admin**
(institutional settings + publishing content — see
[Content Library](#content-library-architecture--how-to-extend-it)).

## Quick start

```bash
npm install
npm run db:up        # starts local Postgres in Docker (port 5433 — see below)
npm run db:migrate   # creates the schema
npm run db:seed      # loads example patients/formulary/content
```

Add a `SESSION_SECRET` to `.env` (copy `.env.example`, then generate your own —
`openssl rand -base64 32`; the app won't start without one). Then:

```bash
npm run dev   # http://localhost:3000, redirects to /login
```

Sign in with one of the seeded accounts (all share one starter password —
change it from `/users` as Admin before any real deployment):

| Username | Password | Role |
|---|---|---|
| `admin` | `changeme123` | Admin |
| `faisal.nadeem` | `changeme123` | SR/Faculty |
| `rehan.malik` | `changeme123` | PGR/MO |
| `ayesha.khan` | `changeme123` | PGR/MO |

Every time after that, only `npm run db:up` (if the container isn't already
running — `docker ps` shows `nisbat-postgres`) and `npm run dev` are needed;
migrations/seed only need re-running when the schema or seed data changes.

```bash
npm run build      # production build
npm run lint
npm run db:studio  # Prisma Studio — browse/edit the database in a GUI
```

Requires Docker Desktop running. Postgres listens on `127.0.0.1:5433` (5432
was already taken by another project on this machine) — see `.env` /
`docker-compose.yml`.

**Recurring gotcha for contributors:** after any `prisma/schema.prisma`
change, `npx prisma generate` alone isn't enough — a running `next dev`
process caches the old Prisma client, so kill the whole node process tree
(`npm run dev`, `next dev`, and any Turbopack worker) and restart it, or
you'll see `Unknown argument` errors on fields that genuinely exist.

### Access from a phone

`next dev`/`next start` bind `0.0.0.0` (see `package.json`'s `--hostname
0.0.0.0`), so the app is reachable from any device on the same network:

1. Find the PC's LAN IP: `ipconfig` (Windows) → the `IPv4 Address`.
2. On the phone (same Wi-Fi), open `http://<that-ip>:3000`.
3. If it doesn't connect, allow it through Windows Firewall once:
   ```powershell
   New-NetFirewallRule -DisplayName "Nisbat dev" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   ```

The database itself is **not** exposed to the network (`127.0.0.1:5433`) —
only the app is reachable from other devices. Login is real (bcrypt-hashed
password, an HMAC-signed session cookie) but this is still plain HTTP with no
TLS, so treat LAN reachability as trusted-network-only.

### Moving to the cloud later

Point `DATABASE_URL` at a managed Postgres (Supabase, Neon, RDS, …) and run
`prisma migrate deploy` against it — `prisma/schema.prisma` has no
local-only assumptions.

## How to make a discharge

There's no "New Discharge" page in isolation — a discharge always starts from
an existing admission:

1. **Find the patient.** Use Search (the entry point), the Dashboard's
   "Current Admissions," or the Admissions page. Every one of these lists
   active admissions with a **Start Discharge** button.
2. Clicking it creates a fresh `DRAFT` discharge (`createDischarge` in
   `src/lib/store.ts`) pre-populated with the admission's real weight/age —
   nothing clinical is invented, only factual data with a trusted source
   auto-populates.
3. **Work through the workspace** (`/discharges/[id]/...`) — a grouped
   sidebar, one route per section, a sticky patient banner throughout:

   | Group | Sections |
   |---|---|
   | Patient | Overview |
   | Clinical | Diagnosis*, Presenting Complaints*, History, Examination* |
   | Hospital Course | Investigations, Treatment, Clinical Course* |
   | Discharge | Medications*, Reconciliation*, Advice, Follow-up, Growth, Pending Tests, Immunization |
   | Review | Summary & Preview |

   (`*` = required before printing for review — see the sidebar's own
   completion dots, and `src/lib/workspace-nav.ts`'s `WORKSPACE_SECTIONS` for
   the exact list and what "complete" means per section.) Autosave is
   continuous — `updateContent` debounces 800ms per discharge, everything
   else (adding a medication, applying an advice pack) syncs immediately.
4. Medications: pick a **drug**, then its **exact formulation/strength**
   (never assumed) — only then does a dose calculate, with the full trace
   shown (weight → rule → calculated amount → formulation → volume → final
   dose). Manual override is allowed but flags a warning past a 20%
   discrepancy from the calculated dose.
5. Treatment → Reconciliation: an inpatient drug-linked treatment event
   (antibiotics/steroids/anticonvulsants) auto-carries into Reconciliation as
   an item awaiting an explicit decision (Continue/Stop/Change/New) — an
   inpatient medication never becomes a discharge prescription on its own.
6. Advice/Follow-up: apply a published Advice Pack or Follow-up Module —
   every suggestion starts **unselected** until you confirm it
   (`advice-bullet-picker.tsx`); nothing is silently included.
7. **Summary & Preview** — the actual print layout (A4/Legal, exact — this is
   the same component print itself uses, so preview never lies about what
   prints), a checklist of anything still missing, and language controls
   (Urdu only / Urdu + English / English only, overridable per-Medications
   and per-Advice-Pack). Printing here moves the discharge to **PENDING SR
   REVIEW** — the printed card visibly says so until an SR completes it.
8. SR/Faculty reviews the physical printout, signs it, and either returns it
   for correction (back to DRAFT — editing bumps the revision) or an
   authorized user records completion. A completed discharge's content is
   frozen; nothing about it is editable in place again.

Patient history (previous admissions/discharges) is always one click away
from a patient's own page — past discharges show their preserved content
snapshot exactly as it was at completion, never recomputed against today's
content/dose-rule versions.

## Content Library architecture — how to extend it

`/advice-packs` (labeled **Content Library** in the sidebar — the URL predates
the other content types joining it) is one tabbed page for every piece of
**governed clinical content**: content that isn't written fresh per-discharge,
but authored once, reviewed, and reused. Six types exist today:

| Type | What it is | Editor |
|---|---|---|
| Advice Pack | Family education / danger signs / home care, grouped into sections of bilingual bullets | Dedicated full-page builder (`/advice-packs/new`, `/advice-packs/[id]/edit`) |
| Follow-up Module | A clinical follow-up visit template (service, timing, purpose, instructions) | Modal — intentionally simpler than Advice Packs |
| Investigation Panel | A named group of tests (e.g. "CBC" → Hemoglobin/TLC/Platelets/DLC/ESR) that bulk-inserts result rows | Modal |
| Dose Rule | A drug's per-kg/fixed dosing formula, with an explainable calculation trace | Modal, with a live preview at sample weights |
| Frequency Phrase | The parent-facing wording for a dosing frequency code (BD → "Twice daily" / "صبح و شام…") | Modal |
| Vocabulary List | A whole rapid-fill chip list (exam/history/presenting-complaint chips) or the diagnosis catalogue | Modal |

All six share **one governance model**, enforced both in the UI and
server-side:

- **Faculty/SR create and edit.** **Admin publishes.** A `PATCH` that sets
  `status: "published"` always requires Admin regardless of the route's other
  role rules (`src/lib/api/crud.ts`).
- **Only published content is available for routine clinical selection** —
  drafts exist for review/iteration but never show up as a rapid-fill option
  on a discharge.
- **Editing an already-published item creates a new draft version** rather
  than mutating the live one in place (`version + 1`, `status: "draft"`,
  `publishedBy` cleared) — publishing that draft is a separate, explicit step.
- **A discharge keeps a snapshot**, never a live reference — applying an
  Advice Pack, Follow-up Module, or Dose Rule's calculation copies the
  content as it existed at that moment onto the discharge. Later edits to the
  library, even publishing a new version, never rewrite an already-applied
  discharge.
- **System-sourced Dose Rules are permanently locked** (never editable, not
  hidden — enforced server-side too); only Faculty-authored rules can be
  edited, and a rule change never touches a prescription already written
  against it.
- **Frequency Phrases** are the one type where more than one row can exist
  per code (multiple phrasings to compare/iterate on) — the store enforces
  exactly one *published* phrase per code at a time, so publishing a new one
  automatically retires whichever was live (`publishFrequencyPhrase` in
  `src/lib/store.ts`). What a code actually *means* for dose timing
  (`timesPerDay`/`intervalHours` in `src/lib/frequency.ts`'s
  `FREQUENCY_OPTIONS`) is fixed in code, not authorable content — adding a
  genuinely new frequency code is a code change, not a Content Library edit.
- **Vocabulary Lists** are edited a whole list at a time (all its
  systems/categories together), matching the grain an Advice Pack's several
  sections are edited/published together — not one row per chip.

### How to add a new governed content type

This is the same six-layer recipe every existing type follows (most recently
Frequency Phrases and Vocabulary Lists) — copy the shape of whichever
existing type is closest to what you're adding:

1. **`prisma/schema.prisma`** — add the model (id, the content fields,
   `version`/`status`/`createdBy`/`publishedBy`/`updatedAt` for governance).
   Run `prisma migrate dev`, then **`prisma generate` and a full dev-server
   restart** (see the gotcha above — this bites every time).
2. **`src/types/content.ts`** — the TypeScript type, matching the Prisma
   model field-for-field.
3. **`src/app/api/<type>/route.ts` + `[id]/route.ts`** — almost always a
   one-line pair using the generic factory:
   ```ts
   export const { GET, POST } = createHandler(prisma.yourModel, {
     authRoles: ["sr_faculty", "admin"],
   });
   ```
   (`src/lib/api/crud.ts` already handles the publish-requires-admin rule.)
4. **`src/app/api/bootstrap/route.ts`** — add it to the `Promise.all` fetch
   list and the response shape, so it loads with everything else on app
   start.
5. **`src/lib/store.ts`** — a state array plus `create`/`update`/`publish`/
   `unpublish` actions, each a small structural copy of an existing type's
   block. Also add it to `src/lib/api-client.ts`'s `BootstrapData` and
   create/sync functions.
6. **A form dialog** (`src/components/content/<type>-form-dialog.tsx`) and a
   new tab + card grid on the Content Library page
   (`src/app/(app)/advice-packs/page.tsx`).

   **The one real gotcha here:** these dialogs are rendered once as a
   persistent instance the page just toggles open/closed for whichever row
   was clicked — they are *not* remounted per row automatically. If the
   dialog initializes its fields with `useState(existing?.field ?? default)`
   (the pattern every one of these dialogs uses), that initializer only ever
   runs once. **Give the dialog a `key` at its usage site**
   (`key={existing?.id ?? "new"}`, prefixed if more than one such dialog is a
   JSX sibling on the same page — key uniqueness is checked across siblings
   regardless of type) so React actually remounts it per row. Skipping this
   was a real, shipped bug: editing one row and then a different one silently
   showed the first row's stale data. A `useEffect` that resets state on
   `open`/`existing` changes looks like an alternative fix — this project's
   lint config (and React's own current guidance) flags that as an
   anti-pattern; use the `key`, not an effect.
7. Seed a starting set in `src/lib/seed-data.ts` and wire it into
   `prisma/seed.ts`'s upsert loop.

### A general robustness note for anyone extending clinical content shapes

Discharge content is stored as `jsonb` (see [Where things
live](#where-things-live)) — a discharge written under an older shape (before
a field existed) is real, persisted data that no migration ever rewrites.
Code that reads deep into `DischargeContent` defensively (`field ?? {}`
before `Object.values`/`.map`, etc.) rather than assuming today's shape is
what's actually there — `src/lib/workspace-nav.ts`'s `safeIsComplete` wraps
every section-completion check in a try/catch for exactly this reason: one
section's shape gap should make that section read as "incomplete," never
crash the whole workspace sidebar for that discharge.

## Where things live

- `src/types/` — the domain model (Patient, Admission, Discharge, medication
  entities, content entities, audit/settings). Read this first —
  `prisma/schema.prisma` mirrors it field-for-field.
- `prisma/schema.prisma` — the database schema. Workflow/status fields are
  relational; deeply nested or evolving clinical content (`DischargeContent`,
  the audit trail, applied advice sections) is `jsonb`, so the API layer
  stays a thin pass-through instead of a second schema to keep in sync.
- `prisma/seed.ts` — loads `src/lib/seed-data.ts`'s example data into
  Postgres.
- `src/app/api/` — route handlers (`src/lib/api/crud.ts` is the generic
  factory most of them delegate to).
- `src/lib/store.ts` — the Zustand store: owns all business logic (status
  transitions, audit trail, revision snapshots, content governance); every
  mutating action also pushes the result to the server via
  `src/lib/api-client.ts`. `updateContent` (the highest-frequency mutation)
  is synced on an 800ms debounce per discharge; everything else syncs
  immediately. `hydrate()` fetches everything from `/api/bootstrap` once on
  app start (`src/components/layout/store-hydrator.tsx`).
- `src/lib/dose-calc.ts` — the explainable dose-calculation trace (weight →
  rule → calculated amount → formulation → volume → final dose), including a
  `topical_instruction` basis for topicals/eye drops that skip the mg/volume
  math entirely.
- `src/lib/growth-calc.ts` / `src/lib/who-growth-data.ts` — WHO Child Growth
  Standards (2006) Z-scores from real LMS parameter tables sourced from
  who.int.
- `src/lib/frequency.ts` / `src/lib/clinical-vocab.ts` — resolve a published
  Frequency Phrase / Vocabulary List first, falling back to a hardcoded
  default only if nothing's published yet.
- `src/components/discharge/discharge-document.tsx` — the single source of
  truth for the clinical/parent-facing document, used by both the
  workspace's inline Preview toggle and the standalone print route, so
  preview and print never diverge.
- `src/app/(app)/` — the global shell (Dashboard, Search, Admissions,
  Settings, Content Library).
- `src/app/discharges/[dischargeId]/(workspace)/` — the discharge editor.
- `src/app/discharges/[dischargeId]/print/` — the true print preview
  (A4/Legal, outside the workspace chrome).

## Authentication

Username/password (`bcryptjs` hashes — pure JS, nothing to native-compile on
Windows), a hand-rolled HMAC-SHA256-signed session cookie
(`src/lib/auth/session.ts`) rather than a framework built around external
providers: three fixed roles, no OAuth/self-signup. The cookie payload only
ever carries `userId` + an expiry — nothing sensitive, so a signature
(tamper-proofing) is enough.

Role and `active` status are **never** trusted from the cookie — every
request re-checks Postgres (`src/lib/auth/dal.ts`), so deactivating a user
(`/users`, Admin-only, no hard delete) takes effect on their very next
request, not at next login. `src/proxy.ts` (Next.js 16 renamed
`middleware.js` to `proxy.js`) does a cheap optimistic redirect based on the
cookie's signature alone; the real DB-backed check happens again in every
route/page that needs the user. Its matcher excludes static files by
extension (not just `_next/static`), so a `public/` asset like the app logo
loads even for an unauthenticated visitor on `/login`.

## Design system

A dark, atmospheric shell — deep charcoal background, layered surfaces
(never "card soup"), a luminous accent color, thin borders, restrained
rounded surfaces (an 8–16px radius scale, `--radius-sm/md/lg/full` in
`globals.css`) — matched to the actual product logo (an emerald/teal
Rx-and-ribbon mark): primary actions and active/selected states use an
emerald green (`#059669`/`#10b981`), a dark teal (`#115e59`, with a brighter
`#06b6d4` step for legible text) is the secondary accent, and a warm gold
stays as the sparing "guide attention" accent. Chips deliberately are **not**
pill-shaped — DESIGN.md is explicit that they read as "compact clinical
controls," not colorful consumer-app pills. The login screen carries a slow,
subtle animated gradient-wave background (pure CSS, no library, frozen under
`prefers-reduced-motion`) — the one surface with no clinical data, so the one
place a bit of expressive motion doesn't compete with charting.

## What's here vs. what's next

Built: the full discharge workflow end-to-end (draft → SR review →
completed, with revisioning and server-side status-transition validation),
every clinical/discharge section from PRODUCT.md, dose calculation with
manual-override discrepancy warnings and topical/nebule support, selective
(per-bullet) advice pack application with post-hoc customization,
editable-in-place follow-up items with full Urdu/English support,
Treatment→Reconciliation drug carry-over, three-way parent-facing language
with per-Medications and per-Advice-Pack overrides, formulation brand names,
print/PDF export, WHO growth Z-scores/charts, an admin-editable logo, and six
governed content types (Advice Packs, Follow-up Modules, Investigation
Panels, Dose Rules, Frequency Phrases, Vocabulary Lists) — the last two
turning what used to be hardcoded frequency wording and rapid-fill chip
lists into content Faculty/Admin can actually edit without a code change.

The formulary runs to 134 drugs (up from an initial 15) with real Pakistani
brand names added only where the exact seeded strength was confirmed —
several system dose rules are deliberately absent instead (Insulin, Sodium
Bicarbonate, Lamotrigine) where a single per-kg number would misrepresent a
genuinely individualized/titrated dose, per this project's "never invent a
clinical fact" rule. Real username/password authentication for all three
roles with server-side authorization, and a real shared Postgres database
reachable from multiple devices on the same network.

Not yet built (deliberately, per the project's V1 scope): digital SR
signatures, TLS (see the security note under "Access from a phone"), a
patient/admission intake UI (both are seed/reference data today — the
intended integration point for a future inpatient feed), and file-upload
storage (the logo, and any future image field, is a URL rather than an
upload — there's no object storage in this stack yet).
