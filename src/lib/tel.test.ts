import { describe, expect, it } from 'vitest';
import { telHref } from './tel';

/**
 * The hotline list and the promoted emergency band both build their `tel:`
 * href from here. A number that dials wrong is worse than one that is missing,
 * so the two shapes content/home/emergency.yaml actually contains — a spaced
 * mobile number and a short national line — are pinned.
 */
describe('telHref', () => {
  it('converts a spaced local mobile number to +63 E.164', () => {
    expect(telHref('0907 299 3793')).toBe('tel:+639072993793');
  });

  it('passes a short national line straight through', () => {
    expect(telHref('911')).toBe('tel:911');
  });

  it('strips spaces from a number that has no leading zero', () => {
    expect(telHref('117 8888')).toBe('tel:1178888');
  });

  it('produces the same href for the same digits, however they are spaced', () => {
    expect(telHref('0955 710 7810')).toBe(telHref('09557107810'));
  });
});
