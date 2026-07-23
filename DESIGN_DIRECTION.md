# ZERØ COMMAND — Design Direction v3 · "ATELIER"

> Decision record. Written before implementation, grounded in 2026 research
> (Awwwards SOTD/SOTM Feb–Jul 2026, Hermès × Linda Merad, NN/g "Handmade
> Designs", Orizon 2026 trends, Creative Bloq 2026, Envato 2026, madegooddesigns
> font trends 2026). Supersedes the v2 "Terminal Slab" direction, which was
> rejected as cold, formal and sterile.

## The thesis

**A private atelier, not a trading floor.**

The previous direction failed because it borrowed authority from *institutional
density* (Bloomberg). But the founder does not need to look institutional — he
needs opening this app to feel like a **privilege**. Privilege in 2026 luxury
digital is signalled by **warmth, craft, space and one confident gesture**, not
by darkness and data density.

Private jet vs first class: the jet is not denser or darker. It is *personal* —
warm materials, irregular by design, a signature detail, room to breathe.

## The three findings that decide everything

1. **Nobody in the 2026 luxury lane uses pure black.** Every award-winning dark
   is warm-tinted: `#2C2824` (Son Daven), `#292919` (Renaissance Edition),
   `#241F21` (Floema). The two sites that *do* use `#000000` are the
   brutalist/avant-garde lane — exactly the cold register we're rejecting. The
   warmth of the black is the entire difference between "vault" and "morgue".
2. **The luxury lane is light-dominant.** Cucinelli `#F1EDE7`, Renaissance
   `#F7F7EE`, Lacoste `#F7ECE8` all lead cream. "Dark mode = luxury" is now an
   amateur tell. → **Light is our primary lane; dark is a true equal, not a
   fallback.**
3. **"Post-Dashboard interfaces"** (Orizon 2026): narrative summaries and
   adaptive insight replace static widget grids and spreadsheet dashboards.
   This is the structural antidote to the terminal look.

## Palette — warm two-colour + disciplined semantics

Restraint reads expensive; the *temperature* of the restraint reads warm.
One vivid accent ("ember") is the app's signature gesture — used sparingly.

```
LIGHT (primary lane)              DARK (equal partner)
ground   #F1EDE7  warm cream      ground   #1B1815  warm near-black (never #000)
panel    #E8E2D8  recessed        panel    #232019
raised   #FBF9F5  card lifts      raised   #2C2824
ink      #2C2824  warm near-black ink      #F1EDE7  cream

SIGNATURE + SEMANTIC (shared, tuned per mode)
ember      #FA4C14   the one vivid gesture — hero action / live pulse
ember-soft #FF7A47   ember on dark surfaces (contrast-safe)
acid       #E9E778   tiny highlight only, never a fill
flat       #A89474   warm taupe, quiet meta
up         #7E9668   sage green   (gain)      down  #B04A2E  terracotta (loss)
```

Rules: ember is a *gesture*, not a theme — at most ~5% of pixels. Acid appears
in millimetres, never in blocks. Gain/loss are muted earth tones, never neon,
and always paired with a sign or arrow (colour is never the only channel).
**Every text colour must clear WCAG AA on its actual surface — verified
programmatically, not by eye.**

## Typography — warmth with a signature

- **Fraunces** (variable soft-serif, `SOFT`/`WONK` axes) — display, hero numbers,
  section headlines. This is the personality. Expressive, crafted, a little
  wonky on purpose. Free, Google Fonts, variable.
- **Hanken Grotesk** — all UI, labels, body. A 2026 "bouba grotesk": humanist,
  gently rounded terminals, *"just enough warmth to avoid the clinical feel of
  Inter"*. Free, Google Fonts, variable.
- Numerals: tabular figures wherever numbers align in columns; the hero figure
  is Fraunces and allowed to be beautiful rather than tabular.
- **No monospace as the primary voice.** Mono was the terminal tell; it is
  demoted to genuinely technical fragments only.

## Layout — narrative, asymmetric, generous

- **Post-dashboard**: the screen opens with a human line (greeting + the one
  thing that matters today), not a wall of widgets.
- **Asymmetry on purpose** — *"irregular layout suggests that real decisions
  were made."* No uniform card grid; deliberately unequal spans.
- **Spatial generosity is the exclusivity signal.** Fewer elements, larger,
  with air. Density is earned, and confined to the zones that deserve it.
- **Soft geometry**: 16–22px radii, warm layered shadows, no hairline-seam
  panelling, no glass-everywhere. Elevation is warm, never a hard black drop.
- **Anti-perfect texture**: a fine paper grain over the canvas; imperfection
  reads as craft (Hermès/NN-g "handmade as trust signal").

## Motion — alive, never noisy

```
140ms cubic-bezier(0.2, 0, 0, 1)        press, toggle, checkbox
200ms cubic-bezier(0.2, 0, 0, 1)        tab switch, dropdown, tooltip
280ms cubic-bezier(0.16, 1, 0.3, 1)     expand, drawer, sheet
420ms cubic-bezier(0.34, 1.4, 0.64, 1)  the ONE overshoot — number roll-up,
                                        entrance stagger (delight moments only)
```
Staggered entrances, number count-up, gentle hover lift. Nothing bouncy on
repeat interactions. `prefers-reduced-motion` fully respected.

## Mobile — its own philosophy, not a shrunken desktop

- **Single-glance first screen**: greeting + one hero figure above the fold.
  Secondary content arrives as you scroll, not as a compressed grid.
- **Scroll-snap sections** and **horizontal rails** instead of stacked widgets.
- **Floating pill bottom navigation**, 56px + `env(safe-area-inset-bottom)`,
  tap targets 44–48px, everything reachable in the thumb zone.
- **Bottom sheets** for detail instead of full page pushes.
- PWA polish: safe-area insets, momentum scroll, no rubber-band artefacts.

## What we deliberately avoid

Pure black · hairline-seam terminal panelling · mono as the primary voice ·
neon gain/loss · uniform widget grids · glass on everything · pastel-generic
palettes · "dark mode + serif = luxury" cliché · decoration without meaning.

## Non-negotiables carried forward

No change to business logic (`store.ts`, `cloudStorage.ts`, `api.ts`); no feature
or data removed; no invented numbers; all live feeds (BTC/ETH/SOL, Fear & Greed,
weather, intel) keep working; PWA intact; WCAG AA in **both** modes; desktop and
mobile both premium — neither is the compromise version.
