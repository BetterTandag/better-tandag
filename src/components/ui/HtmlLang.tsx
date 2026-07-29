'use client';

import { useEffect } from 'react';
import type { Locale } from '@/i18n/routing';

/**
 * Keeps `<html lang>` in step with the active locale.
 *
 * The root layout owns `<html>` and is not re-rendered when only the `[locale]`
 * segment changes, so a client-side language switch would otherwise leave a
 * stale `lang` behind. The pre-paint init script handles the first load; this
 * handles every switch after it.
 *
 * Renders nothing.
 */
export function HtmlLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    if (document.documentElement.lang !== locale) {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return null;
}
