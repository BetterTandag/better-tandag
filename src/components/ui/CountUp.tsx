'use client';

import { useEffect, useRef } from 'react';

type CountUpProps = {
  to: number;
  /** The final, already-formatted value. This is what the server renders. */
  children: string;
  /** Decimal places, so the animation formats the same way as `children`. */
  fractionDigits?: number;
  locale: string;
};

const DURATION_MS = 1600;

/**
 * Counts up to a figure that is ALREADY in the HTML.
 *
 * The design's version started its animation state at 0, so the first paint —
 * and anything a screen reader reached early — published "Residents: 0". On a
 * civic transparency portal that is a content bug, not a motion one.
 *
 * Here the server renders the true value; this only animates from 0 up to it,
 * and under reduced motion it does nothing at all.
 */
export function CountUp({
  to,
  children,
  fractionDigits = 0,
  locale,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const format = new Intl.NumberFormat(locale, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    const final = node.textContent;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - Math.pow(1 - progress, 3);

      if (progress < 1) {
        node.textContent = format.format(to * eased);
        frame = requestAnimationFrame(tick);
      } else {
        // Restore the server-rendered string exactly, rather than a value
        // reformatted on the client.
        node.textContent = final;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, fractionDigits, locale]);

  return <span ref={ref}>{children}</span>;
}
