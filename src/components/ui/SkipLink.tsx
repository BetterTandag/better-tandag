import { getTranslations } from 'next-intl/server';

/** The design had no skip link and no `<main>`. Both are required. */
export async function SkipLink() {
  const t = await getTranslations('common');

  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-full focus:border focus:border-line-control focus:bg-surface-raised focus:px-5 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-panel"
    >
      {t('skipToContent')}
    </a>
  );
}
