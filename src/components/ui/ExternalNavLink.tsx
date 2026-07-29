import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ExternalNavItem } from '@/data/navigation';
import { cn } from '@/lib/utils';
import { ComingSoonBadge } from './ComingSoonBadge';

/**
 * A link off this site.
 *
 * Sibling to `NavLink` rather than a branch inside it: `NavLink` resolves
 * `nav.*`, routes through next-intl's locale-aware `<Link>`, and treats
 * `coming-soon` as "this route will exist here". None of that applies to a
 * national portal — so the two stay apart instead of `NavLink` growing a mode
 * switch.
 *
 * Leaving the site is signalled twice: the arrow glyph for sighted readers,
 * and text for screen readers, because an icon alone is not an accessible
 * indication. Same tab, matching the citation links elsewhere on the page — a
 * forced new window takes the Back button away from the reader.
 *
 * `rel="noreferrer"` on every one.
 */
export function ExternalNavLink({
  item,
  className,
}: {
  item: ExternalNavItem;
  className?: string;
}) {
  const t = useTranslations('resources');
  const tCommon = useTranslations('common');
  const label = t(item.messageKey);

  if (!item.href) {
    return (
      <span
        aria-disabled="true"
        className={cn('cursor-default text-ink-tertiary', className)}
      >
        {label}
        <ComingSoonBadge className="ms-2" />
      </span>
    );
  }

  return (
    <a
      href={item.href}
      rel="noreferrer"
      className={cn(
        'gap-1 text-ink-secondary hover:text-ink-link-hover',
        className
      )}
    >
      {label}
      <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="sr-only">({tCommon('opensExternalSite')})</span>
    </a>
  );
}
