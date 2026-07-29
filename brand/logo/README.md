# The BetterTandag mark

The portal's logo, in its three delivered variants. These are the **source of record** for the mark — the
favicons in `public/` are cut from them, and `src/components/ui/Logo.tsx` inlines the same geometry.

| File                      | Use                                  |
| ------------------------- | ------------------------------------ |
| `better-tandag-color.svg` | Primary — navy land, flag-yellow sun |
| `better-tandag-black.svg` | One-colour black                     |
| `better-tandag-white.svg` | Reversed, for dark grounds           |

## What it is

- **Land** — the City of Tandag administrative boundary, traced from PSA/OpenStreetMap boundary data
  (PSGC 1606800000) and projected to scale, coastline and river mouth intact. `#0032A0`, which is
  `portal.brandColor` in `config/lgu.config.json` and `--color-primary-700`.
- **Sun** — the eight-ray sun of the Philippine flag, official ray construction, three rays per point, set
  top-right where Tandag faces the Pacific. `#FCD116`, the **flag** yellow — deliberately _not_ the portal's
  `--color-accent-400` (`#F2C81D`). The two are close enough to look like a mistake and far enough apart to be
  one, which is why the mark carries its own `--color-mark-sun-flag` token.
- **Clearance** — an 11px-stroke mask cuts the sun away where the boundary crosses it, so both shapes stay
  legible when the mark is drawn in a single colour.
- **Minimum size 32px.** Below that the traced coastline and the thin rays start to fill in. The header renders
  it at 40px and the footer at 64px.

## How the app uses it

**Not these files.** `src/components/ui/Logo.tsx` inlines the geometry as a Server Component so the two fills
come from `@theme` role tokens (`--mark-land` / `--mark-sun`) instead of being frozen into the file. That is
what lets one component render all three variants above, including flipping to the reversed mark inside
`[data-surface='inverse']` — which is how the footer gets the white version with no second import.

`Logo.tsx` also **crops the viewBox to the artwork, edge to edge**. These files are framed `12 40 154 154` —
a 154 square that leaves 10 units of air on each side and 4 above, 7.65 below, so the drawing fills 87% × 92%
of its own box. The component uses the measured ink box instead, `22 44 134 142.35`, and sizes the element to
match: **`size` is the mark's height and the width follows the artwork's 0.94 aspect.** A square element would
letterbox the mark back off two of its edges, and `preserveAspectRatio="none"` would stretch a civic mark out
of shape.

The files keep the delivered framing because they are the record; the component carries the lockup.

> **Measuring this yourself:** use screen-space rects, not `getBBox()`. On a `<use>` element `getBBox()`
> reports the _referenced_ geometry before the element's own transform, which puts the land 26 units out and
> yields a negative margin.

The `public/icon-*` favicons keep literal hex, because a favicon is fetched as its own document and never sees
`globals.css`.
