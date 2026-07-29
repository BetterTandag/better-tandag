import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { HotlineTicker } from '@/components/layout/HotlineTicker';
import { Logo } from '@/components/ui/Logo';
import { SkipLink } from '@/components/ui/SkipLink';
import { Wordmark } from '@/components/ui/Wordmark';
import { routing } from '@/i18n/routing';
import { getHomeContent } from '@/lib/content';
import { lguConfig } from '@/lib/lgu-config';

/**
 * The 404 a visitor actually gets.
 *
 * `app/[locale]/not-found.tsx` only renders when `notFound()` is called from
 * inside that segment — and `proxy.ts` negotiates the locale before a request
 * can reach it, so nothing ever called it. Every real 404 (`/en/no-such-page`,
 * `/nope`, `/xx`) fell through to Next's built-in "404: This page could not be
 * found." We shipped a written, translated 404 page that no visitor could see.
 * This is the one Next uses for an unmatched URL.
 *
 * ## It cannot know the locale
 *
 * The global not-found renders outside the `[locale]` segment, so there are no
 * params to read and next-intl resolves to `routing.defaultLocale`. That is a
 * documented Next limitation, not an oversight: a URL that matched no route has
 * no locale to speak of. `<html lang>` is the default locale for the same
 * reason, which is why the copy is deliberately plain — it has to work for a
 * reader who asked for Filipino.
 *
 * ## Why it carries the ticker
 *
 * It shipped as a dead end: a heading, a sentence and one link, with no
 * navigation and no emergency numbers. On a civic portal the 404 is a page
 * people reach from a stale bookmark or a mistyped address, and "emergency
 * numbers are never more than a glance away" does not get an exception for it.
 *
 * The ticker can come along because `TickerViewport`, its only client leaf,
 * takes `children` and reads no translations — so it needs no
 * `NextIntlClientProvider`, which this file is outside of. The site HEADER
 * cannot: its locale switcher, theme toggle and nav disclosures all call
 * `useTranslations`. Hence a mark that links home rather than the full chrome.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({
    locale: routing.defaultLocale,
    namespace: 'meta',
  });
  return { title: t('notFoundTitle'), robots: { index: false } };
}

export default async function NotFound() {
  /*
   * Required, and easy to miss out here.
   *
   * The `[locale]` layout calls this for every route inside the segment; this
   * file is outside it, so without the call next-intl resolves the locale by
   * READING THE REQUEST. Under `cacheComponents` that is runtime data accessed
   * outside `<Suspense>`, and the route stops prerendering — the dev overlay
   * reported it the moment the ticker and skip link were added, both of which
   * call `getTranslations()` with no explicit locale.
   *
   * Pinning it to the default locale is correct here: an unmatched URL has no
   * locale to negotiate from.
   */
  setRequestLocale(routing.defaultLocale);

  const [{ emergency }, t, tCommon, tNav, tHeader] = await Promise.all([
    getHomeContent(routing.defaultLocale),
    getTranslations({ locale: routing.defaultLocale, namespace: 'notFound' }),
    getTranslations({ locale: routing.defaultLocale, namespace: 'common' }),
    getTranslations({ locale: routing.defaultLocale, namespace: 'nav' }),
    getTranslations({ locale: routing.defaultLocale, namespace: 'header' }),
  ]);

  /*
   * Unprefixed hrefs, and `next/link` rather than next-intl's `Link`: outside
   * the [locale] segment the localised helper has no locale to prefix with, and
   * `proxy.ts` negotiates `/` and `/sources` to the reader's own locale anyway —
   * which is how someone who asked for Filipino lands back on /fil.
   */
  const destinations = [
    { href: '/', label: tCommon('home') },
    { href: '/sources', label: tNav('sources') },
  ];

  return (
    <>
      <SkipLink />
      <HotlineTicker hotlines={emergency.hotlines} />

      <header className="border-b border-line">
        <div className="page-measure flex items-center py-2">
          <Link
            href="/"
            aria-label={tHeader('homeLink', { portal: lguConfig.portal.name })}
            className="flex min-h-11 shrink-0 items-center gap-2 hover:no-underline"
          >
            <Logo idPrefix="not-found" size={40} />
            <Wordmark />
          </Link>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="page-measure py-16 sm:py-20">
        <h1 className="mb-3 font-display text-section font-bold text-balance">
          {t('heading')}
        </h1>
        <p className="mb-8 max-w-prose leading-relaxed text-ink-secondary">
          {t('body')}
        </p>

        <nav aria-label={tNav('label')}>
          <ul className="flex flex-wrap items-center gap-3">
            {destinations.map((destination, index) => (
              <li key={destination.href}>
                <Link
                  href={destination.href}
                  className={
                    index === 0
                      ? 'inline-flex min-h-11 items-center rounded-full bg-ink-link px-6 font-semibold text-surface-page hover:bg-ink-link-hover'
                      : 'inline-flex min-h-11 items-center rounded-full border border-line-control px-6 font-medium text-ink hover:border-ink-link hover:text-ink-link'
                  }
                >
                  {destination.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </>
  );
}
