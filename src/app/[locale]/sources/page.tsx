import { ExternalLink } from 'lucide-react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { FallbackNotice } from '@/components/ui/FallbackNotice';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getSources, type SourceUsage } from '@/lib/content';
import { absoluteUrl, lguConfig } from '@/lib/lgu-config';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/sources'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('sourcesTitle'),
    description: t('sourcesDescription', { city: lguConfig.lgu.officialName }),
    alternates: { canonical: absoluteUrl(`/${locale}/sources`) },
  };
}

/**
 * The consolidated citation list.
 *
 * ## Why this route exists
 *
 * The footer used to carry a "Sources on this page" block; it was removed for a
 * copyright + version bar, and the per-figure captions were left to carry the
 * whole job. They do carry it — but a reader who wants to audit the portal
 * rather than read it had nowhere to go, and on a transparency site that is a
 * real reduction. This is the way back.
 *
 * ## It is DERIVED, not written
 *
 * The list is built by `getSources()` from the same `source` blocks the figures
 * themselves render. Nothing here is restated by hand, so a citation cannot say
 * one thing beside a number and another thing on this page. Adding a source to
 * a stat or a hotline puts it here with no second edit.
 *
 * That is also what finally makes `via` visible. The field has been carried in
 * the content schema, the loader and the types since the first round and was
 * rendered by nothing — so "cite THROUGH Wikipedia to the primary record" was a
 * rule the data obeyed and the reader could never see. It is the second line of
 * every citation that has one.
 */
export default async function SourcesPage({
  params,
}: PageProps<'/[locale]/sources'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [content, t, tStats, format] = await Promise.all([
    getSources(locale),
    getTranslations('sources'),
    getTranslations('stats'),
    getFormatter(),
  ]);

  const statLabel: Record<
    Extract<SourceUsage, { kind: 'stat' }>['key'],
    string
  > = {
    population: tStats('residents'),
    households: tStats('households'),
    barangays: tStats('barangays'),
    landArea: tStats('landArea'),
  };

  const usageLabel = (usage: SourceUsage) =>
    usage.kind === 'stat'
      ? statLabel[usage.key]
      : t('hotlineUsage', { organisation: usage.organisation });

  return (
    <>
      <main id="main" tabIndex={-1} className="page-measure py-12 sm:py-16">
        {content.hasFallback ? <FallbackNotice /> : null}

        <h1 className="mb-3 font-display text-section font-bold text-balance">
          {t('heading')}
        </h1>
        <p className="mb-2 max-w-prose text-lg leading-relaxed text-ink-secondary text-pretty">
          {content.intro}
        </p>
        <p className="mb-10 text-sm text-ink-tertiary">
          {t('lastReviewed', {
            date: format.dateTime(new Date(content.lastReviewedAt), {
              dateStyle: 'long',
            }),
          })}
        </p>

        <h2 className="mb-4 font-display text-xl font-bold tracking-tight">
          {t('citationsHeading')}
        </h2>
        <ul className="mb-12 grid gap-3">
          {content.citations.map(citation => (
            <li
              // Label AND url — the same identity `collectCitations` groups on.
              // The url alone is not unique: two citations may point at the same
              // record under different labels, which is exactly the case the
              // grouping was changed to preserve, and React warned about the
              // duplicate key the moment it did.
              key={`${citation.label} ${citation.url ?? ''}`}
              className="rounded-2xl border border-line bg-surface-raised p-4 sm:p-5"
            >
              <h3 className="text-base font-semibold wrap-anywhere">
                {citation.url ? (
                  <a
                    href={citation.url}
                    rel="noreferrer"
                    className="text-ink-link underline hover:text-ink-link-hover"
                  >
                    {citation.label}
                    <ExternalLink
                      aria-hidden="true"
                      className="ms-1 inline size-3.5 align-middle"
                    />
                  </a>
                ) : (
                  <span className="text-ink">{citation.label}</span>
                )}
              </h3>

              {/*
                The chain, finally rendered. A figure that reaches us through a
                tertiary source says so here rather than presenting the finding
                aid as the record.
              */}
              {citation.via ? (
                <p className="mt-1 text-sm text-ink-secondary">
                  {t('via', { source: citation.via })}
                </p>
              ) : null}
              {!citation.url ? (
                <p className="mt-1 text-sm text-ink-tertiary">{t('noLink')}</p>
              ) : null}

              <p className="mt-2 text-sm text-ink-secondary">
                <span className="font-semibold text-ink">{t('backs')}: </span>
                {citation.usedBy.map(usageLabel).join(' · ')}
              </p>
            </li>
          ))}
        </ul>

        <h2 className="mb-4 font-display text-xl font-bold tracking-tight">
          {t('caveatsHeading')}
        </h2>
        <ul className="mb-10 grid max-w-prose gap-3">
          {content.caveats.map(caveat => (
            <li
              key={caveat}
              className="border-s-2 border-line-control ps-4 leading-relaxed text-ink-secondary"
            >
              {caveat}
            </li>
          ))}
        </ul>

        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-ink-link hover:text-ink-link-hover"
        >
          {t('backHome')}
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
