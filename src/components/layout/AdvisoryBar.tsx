'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import { X } from 'lucide-react';

const STORAGE_KEY = 'bt-advisory-dismissed';

/** Also fires when another tab dismisses the same advisory. */
function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

function readDismissedId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private-browsing modes throw on read. Showing the advisory is the safe
    // failure here.
    return null;
  }
}

/** The server has no localStorage, so it always renders the bar. */
function serverSnapshot(): string | null {
  return null;
}

type AdvisoryBarProps = {
  advisoryId: string;
  body: string;
  regionLabel: string;
  badgeLabel: string;
  dismissLabel: string;
};

/**
 * The advisory bar.
 *
 * Absent entirely when no advisory is published — the design's permanent
 * "Sample advisory" was preview copy, and a bar that is always there teaches
 * people to ignore the one that matters.
 *
 * Dismissal is persisted against the advisory's ID, not a boolean. The design
 * did not persist at all (the bar returned on every navigation); persisting a
 * boolean instead would be worse, because a NEW advisory would inherit the old
 * dismissal and a real storm notice would never appear.
 *
 * Client-rendered because that ID comparison cannot be done in CSS before
 * paint. It is server-rendered first and hidden on mount, so a reader who has
 * not dismissed it sees it with no delay. All copy arrives as props — no i18n
 * runtime in this bundle.
 */
export function AdvisoryBar({
  advisoryId,
  body,
  regionLabel,
  badgeLabel,
  dismissLabel,
}: AdvisoryBarProps) {
  const [dismissedNow, setDismissedNow] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // Read through the store rather than in an effect: an effect that calls
  // setState on mount triggers a cascading render, and this way a dismissal in
  // another tab is picked up too.
  const storedId = useSyncExternalStore(
    subscribe,
    readDismissedId,
    serverSnapshot
  );
  const dismissed = dismissedNow || storedId === advisoryId;

  function dismiss() {
    // Move focus on before unmounting, or the keyboard user drops to <body>
    // and loses their place — the design's version did exactly that.
    const next = barRef.current?.nextElementSibling;
    next?.querySelector<HTMLElement>('a, button')?.focus();

    try {
      localStorage.setItem(STORAGE_KEY, advisoryId);
    } catch {
      // Dismissal still applies to this view; it just will not persist.
    }
    setDismissedNow(true);
  }

  if (dismissed) return null;

  return (
    <div
      ref={barRef}
      data-surface="accent"
      role="region"
      aria-label={regionLabel}
      className="motion-safe:animate-drop-in bg-accent-400 text-ink"
    >
      <div className="page-measure flex flex-wrap items-start gap-x-3 gap-y-2 py-2 text-sm">
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-surface-control px-2.5 py-0.5 text-2xs font-semibold tracking-caps uppercase">
          <span
            aria-hidden="true"
            className="motion-safe:animate-pulse-dot size-1.5 rounded-full bg-ink"
          />
          {badgeLabel}
        </span>
        <p className="min-w-0 basis-full font-medium sm:flex-1 sm:basis-auto">
          {body}
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="-me-2 ms-auto grid size-11 shrink-0 place-items-center rounded-full hover:bg-surface-control"
        >
          <X aria-hidden="true" className="size-4" />
          <span className="sr-only">{dismissLabel}</span>
        </button>
      </div>
    </div>
  );
}
