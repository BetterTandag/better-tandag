import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { searchPortal } from '@/lib/search';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/search'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { title: t('searchTitle'), robots: { index: false } };
}

/**
 * The dynamic half. `searchParams` is uncached by definition, so with
 * `cacheComponents` on it has to sit behind its own Suspense boundary —
 * otherwise it blocks the whole route from prerendering.
 */
async function SearchResults({
  searchParams,
  locale,
}: {
  searchParams: PageProps<'/[locale]/search'>['searchParams'];
  locale: Locale;
}) {
  const query = await searchParams;
  const raw = query.q;
  const term = (Array.isArray(raw) ? raw[0] : (raw ?? '')).trim();

  const t = await getTranslations('search');
  const results = term ? await searchPortal(term, locale) : [];

  return (
    <>
      <h1 className="mb-2 font-display text-section font-bold text-balance">
        {term ? t('resultsFor', { query: term }) : t('heading')}
      </h1>

      {/* Announced, so a screen-reader user learns the outcome rather than
          being left with a silently-changed page. */}
      <p role="status" className="mb-8 text-sm text-ink-secondary">
        {term ? t('resultCount', { count: results.length }) : t('empty')}
      </p>

      {term && results.length === 0 ? (
        <p className="max-w-prose leading-relaxed text-ink-secondary">
          {t('noResults', { query: term })}
        </p>
      ) : null}

      {results.length > 0 ? (
        <ul className="grid gap-3">
          {results.map(result => (
            <li key={`${result.href}-${result.title}`}>
              <article className="rounded-2xl border border-line bg-surface-raised p-4">
                <h2 className="text-base font-semibold">
                  {result.status === 'coming-soon' ? (
                    <>
                      {result.title}
                      <span className="sr-only"> — {result.kind}</span>
                    </>
                  ) : (
                    <a
                      href={result.href}
                      className="text-ink hover:text-ink-link-hover"
                    >
                      {result.title}
                    </a>
                  )}
                </h2>
                <p className="mt-1 text-xs text-ink-tertiary">{result.kind}</p>
              </article>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

/**
 * Where the hero form submits. Server-rendered, so the result has a shareable
 * URL, works with JS disabled, and ships no search index to the browser.
 */
export default async function SearchPage({
  params,
  searchParams,
}: PageProps<'/[locale]/search'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('search');

  return (
    <>
      <main id="main" tabIndex={-1} className="page-measure py-12 sm:py-16">
        <Suspense
          fallback={
            <h1 className="mb-2 font-display text-section font-bold text-balance">
              {t('heading')}
            </h1>
          }
        >
          <SearchResults searchParams={searchParams} locale={locale} />
        </Suspense>

        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center text-ink-link hover:text-ink-link-hover"
        >
          {t('backHome')}
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
