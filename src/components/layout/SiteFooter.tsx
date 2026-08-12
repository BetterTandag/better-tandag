import Image from 'next/image';
import { GitBranch, Github, Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { FOOTER_PAGES, FOOTER_RESOURCES } from '@/data/navigation';
import { lguConfig } from '@/lib/lgu-config';
import { PORTAL_VERSION } from '@/lib/version';
import { ExternalNavLink } from '@/components/ui/ExternalNavLink';
import { Logo } from '@/components/ui/Logo';
import { NavLink } from '@/components/ui/NavLink';
import { Wordmark } from '@/components/ui/Wordmark';

/**
 * The site footer.
 *
 * It sits on its own fixed ground (`--color-surface-footer`) in BOTH themes,
 * so it carries `data-surface="inverse"` — that scope defines ink, link
 * and accent roles independently of the theme, which is what keeps the column
 * headings and links legible when the rest of the page is in light mode.
 * `data-ground="footer"` re-points the two line roles at opaque neutrals; the
 * shared white-alpha lines composite to ~1.4:1 on a ground this dark. Both are
 * documented in globals.css.
 *
 * `id="footer"` is a position handle, not an anchor target — nothing links to
 * it. It replaced `id="sources"`, which outlived both the sources list (moved
 * to docs/sources/landing-page.md) and the disclaimer strip that used to
 * link to it, leaving an anchor named after content the page no longer has.
 */
export async function SiteFooter() {
  const [t, tCommon] = await Promise.all([
    getTranslations('footer'),
    getTranslations('common'),
  ]);

  /*
   * "BetterTandag.org" — the host, but wearing the portal's own capitalisation.
   * `portal.domain` is the source of truth for which host this is (rule 10);
   * `portal.name` is the source of truth for how it is written. Taking the TLD
   * from one and the label from the other means re-pointing the portal at a
   * different domain updates this line with no code change, and the host is
   * never written out as a literal anywhere in the markup.
   *
   * That last part is now enforced rather than asserted: `guardrails.test.ts`
   * § *the canonical host* fails on the host appearing anywhere in `src/`,
   * which is why this comment describes it instead of spelling it out.
   */
  const host = new URL(lguConfig.portal.domain).hostname.replace(/^www\./, '');
  const brandedHost = [lguConfig.portal.name, ...host.split('.').slice(1)].join(
    '.'
  );

  // One class list for both Contribute buttons: a raised wash on the ground
  // with a boundary that clears 3:1 against it, since a dark button on a dark
  // ground is otherwise identifiable only by its label.
  const contributeButton =
    'inline-flex min-h-11 w-full items-center gap-2.5 rounded-full border border-line-control bg-surface-raised px-5 text-sm font-semibold text-ink motion-safe:transition-colors motion-safe:duration-200 hover:border-ink-link hover:text-ink-link';

  return (
    <footer
      id="footer"
      data-surface="inverse"
      data-ground="footer"
      // No top margin. The last section on the landing page is the contact
      // slab, a full-bleed coloured band — a gap between it and the footer
      // reads as a stray strip of page background rather than as breathing
      // room. Routes whose last element is body copy carry their own bottom
      // padding, so nothing else needs the margin either.
      className="bg-surface-footer text-ink"
    >
      {/*
        Four EQUAL tracks — no span. The five-track grid with Contribute over two
        of them existed to buy the cost line enough width to stay readable; the
        brief is now equal columns, so the width has to come from somewhere else.
        It comes from the BREAKPOINT.

        The four-column step is at `xl` (1280px), not `lg` (1024px), and that is
        the whole trick. A quarter of an 80% measure is ~181px at a 1024px
        viewport, which drives `--text-cost` down to 7.8px — unreadable, and less
        than half the ~16px body floor this project sets. Holding two
        columns until 1280px gives 1024px viewports ~394px columns instead.

        What it does NOT fix is 1280 and up: four equal columns of a measure
        capped at 1140px can never exceed 261px, and the Filipino cost string
        needs 19.2em, so the line lands at 10.4px (1280) and 11.9px (1440). Both
        are under the 12px mark. That is arithmetic, not a bug — the ways out are
        a shorter Filipino string, a narrower measure cap, or letting this one
        column be wider than the other three.
      */}
      <div className="page-measure grid gap-8 pt-12 pb-8 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          {/*
            64, matched to the BetterGov mark further down the footer by INK,
            not by the `width` attribute.

            Measured with `getBBox()`: their 64x64 badge is 98.3% x 91.7% ink,
            so it draws 62.9 x 58.7px. Ours fills 86.7% x 88.0% of its 168
            viewBox, so a pure geometric match would be ~68 (ink 59.0 x 59.8) —
            and 68 rendered visibly heavier than the thing it was matching.
            Their mark is fine white line art plus a caption; ours is a solid
            accent-400 sun, and a saturated fill carries more weight per unit
            area than strokes do. Trimming ~6% off the geometric answer lands on
            64 — ink 55.5 x 56.3, about 5% shorter than theirs, which is where
            the two read as the same size.

            The residual width difference (55.5 vs 62.9) is the shape
            difference, not an error: theirs is a squarish badge, ours is a sun
            over two waves.
          */}
          <div className="mb-3 flex items-center gap-2">
            <Logo idPrefix="footer" size={64} />
            {/* The same component as the header, not a copy of its classes —
                a wordmark that differs between the top and the bottom of the
                page reads as a bug. On this ground --ink-wordmark is white. */}
            <Wordmark />
          </div>
          {/* No contact address here any more. `contact.email` is still the
              configured address and is still used where it is actionable —
              the translation-fallback notice and the contact section's
              placeholder appeal — but the footer is not a contact card. */}
          <p className="text-sm leading-relaxed text-ink-secondary">
            {t('about')}
          </p>
        </div>

        <nav aria-labelledby="footer-pages">
          <h2
            id="footer-pages"
            className="mb-3 text-2xs font-bold tracking-label text-ink-tertiary uppercase"
          >
            {t('pages')}
          </h2>
          {/* `gap-2.5` — the same 10px rhythm the Contribute buttons below use.
              The rows were a bare `grid` with no gap, so 20px links stacked
              edge to edge and the "Soon" badges closed the last of the air.
              Spacing, not height: `min-h-5` is a deliberate exemption logged in
              e2e/home.a11y.spec.ts and must not creep back to 44px. */}
          <ul className="grid gap-2.5 text-sm">
            {FOOTER_PAGES.map(item => (
              <li key={item.messageKey}>
                <NavLink
                  item={item}
                  variant="badge"
                  className="inline-flex min-h-5 items-center"
                />
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-resources">
          <h2
            id="footer-resources"
            className="mb-3 text-2xs font-bold tracking-label text-ink-tertiary uppercase"
          >
            {t('resources')}
          </h2>
          {/* Same rhythm as the Pages column opposite — see the note there. */}
          <ul className="grid gap-2.5 text-sm">
            {FOOTER_RESOURCES.map(item => (
              <li key={item.messageKey}>
                <ExternalNavLink
                  item={item}
                  className="inline-flex min-h-5 items-center"
                />
              </li>
            ))}
          </ul>
        </nav>

        {/* One track like the other three — see the grid comment above.
            `@container` so the cost line is sized against this column rather
            than the viewport; available width is not monotonic in viewport
            width (it drops sharply at `xl`), so `cqi` is the only honest unit
            here. See `--text-cost` in globals.css. */}
        <div className="@container">
          <h2
            id="footer-contribute"
            className="mb-3 text-2xs font-bold tracking-label text-ink-tertiary uppercase"
          >
            {tCommon('contribute')}
          </h2>

          {/* The headline claim of the whole project, so it is set as one — not
              buried as another list item. `success-400` is the only luminous
              step on the footer ground (10.84:1 on it, 7.93:1 on the
              `success-900` pill it sits in); the city name comes from the
              config, never from a literal.

              One line at every width, by SIZE: `--text-cost` divides the
              column's own inline size by the measured em-width of the longer
              (Filipino) string. `whitespace-nowrap` is the belt, not the
              braces — the type is already sized to fit, and the `nowrap` only
              guarantees that a future string change fails loudly instead of
              quietly wrapping. `text-balance` is gone: there is nothing left to
              balance across.

              `block` rather than `inline-block`, so the pill fills the column
              and its box matches the two `w-full` buttons below it exactly
              rather than shrink-wrapping to the text. That is also what makes
              the `cqi` sizing honest: the pill now really does have the whole
              column, so the type is sized against the room it actually gets. */}
          {/* `w-fit`, not `block`: the pill hugs its text. `--text-cost` caps
              at 1.125rem, so from ~1200px up the line is narrower than the
              column and a full-width pill left a visible run of empty ground
              after the "₱0".

              `cost-pill` — em-based inline padding — replaces `px-4`. A fixed
              padding is 14% of a 232px column and 4% of an 819px one, which is
              what made a single `--text-cost` divisor unable to keep the pill
              inside its column at every width. Full reasoning in globals.css. */}
          <p className="cost-pill mb-4 w-fit rounded-full bg-success-900 py-2 font-display text-cost font-bold whitespace-nowrap text-success-400">
            {t('costLine', { city: lguConfig.lgu.shortName })}
          </p>

          {/* Buttons by appearance, links by semantics: both navigate, so they
              stay <a>. A <button> here would announce the wrong role and lose
              the middle-click / open-in-new-tab the browser gives for free. */}
          <ul aria-labelledby="footer-contribute" className="grid gap-2.5">
            {/* Both rows point at the repository: volunteering on this project
                IS the repo — issues, translations, sourcing a hotline. Two
                buttons to one destination is deliberate, not a copy-paste. */}
            <li>
              <a
                href={lguConfig.portal.repository}
                rel="noreferrer"
                className={contributeButton}
              >
                <Users aria-hidden="true" className="size-4 shrink-0" />
                {t('volunteer')}
                <span className="sr-only">
                  {' '}
                  ({tCommon('opensExternalSite')})
                </span>
              </a>
            </li>
            <li>
              <a
                href={lguConfig.portal.repository}
                rel="noreferrer"
                className={contributeButton}
              >
                <Github aria-hidden="true" className="size-4 shrink-0" />
                {t('contributeCode')}
                <span className="sr-only">
                  ({tCommon('opensExternalSite')})
                </span>
              </a>
            </li>
          </ul>

          {/*
            The programme's real mark, in `public/`. The white
            variant, not the primary: the primary is drawn in the brand navy,
            which is 1.77:1 on this ground and would all but vanish, where
            white is 18.89:1.

            `unoptimized` because Next's optimizer refuses SVG unless
            `dangerouslyAllowSVG` is set, and opening that door site-wide for
            one first-party file we ship ourselves is the wrong trade. The
            alt text carries the sentence the wordmark used to say, so the
            link's accessible name is unchanged.
          */}
          <a
            href={lguConfig.portal.network.url}
            rel="noreferrer"
            className="mt-5 inline-block motion-safe:transition-opacity motion-safe:duration-200 hover:opacity-80"
          >
            <Image
              src="/bettergov-white.svg"
              alt={t('network', { network: lguConfig.portal.network.name })}
              width={64}
              height={64}
              unoptimized
            />
            <span className="sr-only">({tCommon('opensExternalSite')})</span>
          </a>
        </div>
      </div>

      <div className="page-measure pb-16">
        <div className="flex flex-col gap-3 border-t border-line pt-6 text-xs leading-relaxed text-ink-tertiary sm:flex-row sm:items-center sm:justify-between">
          <p>{t('copyright', { host: brandedHost })}</p>

          <div className="flex shrink-0 items-center gap-4">
            <a
              href={lguConfig.portal.repository}
              rel="noreferrer"
              className="inline-flex min-h-5 items-center text-ink-link hover:text-ink-link-hover"
            >
              {t('sourceCode')}
              <span className="sr-only"> ({tCommon('opensExternalSite')})</span>
            </a>
            {/* PORTAL_VERSION comes from package.json via src/lib/version.ts —
                never a literal. The glyph is decorative, so the label it needs
                is supplied in text for a screen reader. */}
            <p className="inline-flex items-center gap-1.5 tabular-nums">
              <GitBranch aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="sr-only">{t('version')}: </span>
              {PORTAL_VERSION}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
