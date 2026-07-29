import { LayoutGrid, Mail } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { lguConfig } from '@/lib/lgu-config';
import { HeroSearchForm } from './HeroSearchForm';

/**
 * ## The independence notice is no longer here
 *
 * "An independent portal built by residents — not an official City Government
 * website" sat between the lede and the CTAs. It was removed by instruction:
 * the footer's about blurb ("Built by Tandaganons for Tandag…") is taken to
 * cover the same ground, and the page had accumulated several caveats.
 *
 * What still carries the claim: that footer blurb, and `meta.homeDescription`,
 * which is what a search result shows. Nothing above the fold states it now.
 */
export async function Hero() {
  const t = await getTranslations('hero');
  const place = {
    city: lguConfig.lgu.officialName,
    province: lguConfig.lgu.province,
  };

  return (
    <section
      id="top"
      className="relative overflow-hidden py-12 sm:py-16 lg:py-20"
    >
      {/* Decorative only, and childless — a mask on a container would mask its
          descendants too. Fades to nothing in dark, where the design has no wave. */}
      <div aria-hidden="true" className="hero-wave absolute inset-0" />
      <div
        aria-hidden="true"
        className="hero-glow pointer-events-none absolute inset-0"
      />

      <div className="relative page-measure grid items-center gap-8 lg:grid-cols-hero lg:gap-13">
        <div>
          <p className="motion-safe:rise-1 mb-4 text-2xs font-semibold tracking-caps text-ink-link uppercase sm:text-xs sm:tracking-eyebrow">
            {t('eyebrow', place)}
          </p>
          <h1 className="motion-safe:rise-2 mb-4 font-display text-hero font-bold text-balance">
            <span className="text-ink-link">{t('titleWelcome')}</span>{' '}
            <span className="text-ink-accent">{t('titleCarryOn')}</span>{' '}
            {/*
              The city is the destination, not a third word in a list, so it is
              set in its own larger token. `block` rather than a relied-upon
              natural wrap: with two type sizes in one heading the break point
              is no longer predictable from the text alone, and this line has
              always sat on its own.
            */}
            <span className="block text-hero-city text-ink">
              {t('titleCity')}
            </span>
          </h1>
          {/* mb-7, inherited from the notice this replaced — the lede is now
              the last thing before the CTAs and keeps the gap they had. */}
          <p className="motion-safe:rise-4 mb-7 max-w-lg text-lg leading-relaxed text-ink-secondary text-pretty">
            {t('lede', place)}
          </p>
          <div className="motion-safe:rise-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="#services"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full bg-ink-link px-6 text-base font-semibold text-surface-page hover:bg-ink-link-hover sm:w-auto"
            >
              <LayoutGrid aria-hidden="true" className="size-4 shrink-0" />
              {t('browseServices')}
            </a>
            {/* `#contact` — the section this button has always meant. It
                pointed at the Contribute panel for a while, when no contact
                section existed; that panel is gone and this is the only
                destination left that answers "contact us". */}
            <a
              href="#contact"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full border border-line-control bg-surface-raised px-6 text-base font-medium text-ink hover:border-ink-link sm:w-auto"
            >
              <Mail aria-hidden="true" className="size-4 shrink-0" />
              {t('contactUs')}
            </a>
          </div>
        </div>

        <div className="motion-safe:rise-3">
          <HeroSearchForm />
        </div>
      </div>
    </section>
  );
}
