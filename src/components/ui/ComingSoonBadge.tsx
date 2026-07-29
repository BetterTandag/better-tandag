import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/**
 * "Soon" — the marker on a destination that does not exist yet.
 *
 * One component rather than a class string copied into every call site: the
 * badge appears in the header nav, the mobile sheet, both footer link columns
 * and the service grid, and those had already started to drift apart.
 *
 * Gold ground, navy ink — the same pair the featured service card uses, so the
 * marker reads as one thing everywhere. `--ink-on-accent` is declared once on
 * `:root` and is not re-declared by the dark theme or by any `data-surface`
 * scope, so the pair is 9.59:1 wherever the badge lands, in either theme.
 *
 * Smallest type token the project has (`text-2xs`, 11px) and no border — the
 * fill carries the shape. The state is never colour alone: the word "Soon" is
 * the badge.
 *
 * `tone="on-accent"` inverts the pair for the one badge that sits ON the gold
 * featured card, where gold-on-gold would vanish. Same two colours, same
 * 9.59:1, same size — so every badge on the page is one size and one family.
 */
export function ComingSoonBadge({
  className,
  tone = 'accent',
}: {
  className?: string;
  tone?: 'accent' | 'on-accent';
}) {
  const t = useTranslations('common');

  return (
    <span
      className={cn(
        // `pe-1` against `ps-1.5`: `tracking-caps` hangs 0.1em of letter-spacing
        // off the final glyph, which at this size reads as a visibly off-centre
        // pill unless the trailing padding is taken back.
        // `whitespace-nowrap` because the badge is two words in Filipino
        // ("Malapit na") and one in English. In any narrow container it split
        // across two lines and the pill grew a second row — seen in the nav
        // dropdown, but wrong everywhere the badge appears.
        'inline-flex items-center rounded-full py-0 ps-1.5 pe-1 text-2xs font-semibold tracking-caps whitespace-nowrap uppercase',
        tone === 'on-accent'
          ? 'bg-ink-on-accent text-accent-400'
          : 'bg-accent-400 text-ink-on-accent',
        className
      )}
    >
      {t('comingSoon')}
    </span>
  );
}
