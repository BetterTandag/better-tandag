import { getTranslations } from 'next-intl/server';
import { NAV_INDEX, PAGE_SECTIONS } from '@/data/navigation';
import type { Locale } from '@/i18n/routing';
import { getHomeContent } from './content';

export type SearchResult = {
  title: string;
  kind: string;
  href: string;
  status: 'live' | 'coming-soon';
};

/**
 * The portal index, composed from the same content and navigation the page
 * renders — adding a service card to content/home/services.yaml adds a search
 * entry with no code change.
 */
async function buildIndex(locale: Locale): Promise<SearchResult[]> {
  const [content, tNav, tCommon] = await Promise.all([
    getHomeContent(locale),
    getTranslations({ locale, namespace: 'nav' }),
    getTranslations({ locale, namespace: 'common' }),
  ]);

  const sectionEntries = await Promise.all(
    PAGE_SECTIONS.map(async section => ({
      title: (
        await getTranslations({ locale, namespace: section.messageNamespace })
      )('heading'),
      kind: tCommon('home'),
      href: `/${locale}${section.anchor}`,
      status: 'live' as const,
    }))
  );

  return [
    {
      title: content.services.featured.title,
      kind: tNav('services'),
      href: content.services.featured.href,
      status: content.services.featured.status,
    },
    ...content.services.cards.map(card => ({
      title: card.title,
      kind: `${tNav('services')} · ${card.meta}`,
      href: card.href,
      status: card.status,
    })),
    ...sectionEntries,
    // Parents AND their submenu children — a reader searching "departments"
    // should find it even though it only appears inside a dropdown.
    ...NAV_INDEX.map(item => ({
      title: tNav(item.messageKey),
      kind: tNav('label'),
      href: item.href.startsWith('#') ? `/${locale}${item.href}` : item.href,
      status: item.status,
    })),
  ];
}

/** Case-insensitive substring match over title and kind, capped at 12. */
export async function searchPortal(
  term: string,
  locale: Locale
): Promise<SearchResult[]> {
  const needle = term.trim().toLowerCase();
  if (!needle) return [];

  const index = await buildIndex(locale);
  const seen = new Set<string>();

  return index
    .filter(entry =>
      `${entry.title} ${entry.kind}`.toLowerCase().includes(needle)
    )
    .filter(entry => {
      const key = `${entry.href}|${entry.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}
