import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Accessibility is a gate on this project, not a polish pass.
 *
 * The dark palette is a DIFFERENT set of colour pairs from the light one, and
 * Filipino runs 15–25% longer than English on short labels — so the axe scan
 * runs the full {en, fil} x {light, dark} matrix. A light-English-only scan
 * proves nothing about the other three.
 */
async function scan(page: Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
}

/**
 * Scans run with reduced motion on.
 *
 * The hero's staggered entrance holds elements below full opacity for ~1.4s,
 * and axe computing contrast against a half-faded element reports a failure
 * that no reader ever sees. Reduced motion removes the animations entirely, so
 * the colour pairs under test are the settled ones. Motion itself is covered
 * separately below.
 */
async function openInTheme(
  page: Page,
  locale: 'en' | 'fil',
  theme: 'light' | 'dark'
) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // Stored before navigation, so the page renders in this theme from the first
  // paint rather than being flipped after load.
  await page.addInitScript(t => {
    try {
      localStorage.setItem('bt-theme', t);
    } catch {
      /* private browsing */
    }
  }, theme);
  await page.goto(`/${locale}`);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
}

/**
 * The three surfaces that grew a hover state. Each one must transition under
 * `no-preference` and must not under `reduce` — the pair of tests below is what
 * proves the `motion-safe:` gate is actually doing the gating.
 */
const HOVER_TARGETS = [
  '#history ul li', // etymology cards
  '#history ol li > div:last-child', // timeline entries
  '#getting-here article', // travel cards
] as const;

