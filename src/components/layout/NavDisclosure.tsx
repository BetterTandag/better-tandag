'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A navigation parent and its submenu — the desktop dropdown and the mobile
 * accordion, one component.
 *
 * The links themselves are server-rendered and arrive as `children`, so no
 * navigation data and no i18n runtime crosses the client boundary. All this
 * owns is one boolean.
 *
 * ## What is deliberately NOT ported from the reference
 *
 * · Its desktop panel opens on `group-hover` alone, so a keyboard user cannot
 *   reach any child link. This is a real `<button aria-expanded aria-controls>`
 *   that opens on click, Enter and Space, and closes on Escape.
 * · No `role="menu"`. That is the desktop-application pattern: it makes the
 *   children `menuitem`s, takes them out of the tab order, and obliges arrow-key
 *   roving focus and type-ahead. A site nav wants none of that — a nested `<ul>`
 *   inside the parent's `<li>` already says "these belong to that", and Tab
 *   already works. This renders the `<li>` and the nested `<ul>` itself so that
 *   structure cannot be broken by a caller.
 *
 * ## Dismissal
 *
 * Escape, a pointer press outside, and focus leaving the group all close it.
 * "One open at a time" falls out of the outside-press rule rather than needing
 * shared state: pressing a sibling button is a press outside this one.
 *
 * The Escape listener is on the group's own element, NOT on `document`, and it
 * calls `stopPropagation`. Inside the mobile sheet, MobileNav has a document
 * listener that closes the whole dialog on Escape; without stopping the event
 * here, one keypress would collapse the submenu AND dismiss the sheet. Escape
 * has to close the innermost thing first.
 */
export function NavDisclosure({
  label,
  variant = 'dropdown',
  className,
  buttonClassName,
  children,
}: {
  label: string;
  variant?: 'dropdown' | 'inline';
  className?: string;
  buttonClassName?: string;
  children: ReactNode;
}) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const groupRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const group = groupRef.current;
    if (!group) return;

    function onPointerDown(event: PointerEvent) {
      if (!group?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      // Innermost first — see the note above.
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    }

    // Tabbing past the last child link closes the panel behind you, which is
    // what a sighted keyboard user expects and what stops a stack of open
    // panels accumulating on the way across the nav.
    function onFocusOut(event: FocusEvent) {
      const next = event.relatedTarget;
      if (next instanceof Node && group?.contains(next)) return;
      // A null relatedTarget is the window losing focus, not focus leaving the
      // group — closing then would dismiss the panel on every alt-tab.
      if (next === null) return;
      setOpen(false);
    }

    // Following a child link closes the group behind you. Delegated from the
    // group rather than wired onto each link, because the links are server
    // components that know nothing about this disclosure — and must not have
    // to. `#history` is an in-page anchor, so without this the panel would sit
    // open over the section it just scrolled to.
    function onClick(event: MouseEvent) {
      if (
        event.target instanceof Element &&
        event.target.closest('a[href]') !== null
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    group.addEventListener('keydown', onKeyDown);
    group.addEventListener('focusout', onFocusOut);
    group.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      group.removeEventListener('keydown', onKeyDown);
      group.removeEventListener('focusout', onFocusOut);
      group.removeEventListener('click', onClick);
    };
  }, [open]);

  return (
    <li ref={groupRef} className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(value => !value)}
        className={cn(
          'flex items-center gap-1.5 text-ink-secondary hover:text-ink-link-hover',
          buttonClassName
        )}
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-3.5 shrink-0 motion-safe:transition-transform motion-safe:duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {/*
        `hidden` plus a display utility applied ONLY when open. `[hidden]` is a
        UA rule and any author `display` beats it, so a permanent `grid` here
        would leave the panel permanently visible. Same trap as MobileNav's
        sheet, documented there.

        The panel stays in the DOM either way, which is what lets `aria-controls`
        point at a real id from the first server render.
      */}
      <ul
        id={panelId}
        hidden={!open}
        className={cn(
          open && 'grid',
          variant === 'dropdown'
            ? // `w-max` + `whitespace-nowrap`: the panel hugs its widest row and
              // nothing inside it breaks. It was a fixed width, which is what
              // made "Ang lungsod sa isang sulyap" wrap to two lines in Filipino
              // and split the "Malapit na" badge down the middle — a nav label
              // that wraps reads as two entries.
              //
              // Unbounded on purpose. A cap is just the fixed width again, and
              // an absolutely-positioned child still contributes to the
              // document's scrollWidth, so the page-level no-horizontal-scroll
              // checks at 1024/1280 in both locales are the guard.
              'absolute top-full start-0 z-50 mt-1 w-max gap-0.5 rounded-xl border border-line bg-surface-raised p-2 whitespace-nowrap shadow-panel'
            : 'gap-0.5 ps-4 pb-2'
        )}
      >
        {children}
      </ul>
    </li>
  );
}
