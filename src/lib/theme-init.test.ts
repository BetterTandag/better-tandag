import { describe, expect, it } from 'vitest';
import { THEME_INIT_LOCALES, THEME_INIT_SCRIPT } from './theme-init';

describe('THEME_INIT_SCRIPT', () => {
  it('contains no template interpolation', () => {
    // The script is injected with dangerouslySetInnerHTML. It is safe only
    // while it stays a static literal — this is the guard against someone
    // later interpolating a value into it.
    expect(THEME_INIT_SCRIPT).not.toMatch(/\$\{/);
  });

  it('has no closing script tag that could break out of the <script>', () => {
    expect(THEME_INIT_SCRIPT.toLowerCase()).not.toContain('</script');
  });

  it('sets both the data-theme attribute and the Kapwa .dark class', () => {
    // Dropping either leaves half the page in the wrong theme: our utilities
    // key off [data-theme], Kapwa's precompiled CSS keys off .dark.
    expect(THEME_INIT_SCRIPT).toContain("setAttribute('data-theme'");
    expect(THEME_INIT_SCRIPT).toContain("classList.toggle('dark'");
  });

  it('falls back to the OS preference when nothing is stored', () => {
    expect(THEME_INIT_SCRIPT).toContain('prefers-color-scheme: dark');
  });

  it('is wrapped in try/catch — localStorage throws in private browsing', () => {
    expect(THEME_INIT_SCRIPT).toContain('try{');
    expect(THEME_INIT_SCRIPT).toContain('catch');
  });

  it('hardcodes exactly the configured locales', () => {
    // The root layout cannot know the locale, so the script reads it from the
    // path to correct <html lang> before paint. Its locale list is a literal
    // (the script must stay interpolation-free), so this is what keeps it
    // honest against src/i18n/routing.ts.
    for (const locale of THEME_INIT_LOCALES) {
      expect(THEME_INIT_SCRIPT).toContain(`'${locale}'`);
    }
    const inScript = THEME_INIT_SCRIPT.match(/l==='[a-z-]+'/g) ?? [];
    expect(inScript).toHaveLength(THEME_INIT_LOCALES.length);
  });

  describe('behaviour in a document', () => {
    function run() {
      // Executes the real script text, so the assertions below test what
      // actually ships rather than a re-implementation of it.
      new Function(THEME_INIT_SCRIPT)();
    }

    function mockPrefersDark(matches: boolean) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: (query: string) => ({ matches, media: query }),
      });
    }

    it('uses the stored preference over the OS preference', () => {
      localStorage.setItem('bt-theme', 'light');
      mockPrefersDark(true);
      run();

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      localStorage.clear();
    });

    it('resolves the OS preference when nothing is stored', () => {
      localStorage.clear();
      mockPrefersDark(true);
      run();

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('ignores a junk stored value', () => {
      localStorage.setItem('bt-theme', 'chartreuse');
      mockPrefersDark(false);
      run();

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      localStorage.clear();
    });
  });
});
