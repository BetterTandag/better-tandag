import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

/**
 * The 404's own title. `meta.notFoundTitle` was written for this and then never
 * wired, so the page rendered under the home title template — a 404 that claims
 * to be the home page in the tab strip and in a search result.
 *
 * `robots: { index: false }` for the same reason the search route sets it: a
 * not-found page has nothing worth indexing.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('notFoundTitle'), robots: { index: false } };
}

/** A real 404 — Next serves this with the correct status, never a soft 200. */
export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <main id="main" tabIndex={-1} className="page-measure py-20">
      <h1 className="mb-3 font-display text-section font-bold text-balance">
        {t('heading')}
      </h1>
      <p className="mb-6 max-w-prose leading-relaxed text-ink-secondary">
        {t('body')}
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-full bg-ink-link px-6 font-semibold text-surface-page hover:bg-ink-link-hover"
      >
        {t('backHome')}
      </Link>
    </main>
  );
}
