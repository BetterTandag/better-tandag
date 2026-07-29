import {
  IBM_Plex_Sans,
  Instrument_Serif,
  Inter,
  Space_Grotesk,
} from 'next/font/google';
import type { ReactNode } from 'react';
import { routing } from '@/i18n/routing';
import { THEME_INIT_SCRIPT } from '@/lib/theme-init';
import './globals.css';

/**
 * The document shell.
 *
 * `<html>` lives HERE, not in `app/[locale]/layout.tsx`, and that placement is
 * load-bearing. With the shell inside the `[locale]` segment, a client-side
 * switch between locales made React render a SECOND document into the live one
 * — verified in a production build, the page ended up with two `<header>`, two
 * `<section id="top">` and two `<section id="history">`. React cannot reconcile
 * two `<html>` elements, so it appends. A root layout is not re-rendered when
 * only a child segment changes, so the shell is mounted exactly once per tab
 * and the locale switch is an ordinary client-side navigation.
 *
 * The cost: this layout cannot know the locale. `next/root-params` is the API
 * for that, but in Next 16.2.12 Turbopack never populates the module even with
 * `experimental.rootParams` on ("Export locale doesn't exist in target
 * module"), and reading it from headers here would be an uncached dynamic
 * access that pulls every route out of static rendering. So `lang` ships as the
 * default locale and is corrected two ways:
 *   · before first paint, by the init script reading the path (no flash);
 *   · on every client-side switch, by `<HtmlLang>` in the locale layout.
 *
 * Residual gap: a crawler that does not run JS sees `lang="en"` on `/fil`. The
 * `alternates.languages` hreflang set in the locale layout's metadata is the
 * mitigation. Revert to a full-load locale switch if that trade stops being
 * acceptable.
 */

const grotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-grotesk',
  display: 'swap',
});

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-plex',
  display: 'swap',
});

/*
 * The BetterGov network wordmark face.
 *
 * Not a font borrowed from the reference portal — Inter IS the Kapwa design
 * system's sans (`--font-kapwa-sans`), which @bettergov/kapwa's own README
 * declares with exactly this call. betterGeneralTrias renders its wordmark in
 * it at `font-black`, so the mark reads as one family across the network.
 *
 * ONE weight (900), because two spans use it: the header and footer wordmarks.
 * The reference asks for 900 but only loads up to 700, so its mark is
 * synthetically emboldened; a real Black face is cleaner at this size and is
 * what the design intends. Everything else on the page stays Space Grotesk
 * (display) and IBM Plex Sans (body).
 */
const inter = Inter({
  subsets: ['latin'],
  weight: '900',
  variable: '--font-kapwa-sans',
  display: 'swap',
});

// Three words below the fold. Not worth a render-blocking preload.
const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: 'italic',
  variable: '--font-instrument',
  display: 'swap',
  preload: false,
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang={routing.defaultLocale}
      suppressHydrationWarning
      // Tells Next to suspend smooth scrolling during route transitions.
      data-scroll-behavior="smooth"
      className={`${grotesk.variable} ${plex.variable} ${instrument.variable} ${inter.variable}`}
    >
      <head>
        {/* Lets the UA paint the correct page background before our CSS lands. */}
        <meta name="color-scheme" content="light dark" />
        {/* Blocking, render-before-paint. Safe as a raw <script> because this
            layout is never re-rendered on the client. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-surface-page text-ink font-sans">{children}</body>
    </html>
  );
}
