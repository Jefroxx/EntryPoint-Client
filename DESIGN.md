---
name: EntryPoint
description: The STI College Davao library system, drawn as an old library reading room in warm maroon, parchment and Raleway.
colors:
  parchment: "#f6f2ea"
  leather: "#c29b87"
  oak: "#a97954"
  oak-text: "#76553b"
  manuscript: "#1e423f"
  binding: "#532c2e"
  crimson: "#34000b"
  maroon-50: "#f6f0ed"
  maroon-100: "#ede1db"
  maroon-200: "#ddc8bd"
  maroon-300: "#c29b87"
  maroon-400: "#855e56"
  maroon-500: "#532c2e"
  maroon-600: "#4a1f24"
  maroon-700: "#42141b"
  maroon-800: "#3a0912"
  maroon-900: "#34000b"
  surface-white: "#ffffff"
  ink: "#1c1917"
  ink-body: "#292524"
  ink-secondary: "#57534e"
  ink-muted: "#78716c"
  hairline: "#e7e5e4"
  status-danger: "#dc2626"
  status-success: "#059669"
typography:
  display:
    fontFamily: "Raleway, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(46px, min(5.6vw, 9.6vh), 82px)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Raleway, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(34px, 4.4vw, 60px)"
    fontWeight: 800
    lineHeight: 1.03
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Raleway, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(24px, 2.3vw, 31px)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  page-title:
    fontFamily: "Raleway, ui-sans-serif, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.15
  body:
    fontFamily: "Raleway, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Raleway, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14.5px"
    fontWeight: 700
    lineHeight: 1.25
  caption:
    fontFamily: "Raleway, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.4
  figure:
    fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  input: "10px"
  control: "12px"
  card-app: "22px"
  container: "28px"
  shot: "16px"
  phone: "26px"
  pill: "9999px"
spacing:
  frame: "12px"
  grid-gap: "16px"
  gutter-sm: "24px"
  gutter-md: "40px"
  gutter-lg: "64px"
  section-y: "96px"
  section-y-lg: "128px"
  content-max: "1180px"
components:
  button-pill-primary:
    backgroundColor: "{colors.maroon-500}"
    textColor: "{colors.surface-white}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 32px"
  button-pill-primary-hover:
    backgroundColor: "{colors.maroon-600}"
  button-pill-on-maroon:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.maroon-600}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 24px 0 28px"
  button-pill-on-maroon-hover:
    backgroundColor: "{colors.maroon-50}"
  button-pill-outline-on-maroon:
    backgroundColor: "transparent"
    textColor: "{colors.surface-white}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 28px"
  button-pill-outline-on-maroon-hover:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.maroon-600}"
  button-app-primary:
    backgroundColor: "{colors.maroon-500}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.control}"
    height: "42px"
    padding: "0 16px"
  button-app-primary-hover:
    backgroundColor: "{colors.maroon-600}"
  button-app-ghost:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.control}"
    height: "42px"
    padding: "0 16px"
  input-field:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    height: "44px"
    padding: "0 12px"
  card-light:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.container}"
    padding: "32px"
  card-maroon:
    backgroundColor: "{colors.maroon-500}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.container}"
    padding: "32px"
  card-app:
    backgroundColor: "{colors.surface-white}"
    rounded: "{rounded.card-app}"
    padding: "20px"
  nav-glass-pill:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.pill}"
    padding: "8px 8px 8px 20px"
---

# Design System: EntryPoint

## Overview

**Creative North Star: "The Old Library"**

EntryPoint is the reading room of one school's library: warm parchment pages, bound-leather maroon, a single compass for a seal. The palette is six named materials (parchment, leather, oak, manuscript, binding, crimson), and each has one job. The app (student portal, librarian portal, sign-in) is calm, spacious and rounded; the public landing page inherits that world and turns it up, with large maroon fields, one oversized compass, and real screens of the product as its only imagery.

