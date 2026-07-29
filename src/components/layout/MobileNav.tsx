'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

/**
 * The burger and its dropdown panel.
 *
 * A NON-MODAL disclosure below the header, matching the reference portal:
 * `lg:hidden`, a bordered panel on the page surface, the nav rows inside it,
 * and the burger's own icon swapping to an X while it is open.
 *
 * ## Why it is not a dialog
 *
 * It was a full-screen `role="dialog"` sheet, and that was the wrong shape for
 * this pattern. A modal is a promise: everything behind it is inert. A panel
 * that leaves the page visible beneath it makes no such promise and must not
 * claim one — so the dialog role, `aria-modal`, the body scroll lock and the
 * focus trap are all gone. Trapping Tab inside a non-modal disclosure is the
 * specific bug where a keyboard reader cannot get back out to the page.
 *
 * What is kept, because none of it depends on being modal:
 *
 * · `aria-expanded` + `aria-controls` on the burger.
 * · Escape closes and returns focus to the burger.
 * · Opening moves focus into the panel.
 * · Focus leaving the panel closes it, which is the non-modal equivalent of a
 *   trap: Tab walks out to the rest of the page and the panel shuts behind you.
 * · It closes itself if the viewport grows past `lg`, where it is `display:
 *   none` — otherwise it is left open-but-invisible with `aria-expanded="true"`.
 *
 * The links are server-rendered and passed as `children`, so no navigation data
 * crosses the client boundary.
 */
export function MobileNav({ children }: { children: ReactNode }) {
  const t = useTranslations('header');
  const tNav = useTranslations('nav');
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) burgerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>('a[href], button')?.focus();

    function onKeyDown(event: KeyboardEvent) {
      // The submenus inside call `stopPropagation` on their own Escape, so one
      // press collapses the innermost open thing and only a second reaches here.
      if (event.key !== 'Escape') return;
      event.preventDefault();
      close();
    }

    /*
     * Non-modal: focus is free to leave, and when it does the panel goes with
     * it. `relatedTarget` is where focus is heading — null when it leaves the
     * document entirely, which is not a reason to close.
     */
    function onFocusOut(event: FocusEvent) {
      const next = event.relatedTarget;
      if (!(next instanceof Node)) return;
      if (panel?.contains(next) || burgerRef.current?.contains(next)) return;
      close(false);
    }

    /* A press anywhere else dismisses it, as any dropdown should. */
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panel?.contains(target) || burgerRef.current?.contains(target))
        return;
      close(false);
    }

    /*
     * The panel is `lg:hidden`. Open it on a phone, rotate or resize past `lg`,
     * and it vanishes while `open` is still true, leaving the burger claiming
     * `aria-expanded="true"` for a panel nobody can see. 64rem is Tailwind's `lg`.
     */
    const desktop = window.matchMedia('(min-width: 64rem)');
    const onBreakpoint = () => {
      if (desktop.matches) close(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    panel?.addEventListener('focusout', onFocusOut);
    desktop.addEventListener('change', onBreakpoint);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      panel?.removeEventListener('focusout', onFocusOut);
      desktop.removeEventListener('change', onBreakpoint);
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={burgerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? close() : setOpen(true))}
        className="grid size-11 shrink-0 place-items-center rounded-full border border-line-control bg-surface-raised text-ink hover:border-ink-link lg:hidden"
      >
        {open ? (
          <X aria-hidden="true" className="size-4" />
        ) : (
          <Menu aria-hidden="true" className="size-4" />
        )}
        {/* One control, so its name follows its state. */}
        <span className="sr-only">{open ? t('closeMenu') : t('openMenu')}</span>
      </button>

      {/*
        Rendered in place, directly under the header — no portal. The panel is
        `absolute` against the header rather than `fixed`, so it hangs off the
        sticky bar and travels with it. `max-h` + `overflow-y-auto` because ten
        rows plus the locale switch is taller than a 320x568 phone, and this
        panel does NOT lock the body behind it.
      */}
      <div
        id={panelId}
        ref={panelRef}
        hidden={!open}
        className="mobile-nav-panel absolute inset-x-0 top-full border-b border-line bg-surface-page shadow-panel lg:hidden"
      >
        <nav aria-label={tNav('mobileLabel')} className="page-measure py-3">
          {children}
        </nav>
      </div>
    </>
  );
}
