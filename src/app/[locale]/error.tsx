'use client';

import { useTranslations } from 'next-intl';

/**
 * Route error boundary. Must be a Client Component — that is the App Router
 * contract, not a boundary we chose to push down.
 */
export default function RouteError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const t = useTranslations('error');

  return (
    <main id="main" tabIndex={-1} className="page-measure py-20">
      <h1 className="mb-3 font-display text-section font-bold text-balance">
        {t('heading')}
      </h1>
      <p className="mb-6 max-w-prose leading-relaxed text-ink-secondary">
        {t('body')}
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex min-h-11 items-center rounded-full bg-ink-link px-6 font-semibold text-surface-page hover:bg-ink-link-hover"
      >
        {t('retry')}
      </button>
    </main>
  );
}
