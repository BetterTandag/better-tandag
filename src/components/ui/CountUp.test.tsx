import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CountUp } from './CountUp';

function mockReducedMotion(reduce: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: reduce && query.includes('reduce'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
}

describe('CountUp', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the final value immediately, before any animation runs', () => {
    // The whole point. The design animated from 0, so the first paint — and a
    // screen reader arriving early — published "Residents: 0".
    mockReducedMotion(false);
    render(
      <CountUp to={63098} locale="en">
        63,098
      </CountUp>
    );

    expect(screen.getByText('63,098')).toBeInTheDocument();
  });

  it('never animates under prefers-reduced-motion', () => {
    mockReducedMotion(true);
    const raf = vi.spyOn(window, 'requestAnimationFrame');

    render(
      <CountUp to={63098} locale="en">
        63,098
      </CountUp>
    );

    expect(raf).not.toHaveBeenCalled();
    expect(screen.getByText('63,098')).toBeInTheDocument();
  });

  it('schedules a frame when motion is allowed', () => {
    mockReducedMotion(false);
    const raf = vi.spyOn(window, 'requestAnimationFrame');

    render(
      <CountUp to={291.73} fractionDigits={2} locale="en">
        291.73
      </CountUp>
    );

    expect(raf).toHaveBeenCalled();
  });
});
