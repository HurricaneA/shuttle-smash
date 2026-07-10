# Design

Visual system for the Shuttle Smash Championship 2026 site. Follows the brand from the
tournament logo and flyers: bold navy-and-gold, energetic, community-celebration.

## Theme

Light theme, bright and high-energy — matching the white-background posters with saturated
navy and gold. The scene: a phone held in a bright, busy church sports hall on tournament
day. White/near-white surfaces keep results legible under harsh light; navy anchors the
chrome; gold is the celebratory accent (winners, highlights, CTAs).

## Color Palette

Committed brand colors (from the logo — identity-preservation, do not re-hue):

| Role | Token | Value | Use |
|------|-------|-------|-----|
| Brand primary | `--brand-navy` | `#0A2472` | Nav, headings, primary text, hero base |
| Brand secondary | `--brand-royal` | `#1B44B8` | Buttons, links, hero gradient end |
| Accent | `--brand-gold` | `#F5A800` | Winner highlight, chips, gold CTAs, dividers |
| Accent 2 | `--brand-orange` | `#F58220` | Hover on gold, sparing energetic accents |
| Surface | `--brand-white` | `#FFFFFF` | Cards, content surfaces |
| Ink | `--brand-ink` | `#0B1533` | Body text on light surfaces |
| App background | Tailwind `slate-50` | `#F8FAFC` | Page background behind cards |

Contrast notes: navy `#0A2472` on white ≈ 13:1 (AA/AAA). White on navy passes for all sizes.
Gold `#F5A800` on white is ~1.7:1 — **never** use gold for text/icons on white; use gold only
as a fill/background with navy or ink text on top, or as a large decorative element.

## Typography

Contrast pairing (not two similar sans): a condensed display face + a humanist body sans.

- **Display** — "Barlow Condensed" (600–800), uppercase, tight tracking. Headings, hero,
  section titles, team-name emphasis. Echoes the poster's bold condensed lettering.
- **Body / UI** — "Inter" (400–700). Paragraphs, labels, buttons, table/bracket text.
- Rules: display letter-spacing ≥ -0.03em; hero clamp max ≤ 6rem; `text-wrap: balance` on
  h1–h3; body line length capped ~65–75ch. Both loaded via Google Fonts in `index.html`.

## Components

- **Buttons**: `.btn-primary` (royal→navy hover), `.btn-gold` (gold→orange hover, navy text),
  `.btn-ghost` (navy outline → fill on hover). Rounded-lg, gold focus ring.
- **Cards** (`.card`): white, `rounded-2xl`, subtle navy-tinted shadow (`shadow-card`),
  1px slate border. Used for fact panels and rule sections — not nested, not the lazy default.
- **Brand chip** (`.brand-chip`): gold pill with navy uppercase text — for the "Girls Doubles"
  / status tags seen on the poster.
- **MatchCard**: two stacked team slots; the winner slot gets a gold-tinted fill, gold border,
  bold weight, and a check — advancement never signaled by color alone. TBD slots are muted.
- **Navbar**: sticky navy bar, logo + wordmark, gold pill on the active link.
- **Hero**: navy→royal diagonal gradient (`.brand-gradient`) evoking the poster's brush strokes,
  gold accents and the logo on top.

## Layout

- Content max-width ~72rem (`max-w-6xl`), generous but varied vertical rhythm (avoid uniform
  spacing). Flexbox for 1D rows, Grid only for the 2D fact/rules panels
  (`repeat(auto-fit, minmax(240px, 1fr))`).
- **Bracket**: one horizontal flex column per round (`Play-in → QF → SF → Final`), each column
  `justify-around` so later rounds visually center between their feeders; the whole tree scrolls
  horizontally (`overflow-x-auto`) on phones. The 3rd-place match renders as a small card below
  the Final.
- Mobile-first; the bracket and nav collapse gracefully to a single hand's reach.

## Motion

Restrained and purposeful: ease-out (quart/expo) transitions on hover/focus and on bracket
updates (a brief highlight when a winner advances). No bounce/elastic. Every animation has a
`prefers-reduced-motion: reduce` fallback (crossfade or instant).
