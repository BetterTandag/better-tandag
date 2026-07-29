import { getTranslations } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import type { HomeTravelCard } from '@/lib/content';
import { cn } from '@/lib/utils';

/**
 * By air, by land, by sea, and what to know on arrival.
 *
 * A fixed 1 / 2 / 4 ladder rather than the design's `auto-fit minmax(238px)`,
 * which orphaned the dark "Once you're here" card alone on a second row at
 * tablet widths.
 */
export async function GettingHere({ cards }: { cards: HomeTravelCard[] }) {
  const t = await getTranslations('gettingHere');

  return (
    <Section
      id="getting-here"
      eyebrow={t('eyebrow')}
      heading={t('heading')}
      aside={
        <p className="max-w-xs text-base leading-relaxed text-ink-secondary">
          {t('summary')}
        </p>
      }
    >
      <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(card => (
          <li key={card.title}>
            <article
              data-surface={card.surface === 'inverse' ? 'inverse' : undefined}
              className={cn(
                'h-full rounded-2xl border p-6',
                // The ServicesSection card idiom verbatim, so the two grids
                // behave identically. `hover:border-ink-link` is deliberately
                // NOT branched on the surface: inside `data-surface="inverse"`
                // that token already resolves to accent-400, so the dark card
                // picks up a gold edge while the three light ones pick up the
                // brand navy — one class, correct on both grounds.
                'motion-safe:transition-transform motion-safe:duration-300 hover:border-ink-link motion-safe:hover:-translate-y-1',
                card.surface === 'inverse'
                  ? 'border-line bg-surface-inverse text-ink'
                  : 'border-line bg-surface-raised'
              )}
            >
              {/* `ink-accent` (accent-700) is documented display-only — it is
                  3.93:1 on a raised surface, which fails at this 11px size.
                  `ink-accent-strong` (accent-800) is the body-safe gold, and on
                  an inverse surface both resolve to the same accent-400. */}
              <p className="mb-3 text-2xs font-bold tracking-label uppercase text-ink-accent-strong">
                {card.kicker}
              </p>
              <h3 className="mb-2.5 font-display text-lg leading-snug font-bold tracking-tight">
                {card.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-secondary">
                {card.body}
              </p>
            </article>
          </li>
        ))}
      </ul>
    </Section>
  );
}
