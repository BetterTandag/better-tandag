import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Project rules that were previously enforced only by review.
 *
 * Each block below is a rule from docs/coding-standards.md that was true when
 * the landing page shipped and had nothing keeping it true. These are cheap
 * source scans — they cannot prove the page is correct, only that the specific
 * ways it is known to rot have not happened yet.
 */

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const APP = path.join(SRC, 'app');

type SourceFile = { path: string; text: string };

/** Every shipped `.ts`/`.tsx` under a directory. Tests are not shipped. */
function sourceFiles(dir: string): SourceFile[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap<SourceFile>(
    entry => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(full);
      if (!/\.tsx?$/.test(entry.name)) return [];
      if (/\.(test|spec)\.tsx?$/.test(entry.name)) return [];
      return [
        {
          path: path.relative(ROOT, full).replace(/\\/g, '/'),
          text: readFileSync(full, 'utf8'),
        },
      ];
    }
  );
}

const SRC_FILES = sourceFiles(SRC);
const APP_FILES = sourceFiles(APP);

/** Files whose text matches, reported as paths so a failure names the culprit. */
function offenders(files: SourceFile[], pattern: RegExp): string[] {
  return files
    .filter(file => pattern.test(file.text))
    .map(file => `${file.path} → ${file.text.match(pattern)?.[0]}`);
}

describe('the source scan itself', () => {
  it('is actually reading files', () => {
    // Without this, a broken walker turns every scan below into a green no-op.
    expect(SRC_FILES.length).toBeGreaterThan(30);
    expect(APP_FILES.length).toBeGreaterThan(3);
  });
});

