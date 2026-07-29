'use client';

import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type ThemeToggleProps = {
  toDarkLabel: string;
  toLightLabel: string;
  darkAnnouncement: string;
  lightAnnouncement: string;
};

/**
 * The theme toggle. The ONLY client module involved in theming — the header,
 * layout and page all stay Server Components.
 *
 * Both icons and both accessible names are rendered, and CSS picks which is
 * shown. Reading the theme in an effect would paint the wrong icon on first
 * load and then flip it, and would reintroduce the hydration mismatch that the
 * pre-paint init script exists to avoid.
 */
export function ThemeToggle({
  toDarkLabel,
  toLightLabel,
  darkAnnouncement,
  lightAnnouncement,
}: ThemeToggleProps) {
  // Empty until the user acts, so nothing is announced on load.
  const [announcement, setAnnouncement] = useState('');

  /*
   * The favicon deliberately does NOT follow this button; it follows the OS
   * colour scheme, via `media` on the icon links in the locale layout. A JS
   * swap was built here and removed after measuring it in a real headed
   * Chromium — the browser will not repaint a tab icon after load under any
   * treatment. The evidence and the two remaining options are recorded in the
   * `icons` comment in src/app/[locale]/layout.tsx.
   */
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';

    root.dataset.theme = next;
    root.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem('bt-theme', next);
    } catch {
      // Private-browsing modes throw on write. The toggle still works for
      // this page view; it just will not persist.
    }
    setAnnouncement(next === 'dark' ? darkAnnouncement : lightAnnouncement);
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        data-control="theme"
        // size-7 — the height of the "Popular" chips in the hero search card
        // and of the locale switch beside it, by request. NOTE this drops the
        // control below the 44px touch-target floor; see the exemption list in
        // e2e/home.a11y.spec.ts.
        className="grid size-7 shrink-0 place-items-center rounded-full border border-line-control bg-surface-raised text-ink hover:border-ink-link"
      >
        <Sun aria-hidden="true" className="size-3.5 dark:hidden" />
        <Moon aria-hidden="true" className="hidden size-3.5 dark:block" />
        <span className="sr-only dark:hidden">{toDarkLabel}</span>
        <span className="sr-only hidden dark:inline">{toLightLabel}</span>
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
