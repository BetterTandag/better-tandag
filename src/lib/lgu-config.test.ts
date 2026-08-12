import { describe, expect, it } from 'vitest';
import { absoluteUrl, lguConfig } from './lgu-config';

describe('lguConfig', () => {
  it('parses the shipped config', () => {
    expect(lguConfig.lgu.officialName).toBe('City of Tandag');
    expect(lguConfig.lgu.province).toBe('Surigao del Sur');
  });

  it('carries the figures the stat band publishes, with a census year', () => {
    expect(lguConfig.lgu.population).toBe(63098);
    expect(lguConfig.lgu.households).toBe(14931);
    expect(lguConfig.lgu.barangayCount).toBe(21);
    expect(lguConfig.lgu.landAreaKm2).toBe(291.73);
    expect(lguConfig.lgu.censusYear).toBe(2024);
  });

  it('anchors the primary ramp on the brand colour declared in @theme', () => {
    // globals.css hardcodes #0032A0 as --color-primary-700; if the config
    // brand colour drifts from it, the ramp and the config disagree.
    expect(lguConfig.portal.brandColor).toBe('#0032A0');
  });

  it('does not present the unreachable city portal as a live source', () => {
    expect(lguConfig.sources.officialPortal.status).toBe('unreachable');
  });
});

describe('absoluteUrl', () => {
  /*
   * Derived from the configured domain, not repeated as a literal.
   *
   * These two asserted `https://bettertandag.org/...` outright, and when the
   * host was corrected to the `www` one the deployment actually serves, they
   * failed — pointing at the fix rather than at a defect. A test that restates
   * the value under test only proves the value has not changed, which is not
   * what either of these is for: what they check is that a path is joined to
   * the domain exactly once, with exactly one slash between them.
   *
   * `guardrails.test.ts` § *the canonical host* is what pins the value itself,
   * in one place, with the reason attached.
   */
  const domain = lguConfig.portal.domain;

  it('builds a canonical URL from the configured domain', () => {
    expect(absoluteUrl('/en')).toBe(`${domain}/en`);
  });

  it('tolerates a missing leading slash', () => {
    expect(absoluteUrl('fil')).toBe(`${domain}/fil`);
  });

  it('never doubles the slash, whichever side carries it', () => {
    // The failure mode the two cases above exist to catch, stated directly:
    // `absoluteUrl` strips a trailing slash from the domain and normalises the
    // leading one on the path, so neither a bare nor a slashed argument can
    // produce `//`.
    expect(absoluteUrl('/en')).toBe(absoluteUrl('en'));
    expect(absoluteUrl('/en')).not.toContain('.org//');
  });
});