describe('self-containment', () => {
  /*
   * This repository must not depend on anything outside itself — not in code,
   * not in a comment, not in a doc. A clone of it on its own has to be
   * complete, and a path that resolves only on one maintainer's machine is a
   * dead link for everyone else.
   *
   * What that rules out is a reference to a SIBLING directory: `context/`,
   * `references/`, or the other portal's folder. Relative imports that stay
   * inside the repo (`../../package.json` from `src/lib/`) are fine and are not
   * matched here.
   */
  const OUTWARD =
    /(?:^|[\s('"`[])(?:\.\.\/)*(?:context|references|better-tago)\//;

  it('references no directory outside this repository', () => {
    expect(offenders(SRC_FILES, OUTWARD)).toEqual([]);
  });

  it('holds for the checked-in docs and dotfiles too', () => {
    // The docs are where this slips first: a contributor-facing file pointing
    // at a workspace path is a dead link for anyone who cloned just this repo.
    const docs = [
      'README.md',
      'CONTRIBUTING.md',
      'CODE_OF_CONDUCT.md',
      'docs/coding-standards.md',
      'docs/sources/landing-page.md',
      'brand/logo/README.md',
      '.env.example',
      '.gitignore',
    ].map(name => ({
      path: name,
      text: readFileSync(path.join(ROOT, name), 'utf8'),
    }));

    expect(offenders(docs, OUTWARD)).toEqual([]);
  });

  it('holds for the e2e specs, which neither scan above reaches', () => {
    // `sourceFiles()` skips `*.spec.ts` by design — they are not shipped — and
    // e2e/ is outside src/ anyway. They are still checked in and still read.
    const specs = readdirSync(path.join(ROOT, 'e2e'))
      .filter(name => /\.spec\.ts$/.test(name))
      .map(name => ({
        path: `e2e/${name}`,
        text: readFileSync(path.join(ROOT, 'e2e', name), 'utf8'),
      }));

    expect(specs.length).toBeGreaterThan(0);
    expect(offenders(specs, OUTWARD)).toEqual([]);
  });

  it('is checking files that exist', () => {
    // Guards the list above against a rename silently emptying this test.
    expect(() =>
      readFileSync(path.join(ROOT, 'CONTRIBUTING.md'))
    ).not.toThrow();
  });
});

describe('design tokens', () => {
  /*
   * Colour belongs to the @theme layer in globals.css and reaches components
   * only through named tokens. globals.css is where the ramp is DECLARED, so it
   * is deliberately not scanned; every other source file is.
   */
  it('declares no colour literal outside globals.css', () => {
    // A three-digit hex and a short anchor href are the same shape, so an id
    // spelled only in [a-f] would trip this. Rename the id — do not relax it.
    expect(
      offenders(SRC_FILES, /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])/)
    ).toEqual([]);
  });

  it('calls no colour function in a component', () => {
    expect(
      offenders(SRC_FILES, /\b(?:rgba?|hsla?|oklch|oklab|color-mix)\(/)
    ).toEqual([]);
  });

  it('uses no arbitrary Tailwind value', () => {
    // `bg-[#16643c]`, `text-[13px]`, `w-[42rem]`, `border-[--x]`. Anything the
    // theme cannot express is a missing token, not a one-off utility.
    expect(offenders(SRC_FILES, /[a-z0-9]-\[|\[--/)).toEqual([]);
  });
});

describe('static rendering', () => {
  /*
   * The landing page must prerender. `next build` is the authority on that —
   * these guard the known ways a route loses it, which is what a source scan
   * can see and what a reviewer is most likely to miss in a large diff.
   */
  it('reads no dynamic request API in the route tree', () => {
    // `params` and `searchParams` are fine: params is part of the static key,
    // and searchParams is already isolated behind its own Suspense boundary in
    // the search route. cookies()/headers()/draftMode()/connection() are not —
    // any of them in a layout drags every route into dynamic rendering.
    expect(
      offenders(APP_FILES, /next\/headers|\b(?:cookies|draftMode|connection)\(/)
    ).toEqual([]);
  });

  it('never opts a route out of static rendering', () => {
    expect(
      offenders(APP_FILES, /export const (?:dynamic|revalidate)\b/)
    ).toEqual([]);
  });

  it('calls setRequestLocale in every next-intl route OUTSIDE [locale]', () => {
    /*
     * The blind spot that let a real regression through.
     *
     * Inside the segment, `[locale]/layout.tsx` calls `setRequestLocale` and
     * every route under it inherits that. OUTSIDE it — `app/not-found.tsx` is
     * the only one today — nothing does, so next-intl resolves the locale by
     * reading the REQUEST. Under `cacheComponents` that is runtime data
     * accessed outside `<Suspense>`, and the route silently stops
     * prerendering. It does not fail the build, it does not throw, and the
     * page looks perfect; only the dev overlay says anything.
     *
     * The scan below looks for `cookies()`/`headers()` and finds nothing here,
     * because next-intl reads the request on your behalf.
     */
    const outside = APP_FILES.filter(
      file =>
        !file.path.includes('[locale]') &&
        /\/(?:page|layout|not-found)\.tsx$/.test(file.path) &&
        /from 'next-intl/.test(file.text)
    );

    expect(
      outside
        .filter(file => !file.text.includes('setRequestLocale('))
        .map(file => file.path)
    ).toEqual([]);
  });

  it('calls setRequestLocale in every page and layout under [locale]', () => {
    // next-intl reads the locale from async storage. A segment that skips this
    // opts itself out of static rendering silently — the page still works, it
    // just stops being prerendered, which is invisible until someone reads the
    // build output.
    const segments = APP_FILES.filter(
      file =>
        file.path.includes('[locale]') &&
        /\/(?:page|layout)\.tsx$/.test(file.path)
    );

    expect(segments.length).toBeGreaterThan(0);
    expect(
      segments
        .filter(file => !file.text.includes('setRequestLocale('))
        .map(file => file.path)
    ).toEqual([]);
  });
});

describe('translation coverage', () => {
  const read = (locale: string): Record<string, unknown> =>
    JSON.parse(
      readFileSync(path.join(ROOT, 'messages', `${locale}.json`), 'utf8')
    );

  function flatten(value: unknown, prefix = ''): [string, string][] {
    if (typeof value === 'string') return [[prefix, value]];
    if (value === null || typeof value !== 'object') return [];
    return Object.entries(value).flatMap(([key, child]) =>
      flatten(child, prefix ? `${prefix}.${key}` : key)
    );
  }

  const en = Object.fromEntries(flatten(read('en')));
  const fil = Object.fromEntries(flatten(read('fil')));

  /**
   * Keys whose Filipino is IDENTICAL to the English on purpose.
   *
   * The fallback rule is that a missing translation shows English behind a
   * visible banner — never silently. A key sitting in fil.json with an English
   * value defeats that: it is invisible to the banner and to the reader. So
   * every identical value has to be listed here and defended, and anything not
   * listed fails the gate.
   *
   * Adding a line is a translation decision. It is not a way to close a build.
   */
  const DELIBERATELY_IDENTICAL: Record<string, string> = {
    // A reader who cannot read the current language must still find theirs.
    'header.english': 'the language switcher names each language in its own',
    'header.filipino': 'the language switcher names each language in its own',
    'header.englishFull': 'ditto, for the accessible name',
    'header.filipinoFull': 'ditto, for the accessible name',

    // Cebuano/Kamayo, and the city's own name. Not English to begin with.
    'hero.titleWelcome': 'Cebuano — "welcome"',
    'hero.titleCarryOn': 'Cebuano — "carry on"',
    'hero.titleCity': 'the city name',
    'hero.eyebrow': 'placeholders only; both values come from the config',

    // Loanwords in universal Philippine use. Translating these makes the
    // Filipino worse, not better — "Address" is what the sibling FIL copy in
    // contact.addressNote already calls it.
    'nav.mobileLabel': 'device word, used as-is in Filipino',
    'contact.emailLabel': 'loanword, no Filipino equivalent in use',
    'contact.addressLabel': 'loanword, matches contact.addressNote in fil.json',

    // A symbol and three proper nouns.
    'stats.squareKilometres': 'unit symbol',
    'resources.openData': 'proper noun',
    'resources.sangguniangPanlungsod': 'proper noun — already Filipino',
    'resources.philgeps': 'proper noun',
  };

  it('has the same keys in both locales', () => {
    expect(Object.keys(fil).sort()).toEqual(Object.keys(en).sort());
  });

  it('leaves no key untranslated without a stated reason', () => {
    const untranslated = Object.keys(en).filter(
      key => fil[key] === en[key] && !(key in DELIBERATELY_IDENTICAL)
    );
    expect(untranslated).toEqual([]);
  });

  it('keeps the exemption list honest', () => {
    // An entry that no longer matches an identical pair is stale — either the
    // key was translated or it was deleted. Either way the line should go.
    const stale = Object.keys(DELIBERATELY_IDENTICAL).filter(
      key => fil[key] !== en[key]
    );
    expect(stale).toEqual([]);
  });
});
