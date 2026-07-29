import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * One container, one gutter. The design used 1200px for the header and 1140px
 * for every content section — a 60px inconsistency that read as unintentional.
 * At 320px the 16px gutters leave 288px of content, which is what every
 * responsive decision on this page is measured against.
 */
export function Container({
  as: Tag = 'div',
  className,
  children,
}: {
  as?: 'div' | 'section' | 'header' | 'footer' | 'nav';
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={cn('page-measure', className)}>{children}</Tag>;
}
