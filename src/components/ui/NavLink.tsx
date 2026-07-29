import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { NavItem } from '@/data/navigation';
import { cn } from '@/lib/utils';
import { ComingSoonBadge } from './ComingSoonBadge';

/**
 * A navigation destination that may not exist yet.
 *
 * Routes beyond this page are `coming-soon`: they render as non-links rather
 * than links that 404, because a 404 reached from a site's own navigation reads
 * as a broken site. In-page anchors (`#emergency`, `#history`) are always live.
 *
 * `variant="badge"` adds a visible marker where there is room for one; the
 * header nav uses the quieter `variant="inline"`. Either way the state is in
 * text, never in colour alone.
 */
export function NavLink({
  item,
  className,
  variant = 'inline',
}: {
  item: NavItem;
  className?: string;
  variant?: 'inline' | 'badge';
}) {
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const label = tNav(item.messageKey);

  if (item.status === 'coming-soon') {
    return (
      <span
        aria-disabled="true"
        className={cn('cursor-default text-ink-tertiary', className)}
      >
        {label}
        {variant === 'badge' ? (
          <ComingSoonBadge className="ms-2" />
        ) : (
          <span className="sr-only"> — {tCommon('comingSoon')}</span>
        )}
      </span>
    );
  }

  // In-page anchors stay plain <a>; next-intl's Link is for routed paths.
  if (item.href.startsWith('#')) {
    return (
      <a
        href={item.href}
        className={cn(
          'text-ink-secondary hover:text-ink-link-hover',
          className
        )}
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn('text-ink-secondary hover:text-ink-link-hover', className)}
    >
      {label}
    </Link>
  );
}
