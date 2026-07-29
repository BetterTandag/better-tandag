import { readFileSync } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { collectCitations, pickLocalized, schemas } from './content';

const CONTENT_HOME = path.join(process.cwd(), 'content', 'home');

function load(name: string): unknown {
  return yaml.load(
    readFileSync(path.join(CONTENT_HOME, `${name}.yaml`), 'utf8')
  );
}

/**
 * These validate the SHIPPED content, not a fixture. A manifest that drifts
 * out of shape should fail here rather than at request time — the loader
 * throws on a bad file, which would take the page down.
 */
describe('content/home manifests', () => {
  it.each([
    ['advisory', schemas.advisory],
    ['stats', schemas.stats],
    ['services', schemas.services],
    ['history', schemas.history],
    ['getting-here', schemas.gettingHere],
    ['emergency', schemas.emergency],
  ])('%s.yaml matches its schema', (name, schema) => {
    expect(() => schema.parse(load(name))).not.toThrow();
  });

  it('sources.yaml matches its schema', () => {
    expect(() =>
      schemas.sources.parse(
        yaml.load(
          readFileSync(path.join(process.cwd(), 'content/sources.yaml'), 'utf8')
        )
      )
    ).not.toThrow();
  });

  it('keeps the citation list OUT of sources.yaml', () => {
    /*
     * The list is derived from the `source` blocks on the figures themselves,
     * so a citation cannot say one thing beside a number and another on
     * /sources. The day someone adds a `citations:` or `sources:` array to this
     * file, that guarantee is gone and the two can drift silently.
     */
    const raw = readFileSync(
      path.join(process.cwd(), 'content/sources.yaml'),
      'utf8'
    );
    const parsed = yaml.load(raw) as Record<string, unknown>;
    expect(Object.keys(parsed).sort()).toEqual([
      'caveats',
      'intro',
      'lastReviewedAt',
    ]);
  });

  it('capitalises every `via`, because it is rendered', () => {
    // It was `wikipedia` while nothing displayed it; /sources reads it into
    // "reached through {source}".
    const parsed = schemas.stats.parse(load('stats'));
    for (const stat of parsed.stats) {
      if (!stat.source.via) continue;
      expect(stat.source.via[0]).toBe(stat.source.via[0]!.toUpperCase());
    }
  });

  it('ships no advisory by default', () => {
    // A permanent sample advisory teaches people to ignore the real one.
    const parsed = schemas.advisory.parse(load('advisory'));
    expect(parsed.advisory).toBeNull();
  });

  it('gives every published hotline a stated provenance', () => {
    // Not every number has a public posting behind it — several are
    // contributor-supplied. What every number must have is a label saying so,
    // because that is what a reader weighs before dialling in a storm.
    const parsed = schemas.emergency.parse(load('emergency'));
    expect(parsed.hotlines.length).toBeGreaterThan(0);

    for (const hotline of parsed.hotlines) {
      expect(hotline.numbers.length).toBeGreaterThan(0);
      expect(hotline.source.label.en.length).toBeGreaterThan(0);
      if (hotline.source.url !== undefined) {
        expect(hotline.source.url).toMatch(/^https?:\/\//);
      }
    }
  });

  it('carries a page-level provenance note and a check date', () => {
    const parsed = schemas.emergency.parse(load('emergency'));
    expect(parsed.provenance.note.en.length).toBeGreaterThan(0);
    expect(parsed.provenance.lastCheckedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('rejects a hotline number that is not digits and spaces', () => {
    // A typo'd number must fail here rather than reach a `tel:` href.
    const base = schemas.emergency.parse(load('emergency'));
    const broken = {
      ...base,
      hotlines: [{ ...base.hotlines[0], numbers: ['0907-299-CALL'] }],
    };
    expect(() => schemas.emergency.parse(broken)).toThrow();
  });

  it('gives every stat a citation', () => {
    const parsed = schemas.stats.parse(load('stats'));
    expect(parsed.stats).toHaveLength(4);
    for (const stat of parsed.stats) {
      expect(stat.source.url).toMatch(/^https?:\/\//);
    }
  });

  it('rejects a manifest whose slug-critical field is missing', () => {
    expect(() => schemas.stats.parse({ stats: [] })).toThrow();
  });
});

describe('collectCitations', () => {
  const WIKI = 'https://en.wikipedia.org/wiki/Tandag';

  it('merges entries that share a label, collecting what each backs', () => {
    const [psa] = collectCitations([
      {
        label: 'PSA, 2024 census',
        url: 'https://psa.gov.ph',
        via: 'Wikipedia',
        usage: { kind: 'stat', key: 'population' },
      },
      {
        label: 'PSA, 2024 census',
        url: 'https://psa.gov.ph',
        via: 'Wikipedia',
        usage: { kind: 'stat', key: 'households' },
      },
    ]);

    expect(psa!.usedBy).toHaveLength(2);
    expect(psa!.via).toBe('Wikipedia');
  });

  it('keeps two citations that share a URL but not a label apart', () => {
    /*
     * The regression. Keying on the URL merged the barangay classification and
     * the land area — both cite the same Wikipedia article — into one row whose
     * heading said "barangay classification" while also claiming the land area.
     * It rendered wrong on the page and looked right in the data.
     */
    const rows = collectCitations([
      {
        label: 'Wikipedia — Tandag, barangay classification',
        url: WIKI,
        usage: { kind: 'stat', key: 'barangays' },
      },
      {
        label: 'Wikipedia — Tandag, land area',
        url: WIKI,
        usage: { kind: 'stat', key: 'landArea' },
      },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows.map(r => r.usedBy.length)).toEqual([1, 1]);
  });

  it('puts the citations that can be checked first', () => {
    // A reader scanning this page is looking for what has a link behind it.
    const rows = collectCitations([
      {
        label: 'Resident contributor',
        usage: { kind: 'hotline', organisation: 'PNP Tandag' },
      },
      {
        label: 'Official Gazette',
        url: 'https://www.gov.ph/',
        usage: { kind: 'hotline', organisation: 'National' },
      },
    ]);

    expect(rows.map(r => r.label)).toEqual([
      'Official Gazette',
      'Resident contributor',
    ]);
  });

  it('omits url and via rather than emitting them undefined', () => {
    const [row] = collectCitations([
      {
        label: 'Resident contributor',
        usage: { kind: 'hotline', organisation: 'BFP Tandag' },
      },
    ]);
    expect('url' in row!).toBe(false);
    expect('via' in row!).toBe(false);
  });
});

describe('pickLocalized', () => {
  it('returns English for the English locale without flagging a fallback', () => {
    expect(
      pickLocalized({ en: 'Services', fil: 'Mga Serbisyo' }, 'en')
    ).toEqual({
      text: 'Services',
      fellBack: false,
    });
  });

  it('returns Filipino when it exists', () => {
    expect(
      pickLocalized({ en: 'Services', fil: 'Mga Serbisyo' }, 'fil')
    ).toEqual({
      text: 'Mga Serbisyo',
      fellBack: false,
    });
  });

  it('falls back to English and flags it', () => {
    // The banner on the page depends on this flag. A silent fallback is the
    // failure mode the project explicitly forbids.
    expect(pickLocalized({ en: 'Services' }, 'fil')).toEqual({
      text: 'Services',
      fellBack: true,
    });
  });
});
