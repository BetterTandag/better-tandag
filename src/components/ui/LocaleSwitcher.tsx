'use client';

import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

type LocaleSwitcherProps = {
  current: Locale;
  groupLabel: string;
  labels: Record<Locale, string>;
  fullNames: Record<Locale, string>;
  className?: string;
};

/**
 * EN / FIL as a segmented switch.
 *
 * Toggle buttons, not links: `aria-pressed` says which locale is on, so the
 * state is in the accessibility tree and not only in the filled pill. The
 * filled ground is paired with a weight change so the difference is never
 * carried by colour alone, and each option is named in its own language — a
 * reader who cannot read the current one still has to be able to find theirs.
 *
 * `router.replace` from `@/i18n/navigation`, NOT a location assignment:
 * switching stays a client-side navigation with no page reload, and `replace`
 * keeps the two locales of one page from stacking up in the back history.
 *
 * That in-place swap is only safe because the document shell lives in the ROOT
 * layout (`src/app/layout.tsx`). While `<html>` sat inside
 * `app/[locale]/layout.tsx`, a client transition across the segment made React
 * render a second document into the live one — two `<section id="top">`,
 * duplicate ids, and a re-rendered `<head>`. `<HtmlLang>` keeps `<html lang>`
 * in step, since the root layout itself does not re-render.
 *
 * Trade-off taken knowingly: buttons are not crawlable the way the previous
 * `<Link>` pair was. The `alternates.languages` hreflang set in the locale
 * layout's metadata is what carries the sibling locale to crawlers now.
 *
 * Two things stop the swap from FEELING like a reload even though it never was
 * one:
 *
 * · `scroll: false`. App Router restores scroll to the top on every push or
 *   replace unless told otherwise. Measured on the production build, a switch
 *   from halfway down the page moved `window.scrollY` 2200 → 13 — no `load`
 *   event, no new navigation entry, the same document throughout, and yet
 *   indistinguishable from a reload to the reader. Keeping the offset is the
 *   whole fix.
 * · `startTransition`. The replace is a non-urgent update, so React keeps the
 *   outgoing locale painted until the incoming one has streamed in rather than
 *   dropping to a blank frame mid-swap.
 *
 * The pending state is announced, not drawn: `aria-busy` on the group, and
 * `aria-disabled` (never `disabled`) on the options. A real `disabled` blurs
 * the button the reader just activated and pulls it out of the tab order for
 * the duration — losing focus is a worse outcome than a double click, which
 * the `isPending` guard already absorbs. Nothing here changes a box, so the
 * control cannot shift while it waits.
 *
 * Client-side because it needs the current pathname to rebuild the URL.
 */
export function LocaleSwitcher({
  current,
  groupLabel,
  labels,
  fullNames,
  className,
}: LocaleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label={groupLabel}
      aria-busy={isPending}
      // min-h-7 — the height of the "Popular" chips in the hero search card,
      // by request. NOTE this puts the options below the 44px touch-target
      // floor; see the exemption list in e2e/home.a11y.spec.ts.
      //
      // `aria-busy:cursor-progress` is the only visual half of the pending
      // state, and a cursor occupies no layout.
      className={cn(
        'inline-flex min-h-7 rounded-full border border-line-control bg-surface-raised p-0.5 text-xs aria-busy:cursor-progress',
        className
      )}
    >
      {routing.locales.map(locale => {
        const isCurrent = locale === current;
        return (
          <button
            key={locale}
            type="button"
            data-control="locale"
            aria-pressed={isCurrent}
            aria-disabled={isPending || undefined}
            onClick={() => {
              if (isCurrent || isPending) return;
              startTransition(() => {
                // `usePathname` from next-intl is already locale-stripped, so
                // the same value works for either locale. `scroll: false`
                // keeps the reader where they were reading.
                router.replace(pathname, { locale, scroll: false });
              });
            }}
            className={cn(
              'inline-flex min-w-11 items-center justify-center rounded-full px-2.5',
              isCurrent
                ? 'bg-ink-link font-bold text-surface-page'
                : 'font-medium text-ink-secondary hover:text-ink-link-hover'
            )}
          >
            <span aria-hidden="true">{labels[locale]}</span>
            <span className="sr-only">{fullNames[locale]}</span>
          </button>
        );
      })}
    </div>
  );
}