test.describe('@a11y landing page', () => {
  for (const locale of ['en', 'fil'] as const) {
    for (const theme of ['light', 'dark'] as const) {
      test(`axe: ${locale} / ${theme}`, async ({ page }) => {
        await openInTheme(page, locale, theme);

        const results = await scan(page);
        expect(results.violations).toEqual([]);
      });
    }
  }

  test('axe: OS-dark with no stored preference', async ({ browser }) => {
    // Exercises the init script's OS-preference branch, which is the path a
    // first-time visitor actually takes.
    const context = await browser.newContext({
      colorScheme: 'dark',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/en');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    const results = await scan(page);
    expect(results.violations).toEqual([]);
    await context.close();
  });

  test('axe: search results and the empty state', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/en/search?q=zzzznothing');
    expect((await scan(page)).violations).toEqual([]);

    await page.goto('/en/search?q=permit');
    expect((await scan(page)).violations).toEqual([]);
  });

  /*
   * Every route gets a scan, not just the landing page. `/sources` and the
   * global 404 shipped without one — they were clean, but a stated gate that
   * only covers the route it was written for is not a gate.
   *
   * Both run the {en, fil} x {light, dark} matrix where they can. The 404 has
   * no locale to vary: it renders outside the [locale] segment, so next-intl
   * resolves it to the default locale by design.
   */
  for (const locale of ['en', 'fil'] as const) {
    for (const theme of ['light', 'dark'] as const) {
      test(`axe: sources ${locale} / ${theme}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.addInitScript(t => {
          try {
            localStorage.setItem('bt-theme', t);
          } catch {
            /* private browsing */
          }
        }, theme);

        await page.goto(`/${locale}/sources`);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

        expect((await scan(page)).violations).toEqual([]);
        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page.locator('main')).toHaveCount(1);
      });
    }
  }

  for (const theme of ['light', 'dark'] as const) {
    test(`axe: the 404 a visitor actually gets / ${theme}`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript(t => {
        try {
          localStorage.setItem('bt-theme', t);
        } catch {
          /* private browsing */
        }
      }, theme);

      // An unmatched URL, which is the only way to reach the global not-found —
      // `[locale]/not-found.tsx` is unreachable behind proxy.ts.
      const response = await page.goto('/en/no-such-page');
      expect(response?.status()).toBe(404);

      expect((await scan(page)).violations).toEqual([]);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('main')).toHaveCount(1);
    });
  }

  test('the 404 is not a dead end', async ({ page }) => {
    /*
     * It shipped as a heading, a sentence and one link — no navigation and no
     * emergency numbers. On a civic portal the 404 is where a stale bookmark
     * lands, and the hotlines do not get an exception for it.
     */
    await page.goto('/en/no-such-page');

    // The emergency numbers, dialable.
    const hotlines = page.locator('[role="region"] a[href^="tel:"]');
    expect(await hotlines.count()).toBeGreaterThan(0);

    // A way out, and a way to the routes that exist.
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Home', exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Sources', exact: true })
    ).toBeVisible();

    // And the skip link, which only earns its place now there is chrome to skip.
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('link', { name: 'Skip to main content' })
    ).toBeFocused();
  });

  test('colour-contrast is actually being checked', async ({ page }) => {
    // This page's whole risk profile is contrast — the approved design had a
    // global `a:hover` at 1.46:1 and a body-size grey at 3.04:1. If the rule
    // were ever disabled, every scan above would pass for the wrong reason.
    await page.goto('/en');
    const results = await scan(page);
    expect(results.passes.map(p => p.id)).toContain('color-contrast');
  });

  test('exactly one h1 and one main landmark', async ({ page }) => {
    await page.goto('/en');

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
  });

  test('heading levels never skip', async ({ page }) => {
    // The design had one h1, five h2s and ZERO h3s across ~40 content blocks —
    // card titles were sized <div>s, so browsing by heading gave you six stops.
    await page.goto('/en');

    const levels = await page
      .locator('h1, h2, h3, h4, h5, h6')
      .evaluateAll(nodes => nodes.map(n => Number(n.tagName.slice(1))));

    expect(levels.length).toBeGreaterThan(20);
    expect(levels).toContain(3);

    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });

  test('the skip link is reachable and moves focus into main', async ({
    page,
  }) => {
    await page.goto('/en');
    await page.keyboard.press('Tab');

    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });

  /**
   * Controls deliberately shrunk below the 44px floor on request.
   *
   * These are NOT oversights — each was an explicit instruction, and each is a
   * WCAG 2.5.5 / project-floor regression that this list exists to keep
   * visible rather than quietly delete. Removing an entry should mean the
   * control was restored to 44px, not that the rule was relaxed.
   *
   * · hotline `tel:` links — min-height removed so three stacked numbers stop
   *   towering over the other rows. These are the emergency numbers, tapped
   *   one-handed in a storm; they are the worst of the three to shrink. (The
   *   promoted national line is exempt by the same selector but is in fact the
   *   largest target on the page.)
   * · "Find a Service" popular chips — min-h-7 (28px).
   * · footer links — min-h-5 (20px).
   * · `[data-control]` — the header's theme toggle (size-7) and locale switch
   *   options (min-h-7), both sized to match the popular chips on request.
   * · hotline ticker `tel:` links — the bar is 28px tall by design, matching
   *   the reference portal's. Every number in it is also in #emergency; the
   *   ticker is the glance, not the destination.
   */
  const TOUCH_TARGET_EXEMPT = [
    '#emergency a[href^="tel:"]',
    '[aria-label="Emergency hotlines"] a[href^="tel:"]',
    '#top a[href^="/search"]',
    'footer a',
    '[data-control]',
  ].join(', ');

  test('every interactive control meets the 44px touch target floor', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en');

    const controls = page.locator(
      `:is(main, header, footer) :is(a, button):not(:is(${TOUCH_TARGET_EXEMPT}))`
    );
    const count = await controls.count();
    const undersized: string[] = [];

    for (let i = 0; i < count; i += 1) {
      const control = controls.nth(i);
      if (!(await control.isVisible())) continue;

      // Links inside a sentence are exempt; standalone controls are not.
      const inProse = await control.evaluate(
        node =>
          node.closest('p') !== null && node.parentElement?.tagName === 'P'
      );
      if (inProse) continue;

      const box = await control.boundingBox();
      if (!box) continue;
      // Rounded: a 2.75rem box measures 43.99x under subpixel layout, and
      // failing that would be measuring the renderer, not the target size.
      if (Math.round(box.height) < 44 || Math.round(box.width) < 44) {
        undersized.push(
          `${(await control.innerText()).slice(0, 40)} → ${Math.round(box.width)}x${Math.round(box.height)}`
        );
      }
    }

    expect(undersized).toEqual([]);
  });

  test('the exempted controls are still reachable and named', async ({
    page,
  }) => {
    // They no longer meet the size floor, so the remaining affordances have to
    // hold: each is keyboard-focusable and has an accessible name.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en');

    const exempt = page.locator(TOUCH_TARGET_EXEMPT);
    const count = await exempt.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i += 1) {
      const control = exempt.nth(i);
      if (!(await control.isVisible())) continue;
      await control.focus();
      await expect(control).toBeFocused();
      expect((await control.innerText()).trim().length).toBeGreaterThan(0);
    }
  });

  test('emergency numbers are dialable and name their organisation', async ({
    page,
  }) => {
    await page.goto('/en');

    const telLinks = page.locator('a[href^="tel:"]');
    const count = await telLinks.count();
    // CDRRMO x2, PNP x2, BFP x3, plus 911 — once in #emergency and once in the
    // ticker above the header. Both read the same manifest, so the two counts
    // move together; the ticker's second visual copy contributes none, because
    // an aria-hidden echo renders spans rather than anchors.
    expect(await page.locator('#emergency a[href^="tel:"]').count()).toBe(8);
    expect(
      await page
        .locator('[aria-label="Emergency hotlines"] a[href^="tel:"]')
        .count()
    ).toBe(8);
    expect(count).toBe(16);

    for (let i = 0; i < count; i += 1) {
      const link = telLinks.nth(i);
      expect(await link.getAttribute('href')).toMatch(/^tel:(\+63\d{10}|911)$/);
      // "Call BFP Tandag on 0931 721 8770" — not a bare "0931 721 8770".
      const name = await link.getAttribute('aria-label');
      expect(name?.length ?? 0).toBeGreaterThan(5);
    }
  });

  test('published hotlines state their provenance and a check date', async ({
    page,
  }) => {
    // Most of these numbers are contributor-supplied with no public posting
    // behind them. Publishing them is a decision; publishing them without
    // saying so would not be.
    await page.goto('/en');
    const emergency = page.locator('#emergency');

    await expect(
      emergency.getByText('Last checked', { exact: false })
    ).toBeVisible();
    await expect(
      emergency.getByText('not yet confirmed against a public posting').first()
    ).toBeVisible();
  });

  test.describe('navigation submenus', () => {
    test('the desktop dropdown is a real button, not a hover trap', async ({
      page,
    }) => {
      // The reference portal opens its dropdown on `group-hover` alone, which
      // no keyboard user can trigger. This is the assertion that stops that
      // pattern coming back.
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/en');

      const nav = page.getByRole('navigation', { name: 'Main' });
      const services = nav.getByRole('button', { name: 'Services' });

      await expect(services).toHaveAttribute('aria-expanded', 'false');
      const panelId = await services.getAttribute('aria-controls');
      expect(panelId).toBeTruthy();
      // An attribute selector, not `#id`: React's useId emits ids containing
      // `«»`, which are legal in HTML but need escaping in a CSS id selector —
      // and `CSS.escape` is a browser global that does not exist out here.
      const panel = page.locator(`[id="${panelId}"]`);

      // Points at something that exists from the first render — not at an id
      // that only appears after hydration.
      await expect(panel).toBeAttached();
      await expect(panel).toBeHidden();

      // Opens from the keyboard, and the panel is a nested list inside the
      // parent's own list item — structure, not role="menu".
      await services.focus();
      await page.keyboard.press('Enter');
      await expect(services).toHaveAttribute('aria-expanded', 'true');
      await expect(panel).toBeVisible();
      expect(
        await panel.evaluate(node => ({
          tag: node.tagName,
          parent: node.parentElement!.tagName,
          role: node.getAttribute('role'),
        }))
      ).toEqual({ tag: 'UL', parent: 'LI', role: null });

      // Escape closes it and hands focus back.
      await page.keyboard.press('Escape');
      await expect(services).toHaveAttribute('aria-expanded', 'false');
      await expect(services).toBeFocused();
    });

    test('only one desktop dropdown is open at a time', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/en');

      const nav = page.getByRole('navigation', { name: 'Main' });
      const services = nav.getByRole('button', { name: 'Services' });
      const government = nav.getByRole('button', { name: 'Government' });

      await services.click();
      await expect(services).toHaveAttribute('aria-expanded', 'true');

      await government.click();
      await expect(government).toHaveAttribute('aria-expanded', 'true');
      await expect(services).toHaveAttribute('aria-expanded', 'false');

      // A press anywhere else dismisses it.
      await page.locator('h1').click();
      await expect(government).toHaveAttribute('aria-expanded', 'false');
    });

    test('a parent whose children are all unbuilt still opens', async ({
      page,
    }) => {
      // The point of the group is to show what is planned. A parent that
      // refuses to open because nothing inside it is live shows nothing.
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/en');

      const nav = page.getByRole('navigation', { name: 'Main' });
      const government = nav.getByRole('button', { name: 'Government' });
      await government.click();

      // Scoped to THIS panel — the other dropdowns are in the DOM too, just
      // hidden, and a nav-wide count would quietly pass on their badges.
      const panel = page.locator(
        `[id="${await government.getAttribute('aria-controls')}"]`
      );
      // NOT `{ exact: true }`. An unbuilt child renders as
      // `<span>Officials<ComingSoonBadge/></span>`, so the label is a bare text
      // node beside the badge and no element's text is exactly "Officials" —
      // an exact match returns zero and the assertion fails on a correct page.
      for (const label of ['Officials', 'Transparency', 'Departments']) {
        await expect(panel.getByText(label)).toBeVisible();
      }
      // Each one is marked, in text — never by colour alone.
      await expect(panel.getByText('Soon')).toHaveCount(3);
    });

    test('axe is clean with a desktop dropdown open', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/en');
      await page
        .getByRole('navigation', { name: 'Main' })
        .getByRole('button', { name: 'Services' })
        .click();

      expect((await scan(page)).violations).toEqual([]);
    });
  });

  test.describe('mobile navigation', () => {
    // 320x568 — the smallest real phone, and the width where a five-row list
    // with an expanded submenu is most likely to need scrolling.
    test.use({ viewport: { width: 320, height: 568 } });

    test('is a NON-modal dropdown under the header', async ({ page }) => {
      // It was a full-screen `role="dialog"`. It is a dropdown panel now, and
      // that distinction is the whole test: a modal promises the page behind it
      // is inert, and this one deliberately does not. Claiming `aria-modal` or
      // locking the body while leaving the page readable is the failure mode.
      await page.goto('/en');
      await page.getByRole('button', { name: 'Open menu' }).click();

      const panel = page.getByRole('navigation', { name: 'Mobile' });
      await expect(panel).toBeVisible();

      expect(await page.locator('[role="dialog"]').count()).toBe(0);
      expect(await page.evaluate(() => document.body.style.overflow)).toBe('');

      // Anchored to the header, not the viewport, and it does not cover it.
      const geometry = await page.evaluate(() => {
        const box = document
          .querySelector('nav[aria-label="Mobile"]')!
          .closest('div')!
          .getBoundingClientRect();
        return { top: Math.round(box.top), height: Math.round(box.height) };
      });
      expect(geometry.top).toBeGreaterThan(0);
      expect(geometry.height).toBeLessThan(568);

      // The page underneath is still there to be read.
      await expect(page.locator('#top')).toBeAttached();
    });

    test('expanding a submenu keeps everything reachable', async ({ page }) => {
      await page.goto('/en');
      await page.getByRole('button', { name: 'Open menu' }).click();

      const panel = page.getByRole('navigation', { name: 'Mobile' });
      const services = panel.getByRole('button', { name: 'Services' });
      await services.click();
      await expect(services).toHaveAttribute('aria-expanded', 'true');
      await expect(panel.getByText('All services')).toBeVisible();

      // The panel scrolls itself rather than growing past the viewport.
      const locale = page.locator(
        'nav[aria-label="Mobile"] [data-control="locale"]'
      );
      await locale.last().scrollIntoViewIfNeeded();
      await expect(locale.last()).toBeVisible();
    });

    test('the burger is the toggle, and its name follows its state', async ({
      page,
    }) => {
      // One control now, not a burger plus a close button buried under an
      // overlay — so exactly one thing answers to each name at any moment.
      await page.goto('/en');
      const burger = page.getByRole('button', { name: 'Open menu' });
      await expect(burger).toHaveAttribute('aria-expanded', 'false');

      await burger.click();
      const close = page.getByRole('button', { name: 'Close menu' });
      await expect(close).toHaveCount(1);
      await expect(close).toHaveAttribute('aria-expanded', 'true');
      await expect(page.getByRole('button', { name: 'Open menu' })).toHaveCount(
        0
      );

      await close.click();
      await expect(
        page.getByRole('navigation', { name: 'Mobile' })
      ).toBeHidden();
      await expect(
        page.getByRole('button', { name: 'Open menu' })
      ).toBeFocused();
    });

    test('Escape closes it and returns focus to the burger', async ({
      page,
    }) => {
      await page.goto('/en');
      const burger = page.getByRole('button', { name: 'Open menu' });
      await burger.click();

      const panel = page.getByRole('navigation', { name: 'Mobile' });
      await expect(panel).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(panel).toBeHidden();
      await expect(
        page.getByRole('button', { name: 'Open menu' })
      ).toBeFocused();
      expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    });

    test('Escape unwinds one level at a time', async ({ page }) => {
      // The disclosure stops the event on its own element, so the first press
      // collapses the submenu and the panel stays. Without that, one keypress
      // does both.
      await page.goto('/en');
      await page.getByRole('button', { name: 'Open menu' }).click();

      const panel = page.getByRole('navigation', { name: 'Mobile' });
      const services = panel.getByRole('button', { name: 'Services' });
      await services.click();
      await expect(services).toHaveAttribute('aria-expanded', 'true');

      await services.focus();
      await page.keyboard.press('Escape');
      await expect(services).toHaveAttribute('aria-expanded', 'false');
      await expect(panel).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(panel).toBeHidden();
    });

    test('closes itself if the viewport grows past lg while it is open', async ({
      page,
    }) => {
      // The panel is `lg:hidden`. Left open across the breakpoint it disappears
      // while the burger still claims `aria-expanded="true"`.
      await page.goto('/en');
      await page.getByRole('button', { name: 'Open menu' }).click();
      await expect(
        page.getByRole('navigation', { name: 'Mobile' })
      ).toBeVisible();

      await page.setViewportSize({ width: 1280, height: 900 });
      await expect(
        page.getByRole('navigation', { name: 'Mobile' })
      ).toBeHidden();
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              document
                .querySelector('button[aria-controls][aria-expanded]')
                ?.getAttribute('aria-expanded') ?? null
          )
        )
        .not.toBe('true');
    });

    test('axe is clean with the panel open', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/en');
      await page.getByRole('button', { name: 'Open menu' }).click();

      const results = await scan(page);
      expect(results.violations).toEqual([]);
    });
  });

  test.describe('reduced motion', () => {
    // Set explicitly rather than via `test.use({ reducedMotion })` — that
    // option did not reach `matchMedia` here, so the assertions below would
    // have been silently running against normal motion.
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
    });

    test('the reduce preference actually reaches the page', async ({
      page,
    }) => {
      await page.goto('/en');
      const reduces = await page.evaluate(
        () => matchMedia('(prefers-reduced-motion: reduce)').matches
      );
      expect(reduces).toBe(true);
    });

    test('figures are final immediately and no section is hidden', async ({
      page,
    }) => {
      await page.goto('/en');

      await expect(page.getByText('63,098')).toHaveText('63,098', {
        timeout: 100,
      });

      // The scroll-driven reveal is declared inside
      // `@media (prefers-reduced-motion: no-preference)`, so under reduce it
      // does not exist and every section sits at full opacity from the start.
      for (const id of ['services', 'history', 'getting-here', 'emergency']) {
        const style = await page.locator(`#${id}`).evaluate(node => {
          const cs = getComputedStyle(node);
          return { opacity: cs.opacity, animationName: cs.animationName };
        });
        expect(style.opacity).toBe('1');
        expect(style.animationName).toBe('none');
      }
    });

    test('the card and timeline hovers carry no motion', async ({ page }) => {
      // Every hover added to the etymology cards, the timeline entries and the
      // travel cards is behind `motion-safe:`, so under reduce the transition
      // is not emitted at all and the feedback is colour only. The paired
      // assertion under "with motion allowed" below is what stops this passing
      // for the wrong reason — a typo'd class name also transitions in 0s.
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/en');

      for (const selector of HOVER_TARGETS) {
        const duration = await page
          .locator(selector)
          .first()
          .evaluate(node => getComputedStyle(node).transitionDuration);
        expect(duration, selector).toBe('0s');
      }
    });

    test('back-to-top jumps rather than smooth-scrolls', async ({ page }) => {
      await page.goto('/en');
      await page.mouse.wheel(0, 3000);

      const backToTop = page.getByRole('button', { name: 'Back to top' });
      await expect(backToTop).toBeVisible();
      await backToTop.click();

      // A smooth scroll would still be in flight here. The CSS media query
      // governs `scroll-behavior`, but NOT `window.scrollTo` — BackToTop has
      // to check `matchMedia` itself, and this is what proves it does.
      await expect
        .poll(() => page.evaluate(() => window.scrollY), { timeout: 300 })
        .toBe(0);
    });
  });

  test.describe('with motion allowed', () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    });

    test('the card and timeline hovers do transition', async ({ page }) => {
      // The other half of the reduced-motion pair above.
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/en');

      for (const selector of HOVER_TARGETS) {
        const duration = await page
          .locator(selector)
          .first()
          .evaluate(node => getComputedStyle(node).transitionDuration);
        expect(duration, selector).not.toBe('0s');
      }
    });

    test('a section below the fold reveals once scrolled to', async ({
      page,
    }) => {
      await page.goto('/en');

      await page.locator('#services').scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          page
            .locator('#services')
            .evaluate(node => Number(getComputedStyle(node).opacity))
        )
        .toBeGreaterThan(0.9);
    });
  });
});
