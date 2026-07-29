import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A numbered page section with its eyebrow and h2.
 *
 * `reveal-on-scroll` is a CSS scroll-driven animation that only exists behind
 * `prefers-reduced-motion: no-preference` and `@supports (animation-timeline)`.
 * Content is visible by default; the design ran this the other way round, so a
 * blocked or slow script left everything below the stat band invisible.
 */
export function Section({
  id,
  eyebrow,
  heading,
  aside,
  intro,
  children,
  className,
}: {
  id: string;
  eyebrow: string;
  heading: string;
  aside?: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn('reveal-on-scroll page-measure pt-14 sm:pt-16', className)}
    >
      <div
        className={cn(
          'mb-6 flex flex-col gap-4',
          aside && 'sm:flex-row sm:items-end sm:justify-between'
        )}
      >
        <div>
          <p className="mb-2 text-2xs font-semibold tracking-label text-ink-tertiary uppercase">
            {eyebrow}
          </p>
          <h2
            id={headingId}
            className="font-display text-section font-bold text-balance"
          >
            {heading}
          </h2>
        </div>
        {aside}
      </div>
      {intro}
      {children}
    </section>
  );
}
