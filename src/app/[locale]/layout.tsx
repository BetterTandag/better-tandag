import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AdvisoryBar } from '@/components/layout/AdvisoryBar';
import { HotlineTicker } from '@/components/layout/HotlineTicker';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { BackToTop } from '@/components/ui/BackToTop';
import { HtmlLang } from '@/components/ui/HtmlLang';
import { SkipLink } from '@/components/ui/SkipLink';
import { routing } from '@/i18n/routing';
import { getHomeContent } from '@/lib/content';
import { absoluteUrl, lguConfig } from '@/lib/lgu-config';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: 'meta' });
  const values = {
    city: lguConfig.lgu.officialName,
    province: lguConfig.lgu.province,
  };

  return {
    metadataBase: new URL(lguConfig.portal.domain),
    title: {
      default: t('homeTitle', values),
      template: `%s · ${lguConfig.portal.name}`,
    },
    description: t('homeDescription', values),
    alternates: {
      canonical: absoluteUrl(`/${locale}`),
      languages: Object.fromEntries(
        routing.locales.map(l => [l, absoluteUrl(`/${l}`)])
      ),
    },
    /*
     * Declared here through the Metadata API rather than with the `app/icon`
     * file convention, for one reason: `media`. The file convention emits a
     * bare `<link rel="icon">` with no way to attach a media query, and the
     * OS-preference half of a theme-aware favicon IS a media query.
     *
     * The PNG comes first and the SVGs after it: an SVG-capable browser lands
     * on the mark matching its colour scheme, one that is not falls back to the
     * raster.
     *
     * ## The icon follows the OS, NOT the in-page theme toggle
     *
     * That gap is known and it is not for want of trying. A JS swap was built
     * (append a media-less `<link rel="icon">` last, keep its href in step with
     * `data-theme`) and then measured in a headed Chromium against an OS-level
     * screenshot of the tab strip, because a page screenshot cannot see browser
     * chrome and headless never paints a tab at all. Every variant produced a
     * pixel-identical tab icon:
     *
     *   · append a link and toggle          → no repaint
     *   · remove the PNG candidate          → no repaint
     *   · remove both media links as well   → no repaint
     *   · recreate the node, cache-busted   → no repaint
     *   · reload with the swap already in   → still the media-matched icon
     *
     * Chromium fetched the new file every time — the network log shows it — and
     * kept drawing the old one. It commits a tab icon once per navigation and
     * honours `media` over document order when it does. Only Chromium was
     * available to test, and that is enough: an effect that is dead in the
     * dominant engine is not a feature, it is client JS with no user.
     *
     * If the toggle really must drive the tab, the honest way is to stop
     * declaring `media` at all and emit ONE icon link whose href is chosen
     * server-side per request — which costs the whole route its static
     * rendering. That trade was not taken for a 16px glyph.
     */
    icons: {
      icon: [
        { url: '/icon.png', type: 'image/png', sizes: '48x48' },
        {
          url: '/icon-light.svg',
          type: 'image/svg+xml',
          media: '(prefers-color-scheme: light)',
        },
        {
          url: '/icon-dark.svg',
          type: 'image/svg+xml',
          media: '(prefers-color-scheme: dark)',
        },
      ],
      apple: [
        { url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' },
      ],
    },
    openGraph: {
      type: 'website',
      siteName: lguConfig.portal.name,
      locale,
      url: absoluteUrl(`/${locale}`),
      title: t('homeTitle', values),
      description: t('homeDescription', values),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [{ advisory, emergency }, tAdvisory] = await Promise.all([
    getHomeContent(locale),
    getTranslations({ locale, namespace: 'advisory' }),
  ]);

  // No <html>/<body> here — the ROOT layout owns the document shell. Keeping it
  // in this segment made a client-side locale switch render a second document
  // into the live one. See src/app/layout.tsx.
  return (
    <NextIntlClientProvider>
      <HtmlLang locale={locale} />
      <SkipLink />
      {advisory ? (
        <AdvisoryBar
          advisoryId={advisory.id}
          body={advisory.body}
          regionLabel={tAdvisory('regionLabel')}
          badgeLabel={tAdvisory('label')}
          dismissLabel={tAdvisory('dismiss')}
        />
      ) : null}
      {/* The hotlines come from the same cached read the advisory does — one
          content read serves the whole layout. */}
      <HotlineTicker hotlines={emergency.hotlines} />
      <SiteHeader locale={locale} />
      {children}
      <BackToTop />
    </NextIntlClientProvider>
  );
}
