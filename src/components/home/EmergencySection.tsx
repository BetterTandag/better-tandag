import { AlertTriangle, ExternalLink, Phone } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';
import type { HomeContent } from '@/lib/content';
import { lguConfig } from '@/lib/lgu-config';
import { telHref } from '@/lib/tel';
import { EmergencyCallBand } from './EmergencyCallBand';
import { HotlineSource } from './HotlineSource';

type EmergencyProps = HomeContent['emergency'];

/**
 * Emergency.
 *
 * The local numbers are contributor-supplied and could not be traced to a
 * public posting (tandag.gov.ph does not resolve). They are published anyway,
 * by explicit decision — with their provenance and a check date stated ABOVE
 * the list, and each number's own source line saying plainly that it is
 * unconfirmed. Publishing without that framing would be the actual problem;
 * publishing with it lets a reader weigh the number themselves.
 *
 * Every number is a full-width row whose accessible name carries its
 * organisation. The design stacked three 20px `tel:` targets for BFP alone, to
 * be tapped one-handed in a storm.
 *
 * One number is promoted out of the list into a band spanning both columns —
 * see EmergencyCallBand.
 */
export async function EmergencySection({
  provenance,
  hotlines,
  pendingOffices,
  preparedness,
}: EmergencyProps) {
  const [t, tCommon, format] = await Promise.all([
    getTranslations('emergency'),
    getTranslations('common'),
    getFormatter(),
  ]);

  const checkedOn = format.dateTime(
    new Date(`${provenance.lastCheckedAt}T00:00:00Z`),
    { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }
  );

  // Split by the CONTENT flag, never by the number or the organisation name.
  // Whichever entry carries `emphasis: true` in content/home/emergency.yaml is
  // the one promoted to the band below — moving that flag to another line, or
  // to none at all, needs no code change.
  const banner = hotlines.filter(hotline => hotline.emphasis);
  const listed = hotlines.filter(hotline => !hotline.emphasis);

  return (
    <section
      id="emergency"
      data-surface="inverse"
      aria-labelledby="emergency-heading"
      className="reveal-on-scroll relative mt-16 overflow-hidden bg-surface-inverse-deep text-ink sm:mt-20"
    >
      <div
        aria-hidden="true"
        className="slab-glow pointer-events-none absolute inset-0"
      />

      <div className="relative page-measure py-14 sm:py-18">
        <p className="mb-2 text-2xs font-semibold tracking-label text-ink-accent uppercase">
          {t('eyebrow')}
        </p>
        <h2
          id="emergency-heading"
          className="mb-3 font-display text-section font-bold text-balance"
        >
          {t('heading')}
        </h2>
        <p className="mb-5 max-w-2xl text-base leading-relaxed text-ink-secondary">
          {t('intro', { rainfall: lguConfig.lgu.annualRainfallMm })}
        </p>

        {/*
          Provenance sits ABOVE the numbers, not in a footnote. Most of these
          are contributor-supplied and unconfirmed against any public posting;
          a reader deciding whether to trust a number in a storm needs that
          before they read it, not after.
        */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-accent-400 bg-surface-raised px-4 py-3.5">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-4.5 shrink-0 text-ink-accent"
          />
          <p className="text-sm leading-relaxed text-ink-secondary">
            {provenance.note}{' '}
            <strong className="font-semibold text-ink-accent">
              {tCommon('lastChecked')}: {checkedOn}
            </strong>
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-hotlines">
          {/* `justify-center` keeps the rows centred inside this panel when it
              is the shorter of the two. The panel itself always stretches — as
              does "Before the season" opposite, so the two boxes are the same
              height whichever one is driving it. */}
          <div className="flex flex-col justify-center overflow-hidden rounded-2xl border border-line bg-surface-raised">
            {/* The visible "Hotlines" header is removed by request. It stays in
                the accessibility tree so the list keeps a name and the heading
                order (h2 → h3 → h4) does not skip a level. */}
            <h3 className="sr-only">{t('hotlines')}</h3>
            <ul>
              {listed.map(hotline => (
                <li
                  key={hotline.organisation}
                  className="flex flex-col gap-2 border-t border-line px-4 py-3 first:border-t-0 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-4 sm:px-6"
                >
                  <div className="min-w-0">
                    <h4 className="text-base font-semibold">
                      {hotline.organisation}
                    </h4>
                    <p className="text-xs text-ink-secondary">{hotline.role}</p>
                    <HotlineSource source={hotline.source} className="mt-1" />
                  </div>
                  <div className="flex flex-col gap-1 sm:items-end">
                    {hotline.numbers.map(number => (
                      <a
                        key={number}
                        href={telHref(number)}
                        aria-label={t('callAria', {
                          organisation: hotline.organisation,
                          number,
                        })}
                        // No min-height, by request: three stacked 44px rows
                        // made the BFP entry tower over the others. NOTE this
                        // drops these below the 44px touch-target floor — see
                        // the exemption list in e2e/home.a11y.spec.ts.
                        className="inline-flex items-center py-0.5 font-display text-base font-semibold tabular-nums text-ink-link hover:text-ink-link-hover"
                      >
                        <Phone
                          aria-hidden="true"
                          className="me-2 size-4 sm:hidden"
                        />
                        {number}
                      </a>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* NOT `content-center` any more. The column stretches to the row
              height either way; centring made its rows sit at their natural
              height in the middle of that box, so "Before the season" ended up
              visibly shorter than the hotlines panel beside it. With the
              default `stretch`, the panel fills the column and the two match.
              If a pending-offices card ever renders, the leftover height is
              shared between the two rows rather than pooling above them. */}
          <div className="grid gap-3">
            <div className="rounded-2xl border border-line bg-surface-raised p-5 sm:p-6">
              <h3 className="mb-3.5 text-2xs font-bold tracking-caps text-ink-secondary uppercase">
                {t('beforeSeason')}
              </h3>
              <ol className="grid gap-2.5 text-sm leading-relaxed text-ink-secondary">
                {preparedness.map((step, index) => (
                  <li key={step} className="flex gap-2.5">
                    <span
                      aria-hidden="true"
                      className="font-bold tabular-nums text-ink-accent"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Only when an office is actually missing a number. With the list
                complete this card disappears entirely rather than sitting there
                claiming a gap that no longer exists. */}
            {pendingOffices.length > 0 ? (
              <div className="rounded-2xl border border-dashed border-line-control bg-surface-sunken p-5 sm:p-6">
                <h3 className="mb-2 flex items-center gap-2 text-base font-semibold">
                  <AlertTriangle
                    aria-hidden="true"
                    className="size-4.5 shrink-0 text-ink-accent"
                  />
                  {t('pendingTitle')}
                </h3>
                <p className="text-sm leading-relaxed text-ink-secondary">
                  {t('pendingBody', {
                    offices: format.list(pendingOffices, {
                      type: 'conjunction',
                    }),
                  })}
                </p>
                <a
                  href={lguConfig.socials.cdrrmoFacebook}
                  rel="noreferrer"
                  className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-link hover:text-ink-link-hover"
                >
                  {t('pendingCta')}
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
              </div>
            ) : null}
          </div>

          {/* Spans both columns, below them. Content-driven: nothing renders
              here unless a hotline carries `emphasis: true`. */}
          {banner.map(hotline => (
            <EmergencyCallBand key={hotline.organisation} hotline={hotline} />
          ))}
        </div>
      </div>
    </section>
  );
}
