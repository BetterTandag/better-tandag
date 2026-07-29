import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { absoluteUrl } from '@/lib/lgu-config';

/**
 * Generated from the locale list crossed with the routes that actually exist,
 * so a new locale appears automatically. Routes that do not exist yet are
 * deliberately absent — a sitemap advertising a 404 is worse than a short one.
 *
 * `/search` is not here on purpose: it sets `robots: { index: false }`, and
 * listing a noindex route in the sitemap tells a crawler two opposite things.
 */
const ROUTES = [
  { path: '', changeFrequency: 'weekly', priority: 1 },
  { path: '/sources', changeFrequency: 'monthly', priority: 0.5 },
] as const satisfies readonly {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}[];

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.flatMap(locale =>
    ROUTES.map(route => ({
      url: absoluteUrl(`/${locale}${route.path}`),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map(l => [l, absoluteUrl(`/${l}${route.path}`)])
        ),
      },
    }))
  );
}
