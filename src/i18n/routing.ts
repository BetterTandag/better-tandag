import { defineRouting } from 'next-intl/routing';

/**
 * EN and FIL only. The design project's strings.json reserves a third column
 * for Tandaganon / Kamayo (`tdg`), deliberately left blank for local speakers —
 * it is not wired up here.
 */
export const routing = defineRouting({
  locales: ['en', 'fil'],
  defaultLocale: 'en',
});

export type Locale = (typeof routing.locales)[number];
