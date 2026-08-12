'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** How long after the last touch or scroll before the marquee starts again. */
const RESUME_DELAY_MS = 2500;

/**
 * The scrolling half of the hotline bar.
 *
 * CSS alone gets pause-on-hover and pause-on-focus, and those stay in
 * globals.css so they still work with JS disabled. What CSS cannot do is the
 * two things asked for here:
 *
 * · **Pause on touch.** `:hover` is unreliable on a touchscreen — it either
 *   never fires or sticks after the finger lifts. `pointerdown` is
 *   unambiguous, and the bar stays paused for a beat afterwards so a reader
 *   who tapped to stop it is not immediately chased again.
 * · **Manual scrolling while paused.** The marquee needs `overflow-x: hidden`
 *   while it runs, or the animated track adds a scrollbar's worth of scrollable
 *   width. Paused, it needs `overflow-x: auto` so the row can be dragged or
 *   swiped. That is a state swap, and state is what a client component is for.
 *
 * Scrolling also pauses: dragging the row and having it slide out from under
 * the finger is the worst version of this control.
 *
 * The bar's content is server-rendered and passed in as `children`, so no
 * hotline data and no i18n runtime crosses the boundary.
 */
export function TickerViewport({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [paused, setPaused] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const resumeAt = useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * The marquee runs when the content ACTUALLY overflows, not below a fixed
   * breakpoint. A breakpoint is only a guess at the content's width, and here
   * it guessed wrong in both directions: a 1120px rule left a band where the
   * row overflowed and sat still. Measuring is exact, and it stays exact when a
   * hotline is added to the manifest or a longer locale is added later.
   *
   * ⚠️ Re-measured 2026-08-12: one run is **1336px in English and 1488px in
   * Filipino**, not the 1277/1427 recorded when this was written. Nothing here
   * changed — that is the point of measuring rather than hardcoding — but the
   * e2e table that DID hardcode those numbers had gone stale and expected a
   * static row at a width the content still overflows.
   */
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === 'undefined') return;

    const measure = () => {
      const run = viewport.querySelector('.hotline-run');
      if (!run) return;
      setOverflowing(run.scrollWidth > viewport.clientWidth);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    const run = viewport.querySelector('.hotline-run');
    if (run) observer.observe(run);
    return () => observer.disconnect();
  }, []);

  const clearResume = useCallback(() => {
    if (resumeAt.current) clearTimeout(resumeAt.current);
    resumeAt.current = null;
  }, []);

  const resumeSoon = useCallback(() => {
    clearResume();
    resumeAt.current = setTimeout(() => setPaused(false), RESUME_DELAY_MS);
  }, [clearResume]);

  useEffect(() => clearResume, [clearResume]);

  return (
    <div
      ref={viewportRef}
      className={cn('hotline-viewport', className)}
      data-marquee={overflowing ? 'true' : undefined}
      data-paused={paused ? 'true' : undefined}
      // A mouse resumes the moment it leaves; a finger gets the delay above.
      onPointerEnter={event => {
        if (event.pointerType === 'mouse') {
          clearResume();
          setPaused(true);
        }
      }}
      onPointerLeave={event => {
        if (event.pointerType === 'mouse') {
          clearResume();
          setPaused(false);
        }
      }}
      onPointerDown={() => {
        clearResume();
        setPaused(true);
      }}
      onPointerUp={event => {
        if (event.pointerType !== 'mouse') resumeSoon();
      }}
      onPointerCancel={resumeSoon}
      onScroll={() => {
        setPaused(true);
        resumeSoon();
      }}
    >
      {children}
    </div>
  );
}
