import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { CountUp } from '@/components/ui/CountUp';
import type { HomeStat } from '@/lib/content';
import { lguConfig } from '@/lib/lgu-config';

/**
 * The four headline figures.
 *
 * Values come from config/lgu.config.json; captions and citations come from
 * content/home/stats.yaml. The server renders the TRUE, formatted number — the
 * count-up animates up to a value that is already in the HTML, so nothing ever
 * publishes "0 residents", not even for a frame.
 */
export async function StatBand({ stats }: { stats: HomeStat[] }) {
  const [t, format, locale] = await Promise.all([
    getTranslations('stats'),
    getFormatter(),
    getLocale(),
  ]);

  const { population, households, barangayCount, landAreaKm2 } = lguConfig.lgu;

  const values: Record<
    HomeStat['key'],
    { label: string; value: number; fractionDigits: number; unit?: string }
  > = {
    population: { label: t('residents'), value: population, fractionDigits: 0 },
    households: {
      label: t('households'),
      value: households,
      fractionDigits: 0,
    },
    barangays: {
      label: t('barangays'),
      value: barangayCount,
      fractionDigits: 0,
    },
    landArea: {
      label: t('landArea'),
      value: landAreaKm2,
      fractionDigits: 2,
      unit: t('squareKilometres'),
    },
  };

  return (
    <div
      data-surface="inverse"
      aria-labelledby="stats-heading"
      role="group"
      className="border-y border-line bg-surface-band text-ink"
    >
      <h2 id="stats-heading" className="sr-only">
        {t('regionLabel')}
      </h2>
      <dl className="page-measure grid grid-cols-1 gap-x-10 gap-y-8 py-9 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => {
          const item = values[stat.key];
          const formatted = format.number(item.value, {
            minimumFractionDigits: item.fractionDigits,
            maximumFractionDigits: item.fractionDigits,
          });

          return (
            <div key={stat.key}>
              <dt className="mb-2 text-2xs font-semibold tracking-caps text-ink-on-band-muted uppercase">
                {item.label}
              </dt>
              <dd>
                <span className="font-display text-stat font-bold tabular-nums">
                  <CountUp
                    to={item.value}
                    fractionDigits={item.fractionDigits}
                    locale={locale}
                  >
                    {formatted}
                  </CountUp>
                  {item.unit ? (
                    <span className="text-lg font-medium text-ink-on-band-muted">
                      {' '}
                      {item.unit}
                    </span>
                  ) : null}
                </span>
                {/* A caption, not a link — as in the approved design. Making
                    it a link would put a 15px-tall tap target under a headline
                    figure. The caption names the record; the full citation,
                    including whether the figure was reached THROUGH a tertiary
                    source, is on /sources, which is built from this same
                    `source` block and so cannot disagree with it. */}
                <span className="mt-2 block text-xs text-ink-on-band-muted">
                  {stat.caption}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
