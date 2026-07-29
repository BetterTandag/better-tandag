import { ArrowRight, Search } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

const POPULAR_QUERIES = [
  'birth certificate',
  'business permit',
  'property tax',
];

/**
 * A real GET form, not a combobox.
 *
 * The design's version was an input plus a div of links that appeared on
 * keystroke: no `aria-expanded`, no listbox role, no arrow keys, no Escape, no
 * announcement — a screen-reader user typed and heard nothing change. Half a
 * combobox is worse than none.
 *
 * Submitting to a server-rendered /search instead works with JS disabled, gives
 * the result a shareable URL, ships no search index to the browser, and needs
 * no client component at all.
 */
export async function HeroSearchForm() {
  const t = await getTranslations('hero');

  return (
    <div className="rounded-2xl border border-line bg-surface-raised p-5 shadow-panel sm:p-7">
      <div className="mb-2 flex items-center gap-2.5">
        <Search aria-hidden="true" className="size-5 shrink-0 text-ink-link" />
        <h2 className="font-display text-xl font-bold tracking-tight">
          {t('findService')}
        </h2>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-ink-tertiary">
        {t('findServiceHelp')}
      </p>

      <form action="/search" method="get">
        <label htmlFor="hero-search" className="sr-only">
          {t('searchLabel')}
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-line-control bg-surface-sunken py-1.5 pe-1.5 ps-4 focus-within:border-ink-link">
          <input
            id="hero-search"
            name="q"
            type="search"
            autoComplete="off"
            placeholder={t('searchPlaceholder')}
            // `min-w-0` is load-bearing: a flex-child <input> keeps an intrinsic
            // min-width from its default `size` and will not shrink, which is
            // the likeliest source of horizontal scroll at 320px.
            className="min-h-11 w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-tertiary"
          />
          <button
            type="submit"
            className="grid size-11 shrink-0 place-items-center rounded-lg bg-ink-link text-surface-page hover:bg-ink-link-hover"
          >
            <ArrowRight aria-hidden="true" className="size-4" />
            <span className="sr-only">{t('searchSubmit')}</span>
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-ink-tertiary">{t('popular')}</span>
        {POPULAR_QUERIES.map(query => (
          // Links, not buttons that fill the input — the reader's intent is
          // "take me there", and a chip that only types for them costs two
          // extra steps.
          <a
            key={query}
            href={`/search?q=${encodeURIComponent(query)}`}
            // min-h-7, by request. NOTE this is below the 44px touch-target
            // floor — see the exemption list in e2e/home.a11y.spec.ts.
            className="inline-flex min-h-7 items-center rounded-full border border-line bg-surface-tint px-3.5 text-sm font-medium text-ink-link hover:border-ink-link hover:bg-ink-link hover:text-surface-page"
          >
            {query}
          </a>
        ))}
      </div>
    </div>
  );
}
