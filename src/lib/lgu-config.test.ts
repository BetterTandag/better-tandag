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
  it('builds a canonical URL from the configured domain', () => {
    expect(absoluteUrl('/en')).toBe('https://bettertandag.org/en');
  });

  it('tolerates a missing leading slash', () => {
    expect(absoluteUrl('fil')).toBe('https://bettertandag.org/fil');
  });
});
