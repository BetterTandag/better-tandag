'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

/** Appears past 700px of scroll, matching the approved design. */
const SHOW_AFTER_PX = 700;

export function BackToTop() {
  const t = useTranslations('common');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  function scrollToTop() {
    // The CSS `prefers-reduced-motion` rule governs `scroll-behavior`, NOT the
    // JS scroll API — this has to be checked explicitly.
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="motion-safe:rise fixed end-4 bottom-4 z-50 grid size-12 place-items-center rounded-full border border-line-control bg-surface-raised text-ink shadow-panel hover:border-ink-link sm:end-6 sm:bottom-6"
    >
      <ArrowUp aria-hidden="true" className="size-4.5" />
      <span className="sr-only">{t('backToTop')}</span>
    </button>
  );
}
