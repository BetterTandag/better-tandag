import { routing } from '@/i18n/routing';

/**
 * Runs before first paint, from the document shell in `src/app/layout.tsx`.
 *
 * Two jobs, both of which must happen before anything is painted:
 *
 * 1. **Theme.** Resolves the stored preference, falling back to the OS setting,
 *    and writes `data-theme` (ours) plus the `.dark` class (Kapwa's precompiled
 *    CSS binds its dark variant to a class). Dropping either leaves half the
 *    page in the wrong theme.
 *
 * 2. **Language.** The root layout owns `<html>` and is never re-rendered on a
 *    client-side navigation, so it cannot emit a per-locale `lang`. This reads
 *    the locale off the first path segment and corrects `lang` before paint;
 *    `<HtmlLang>` then keeps it in step across client-side locale switches.
 *
 * Injected with `dangerouslySetInnerHTML`. That is safe only while it stays a
 * static literal — `theme-init.test.ts` asserts it contains no interpolation.
 * The locale list is duplicated here as a literal for the same reason; a test
 * asserts it matches `routing.locales`.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('bt-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}d.setAttribute('data-theme',t);d.classList.toggle('dark',t==='dark');var l=location.pathname.split('/')[1];if(l==='en'||l==='fil'){d.lang=l;}}catch(e){}})();`;

/** The locales the init script hardcodes. Kept honest by a unit test. */
export const THEME_INIT_LOCALES = routing.locales;
