import { cn } from '@/lib/utils';

/**
 * The BetterTandag mark: the City of Tandag boundary under the Philippine sun.
 *
 * Version 2 of the mark — see brand/logo/ for the design
 * sheet, the three standalone SVGs and the construction notes. The land shape
 * is the real administrative boundary (PSGC 1606800000, traced from
 * PSA/OpenStreetMap data); the sun is the flag's eight-ray sun in its official
 * construction, three rays per point, placed top-right where Tandag faces the
 * Pacific.
 *
 * ## Why this is inlined rather than an <img src="/logo.svg">
 *
 * The rebrand ships three files — colour, black and reversed-white — that
 * differ only in their two fills. Inlined, the fills come from the --mark-land
 * and --mark-sun role tokens, so ONE component renders all three: colour on the
 * page, a lighter land in dark theme (brand navy is 1.16:1 on the dark ground),
 * and the reversed mark automatically inside [data-surface='inverse'] — which
 * is how the footer gets the white variant without importing a second file.
 *
 * ## Two things that are load-bearing
 *
 * `idPrefix` is required: the mask and the sun's <use> chain need
 * document-unique ids, and a Server Component cannot call useId(). Two
 * instances sharing a prefix would break the second one's mask.
 *
 * The mask's black and white are LUMINANCE, not colour — white keeps, black
 * cuts. They are keywords rather than tokens on purpose: theming them would
 * punch a hole in the sun.
 *
 * Always `aria-hidden` — the wordmark sits beside it everywhere it appears, and
 * naming the SVG made the header link announce "BetterTandag BetterTandag
 * Surigao del Sur".
 *
 * Minimum legible size is 32px (the design sheet's own floor). Header 40,
 * footer 64.
 */

/** The traced City of Tandag boundary, in the mark's own 200×200 space. */
const LAND_PATH =
  'M150.9,55.0L150.1,54.6L64.1,50.0L58.3,58.7L56.9,59.6L56.7,61.9L57.8,63.7L57.1,64.9L57.2,67.7L60.4,73.1L58.2,76.6L60.6,80.0L61.8,86.0L60.6,87.9L61.1,90.5L61.1,93.6L62.1,93.9L62.2,96.4L64.2,98.8L64.4,101.1L48.0,104.4L96.2,184.5L100.6,180.4L103.0,183.2L106.1,181.8L112.9,187.9L114.7,189.8L122.3,183.8L135.6,170.4L146.1,157.7L161.6,151.5L163.8,155.1L165.9,156.4L169.2,154.0L178.9,151.2L181.2,151.6L194.0,145.7L191.8,143.3L188.5,138.8L185.7,134.2L183.8,129.7L183.2,127.2L182.1,125.2L182.0,123.2L183.3,120.2L185.0,118.1L182.3,116.9L178.1,116.3L177.5,114.3L177.8,109.3L177.0,108.0L171.8,106.2L171.8,104.6L173.8,103.3L173.2,101.6L170.1,104.3L169.7,106.6L172.7,108.1L172.2,110.8L170.3,111.9L168.9,110.1L166.7,110.1L162.0,111.1L159.2,110.1L155.0,107.7L152.7,105.7L149.4,103.6L143.3,96.7L142.0,91.4L139.5,87.1L139.1,84.1L139.9,81.5L144.1,78.2L144.9,74.2L143.7,73.8L143.7,72.0L144.7,69.5L147.2,65.4L146.7,64.2L147.4,60.4L149.9,57.6L150.9,55.0Z';

/** Applied identically to the mask cut-out and the drawn land, or they drift. */
const LAND_TRANSFORM = 'translate(-14 44) scale(0.75)';

/**
 * Cropped to the artwork, EDGE TO EDGE. Framing only — no geometry is touched.
 *
 * These numbers are the measured ink bounds, not an estimate: rendered at 10×
 * and read back in screen space, the drawing occupies x 22–156, y 44–186.35.
 * (`getBBox()` is the wrong tool here — on a `<use>` it reports the referenced
 * geometry *before* the element's own transform, which puts the land 26 units
 * out and yields a negative margin.)
 *
 * The delivered files frame this in a 154 square starting at (12, 40), which
 * leaves 10 units of air on each side and 4 above, 7.65 below — 87% × 92% fill.
 * A logo asked to fill its container has to touch all four edges, so the
 * component uses the ink box itself.
 *
 * That box is **not square** — 134 × 142.35, aspect 0.94 — so the element is
 * sized to match it. Forcing a square would either letterbox (the mark stops
 * touching two edges, which is the thing being fixed) or need
 * `preserveAspectRatio="none"`, which stretches a civic mark out of shape.
 *
 * The archived SVGs in brand/logo/ keep the delivered 154 framing. They are the
 * record; this is the lockup.
 */
const VIEW_BOX = '22 44 134 142.35';

/** Width ÷ height of the ink box above. Keeps the element free of letterbox. */
const ASPECT = 134 / 142.35;

export function Logo({
  idPrefix,
  size = 40,
  className,
}: {
  idPrefix: string;
  /** The mark's HEIGHT in px. Width follows the artwork's 0.94 aspect. */
  size?: number;
  className?: string;
}) {
  const landId = `${idPrefix}-land`;
  const gapId = `${idPrefix}-gap`;
  const rayId = `${idPrefix}-ray`;
  const pointId = `${idPrefix}-point`;
  const quadId = `${idPrefix}-quad`;
  const halfId = `${idPrefix}-half`;

  return (
    <svg
      viewBox={VIEW_BOX}
      // `size` is the mark's HEIGHT; the width follows the artwork. Passing
      // `size` to both would reintroduce the letterbox this crop removes.
      width={Math.round(size * ASPECT * 100) / 100}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={cn('block', className)}
    >
      <defs>
        <path id={landId} d={LAND_PATH} />
        {/*
          The clearance. The boundary is redrawn here at an 11px stroke and
          painted black, so the sun is cut away for ~5.5px either side of the
          coastline. That gap is what keeps both shapes readable when the mark
          is drawn in a single colour — the black and reversed variants.
        */}
        <mask
          id={gapId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="200"
          height="200"
        >
          <rect width="200" height="200" fill="white" />
          <use
            href={`#${landId}`}
            transform={LAND_TRANSFORM}
            fill="black"
            stroke="black"
            strokeWidth="11"
            strokeLinejoin="round"
          />
        </mask>
      </defs>

      {/*
        The flag sun, built the way the flag builds it: one point, mirrored into
        a pair, rotated into a quadrant, into a half, into eight. Each <use>
        doubles the previous group, so the whole sun is four small paths.
      */}
      <g mask={`url(#${gapId})`} className="fill-mark-sun">
        <g transform="translate(104 96) scale(2.7368)">
          <circle r="9" />
          <g id={halfId}>
            <g id={quadId}>
              <g id={pointId}>
                <path
                  d="M-1 0l.062.062L0 0l-.938-.062z"
                  transform="scale(19)"
                />
                <path
                  id={rayId}
                  d="M-.884.116l.05.05L0 0z"
                  transform="scale(19.2381)"
                />
                <use href={`#${rayId}`} transform="scale(1 -1)" />
              </g>
              <use href={`#${pointId}`} transform="rotate(45)" />
            </g>
            <use href={`#${quadId}`} transform="rotate(90)" />
          </g>
          <use href={`#${halfId}`} transform="rotate(180)" />
        </g>
      </g>

      <use
        href={`#${landId}`}
        transform={LAND_TRANSFORM}
        className="fill-mark-land"
      />
    </svg>
  );
}
