import { AlertTriangle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { HomeHotline } from '@/lib/content';
import { telHref } from '@/lib/tel';
import { cn } from '@/lib/utils';
import { TickerViewport } from './TickerViewport';

/** Shared by the run and its echo, so the two measure the same. */
const ENTRY_CLASS = 'inline-flex items-center rounded-sm px-1';

/**
 * The emergency hotline bar, above the header.
 *
 * One centred line, in a fixed shape:
 *
 *   ⚠ Emergency hotlines: City DRRM Office 0907 299 3793 | 0956 739 5623 ·
 *   PNP Tandag 0998 598 7378 | 0950 707 3402 · … · National Emergency Line 911
 *
 * `·` separates organisations; `|` separates the numbers belonging to one
 * organisation. Both are decorative and `aria-hidden` — a screen reader gets
 * the organisation and the number from each link's own accessible name, and
 * punctuation read aloud between them is noise.
 *
 * Numbers come from content/home/emergency.yaml through content.ts. Adding a
 * hotline there adds it here, grouped under its organisation, with no code
 * change.
 *
 * ## Motion
 *
 * Under 1120px the row is a marquee; at 1120px and up it is a static centred
 * row. It stops entirely under `prefers-reduced-motion`, and pauses on hover,
 * on keyboard focus, on touch and while being scrolled — the last two need
 * state, which is why the viewport is a client leaf. See TickerViewport.
 *
 * ## What it replaced
 *
 * This bar took the slot the independence notice used to occupy. That sentence
 * — "not an official City Government website" — is the one thing stopping the
 * portal being mistaken for the LGU's own, so it moved into the hero rather
 * than being dropped. See Hero.tsx.
 *
 * ## Accessibility
 *
 * · The second run is a VISUAL echo: `aria-hidden`, and spans rather than
 *   anchors, so the list is neither read twice nor duplicated as eight more
 *   focusable `tel:` links inside an aria-hidden subtree.
 * · These targets are ~28px, under the project's 44px floor. Deliberate, and
 *   logged in the exemption list in e2e/home.a11y.spec.ts rather than left
 *   invisible; every number here is also in #emergency at full size.
 */
export async function HotlineTicker({ hotlines }: { hotlines: HomeHotline[] }) {
  const [t, tEmergency] = await Promise.all([
    getTranslations('ticker'),
    getTranslations('emergency'),
  ]);

  const groups = hotlines.filter(hotline => hotline.numbers.length > 0);

  // No hotlines in the manifest means no bar at all — an empty red strip above
  // the header reads as a broken page, not as "no numbers".
  if (groups.length === 0) return null;

  return (
    <section
      // `data-surface="inverse"` for one role: `--focus-ring` resolves to
      // accent-400 there, which is 12.01:1 on this ground. The ink colours are
      // explicit `error` steps rather than the scope's, whose blue-grey muted
      // ink was mixed for navy surfaces, not a maroon one.
      data-surface="inverse"
      role="region"
      aria-label={t('regionLabel')}
      className="border-b border-error-800 bg-error-950"
    >
      <TickerViewport className="flex h-7 items-center justify-center">
        <div className="hotline-track">
          <HotlineRun
            groups={groups}
            label={t('label')}
            callLabel={(organisation, number) =>
              tEmergency('callAria', { organisation, number })
            }
          />
          <HotlineRun groups={groups} label={t('label')} echo />
        </div>
      </TickerViewport>
    </section>
  );
}

/**
 * One pass of the list. `echo` renders the identical boxes as inert text so the
 * loop is seamless without duplicating a single link.
 */
function HotlineRun({
  groups,
  label,
  callLabel,
  echo = false,
}: {
  groups: HomeHotline[];
  label: string;
  callLabel?: (organisation: string, number: string) => string;
  echo?: boolean;
}) {
  return (
    <div
      className={cn('hotline-run text-2xs', echo && 'hotline-echo')}
      {...(echo ? { 'aria-hidden': true } : {})}
    >
      <span className="flex shrink-0 items-center gap-1.5 font-bold tracking-caps text-error-400 uppercase">
        <AlertTriangle aria-hidden="true" className="size-3 shrink-0" />
        {label}
      </span>

      {groups.map((group, groupIndex) => (
        <span
          key={group.organisation}
          className="flex shrink-0 items-center gap-1"
        >
          {/* Between organisations only. */}
          {groupIndex > 0 ? (
            <span aria-hidden="true" className="px-1.5 text-error-600">
              ·
            </span>
          ) : null}

          <span className="shrink-0 font-bold text-ink-inverse">
            {group.organisation}
          </span>

          {group.numbers.map((number, numberIndex) => (
            <span key={number} className="flex shrink-0 items-center gap-1">
              {/* Between two numbers of the SAME organisation. */}
              {numberIndex > 0 ? (
                <span aria-hidden="true" className="text-error-600">
                  |
                </span>
              ) : null}
              {echo ? (
                <span
                  className={cn(ENTRY_CLASS, 'tabular-nums text-error-200')}
                >
                  {number}
                </span>
              ) : (
                <a
                  href={telHref(number)}
                  aria-label={callLabel?.(group.organisation, number)}
                  // With `hover:underline` banned site-wide, colour is the only
                  // channel left, so the feedback has to move: a 2.40:1 wash
                  // plus the number brightening 12.71 -> 15.49:1. Both pairs
                  // stay above 4.5:1 ON the washed ground, so hovering never
                  // costs legibility.
                  // `outline-offset-0`: the bar is 28px and the base focus ring
                  // sits 2px outside the box with a further 2px offset, which
                  // the viewport's overflow would clip.
                  className={cn(
                    ENTRY_CLASS,
                    'tabular-nums text-error-200 focus-visible:outline-offset-0 motion-safe:transition-colors motion-safe:duration-150 hover:bg-error-700 hover:text-error-100'
                  )}
                >
                  {number}
                </a>
              )}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}
