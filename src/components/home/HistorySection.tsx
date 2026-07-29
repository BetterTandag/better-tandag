import { getTranslations } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import type { HomeContent } from '@/lib/content';

type HistoryProps = HomeContent['history'];

/**
 * The three name-origin stories beside the timeline.
 *
 * The design wrapped the etymology cards in an `<aside>` — they are primary
 * content, not tangential, so this is a `<section>`. The timeline is an `<ol>`:
 * it is a chronological sequence, and a stack of `<div>`s told a screen reader
 * nothing about its order or length.
 */
export async function HistorySection({ etymology, timeline }: HistoryProps) {
  const t = await getTranslations('history');

  return (
    <Section
      id="history"
      eyebrow={t('eyebrow')}
      heading={t('heading')}
      intro={
        <p className="mb-8 max-w-2xl text-base leading-relaxed text-ink-secondary">
          {t('intro')}
        </p>
      }
    >
      {/*
        `lg:items-center` — the etymology column is much shorter than the
        timeline beside it, so at `lg` it sits at the midpoint of the row
        rather than stretching to a height it has nothing to fill. Below `lg`
        the two stack and the alignment is moot.

        The scroll-driven travel that briefly lived here (a three-row grid
        animating its `fr` spacers against `animation-timeline: view()`) has
        been reverted along with its `.history-column-travel` rule, its
        keyframes and its two e2e tests. The card and timeline hover states
        below are unaffected and stay.
      */}
      <div className="grid gap-8 lg:grid-cols-narrative lg:items-center">
        <section aria-labelledby="etymology-heading">
          <h3
            id="etymology-heading"
            className="mb-3 border-b border-line pb-3 text-2xs font-bold tracking-eyebrow text-ink-link uppercase"
          >
            {t('nameOrigin')}
          </h3>
          <p className="mb-4 text-sm leading-relaxed text-ink-secondary">
            {t('nameOriginIntro')}
          </p>
          <ul className="grid gap-3">
            {etymology.map(entry => (
              <li
                key={entry.word}
                // The ServicesSection card idiom, unchanged: motion-safe
                // transition, 4px lift, border to the link colour.
                className="rounded-2xl border border-line bg-surface-raised p-5 motion-safe:transition-transform motion-safe:duration-300 hover:border-ink-link motion-safe:hover:-translate-y-1"
              >
                <p className="font-serif text-3xl leading-tight text-ink-accent italic">
                  {entry.word}
                </p>
                <p className="mt-2 mb-2.5 text-2xs font-semibold tracking-label text-ink-tertiary uppercase">
                  {entry.gloss}
                </p>
                <p className="text-sm leading-relaxed text-ink-secondary">
                  {entry.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <ol aria-label={t('timelineLabel')} className="grid">
          {timeline.map((entry, index) => (
            <li
              key={`${entry.period}-${entry.title}`}
              // NO vertical padding on the <li>. The rail below is a grid item,
              // so it stretches to the row's CONTENT box only — any padding
              // here becomes a dead zone the line cannot reach, which broke the
              // rail into disconnected 24px-gapped segments. The gap now lives
              // on the text cell instead, inside the row the rail spans.
              // `group` only — no hover styling on the <li> itself. Anything
              // that moved this element would drag the rail with it and break
              // the continuous line the row below depends on.
              className="group grid grid-cols-timeline gap-x-4"
            >
              {/* The rail and dot replace the design's absolutely-positioned
                  line — no magic offsets, and it works in either writing
                  direction. Decorative, so hidden from the accessibility tree.

                  Two things have to hold at once:
                  · The inset is -2 (-8px), not -1.5: absolute insets resolve
                    against the PADDING box, which the 2px `border-s` has
                    already pushed inward, so -8px puts the 14px dot's centre on
                    the line (railLeft + 2 - 8 + 7 = railLeft + 1).
                  · The last row keeps the border but turns it TRANSPARENT
                    rather than dropping it. Removing it would shrink the
                    padding box by 2px and shift that one dot 2px out of line —
                    same trap as above, one row down. */}
              <span
                aria-hidden="true"
                className={`relative w-4 border-s-2 ${
                  index === timeline.length - 1
                    ? 'border-transparent'
                    : 'border-line'
                }`}
              >
                {/* The dot grows on hover instead of changing colour: colour
                    is already carrying the milestone/not-milestone
                    distinction, and recolouring it on hover would erase that
                    for as long as the pointer sits there. Transform-only, so
                    the rest geometry the rail depends on is untouched. */}
                <span
                  className={`absolute -inset-s-2 top-0.5 block size-3.5 rounded-full border-2 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-125 ${
                    entry.milestone
                      ? 'border-accent-400 bg-accent-400'
                      : 'border-ink-link bg-surface-page'
                  }`}
                />
              </span>
              {/* `last:` would match the div being its li's last child — always
                  true — so the final row is keyed off the index instead. */}
              {/* A 2px lift, not the cards' 4px, and no border: the row has to
                  stay visually tied to its dot, and a bordered box here would
                  read as a card sitting on a timeline rather than as an entry
                  in one. The title's colour change is the non-motion half of
                  the feedback, so the entry still responds under
                  `prefers-reduced-motion`. */}
              <div
                className={`motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:-translate-y-0.5 ${
                  index === timeline.length - 1 ? 'pb-1' : 'pb-6'
                }`}
              >
                {/* The period is inside the heading so the accessible name is
                    self-contained ("1650 — Capital of the whole Caraga
                    district") when browsing by heading. */}
                <h3 className="mb-1.5">
                  <span className="block font-display text-xs font-bold tracking-caps text-ink-link uppercase">
                    {entry.period}
                  </span>
                  <span className="block text-base font-semibold text-ink motion-safe:transition-colors motion-safe:duration-300 group-hover:text-ink-link">
                    {entry.title}
                  </span>
                  {/* The gold dot is the only visual marker of a milestone.
                      Naming it in text keeps that out of colour alone. */}
                  {entry.milestone ? (
                    <span className="sr-only">{t('milestone')}</span>
                  ) : null}
                </h3>
                <p className="text-sm leading-relaxed text-ink-secondary">
                  {entry.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
