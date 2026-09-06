# DESIGN.md — Nisbat Visual & Interaction Design

## Design philosophy
Nisbat should feel like **premium clinical software with an editorial, modern-product sensibility**: trustworthy enough for a hospital, polished enough to feel deliberately designed, and warm enough for pediatrics without becoming childish.

The visual direction should take inspiration from the supplied reference UI: a **dark, atmospheric application shell with subtle gradient depth, luminous accent color, thin borders, compact navigation, dense but calm information layouts, and carefully restrained rounded surfaces**.

The goal is not to copy the reference literally. Translate its visual language into a clinical product.

### Core principles
1. **Clinical trust first**
   - Information hierarchy, legibility, safety states and workflow clarity always outrank decoration.
   - The interface should feel appropriate for real PGR/MO/SR use during a busy clinical shift.

2. **Dark editorial shell + luminous clinical accent**
   - Use a deep charcoal/navy application background rather than a flat black.
   - Use subtle radial/linear gradient illumination behind major application areas to create depth.
   - Accent color should be warm and energetic enough to guide attention, while secondary teal/green tones preserve the healthcare character.
   - Gradients are allowed as **atmospheric depth**, not as decorative fills on every component.

3. **Layered surfaces, not card soup**
   - Use a small number of meaningful surfaces: app shell, navigation, workspace, contextual panels.
   - Prefer thin borders, tonal separation and restrained shadows over dozens of floating cards.
   - Cards should communicate grouping or importance; they should not surround every field.

4. **Premium interaction details**
   - Use subtle hover, focus, active and transition states.
   - Small motion may be used for navigation, panel expansion, status changes and feedback.
   - Motion must remain fast, purposeful and non-distracting in clinical workflows.

5. **Designed, not vibe-coded**
   - Avoid default component-library appearance.
   - Avoid random border radii, arbitrary gradients, excessive iconography and generic SaaS dashboards.
   - Establish consistent spacing, radius, border, typography and interaction tokens before building screens.

6. **Pediatric warmth through restraint**
   - Warmth should come from accent color, micro-illustration, language and subtle visual cues.
   - Do not use cartoon characters, childish illustrations, balloons, playful blobs or nursery aesthetics.

### UI inspiration / implementation sources
Use **React Bits** and **Watermelon UI** as implementation and interaction references where appropriate.

- React Bits can inform polished micro-interactions, animated UI details, transitions and distinctive component treatments.
- Watermelon UI can inform practical component patterns, layout structure and reusable interface primitives.

These are **reference/component sources, not a license to blindly import their visual identity**. Every component must be adapted to Nisbat's clinical design system.

When using third-party components:
- preserve Nisbat's spacing and typography tokens
- preserve the dark editorial shell
- preserve clinical accessibility and readability
- avoid unnecessary animation
- avoid component proliferation
- prefer composable primitives over one-off decorative widgets

### Visual target
The product should sit visually between:
- a high-quality modern productivity application
- a premium clinical workstation
- a carefully typeset medical document system

It should feel **quietly sophisticated**, rather than flashy.

It must NOT look:
- childish
- generic SaaS
- futuristic/cyberpunk
- “AI-generated”
- glassmorphic
- neon-heavy
- over-animated
- dashboard-for-dashboard's-sake

## Brand relationship
Nisbat is part of the conceptual N-family:
- Nabz — نبض
- Nigheban — نگہبان
- Nisbat — نسبت

Nisbat should not dominate the hospital identity on printed clinical documents. Institutional identity comes first.

## Visual language

### Application shell
Use a dark premium shell:
- deep charcoal/navy base
- subtle background gradients and radial glow
- slightly lighter navigation/workspace surfaces
- fine low-contrast borders
- restrained shadows
- strong text contrast

The gradient background should create **depth and atmosphere**, similar to the supplied reference, but must never reduce text readability.

