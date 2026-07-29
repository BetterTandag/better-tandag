import { Phone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { HomeHotline } from '@/lib/content';
import { telHref } from '@/lib/tel';
import { cn } from '@/lib/utils';
import { HotlineSource } from './HotlineSource';

/**
 * The one number worth promoting out of the list, as a full-width band.
 *
 * Which number that is comes from `emphasis: true` in
 * content/home/emergency.yaml — the component never names it.
 *
 * ## Two sides, not one stack
 *
 * The label, the role it plays and the citation sit on the LEFT; the number
 * alone sits on the RIGHT. The band reads as a caption and its answer, which is
 * how a directory row reads, rather than as four right-aligned lines the eye
 * has to walk down to find the digits.
 *
 * It is a GRID rather than two flex children so the DOM order can stay
 * label → number → role → citation while the visual order puts the number in
 * the second column. The number is the reason this band exists; a screen-reader
 * user should not have to pass the source citation to reach it. The number is
 * placed explicitly into column 2 spanning all three rows, so the left column
 * auto-fills rows 1–3 around it.
 *
 * Below `sm` the grid collapses to one column and the DOM order is the reading
 * order: label, number, role, citation — the number still directly under the
 * thing that names it.
 *
 * ## The number is sized to fill its cell, not to match a heading
 *
 * At `sm` and up the number's cell carries `container-type: size` and the digits
 * are set in `--text-callband`, which is a `cqh` expression — the font size
 * tracks the cell's own height. That height comes from the LEFT column, because
 * the number's cell spans all three of its rows and size containment takes the
 * number itself out of the calculation. No cycle, and the number is as tall as
 * the block that names it.
 *
 * Three things this depends on, each of which silently breaks it:
 *
 * · The cell must sit in a `1fr` track. `grid-cols-callband` used to be
 *   `1fr auto`; a size-contained item reports a max-content width of 0, so the
 *   `auto` track collapsed the column to nothing.
 * · `items-center` is gone from the grid. The cell has to STRETCH to the row
 *   height or `100cqh` is the height of the number, which is circular.
 * · Below `sm` there is no external height, so the container is not applied and
 *   the number keeps `--text-section`. Applying it there collapses the cell.
 *
 * It only engages for a single number. A hotline carrying two or three would
 * stack them inside one contained cell and each would be sized against the whole
 * cell rather than its share of it; those fall back to `--text-section`.
 *
 * `data-surface="accent"` over `bg-accent-400` fixes the ink at navy in BOTH
 * themes (9.59:1) — the band must not soften into the page when the reader has
 * dark mode on.
 */
export async function EmergencyCallBand({ hotline }: { hotline: HomeHotline }) {
  const t = await getTranslations('emergency');
  const fillsCell = hotline.numbers.length === 1;

  return (
    <div
      data-surface="accent"
      className="rounded-2xl bg-accent-400 px-4 py-6 text-ink sm:px-6 sm:py-8 lg:col-span-2"
    >
      <div className="grid gap-x-6 sm:grid-cols-callband">
        {/* The phone glyph sits on the label, not on the number. On this
            surface every colour resolves to the same navy, so the icon is what
            says "call this" — once, up front, without competing with the
            digits for width at 320px. */}
        <h3 className="flex items-center gap-1.5 text-2xs font-bold tracking-caps uppercase sm:col-start-1 sm:text-xs">
          <Phone aria-hidden="true" className="size-3.5 shrink-0" />
          {hotline.organisation}
        </h3>

        <div
          className={cn(
            'mt-1 grid gap-1 sm:col-start-2 sm:row-span-3 sm:row-start-1 sm:mt-0 sm:justify-items-end',
            // The em box is ~1.43x the cap height it draws, so the line box
            // overhangs the cell top and bottom by ~20% of the font size. That
            // slack is transparent, and centring it splits it evenly so the ink
            // itself lands dead centre in the cell rather than dropping out of
            // the bottom of it.
            fillsCell && 'sm:@container-size sm:content-center'
          )}
        >
          {hotline.numbers.map(number => (
            <a
              key={number}
              href={telHref(number)}
              aria-label={t('callAria', {
                organisation: hotline.organisation,
                number,
              })}
              // `inline-block` rather than a flex row: the number has to be
              // able to break inside itself if a longer one is ever flagged,
              // and a flex child would push the band sideways at 320px instead
              // of wrapping.
              className={cn(
                'inline-block max-w-full font-display font-bold tabular-nums wrap-break-word hover:text-ink-link-hover',
                fillsCell
                  ? 'text-callband-compact sm:text-callband'
                  : 'text-section'
              )}
            >
              {number}
            </a>
          ))}
        </div>

        <p className="mt-1 text-sm font-medium sm:col-start-1 sm:row-start-2">
          {hotline.role}
        </p>

        <HotlineSource
          source={hotline.source}
          className="mt-3 sm:col-start-1 sm:row-start-3"
        />
      </div>
    </div>
  );
}