The system is warm, never grey. Elevation is soft and brown-black, corners are generous (28px containers), and type is a single sans family (Raleway) at heavy weights for display and light-handed weights for reading. Montserrat appears only where something is a figure: IDs, codes, times, counts. Motion is short and eased out, and always yields to `prefers-reduced-motion`.

The page and the app share one grammar; the landing page only adds scale. Record divergence honestly: the app's content surfaces are quieter (22px cards, 12px controls, stone hairlines), the landing's are bolder (28px containers, full pills, maroon bands).

**Key Characteristics:**
- Parchment ground, white cards, maroon fields; leather and oak appear only as small highlights.
- Raleway ExtraBold with tight negative tracking for display; Montserrat for figures only.
- 28px rounded containers framed 12px in from the viewport edge; pills on the public page, 12px radius in the app.
- Two warm shadows total (card, overlay), plus one screenshot shadow on the landing.
- The compass emblem is the recurring motif; on the landing it turns with scroll.
- Real product screenshots (sample data, labelled as such) instead of photography or illustration.

## Colors

A one-hue maroon family on parchment, with a quiet green kept in reserve and warm stone neutrals for text.

### Primary
- **Binding Maroon** (#532c2e, `accent-500`): The primary action color and the brand field. Buttons, active nav, the hero, closing band and sign-in panel all start here.
- **Crimson Deep** (#34000b, `crimson` / `accent-900`): The far end of the maroon field gradient, the footer, and page headings in the app (`text-crimson`).
- **Maroon ramp** (`maroon-50` to `maroon-900`, the `accent-*` scale): Tints for hover (`50`, `100`), borders (`200`, `300`), second-line display text on maroon (`200`), pressed/hover fills (`600`), and the deep text on light bands (`800`). Ramp values live in the frontmatter; do not invent in-between steps.

### Secondary
- **Manuscript Green** (#1e423f, `secondary-*`): Defined as the secondary role in the theme. The landing page deliberately does not use it; treat it as reserved and introduce it only for a clear secondary meaning.

### Tertiary
- **Oak** (#a97954, `highlight-500`): Highlights, stars, large figures and icons only (3.8:1 on white). Use `oak-text` (#76553b, `highlight-700`) when a highlight must carry small text.
- **Leather** (#c29b87): Soft borders and tints; equals `maroon-300`.

### Neutral
- **Parchment** (#f6f2ea): The page background everywhere (`bg-parchment`, `.student-app`, the librarian layout, the landing root).
- **Surface White** (#ffffff): Cards, inputs, sidebars, the staff-door tile.
- **Ink stones** (`ink` #1c1917, `ink-body` #292524, `ink-secondary` #57534e, `ink-muted` #78716c): Tailwind stone steps used for body text, secondary copy and quiet metadata. Body on parchment is stone-800.
- **Hairline** (#e7e5e4, stone-200): The 1px border on app cards, sidebars and header.
- **Status** (`status-danger`, `status-success`): Red and emerald, used only for alerts, overdue and live states in the app (error banners, the running-scanner tile). Never as decoration.

### Named Rules
**The One Hue Rule.** Every brand surface is a step of the maroon ramp. Introduce a second hue only as status color or the reserved manuscript green, never to decorate.

**The Parchment Ground Rule.** Pages sit on parchment, content on white, emphasis on maroon. Pure white as a full-page background does not appear.

**The Oak Size Rule.** Oak is for large figures and icons; at small text sizes use `oak-text`.

## Typography

**Display Font:** Raleway (with ui-sans-serif, system-ui, sans-serif)
**Body Font:** Raleway
**Label/Mono Font:** Montserrat (figures only: `font-data`, `tabular-nums`)

**Character:** One humanist-geometric sans does all the talking. Weight carries hierarchy: ExtraBold (800) with negative tracking for headings, regular for reading. Montserrat's wider numerals mark anything that is a code or a count so figures line up in tables and on the Library ID.

### Hierarchy
- **Display** (800, clamp(46px, min(5.6vw, 9.6vh), 82px), 0.98, -0.035em): The landing hero headline only, two-tone (white, then `maroon-200` on the second line), capped near 12ch.
- **Headline** (800, clamp(34px, 4.4vw, 60px), 1.03, -0.03em): Landing section headings, in `maroon-800` on light bands and white on maroon. The closing band steps up to clamp(38px, 5.4vw, 76px).
- **Title** (800, clamp(24px, 2.3vw, 31px), 1.08, -0.02em): Bento tile and door-card headings, max 17ch.
- **Page title** (700, 30px, `text-3xl`, crimson): Every app page's H1 (`.dashboard-heading`); the sign-in H1 is 800 at 30px.
- **Body** (400, 17px, relaxed, `text-pretty`): Landing explanatory lines, max about 40 to 52ch, white at 80% on maroon, stone-600 on light. App body runs 14 to 15px.
- **Label** (700, 14.5 to 15px): Buttons, nav links, step titles (21px bold for step titles on maroon).
- **Caption** (400 to 500, 12.5px, stone-500): App metadata, footers, the "sample data" note.
- **Figure** (Montserrat, 500, 13.5 to 15.5px, tabular): Hours, counts, IDs, codes, points.

### Named Rules
**The Figures Rule.** Words are Raleway, numbers are Montserrat. Mark figures with `font-data` or `tabular-nums` and never name the font in a component.

**The Tight Display Rule.** Any heading above 24px uses weight 800 and negative letter-spacing between -0.02em and -0.035em, balanced wrapping, and line-height near 1.

## Layout

Single column, content centered at a 1180px maximum, with outer gutters of 24px (phone), 40px (sm), 64px (lg). Landing sections alternate by band: parchment bands use `py-24` (`lg:py-32`); maroon bands and the footer are inset 12px from the viewport edge so their 28px corners show, like a page set in a frame. Grids use a 16px gap (`gap-4`); the feature section is a 12-column bento (7/5, then 4/4/4) that collapses to one column below lg. The hero fills the first viewport (`min-h-[calc(100svh-24px)]`) with copy on the left and a fanned screenshot row rising from its bottom edge; outer screens drop away at sm and lg.

The app uses a persistent left sidebar (76px icon rail, 232px labelled at lg, user-collapsible) beside a sticky 68px header with a parchment, blurred background. Student content caps at a main column plus a 340px rail at xl; librarian pages pad `p-6`. Touch devices get 16px inputs and `touch-action: manipulation` in the student app. Anchored sections offset by 96px so the floating nav never covers headings.

## Elevation & Depth

Hybrid, and mostly flat. App surfaces are white with a 1px stone hairline and no shadow at rest; depth is spent on things that float. Two warm shadows serve the whole product, tinted brown-black (rgb 28 23 18) rather than grey.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 1px 2px rgb(28 23 18 / .04), 0 12px 28px -12px rgb(28 23 18 / .28)`): Landing light tiles and doors card, and the solid state of the floating nav.
- **Overlay** (`box-shadow: 0 2px 6px rgb(28 23 18 / .06), 0 32px 64px -24px rgb(28 23 18 / .45)`): Hero screenshots, the phone in the steps band, the auth card, modals and drawers.
- **Screenshot window** (`box-shadow: 0 2px 6px rgb(28 23 18 / .06), 0 18px 40px -16px rgb(28 23 18 / .38)`): Bleed-off screenshots inside bento tiles.
- **Scanner CTA glow** (`box-shadow: 0 8px 20px -10px rgba(83,44,46,.7)`): The librarian dashboard start-scanner tile only.
- **Glass** (`backdrop-filter: blur(12px)` over `rgba(255,255,255,.10)` with a `rgba(255,255,255,.20)` border; solid state is 85% white with blur 24px): The landing nav over the maroon hero. It is the only glass surface besides the student header's light blur.

### Named Rules
**The Two Warm Shadows Rule.** Use `shadow-card` or `shadow-overlay`. No grey Tailwind shadows, no hard offset shadows.

**The Maroon Field Rule.** Maroon surfaces get depth from light, not shadow: a soft white radial from the top-left (`rgb(255 255 255 / .10)`) over a 160deg gradient from `maroon-500` to `crimson`. The staff sign-in panel swaps this for charcoal (#3a3330 to #1c1917) to mark the staff door.

## Shapes

Round, calm and consistent. Containers are 28px (landing bands, tiles, footer, auth card and panel). App content cards are 22px, controls (buttons, nav items, banners) 12px, inputs 10px. Screenshots shown as products carry 16px (tablet and laptop screens) or 26 to 28px (phones) corners; in bento tiles the screenshot hangs 18% past the tile's right edge and off its bottom, with only the top-left corner rounded, so it reads as a window on a larger screen. The public page's action shape is the full pill (52px tall); the app's is the 12px-rounded rectangle (42px). Borders are 1px stone hairlines in the app, 1.5px maroon-300 or white at 70% on outline pills. The compass (a circle with a star) is the recurring silhouette: big, faint (9 to 18% white) and behind content, never in front of text.

## Components

### Buttons
- **Shape:** Pill (full) on the landing and public doors, 12px rounded rectangle in the app.
- **Primary (light band):** Binding maroon fill, white bold 15px text, 52px tall, 32px side padding; hover to `maroon-600` in 200ms.
- **Primary (on maroon):** White fill, `maroon-600` text, trailing arrow icon that nudges 2px right on hover; hover fill `maroon-50`.
- **Outline:** 1.5px border (maroon-300 on light, white at 70% on maroon), hover fills `maroon-50` or solid white with maroon text.
- **App primary / ghost:** 42px tall, binding fill with `shadow-sm` or white with a stone border; both press to scale .95 (icon buttons to .90) over 150ms.
- **Focus:** Landing uses a 2px outline, offset 3px, `maroon-500` on light bands and `maroon-100` on maroon, glass and footer. App uses a 2px `maroon-200` ring.

### Cards / Containers
- **Light tile:** White (or `maroon-100`, `maroon-200` at 70%) 28px container, 32px padding, `shadow-card`, `overflow: hidden`; heading in `maroon-800`, body in stone-600 (or maroon-700 at 80% on tinted tiles).
- **Maroon tile / band:** The maroon field, 28px, white text, a faint compass bleeding off a corner.
- **App card:** White, 22px, 1px stone-200 border, 20px padding, no shadow. Hero cards in the student app use a maroon-600 to maroon-400 gradient with a translucent white circle in the corner.
- **Lists inside cards:** Hairline-divided rows (`divide-accent-200` on landing, stone on app), never nested cards.

### Inputs / Fields
- **Style:** 44px tall, white, 10px radius, 1px stone-200 border, 15px text, 13.5px semibold label above.
- **Focus:** Border to `maroon-500` plus a 2px `maroon-200` ring.
- **Error:** Red-400 border on red-50 background with a 12.5px red message below; banners are 12px-rounded red-50 or emerald-50 with a tabler icon.

### Navigation
- **Landing nav (floating glass pill):** Fixed, centered, max 1080px, fully rounded, 12px from the top. Logo wordmark left, three anchor links center (Features, How it works, Visit us), Sign in and Get started right. Over the hero it is translucent white with blur and white text; after scrolling past about 72% of the viewport it turns solid (85% white, blur 24px, `shadow-card`) with maroon and stone text and the maroon wordmark.
- **App sidebar:** White, 1px right border, 76px rail or 232px labelled. A single `maroon-100` highlight pill slides between items (320ms ease-out); items are 44px tall, 12px rounded, stone-500 idle and maroon-700 active. Badges are red pills.
- **App header:** 68px, parchment at 85% with blur, bottom hairline.

### Compass emblem (signature)
The circle-and-star from the stacked logo, white, used as a decorative field behind content. On the landing, every compass rotates with scroll via one custom property on the page root (`--turn`, scroll distance times 0.06 degrees, set in a rAF-throttled passive listener; disabled under reduced motion). In the sign-in panel it is the same mark, tinted white, with a soft warm glow and drifting sparkles. It carries no meaning of its own and is always `aria-hidden`.

### Fanned screenshot arc (landing)
Five real screens (two laptop pairs flanking a phone Library ID) in a perspective row (`perspective: 1500px`), rotated on the Y axis by 0, 20 and 34 degrees and set back in Z, rising once at 900ms ease-out with 70ms stagger. They are fully visible at rest. A caption under them says they are sample data. Every shipped screenshot is a WebP with a sidecar JSON recording its provenance.

### Bento tiles and bands (landing)
A 12-column grid of mixed light, tinted and maroon tiles with a title (max 17ch), one line of body, and a bleed-off screenshot; the last tile is a divided text list on maroon. Bands alternate parchment and maroon, each maroon band inset by the 12px frame; the final band is a closing call to action with a faint compass.

### Motion
Ease-out `cubic-bezier(.23, 1, .32, 1)` is the default; ease-in-out `cubic-bezier(.77, 0, .175, 1)` for large moves (the sign-in panel slide, 760ms); drawer curve `cubic-bezier(.32, .72, 0, 1)` for edge sheets. Typical durations: 150ms for presses, 200ms for color/hover, 380ms for staggered section entrances (35ms apart, `st-in`), 200ms for in-place swaps, 90 to 200ms for page transitions. Every animation has a `prefers-reduced-motion` fallback that shows the end state.

## Do's and Don'ts

### Do:
- **Do** build every brand surface from the maroon ramp (`binding` #532c2e to `crimson` #34000b) on a parchment (#f6f2ea) ground.
- **Do** use 28px radius for large containers, 22px for app cards, and pills only for public-page actions.
- **Do** set figures (times, counts, IDs, points) in Montserrat via `font-data` or `tabular-nums`.
- **Do** give display headings weight 800, negative tracking and balanced wrapping.
- **Do** use only `shadow-card` and `shadow-overlay` for elevation, plus the screenshot window shadow for bleed-off images.
- **Do** show the real product (sample data, labelled) as imagery, and keep a provenance sidecar next to every shipped screenshot.
- **Do** keep both doors (student, staff) visible and distinct wherever sign-in is offered.
- **Do** honor `prefers-reduced-motion` for every transition, entrance and the compass turn.
- **Do** keep the compass behind content, at low opacity, and `aria-hidden`.

### Don't:
- **Don't** put a second brand hue beside the maroon; manuscript green stays reserved.
- **Don't** use oak for small text; use `oak-text` (#76553b).
- **Don't** use grey Tailwind shadows or hard offset shadows.
- **Don't** set Raleway in a serif or substitute a system display face for headings.
- **Don't** pair a large photograph or stock hero with a three-icon feature row; the product's own screens carry the page.
- **Don't** invent numbers, quotes or capabilities beyond what the system does.
- **Don't** let the glass treatment spread beyond the floating nav and the sticky header.

## Not canonized

Drift recorded as observed, not as house style:
- The maroon field gradient is written out twice (landing `.landing-maroon` and the auth panel) rather than shared as a token.
- Corner radii in the app vary by author (18, 20 and 14px cards exist alongside 22px as the common card), and several pages hard-code values instead of the shadow tokens.
- The staff sign-in panel is charcoal rather than maroon; it is kept as a deliberate staff marker, not a second brand palette.
- The auth card uses `shadow-overlay` at rest, heavier than other resting cards.