### Color direction
Updated to match the real product logo (logo.png — a green/teal Rx-and-ribbon
mark, no orange or purple anywhere in it). Primary palette combines:
- deep navy/charcoal foundation
- emerald-green primary action accent (`#059669`/`#10b981` — sampled from the
  logo's capsule icon)
- dark teal secondary accent (`#115e59` for fills/borders/gradients,
  `#06b6d4` for legible text — sampled from the "Nisbat" wordmark)
- warm gold/amber attention accent, used sparingly (kept close to the logo's
  small gold sparkle detail)
- cool blue informational accent
- muted neutral surfaces
- semantic success/warning/danger colors (success intentionally sits in the
  yellower "green" family while primary sits in the bluer "emerald" family,
  so the two stay visually distinct despite both being green)

Use gradients primarily in:
- application background atmosphere
- selected/active states
- occasional hero/brand treatments
- subtle accent glow

Do not use gradients indiscriminately on ordinary controls.

### Surfaces
Prefer:
- 8–16px corner radii depending on hierarchy
- thin borders
- subtle elevation
- dense aligned layouts
- controlled whitespace

Avoid:
- every field becoming a floating card
- huge rounded rectangles
- excessive shadows
- glassmorphism
- decorative floating blobs
- excessive icon tiles
- cartoon pediatric imagery

### Interaction language
Buttons, chips, navigation items and alerts should have clear states:
- default
- hover
- active
- focus
- disabled
- success/warning/error where relevant

Use concise motion for:
- panel expansion
- navigation transitions
- autosave feedback
- status changes
- contextual suggestions

No perpetual motion or attention-grabbing animation in clinical screens.

## Typography
Preferred Latin:
- IBM Plex Sans
- Source Sans 3
- Noto Sans

Urdu:
- Noto Nastaliq Urdu or a highly readable Urdu-compatible fallback.

Print typography should prioritize clinical legibility. Approximate targets:
- body: 9.5–11 pt
- section headings: 10–12 pt
- title: 16–20 pt

Adjust based on density and actual print testing.

## Layout
Desktop:
- left grouped navigation
- central editing workspace
- contextual actions
- sticky patient banner

Mobile:
- responsive single-column workspace
- same information hierarchy
- clinical/card preview via toggle rather than permanent split screen

## Editor
Use dense, calm clinical controls.

Hybrid input:
- common chips
- small prompt buttons
- autocomplete
- keyboard entry
- free-text areas

Chips should look like compact clinical controls, not colorful consumer-app pills.

## Patient banner
Compact clinical banner:
Name | Age | Sex | MR
DOA → DOD | Ward/Bed | Weight
Allergy status when documented
Important alert when present

Alerts should be visible but restrained; do not turn the header into a large red warning panel.

## Clinical sections
Use clear section headings and aligned fields.
Prefer:
- compact tables
- borders
- subtle dividers
- predictable spacing

Avoid excessive nested cards.

## Medication UI
Clinician editor should use a dense table/grid:
Drug | Source | Formulation | Dose | Route | Frequency | Duration | PRN | Calculation

Dose calculation can expand inline to show:
Weight → Rule → Calculated dose → Formulation → Volume → Final dose.

Warnings should be obvious but not alarmist.

Parent-facing print should use highly readable medication blocks/tables, with:
- English drug name
- strength
- dose
- frequency
- duration
- simple Urdu/English instructions

## Advice / danger signs
Advice Packs should render as clean modular sections.
Danger signs use restrained warning styling:
- clear heading
- short bullets
- enough whitespace
- no giant red blocks

## Follow-up
Use compact structured rows:
Service | When | Purpose | Instructions

Allow multiple follow-up items without making the section visually heavy.

## Final Review
Final Review is the actual full-page print preview, using the real target paper size.

Include a clear print-state indicator:
- PENDING SR REVIEW before physical signature
- COMPLETED / SIGNED after completion

The preview must be faithful to printed output.

## Print design
Primary goals:
1. recognizable institutional card
2. highly readable
3. information-dense without clutter
4. correct A4/Legal dimensions
5. intelligent continuation across pages

No shadows in print.
Use borders, whitespace, typography and alignment.

Preserve the recognizable two-panel physical-card concept while substantially improving the formerly blank home-advice area.

If content overflows:
- continue logically to another page
- repeat essential patient identification/header context
- use page numbering
- never simply scale the entire document down to unreadability

## Institutional header
Settings-driven:
- hospital name
- logo
- department
- HOD/faculty/SR information
- institutional contact

Historical final documents retain the snapshot used at finalization.

## Accessibility
- sufficient text contrast
- keyboard navigability
- visible focus
- touch targets appropriate for mobile
- Urdu text must remain readable
- do not encode essential meaning by color alone

## Design quality bar
The finished product should look like software intentionally designed by a clinical product team, not a generated CRUD application.

Before calling a screen finished:
- check hierarchy
- check spacing
- check alignment
- check empty states
- check long clinical text
- check medication density
- check mobile responsiveness
- check print behavior
- check bilingual rendering
- check warnings
