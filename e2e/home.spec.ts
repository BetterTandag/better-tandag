import { readFileSync } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { expect, test, type Page } from '@playwright/test';

/**
 * City Hall's contact block, read from the same file the app reads. Assertions
 * about published contact detail should fail when the CONFIG is wrong, not when
 * a copy of it in this file falls out of date.
 */
function cityHall(): {
  name: string;
  address: string;
  mapUrl: string;
  status: string;
} {
  const raw = readFileSync(
    path.join(process.cwd(), 'config', 'lgu.config.json'),
    'utf8'
  );
  return JSON.parse(raw).contact.cityHall;
}

test.describe('landing page', () => {
  test('/ negotiates a locale and renders the hero', async ({ page }) => {
    const response = await page.goto('/');

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/(en|fil)$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('every section of the approved design is present', async ({ page }) => {
    await page.goto('/en');

    // Page order, and asserted as an ORDER rather than a set: Emergency and
    // Getting here were swapped (03 / 04), and a set assertion would have
    // passed either way. The Contribute panel is gone entirely — its volunteer
    // ask lives in the footer column of the same name.
    const ids = [
      'top',
      'services',
      'history',
      'emergency',
      'getting-here',
      'contact',
      'footer',
    ];

    for (const id of ids) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
    await expect(page.locator('#contribute')).toHaveCount(0);

    const tops = await page.evaluate(
      list =>
        list.map(
          id => document.querySelector(`#${id}`)!.getBoundingClientRect().top
        ),
      ids
    );
    expect(tops).toEqual([...tops].sort((a, b) => a - b));
  });

  test('the eyebrow numbers run in page order', async ({ page }) => {
    await page.goto('/en');

    await expect(page.locator('#emergency')).toContainText('03 · Emergency');
    await expect(page.locator('#getting-here')).toContainText(
      '04 · Getting here'
    );
  });

  test('the contact section publishes no unverified contact detail as usable', async ({
    page,
  }) => {
    // `contact.cityHall.status` is `placeholder`: the PHONE and EMAIL are
    // invented. While that holds neither may render as a tel:/mailto: link — a
    // link is a promise that it reaches someone. The ADDRESS is not covered by
    // that flag; it is a real address behind a real pin, and is a link.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/en');

    const contact = page.locator('#contact');
    await expect(contact.getByRole('heading', { level: 2 })).toBeVisible();
    await expect(
      contact.getByText('placeholders', { exact: false })
    ).toBeVisible();

    // Nothing dialable or mailable anywhere in the section.
    await expect(contact.locator('a[href^="tel:"]')).toHaveCount(0);
    await expect(contact.locator('a[href^="mailto:"]')).toHaveCount(0);

    // Read from the config rather than restated here, so the assertion cannot
    // drift from the source of truth the component renders.
    const { address, mapUrl } = cityHall();
    await expect(contact.getByText(address, { exact: false })).toBeVisible();
    const map = contact.locator(`a[href="${mapUrl}"]`);
    await expect(map).toHaveCount(1);
    // The map card must never be marked placeholder alongside the other two.
    await expect(map).not.toHaveAttribute('aria-disabled', 'true');

    // Three routes, each named by its own heading.
    await expect(contact.getByRole('heading', { level: 3 })).toHaveCount(3);
  });

  test('a favicon is declared for both colour schemes, plus fallbacks', async ({
    page,
    request,
  }) => {
    await page.goto('/en');

    const icons = await page.evaluate(() =>
      Array.from(document.querySelectorAll('link[rel*="icon"]')).map(l => ({
        rel: l.getAttribute('rel'),
        href: l.getAttribute('href'),
        media: l.getAttribute('media'),
      }))
    );

    expect(icons).toEqual([
      { rel: 'icon', href: '/icon.png', media: null },
      {
        rel: 'icon',
        href: '/icon-light.svg',
        media: '(prefers-color-scheme: light)',
      },
      {
        rel: 'icon',
        href: '/icon-dark.svg',
        media: '(prefers-color-scheme: dark)',
      },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', media: null },
    ]);

    for (const icon of icons) {
      const response = await request.get(icon.href!);
      expect(response.status(), icon.href!).toBe(200);
    }
  });

  test('the stat band publishes the real figure on first paint', async ({
    page,
  }) => {
    // Never "0 residents", not even for a frame — the design's count-up
    // started its state at zero and rendered that server-side.
    await page.goto('/en');
    await expect(page.getByText('63,098')).toBeVisible();
    await expect(page.getByText('291.73')).toBeVisible();
  });

  test('renders Filipino at /fil', async ({ page }) => {
    await page.goto('/fil');

    await expect(page.locator('html')).toHaveAttribute('lang', 'fil');
    // The hero lede. It used to be the independence notice, which has been
    // removed — this is the next Filipino sentence above the fold, and being
    // the lede it is unlikely to be quietly deleted the way a caveat can be.
    await expect(
      page.getByText('Alamin ang mga serbisyo, impormasyon at tulong', {
        exact: false,
      })
    ).toBeVisible();
  });

  test('the language switcher moves between locales', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/en');

    await page.getByRole('button', { name: 'Filipino', exact: true }).click();
    // Client-side navigation: `toHaveURL` polls the URL, where `waitForURL`
    // would hang waiting for a `load` event that a client-side nav never fires.
    await expect(page).toHaveURL(/\/fil$/, { timeout: 30_000 });
    await expect(page.locator('html')).toHaveAttribute('lang', 'fil');
  });

  test('switching locale swaps in place — no reload, no errors, one visible page', async ({
    page,
  }) => {
    // Two regressions guarded here at once:
    //
    // 1. No full page load. The switch is a client-side navigation; only the
    //    [locale] subtree re-renders.
    // 2. Exactly one VISIBLE page. Next keeps the outgoing route mounted with
    //    `display: none` for back/forward — that is framework behaviour and
    //    happens on same-locale navigations too, so the assertion is on what
    //    the reader can actually see, not on raw element count.
    //
    // The console-error check is what catches the <head> script being
    // re-rendered on the client ("Encountered a script tag while rendering
    // React component"), which is why the document shell lives in the ROOT
    // layout rather than in app/[locale]/layout.tsx.
    await page.setViewportSize({ width: 1280, height: 900 });

    // Transport-level noise from the dev server under parallel load — a chunk
    // or RSC payload that times out while several workers compile at once.
    // Filtered because it is the harness, not the page: everything the two
    // regressions above would produce is a React/runtime message, which still
    // fails this test.
    const isDevServerNoise = (message: string) =>
      /Failed to load resource|ERR_(ABORTED|CONNECTION|NETWORK)|net::ERR_/i.test(
        message
      );

    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {
      if (m.type() === 'error' && !isDevServerNoise(m.text())) {
        errors.push(m.text());
      }
    });

    let loads = 0;
    page.on('load', () => (loads += 1));

    await page.goto('/en');
    const loadsAfterFirstPaint = loads;

    await page.getByRole('button', { name: 'Filipino', exact: true }).click();
    await expect(page).toHaveURL(/\/fil$/, { timeout: 30_000 });
    await expect(page.locator('#top:visible')).toHaveCount(1);
    await expect(page.locator('main:visible')).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fil');

    await page.getByRole('button', { name: 'English', exact: true }).click();
    await expect(page).toHaveURL(/\/en$/, { timeout: 30_000 });
    await expect(page.locator('#top:visible')).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    expect(loads - loadsAfterFirstPaint).toBe(0);
    expect(errors).toEqual([]);
  });

  test('switching locale keeps the reader where they were', async ({
    page,
  }) => {
    // The switch never was a reload — no `load` event, one navigation entry,
    // globals survive it. What made it FEEL like one was App Router restoring
    // scroll to the top on every `replace`: 2200 -> 13. `scroll: false` in
    // LocaleSwitcher is the fix, and this is what stops it regressing.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/en');

    // `scroll-behavior: smooth` is on `html`, so this animates — poll rather
    // than read straight back.
    await page.evaluate(() => window.scrollTo(0, 2200));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(2200);

    await page.getByRole('button', { name: 'Filipino', exact: true }).click();
    await expect(page).toHaveURL(/\/fil$/, { timeout: 30_000 });
    await expect(page.locator('html')).toHaveAttribute('lang', 'fil');

    // Filipino runs longer than English, so the page can grow — but the
    // reader's offset must not be thrown away. A few pixels of reflow is fine;
    // a jump to the top is the bug.
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(2100);
  });

  test('the Soon badge overlays the card corner and never covers title TEXT', async ({
    page,
  }, testInfo) => {
    // The badge no longer displaces anything: the card reserves no top band and
    // the badge is absolutely positioned over the corner. What keeps them apart
    // is a floated, invisible copy of the badge at the head of the title, which
    // shortens the title's FIRST LINE by exactly the badge's width in whatever
    // locale is rendering. "Soon" is ~45px; Filipino "Malapit na" is ~87px.
    //
    // So the assertion has to be against the rendered text runs, not against
    // the title's box. The box now starts at the same y as the badge by design
    // — comparing boxes would fail on a layout that is correct.
    const measured: Record<string, unknown> = {};

    for (const locale of ['en', 'fil']) {
      for (const width of [320, 390, 768, 1024, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}`);

        const geometry = await page.evaluate(() => {
          // One rect per rendered LINE of the element's own text nodes.
          const lineRects = (el: Element | null) => {
            if (!el) return [] as DOMRect[];
            const out: DOMRect[] = [];
            for (const node of Array.from(el.childNodes)) {
              if (node.nodeType !== Node.TEXT_NODE) continue;
              if (!node.textContent?.trim()) continue;
              const range = document.createRange();
              range.selectNodeContents(node);
              out.push(...Array.from(range.getClientRects()));
            }
            return out;
          };
          const overlaps = (a: DOMRect, b: DOMRect) =>
            a.left < b.right - 0.5 &&
            b.left < a.right - 0.5 &&
            a.top < b.bottom - 0.5 &&
            b.top < a.bottom - 0.5;

          const cards = Array.from(
            document.querySelectorAll('#services article')
          );
          let collisions = 0;
          let badgeWidth = 0;
          let badged = 0;

          for (const card of cards) {
            const badge = card.querySelector(':scope > span');
            if (!badge) continue;
            badged += 1;
            const b = badge.getBoundingClientRect();
            const c = card.getBoundingClientRect();
            badgeWidth = Math.max(badgeWidth, Math.round(b.width));
            // Anchored to the card's own corner, not to the text below it.
            if (!(
              b.top - c.top < c.height / 2 && c.right - b.right < c.width / 2
            )) {
              collisions += 1;
            }
            for (const line of lineRects(card.querySelector('h4'))) {
              if (overlaps(b, line)) collisions += 1;
            }
          }
          return { cards: cards.length, badged, badgeWidth, collisions };
        });

        measured[`${locale} @ ${width}`] = geometry;
        // Featured + three from the manifest + "View all services".
        expect(geometry.cards, `${locale} @ ${width}`).toBe(5);
        expect(geometry.badged, `${locale} @ ${width}`).toBe(5);
        expect(geometry.collisions, `${locale} @ ${width}`).toBe(0);
      }
    }

    await testInfo.attach('badge width and collisions', {
      body: JSON.stringify(measured, null, 2),
      contentType: 'application/json',
    });
  });

  test('the services group is five cards, and the fifth goes to the index', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/en');

    const services = page.locator('#services');
    await expect(services.getByRole('heading', { level: 3 })).toHaveText(
      'Most asked'
    );
    await expect(services.getByRole('heading', { level: 4 })).toHaveCount(5);
    await expect(services.getByText('View all services')).toBeVisible();
    // /services does not exist yet, so it must not be a link that 404s.
    await expect(
      services.getByRole('link', { name: /View all services/ })
    ).toHaveCount(0);
  });

  test('no card overflows its own grid track', async ({ page }) => {
    // The contact cards' grid track was sized from an unbreakable email token
    // and came out 343px inside a 256px measure at 320px. The section's
    // `overflow-hidden` clipped it, so the page-level horizontal-scroll check
    // below never saw it — the text was simply cut off. Assert containment
    // directly rather than inferring it from document scrollWidth.
    for (const locale of ['en', 'fil']) {
      for (const width of [320, 360, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}`);

        const escaping = await page.evaluate(() => {
          /*
           * Out-of-flow elements are exempt — and so is everything INSIDE one.
           *
           * Checking only the element's own `position` was not enough: the
           * contact slab's silhouette is an absolutely-positioned `<svg>` that
           * is deliberately cropped off the leading edge, and its `<g>`,
           * `<path>` and `<use>` children are all `static`, so they reported
           * themselves as escaping. They are not content escaping a track, they
           * are a decoration doing what it was asked to. The rule the test
           * always meant is "in normal flow", which has to be answered by
           * walking up.
           */
          const outOfFlow = (el: Element) => {
            for (
              let node: Element | null = el;
              node && node !== document.body;
              node = node.parentElement
            ) {
              const position = getComputedStyle(node).position;
              if (position === 'fixed' || position === 'absolute') return true;
            }
            return false;
          };

          const bad: string[] = [];
          for (const el of Array.from(
            document.querySelectorAll('main *, footer *')
          )) {
            if (outOfFlow(el)) continue;
            const r = el.getBoundingClientRect();
            if (r.width === 0) continue;
            if (r.right > window.innerWidth + 0.5 || r.left < -0.5) {
              // `className` on an SVG element is an SVGAnimatedString, which
              // stringifies to "[object SVGAnimatedString]" and names nothing.
              const cls =
                typeof el.className === 'string'
                  ? el.className
                  : (el.getAttribute('class') ?? '');
              bad.push(`${el.tagName}.${cls.slice(0, 40)}`);
            }
          }
          return Array.from(new Set(bad));
        });

        expect(escaping, `${locale} @ ${width}`).toEqual([]);
      }
    }
  });

  test('the national line reads label-left, number-right on one row', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/en');

    const geometry = await page.evaluate(() => {
      const band = document
        .querySelector('#emergency a[href="tel:911"]')!
        .closest('[data-surface="accent"]')!;
      const number = band
        .querySelector('a[href="tel:911"]')!
        .getBoundingClientRect();
      const label = band.querySelector('h3')!.getBoundingClientRect();
      const source = band.querySelector('p a')!.getBoundingClientRect();
      return {
        labelBeforeNumber: label.right <= number.left,
        sourceBeforeNumber: source.right <= number.left,
        // One row: the number's box overlaps the label's vertical span.
        sameRow: number.top < label.bottom + 80 && number.bottom > label.top,
      };
    });

    expect(geometry.labelBeforeNumber).toBe(true);
    expect(geometry.sourceBeforeNumber).toBe(true);
    expect(geometry.sameRow).toBe(true);
  });

  test('the timeline rail is one unbroken line with centred markers', async ({
    page,
  }) => {
    // Regression, twice over. First the dot sat 2px off the line because
    // absolute insets resolve against the PADDING box and the rail draws its
    // line with a 2px border. Then the rail itself turned out to be broken into
    // segments: `pb-6` on the <li> is outside the content box the rail stretches
    // to, leaving a 24px dead gap before every marker.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/en');

    const geometry = await page.evaluate(() => {
      const rails = [
        ...document.querySelectorAll('#history ol li span[aria-hidden]'),
      ].map(s => s.getBoundingClientRect());
      const dots = [
        ...document.querySelectorAll('#history ol li span[aria-hidden] > span'),
      ].map(d => d.getBoundingClientRect());

      const gaps: number[] = [];
      for (let i = 1; i < rails.length; i += 1) {
        gaps.push(Math.round(rails[i].top - rails[i - 1].bottom));
      }
      const offsets = dots.map((d, i) =>
        Math.round(d.left + d.width / 2 - (rails[i].left + 1))
      );
      return { gaps, offsets, count: rails.length };
    });

    expect(geometry.count).toBeGreaterThan(4);
    // No gap anywhere along the rail.
    expect(geometry.gaps.every(g => g === 0)).toBe(true);
    // Every marker centred on the line, including the last (whose border is
    // transparent rather than absent, so its box model matches).
    expect(geometry.offsets.every(o => o === 0)).toBe(true);
  });

  test('nothing on the page underlines on hover', async ({ page }) => {
    // Asserted against the ELEMENTS, not the stylesheet.
    //
    // A stylesheet scan looks exhaustive but reports a false positive here:
    // `globals.css` has `@source '…/@bettergov/kapwa/dist'`, so Tailwind scans
    // Kapwa's compiled JS and emits `.hover\:underline:hover` because Kapwa's
    // own components use it — even though nothing we render carries the class.
    // What matters is whether anything ON THE PAGE would underline.
    await page.goto('/en');

    const offenders = await page.evaluate(() => {
      const found: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>('a, button')) {
        if (el.matches('.hover\\:underline')) {
          found.push(el.className || el.tagName);
          continue;
        }
        // Catch a hover underline arriving from anywhere else too: compare the
        // resting decoration against the one the :hover rules would apply.
        const resting = getComputedStyle(el).textDecorationLine;
        const hovered = [...document.styleSheets]
          .flatMap(sheet => {
            try {
              return [...sheet.cssRules];
            } catch {
              return [];
            }
          })
          .filter(
            (rule): rule is CSSStyleRule =>
              rule instanceof CSSStyleRule && /:hover\b/.test(rule.selectorText)
          )
          .filter(rule => {
            try {
              return el.matches(rule.selectorText.replace(/:hover\b/g, ''));
            } catch {
              return false;
            }
          })
          .map(
            rule =>
              rule.style.getPropertyValue('text-decoration-line') ||
              rule.style.getPropertyValue('text-decoration')
          );

        if (
          !resting.includes('underline') &&
          hovered.some(d => d.includes('underline'))
        ) {
          found.push(el.className || el.tagName);
        }
      }
      return [...new Set(found)];
    });

    expect(offenders).toEqual([]);
  });

  test('the hotline citations stay underlined', async ({ page }) => {
    // The persistent underline is deliberate and separate from the rule above.
    // On the accent band `--ink-link` resolves to the same navy as the body
    // ink, so the underline is the only thing marking the citation as a link.
    await page.goto('/en');

    const citation = page.locator('#emergency p a').first();
    await expect(citation).toBeAttached();
    expect(
      await citation.evaluate(node => getComputedStyle(node).textDecorationLine)
    ).toContain('underline');
  });

  test('911 fills the height of its cell without escaping it', async ({
    page,
  }, testInfo) => {
    // The number is sized in `--text-callband`, a `cqh` expression against its
    // own cell — so the assertion is about the ratio of PAINTED INK to the cell,
    // not about a font size. `getClientRects()` would measure the line box,
    // which is ~1.27em and legitimately overhangs; canvas `TextMetrics` gives
    // the glyph bounds, which are what a reader sees and what must not escape.
    //
    // Below `sm` there is no externally-set height to measure against, so the
    // container is not applied and the number stays at `--text-section`. That
    // is checked too — applying it there collapses the cell to zero.
    const measured: Record<string, unknown> = {};

    for (const locale of ['en', 'fil']) {
      for (const width of [320, 390, 768, 1024, 1280, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}`);

        const band = await page.evaluate(async () => {
          await document.fonts.ready;
          const link = document.querySelector<HTMLElement>(
            '#emergency a[href="tel:911"]'
          )!;
          const cell = link.parentElement!;
          const cellBox = cell.getBoundingClientRect();
          const lineBox = link.getBoundingClientRect();
          const cs = getComputedStyle(link);
          const font = parseFloat(cs.fontSize);

          const ctx = document.createElement('canvas').getContext('2d')!;
          ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
          const m = ctx.measureText(link.textContent!.trim());
          const inkH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
          // Space Grotesk's cap height is 0.7107em; the line box is centred.
          const baseline = lineBox.top + (lineBox.height + font * 0.7107) / 2;
          const inkTop = baseline - m.actualBoundingBoxAscent;

          /*
           * WIDTH comes from a Range, not from canvas and not from the link's
           * own box.
           *
           * `ctx.measureText` cannot see `font-variant-numeric: tabular-nums`,
           * which this element sets — it reported the PROPORTIONAL width,
           * 1.522em, while the page rendered the tabular one, 1.86em. That 18%
           * blind spot is precisely why this test watched the number break out
           * of its cell between 640-767px and said nothing. The link's own rect
           * is no good either: it is an `inline-block` in a stretched grid cell,
           * so it reports the CELL's width and the comparison is vacuous.
           *
           * A Range over the text node measures what was actually painted.
           */
          const range = document.createRange();
          range.selectNodeContents(link);
          const textBox = range.getBoundingClientRect();

          return {
            contained: getComputedStyle(cell).containerType,
            fontPx: Math.round(font * 10) / 10,
            cellH: Math.round(cellBox.height),
            inkH: Math.round(inkH),
            fillPct: Math.round((inkH / cellBox.height) * 1000) / 10,
            topGap: Math.round((inkTop - cellBox.top) * 10) / 10,
            bottomGap: Math.round((cellBox.bottom - (inkTop + inkH)) * 10) / 10,
            inkW: Math.round(textBox.width),
            cellW: Math.round(cellBox.width),
          };
        });

        measured[`${locale} @ ${width}`] = band;

        // Never clipped and never spilling, in either axis.
        expect(band.topGap, `${locale} @ ${width} top`).toBeGreaterThanOrEqual(
          0
        );
        expect(
          band.bottomGap,
          `${locale} @ ${width} bottom`
        ).toBeGreaterThanOrEqual(0);
        expect(band.inkW, `${locale} @ ${width} width`).toBeLessThan(
          band.cellW
        );

        if (width < 640) {
          // No definite height below `sm` — the container must NOT be applied.
          expect(band.contained, `${locale} @ ${width}`).not.toBe('size');
        } else {
          expect(band.contained, `${locale} @ ${width}`).toBe('size');
          // "Fills it" means fills it: at least 90% of the cell, or the width
          // guard is what is binding.
          expect(
            band.fillPct > 90 || band.inkW > band.cellW * 0.8,
            `${locale} @ ${width} fill ${band.fillPct}%`
          ).toBe(true);
          // And it is a great deal larger than a section heading now.
          expect(band.fontPx, `${locale} @ ${width}`).toBeGreaterThan(60);
        }
      }
    }

    await testInfo.attach('911: painted ink vs its cell', {
      body: JSON.stringify(measured, null, 2),
      contentType: 'application/json',
    });
  });

  test('the 911 band is legible on a phone and never leaves its cell', async ({
    page,
  }) => {
    /*
     * Below `sm` the container query cannot apply (the band is one column and
     * nothing external sets the row height), so the number used to fall back to
     * `--text-section` — 28px, against the 89.8px it renders at on a desktop.
     * 31%, on the devices most likely to be used to dial it.
     *
     * The width guard is checked in the same test because it was calibrated on
     * a measurement of "911" taken WITHOUT `tabular-nums`, which the element
     * sets: the digits actually run 1.86em, not 1.522em, and between 640-767px
     * they broke out of their own cell.
     */
    const sizeAt = async (width: number) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/en');
      return page.evaluate(async () => {
        await document.fonts.ready;
        const a = document.querySelector<HTMLElement>(
          '[data-surface="accent"] a[href^="tel:"]'
        )!;
        // A Range, for the reason spelled out in the test above: the link is an
        // inline-block in a stretched cell, so its own rect IS the cell's width
        // and comparing the two would always pass.
        const range = document.createRange();
        range.selectNodeContents(a);
        return {
          fontSize: parseFloat(getComputedStyle(a).fontSize),
          inkW: range.getBoundingClientRect().width,
          cellW: a.parentElement!.getBoundingClientRect().width,
        };
      });
    };

    const desktop = await sizeAt(1280);
    const phone = await sizeAt(390);

    // "more like 70% of its desktop font-size"
    const ratio = phone.fontSize / desktop.fontSize;
    expect(ratio).toBeGreaterThan(0.62);
    expect(ratio).toBeLessThan(0.78);

    // And it still fits, at the narrowest width and across the band where the
    // container query takes over.
    for (const width of [320, 640, 700, 768]) {
      const at = await sizeAt(width);
      expect(at.inkW).toBeLessThanOrEqual(at.cellW + 0.5);
    }
  });

  test('the two hotline panels are the same height', async ({ page }) => {
    // "Before the season" sat centred at its natural height beside a much
    // taller hotlines list. Both columns stretch now.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/en');

    const hotlines = await page
      .locator('#emergency ul')
      .first()
      .locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]')
      .boundingBox();
    const preparedness = await page
      .locator('#emergency ol')
      .first()
      .locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]')
      .boundingBox();

    expect(hotlines).not.toBeNull();
    expect(preparedness).not.toBeNull();
    expect(Math.round(preparedness!.height)).toBe(Math.round(hotlines!.height));
  });

  test.describe('the sources page', () => {
    test('lists every citation, derived from the figures themselves', async ({
      page,
    }) => {
      /*
       * The list is built from the same `source` blocks the stat band and the
       * hotline list render, so it cannot disagree with them. These assertions
       * read the CONTENT and then look for it on the page — restating the
       * expected citations here would defeat the point.
       */
      const read = (rel: string) =>
        yaml.load(
          readFileSync(path.join(process.cwd(), rel), 'utf8')
        ) as Record<string, { source: { label: { en: string } } }[]>;

      const labels = new Set([
        ...read('content/home/stats.yaml').stats!.map(s => s.source.label.en),
        ...read('content/home/emergency.yaml').hotlines!.map(
          h => h.source.label.en
        ),
      ]);
      expect(labels.size).toBeGreaterThan(2);

      const response = await page.goto('/en/sources');
      expect(response?.status()).toBe(200);

      for (const label of labels) {
        await expect(
          page.getByRole('heading', { level: 3, name: label }),
          label
        ).toBeVisible();
      }
    });

    test('renders the via chain, which nothing used to show', async ({
      page,
    }) => {
      // `via` sat in the schema, the loader and the types for many rounds and
      // was rendered by no component — so "cite THROUGH the tertiary source"
      // was a rule the data obeyed and the reader could never check.
      await page.goto('/en/sources');
      await expect(page.getByText(/reached through Wikipedia/i)).toBeVisible();
    });

    test('keeps two citations that share a URL but not a label apart', async ({
      page,
    }) => {
      // Deduping on the URL merged the barangay classification and the land
      // area into one row headed "barangay classification".
      await page.goto('/en/sources');
      const wikipedia = page.getByRole('heading', {
        level: 3,
        name: /^Wikipedia — Tandag/,
      });
      expect(await wikipedia.count()).toBeGreaterThan(1);
    });

    test('is reachable from the footer and carries its own title', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/en');

      await page
        .locator('footer')
        .getByRole('link', { name: 'Sources' })
        .click();
      await expect(page).toHaveURL(/\/en\/sources$/);
      await expect(page).toHaveTitle(/Sources/);
    });

    test('is in the sitemap, and the noindex routes are not', async ({
      request,
    }) => {
      const body = await (await request.get('/sitemap.xml')).text();
      expect(body).toContain('/en/sources');
      expect(body).toContain('/fil/sources');
      // /search sets robots: noindex; listing it here would say the opposite.
      expect(body).not.toContain('/search');
    });
  });

  test('the 404 has its own title, not the home page title', async ({
    page,
  }) => {
    // `meta.notFoundTitle` was written for this and never wired, so a 404
    // claimed to be the home page in the tab strip and in search results.
    const response = await page.goto('/en/no-such-page');
    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle(/Page not found/);
  });

  test('the contact slab uses the mark as its silhouette', async ({ page }) => {
    /*
     * It was two faint discs carried over from the reference portal. The mark
     * needs no colour of its own here: the slab is `data-surface="inverse"`,
     * where both mark roles already resolve to white, so the two-tone logo
     * flattens to a single silhouette.
     */
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/en');

    const geom = await page.evaluate(() => {
      const section = document.querySelector('#contact')!;
      const mark = section.querySelector('svg')!;
      const s = section.getBoundingClientRect();
      const m = mark.getBoundingClientRect();
      return {
        widthRatio: m.width / s.width,
        aspect: m.width / m.height,
        visibleFromEnd: (m.right - s.left) / m.width,
        visibleFromTop: (s.bottom - m.top) / m.height,
        opacity: Number(getComputedStyle(mark).opacity),
        overflow: getComputedStyle(section).overflowX,
        hidden: mark.getAttribute('aria-hidden'),
      };
    });

    expect(geom.widthRatio).toBeCloseTo(0.4, 2); // 40% of the section's width
    expect(geom.aspect).toBeCloseTo(134 / 142.35, 2); // undistorted
    expect(geom.visibleFromEnd).toBeCloseTo(0.7, 2); // leading 30% cropped
    expect(geom.visibleFromTop).toBeCloseTo(0.7, 2); // bottom 30% cropped
    expect(geom.opacity).toBeLessThan(0.15); // texture, not content
    expect(geom.hidden).toBe('true');
    // The crop is the section's overflow, so losing it would show the rest.
    expect(geom.overflow).toBe('hidden');
  });

  test('desktop nav submenus hug their content and never wrap a label', async ({
    page,
  }) => {
    /*
     * The panel sizes to its widest row (`w-max`) and nothing inside it breaks
     * (`whitespace-nowrap`). A fixed width wrapped "Ang lungsod sa isang
     * sulyap" onto two lines in Filipino and split the "Malapit na" badge down
     * the middle — a nav label on two lines reads as two entries.
     *
     * Checked in FILIPINO, which is where it failed: the labels run 15-25%
     * longer than the English, and at 1024px the desktop nav is at its tightest.
     */
    for (const width of [1024, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/fil');

      const buttons = page.locator('header nav button[aria-expanded]');
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);

      let opened = 0;
      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        if (!(await button.isVisible())) continue;

        await button.click();
        const id = await button.getAttribute('aria-controls');
        const panel = page.locator(`#${id}`);

        const shape = await panel.evaluate(el => {
          /*
           * Line counting is done on the TEXT NODES, not on the row box.
           * A row is `min-h-11` for the touch target and holds a smaller
           * inline-flex badge, so row-height ÷ line-height reads as ~1.8 and a
           * Range over the whole row returns three rects (label, badge box,
           * badge text) at three different tops — neither means it wrapped.
           * A text node's client rects are exactly one per line box.
           */
          const lines = (node: Node) => {
            const range = document.createRange();
            range.selectNode(node);
            return range.getClientRects().length;
          };

          const wrapped: { text: string; lines: number }[] = [];
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          let node: Node | null;
          while ((node = walker.nextNode())) {
            const text = node.textContent?.trim() ?? '';
            if (!text) continue;
            const count = lines(node);
            if (count > 1)
              wrapped.push({ text: text.slice(0, 32), lines: count });
          }

          // The panel should already BE max-content; prove it by measuring a
          // clone that is explicitly sized that way.
          const probe = el.cloneNode(true) as HTMLElement;
          probe.style.position = 'absolute';
          probe.style.width = 'max-content';
          probe.style.visibility = 'hidden';
          el.parentElement!.append(probe);
          const maxContent = probe.getBoundingClientRect().width;
          probe.remove();

          const box = el.getBoundingClientRect();
          return {
            wrapped,
            hugs: Math.abs(box.width - maxContent) < 1,
            nowrap: getComputedStyle(el).whiteSpace === 'nowrap',
            right: box.right,
          };
        });

        expect(shape.nowrap, `${id} @ ${width} white-space`).toBe(true);
        expect(shape.hugs, `${id} @ ${width} hugs its content`).toBe(true);
        expect(shape.wrapped, `${id} @ ${width} wrapped text`).toEqual([]);
        // And it still fits on screen — `w-max` is deliberately uncapped.
        expect(shape.right, `${id} @ ${width} right edge`).toBeLessThanOrEqual(
          width
        );

        await button.click();
        opened++;
      }
      expect(opened, `opened at ${width}`).toBeGreaterThan(0);
    }
  });

  test('page content is 80% wide with 10% margins', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/en');

    const box = await page.locator('#services').boundingBox();
    expect(box).not.toBeNull();
    expect(Math.round(box!.width)).toBe(1024);
    expect(Math.round(box!.x)).toBe(128);
  });

  test.describe('the mark', () => {
    /*
     * The rebrand ships three SVGs — colour, black and reversed-white — that
     * differ only in two fills. Logo.tsx renders all three from the --mark-land
     * and --mark-sun role tokens instead of importing three files, so these
     * assertions are what stand between that and a mark that silently comes out
     * navy-on-navy in dark theme or invisible on the footer's black ground.
     */
    const LAND_LIGHT = 'rgb(0, 50, 160)'; // primary-700, the brand navy
    const LAND_DARK = 'rgb(140, 180, 255)'; // primary-300
    const SUN_FLAG = 'rgb(252, 209, 22)'; // #FCD116, the flag yellow
    const WHITE = 'rgb(255, 255, 255)';

    async function fills(page: Page, scope: 'header' | 'footer') {
      return page.evaluate(sel => {
        const svg = document.querySelector(`${sel} svg`)!;
        const land = svg.querySelector('use[class*="mark-land"]')!;
        const sun = svg.querySelector('g[mask]')!;
        return {
          land: getComputedStyle(land).fill,
          sun: getComputedStyle(sun).fill,
        };
      }, scope);
    }

    test('is the colour variant in light theme', async ({ page }) => {
      await page.goto('/en');
      expect(await fills(page, 'header')).toEqual({
        land: LAND_LIGHT,
        sun: SUN_FLAG,
      });
    });

    test('lightens its land in dark theme, and keeps the flag sun', async ({
      page,
    }) => {
      // The brand navy is 1.16:1 on the dark page ground — the land would be
      // a navy hole in a navy page. The sun does not move: flag yellow reads
      // on both grounds.
      await page.goto('/en');
      await page
        .locator('[data-control="theme"]')
        .first()
        .click({ force: true });
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

      expect(await fills(page, 'header')).toEqual({
        land: LAND_DARK,
        sun: SUN_FLAG,
      });
    });

    test('is the reversed all-white variant on the footer ground', async ({
      page,
    }) => {
      await page.goto('/en');
      expect(await fills(page, 'footer')).toEqual({ land: WHITE, sun: WHITE });
    });

    test('fills its box edge to edge, on all four sides', async ({ page }) => {
      /*
       * The mark must touch every edge of its own element — no letterbox, and
       * no reliance on the delivered framing, which centres the drawing in a
       * 154 square with 10 units of air on each side (87% x 92% fill).
       * Logo.tsx crops to the measured ink box instead.
       *
       * That box is 134 x 142.35, aspect 0.94, so the ELEMENT is not square
       * either: `size` is the height and the width follows the artwork. A
       * square element would put the letterbox straight back, which is the
       * failure this guards — and it is purely visual, the kind nobody files.
       */
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/en');

      for (const [scope, height] of [
        ['header', 40],
        ['footer', 64],
      ] as const) {
        const box = await page.evaluate(sel => {
          const svg = document.querySelector(`${sel} svg`)!;
          const outer = svg.getBoundingClientRect();
          const land = svg
            .querySelector('use[class*="mark-land"]')!
            .getBoundingClientRect();
          const sun = svg.querySelector('g[mask]')!.getBoundingClientRect();
          const ink = {
            left: Math.min(land.left, sun.left),
            right: Math.max(land.right, sun.right),
            top: Math.min(land.top, sun.top),
            bottom: Math.max(land.bottom, sun.bottom),
          };
          return {
            height: outer.height,
            aspect: outer.width / outer.height,
            padLeft: ink.left - outer.left,
            padRight: outer.right - ink.right,
            padTop: ink.top - outer.top,
            padBottom: outer.bottom - ink.bottom,
          };
        }, scope);

        expect(Math.round(box.height), scope).toBe(height);
        // The element carries the artwork's aspect, not a square.
        expect(box.aspect, scope).toBeCloseTo(134 / 142.35, 2);
        // Edge to edge: sub-pixel on every side.
        for (const [side, pad] of Object.entries(box)) {
          if (!side.startsWith('pad')) continue;
          expect(Math.abs(pad), `${scope} ${side}`).toBeLessThan(0.5);
        }
      }
    });
  });

  test.describe('the wordmark', () => {
    /*
     * Two lines that have to read as ONE object: a de-emphasised "Better" over
     * a larger, uppercase "TANDAG", set in Inter (the Kapwa design system's
     * sans) so the mark matches the rest of the Better<LGU>.org network. Every
     * assertion below is a property that, if it broke, would look merely
     * slightly off rather than obviously wrong — which is why they are pinned.
     */
    async function lockup(page: Page, scope: 'header' | 'footer') {
      return page.evaluate(sel => {
        const root = document.querySelector(`${sel} .font-wordmark`)!;
        const [lead, main] = [...root.children] as HTMLElement[];
        const read = (el: HTMLElement) => {
          const s = getComputedStyle(el);
          return {
            text: el.textContent!.trim(),
            rendered: el.getBoundingClientRect().height,
            fontSize: parseFloat(s.fontSize),
            lineHeight: parseFloat(s.lineHeight),
            weight: s.fontWeight,
            transform: s.textTransform,
            colour: s.color,
            family: s.fontFamily,
          };
        };
        return { lead: read(lead!), main: read(main!) };
      }, scope);
    }

    test('is Inter, and the face is actually loaded', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/en');
      const { lead, main } = await lockup(page, 'header');

      for (const line of [lead, main]) {
        expect(line.family).toMatch(/Inter/i);
        expect(line.family).not.toMatch(/Grotesk/i);
      }

      // A declared family is not a loaded one. Without this, deleting the font
      // from the root layout leaves the class list intact and the mark falls
      // back to the body face — the exact failure this guards.
      const loaded = await page.evaluate(family => {
        const primary = family.split(',')[0]!.trim();
        return document.fonts.check(`900 16px ${primary}`);
      }, main.family);
      expect(loaded).toBe(true);
    });

    test('reads Better over TANDAG, the second line larger and in caps', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/en');
      const { lead, main } = await lockup(page, 'header');

      expect(lead.text).toBe('Better');
      // Sentence case in the DOM, uppercase only in CSS — so a screen reader
      // is not handed "TANDAG" to spell out, and the visible text still
      // concatenates to "BetterTandag" for WCAG 2.5.3.
      expect(main.text).toBe('Tandag');
      expect(main.transform).toBe('uppercase');

      // The hierarchy is carried by SIZE, and the target is exactly 70% —
      // 14px over 20px. Below about 60% the lead reads as a caption rather than
      // as the first word of the name; at parity the two lines stop being a
      // lockup at all.
      expect(lead.fontSize / main.fontSize).toBeCloseTo(0.7, 2);
    });

    test('holds the same 70% at every width, and in the footer', async ({
      page,
    }) => {
      // The ratio used to step with the breakpoint (67% at base, 70% from
      // `sm`). One pair now serves every width and both marks.
      for (const width of [320, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/en');
        for (const scope of ['header', 'footer'] as const) {
          const { lead, main } = await lockup(page, scope);
          expect(
            lead.fontSize / main.fontSize,
            `${scope} @ ${width}`
          ).toBeCloseTo(0.7, 2);
        }
      }
    });

    test('sets the two lines tight enough to read as one unit', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/en');
      const { lead, main } = await lockup(page, 'header');

      // leading-none: the line box is the type size, with no extra leading
      // opening a gap between the two words.
      for (const line of [lead, main]) {
        expect(line.lineHeight).toBeCloseTo(line.fontSize, 1);
      }

      // And the whole lockup still fits beside the 40px mark.
      const stack = await page.evaluate(() =>
        document
          .querySelector('header .font-wordmark')!
          .getBoundingClientRect()
          .height.toFixed(1)
      );
      expect(parseFloat(stack)).toBeLessThanOrEqual(40);
    });

    test('is blue in the header and white on the footer ground', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/en');

      const header = await lockup(page, 'header');
      const footer = await lockup(page, 'footer');

      // primary-700 on the page; --ink-wordmark exists because --ink-link
      // would resolve GOLD on the footer's inverse surface.
      expect(header.lead.colour).toBe('rgb(0, 50, 160)');
      expect(header.main.colour).toBe('rgb(0, 50, 160)');
      expect(footer.lead.colour).toBe('rgb(255, 255, 255)');
      expect(footer.main.colour).toBe('rgb(255, 255, 255)');
    });

    test('lightens in dark theme rather than staying brand navy', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/en');
      await page
        .locator('[data-control="theme"]')
        .first()
        .click({ force: true });
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

      const { main } = await lockup(page, 'header');
      expect(main.colour).toBe('rgb(140, 180, 255)'); // primary-300
    });
  });

  test('each language is named in its own language', async ({ page }) => {
    // A reader who cannot read the current language still has to find theirs.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/fil');

    await expect(
      page.getByRole('button', { name: 'English', exact: true })
    ).toBeVisible();
  });

  test('the translation notice overlays and never displaces the hero', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const heroTop = async () =>
      page.evaluate(
        () =>
          document.querySelector('#top')!.getBoundingClientRect().top +
          window.scrollY
      );

    await page.goto('/en');
    const withoutNotice = await heroTop();

    await page.goto('/fil');
    await expect(
      page.getByText('wala pang salin sa Filipino', { exact: false })
    ).toBeVisible();
    const withNotice = await heroTop();

    expect(withNotice).toBe(withoutNotice);
  });

  test('the translation notice never sits under the back-to-top button', async ({
    page,
  }) => {
    // Both are fixed to the bottom. They are laid out to miss each other at
    // every width; 320px is where they would collide first.
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/fil');
    await page.mouse.wheel(0, 3000);

    const backToTop = page.getByRole('button', { name: 'Bumalik sa itaas' });
    await expect(backToTop).toBeVisible();

    const notice = page
      .locator('[role="status"]')
      .filter({ hasText: 'salin sa Filipino' });
    const noticeBox = await notice.boundingBox();
    const buttonBox = await backToTop.boundingBox();

    expect(noticeBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();
    expect(noticeBox!.x + noticeBox!.width).toBeLessThanOrEqual(buttonBox!.x);
  });

  test('a missing Filipino translation is disclosed, never silent', async ({
    page,
  }) => {
    await page.goto('/fil');
    await expect(
      page.getByText('wala pang salin sa Filipino', { exact: false })
    ).toBeVisible();
  });

  test.describe('theme', () => {
    test('toggles, persists, and mirrors the Kapwa class', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/en');

      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

      await page.getByRole('button', { name: 'Switch to dark theme' }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      // Kapwa's precompiled CSS keys off `.dark`, ours off the attribute.
      await expect(page.locator('html')).toHaveClass(/dark/);

      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    });

    test('follows the OS preference when nothing is stored', async ({
      browser,
    }) => {
      const context = await browser.newContext({ colorScheme: 'dark' });
      const page = await context.newPage();
      await page.goto('/en');

      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await context.close();
    });

    test('the theme attribute is set before the body paints', async ({
      page,
    }) => {
      await page.addInitScript(() => {
        try {
          localStorage.setItem('bt-theme', 'dark');
        } catch {
          /* private browsing */
        }
      });
      // `commit` resolves as soon as the navigation is committed, so this
      // reads the attribute set by the blocking head script, not one applied
      // after hydration — a FOUC would fail here.
      await page.goto('/en', { waitUntil: 'commit' });

      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    });
  });

  test.describe('search', () => {
    test('the hero form submits to a shareable URL', async ({ page }) => {
      await page.goto('/en');

      await page.getByLabel('Search services').fill('permit');
      await page.getByRole('button', { name: 'Search' }).click();

      await expect(page).toHaveURL(/\/search\?q=permit/);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        'permit'
      );
    });

    test('a query with no matches renders a real empty state', async ({
      page,
    }) => {
      await page.goto('/en/search?q=zzzznothing');

      await expect(page.locator('main').getByRole('status')).toContainText(
        'No results'
      );
      await expect(
        page.getByText('Nothing matched', { exact: false })
      ).toBeVisible();
    });

    test('a matching query lists results', async ({ page }) => {
      await page.goto('/en/search?q=permit');
      await expect(page.locator('main').getByRole('status')).not.toContainText(
        'No results'
      );
    });
  });

  test('unbuilt destinations are not links that 404', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/en');

    const nav = page.getByRole('navigation', { name: 'Main' });
    // "Services" is a disclosure button now, so it was never a link — but its
    // children are the ones that would 404, and they must not be links either.
    await nav.getByRole('button', { name: 'Services' }).click();
    await expect(
      nav.getByRole('link', { name: /Business & permits/ })
    ).toHaveCount(0);
    await expect(nav.getByText('Business & permits')).toBeVisible();
  });

  test('the resources column links the LGU page from the config', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/en');

    const link = page.getByRole('link', { name: /LGU Tandag Facebook/ });
    await expect(link).toHaveAttribute(
      'href',
      'https://www.facebook.com/CityGovernmentofTandag'
    );

    // Directly under Sangguniang Panlungsod in the same column.
    const labels = await page
      .locator('nav[aria-labelledby="footer-resources"] li')
      .allInnerTexts();
    const sp = labels.findIndex(l => l.includes('Sangguniang Panlungsod'));
    expect(labels[sp + 1]).toContain('LGU Tandag Facebook');
  });

  test.describe('emergency hotline ticker', () => {
    // Locale-independent. The section's aria-label comes from messages/, so
    // an attribute selector only ever matches one locale — and these tests
    // deliberately run both.
    const ticker = 'section:has(.hotline-track)';

    test('publishes every number from the manifest, dialable and named', async ({
      page,
    }) => {
      await page.goto('/en');

      // CDRRMO x2, PNP x2, BFP x3, plus 911 — the whole of
      // content/home/emergency.yaml, with nothing hardcoded in the component.
      const links = page.locator(`${ticker} a[href^="tel:"]`);
      await expect(links).toHaveCount(8);

      for (let i = 0; i < 8; i += 1) {
        expect(await links.nth(i).getAttribute('href')).toMatch(
          /^tel:(\+63\d{10}|911)$/
        );
        expect(await links.nth(i).getAttribute('aria-label')).toMatch(
          /^Call .+ on .+$/
        );
      }
    });

    test('reads the list once to a screen reader, not twice', async ({
      page,
    }) => {
      // The marquee needs two visual copies to loop seamlessly. The second is
      // aria-hidden AND renders spans rather than anchors, so there is nothing
      // focusable inside an aria-hidden subtree and no duplicate tel: link.
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/en');

      const runs = page.locator(`${ticker} .hotline-run`);
      await expect(runs).toHaveCount(2);
      await expect(runs.nth(1)).toHaveAttribute('aria-hidden', 'true');
      await expect(runs.nth(1).locator('a')).toHaveCount(0);
    });

    test('marquees only when the content actually overflows', async ({
      page,
    }) => {
      /*
       * Gated on measured overflow, not a breakpoint. A breakpoint is a guess
       * at the content width, and it guessed wrong in both directions, so the
       * old 1120px rule left a band where the row overflowed and sat still.
       *
       * ⚠️ **Run widths re-measured 2026-08-12.** One run is **1336px in
       * English and 1488px in Filipino**; this table was built against 1277px
       * and 1427px, which is why `fil @ 1440` expected a static row and got a
       * marquee. At 1488px the Filipino run genuinely overflows a 1440px
       * viewport by 48px — the component was right and the expectation was
       * stale.
       *
       * The static case for Filipino therefore has to be a viewport wider than
       * its content, and 1600 is the first round step that clears 1488. The
       * 1440 case is kept, flipped to `true`, so the pair still brackets the
       * boundary rather than only testing one side of it.
       */
      await page.emulateMedia({ reducedMotion: 'no-preference' });

      for (const [locale, width, animated] of [
        ['en', 390, true],
        ['en', 1120, true],
        ['en', 1440, false],
        // Filipino is the longer string, so it still marquees where English
        // has already gone static. Same rule, different content.
        ['fil', 1280, true],
        ['fil', 1440, true],
        ['fil', 1600, false],
      ] as const) {
        await page.setViewportSize({ width, height: 844 });
        await page.goto(`/${locale}`);
        await expect(page.locator(ticker)).toBeVisible();

        const label = `${locale} @ ${width}px`;
        await expect
          .poll(
            () =>
              page.evaluate(
                sel =>
                  document
                    .querySelector(`${sel} .hotline-viewport`)!
                    .getAttribute('data-marquee') === 'true',
                ticker
              ),
            { message: label }
          )
          .toBe(animated);

        const state = await page.evaluate(sel => {
          const track = document.querySelector(`${sel} .hotline-track`)!;
          const viewport = document.querySelector(`${sel} .hotline-viewport`)!;
          const echo = document.querySelector(`${sel} .hotline-echo`)!;
          return {
            animation: getComputedStyle(track).animationName,
            overflowX: getComputedStyle(viewport).overflowX,
            echoShown: getComputedStyle(echo).display !== 'none',
          };
        }, ticker);

        expect(state.animation === 'hotline-scroll', label).toBe(animated);
        expect(state.echoShown, label).toBe(animated);
        // Static means scrollable — a row of numbers you cannot reach is worse
        // than one that moves.
        expect(state.overflowX, label).toBe(animated ? 'hidden' : 'auto');
      }
    });

    test('pauses on hover and on keyboard focus (WCAG 2.2.2)', async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/en');

      const playState = () =>
        page.evaluate(
          sel =>
            getComputedStyle(document.querySelector(`${sel} .hotline-track`)!)
              .animationPlayState,
          ticker
        );

      /*
       * 🔴 Move the cursor OFF the bar before asserting it runs.
       *
       * This test used to assert `running` straight after `goto`, and failed:
       * the bar is the first thing on the page and occupies (0, 0, 390, 29),
       * while Playwright parks the cursor at (0,0) and never moves it. The
       * pointer was therefore inside `.hotline-viewport` from the first frame,
       * `:hover` matched, and the marquee was legitimately paused before the
       * test had done anything.
       *
       * The app was right and the assertion was wrong — pausing under the
       * pointer is exactly the WCAG 2.2.2 behaviour the rest of this test goes
       * on to verify. `(0, 400)` is the same off-bar position the test already
       * uses to check it resumes.
       */
      await page.mouse.move(0, 400);
      await expect.poll(playState).toBe('running');

      // `locator.hover()` cannot be used here: it waits for the element to be
      // stable, and a marquee entry is by definition never stable, so it spins
      // until the test times out. Moving the mouse to the bar's own centre is
      // the same gesture without the actionability check.
      const bar = await page.locator(ticker).boundingBox();
      expect(bar).not.toBeNull();
      await page.mouse.move(bar!.x + bar!.width / 2, bar!.y + bar!.height / 2);
      await expect.poll(playState).toBe('paused');

      await page.mouse.move(0, 400);
      await expect.poll(playState).toBe('running');

      await page.locator(`${ticker} a[href^="tel:"]`).first().focus();
      expect(await playState()).toBe('paused');
    });

    test('loops with no gap at any point in the cycle', async ({ page }) => {
      /*
       * The reported bug, and it was not the seam between the two runs — that
       * measured 0 all along. The viewport is a CENTRING flex container, which
       * it has to be to centre the static row, and centring a track twice the
       * viewport's width starts it at a negative offset: at 1200px the 2554px
       * track began at x=-677. Running 0 → -50% from there walked its right
       * edge to x=605 by the end of the cycle and left 595px of empty bar.
       *
       * Once per cycle, at every width — so a spot check at one moment would
       * have passed. This walks the whole 28s.
       */
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto('/en');

      // `data-marquee` is set by a ResizeObserver after hydration, so reading
      // it straight after `goto` is a race — it lost once here before this
      // wait was added, and would have gone on losing intermittently.
      await expect(page.locator('.hotline-viewport')).toHaveAttribute(
        'data-marquee',
        'true'
      );

      const worst = await page.evaluate(() => {
        const vp = document.querySelector('.hotline-viewport')!;
        const track = document.querySelector<HTMLElement>('.hotline-track')!;
        if (!vp.getAttribute('data-marquee')) return { skipped: true, gap: 0 };

        const runs = [...document.querySelectorAll('.hotline-run')];
        track.style.animationPlayState = 'paused';
        let gap = 0;

        for (let t = 0; t < 28; t += 0.25) {
          track.style.animationDelay = `-${t}s`;
          void track.getBoundingClientRect();
          const origin = vp.getBoundingClientRect().left;
          const spans = runs
            .filter(r => getComputedStyle(r).display !== 'none')
            .map(r => {
              const b = r.getBoundingClientRect();
              return [b.left - origin, b.right - origin] as const;
            })
            .sort((a, b) => a[0] - b[0]);

          let covered = 0;
          for (const [left, right] of spans) {
            if (left > covered) gap = Math.max(gap, left - covered);
            covered = Math.max(covered, right);
          }
          gap = Math.max(gap, vp.clientWidth - covered);
        }

        track.style.animationPlayState = '';
        track.style.animationDelay = '';
        return { skipped: false, gap: Math.round(gap) };
      });

      expect(worst.skipped).toBe(false);
      expect(worst.gap).toBe(0);
    });

    test('stops entirely under prefers-reduced-motion, and stays readable', async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/en');

      const state = await page.evaluate(sel => {
        const track = document.querySelector(`${sel} .hotline-track`)!;
        const viewport = document.querySelector(`${sel} .hotline-viewport`)!;
        return {
          animation: getComputedStyle(track).animationName,
          transform: getComputedStyle(track).transform,
          overflowX: getComputedStyle(viewport).overflowX,
          echoShown:
            getComputedStyle(document.querySelector(`${sel} .hotline-echo`)!)
              .display !== 'none',
        };
      }, ticker);

      expect(state.animation).toBe('none');
      expect(state.transform).toBe('none');
      // Not animated, so it has to be scrollable, and the echo is pointless.
      expect(state.overflowX).toBe('auto');
      expect(state.echoShown).toBe(false);
      await expect(
        page.locator(`${ticker} a[href^="tel:"]`).first()
      ).toBeVisible();
    });
  });

  test('an unknown path is a real 404, not a soft 200', async ({ page }) => {
    const response = await page.goto('/en/does-not-exist');
    expect(response?.status()).toBe(404);
  });

  test('sitemap and robots are generated', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain('/en');

    const robots = await request.get('/robots.txt');
    expect(robots.status()).toBe(200);
  });

  test('the footer columns are equal and the cost pill hugs its text', async ({
    page,
  }, testInfo) => {
    // Two requirements that pull against each other, asserted together because
    // that is the only way to see the trade:
    //
    // · Equal columns — no track spans two. 1 below `sm`, 2 at `sm`, 4 at `xl`.
    // · The cost pill SHRINKS TO ITS TEXT (`w-fit`). It used to be `block` and
    //   exactly button-width; `--text-cost` caps at 1.125rem, so once the
    //   column is wider than the line needs, a full-width pill left a visible
    //   run of empty ground after the "₱0".
    //
    // `--text-cost` divides the column's own inline size by the measured
    // em-width of the longer (Filipino) string, so the rendered size is the
    // same in both locales and Filipino is what it was sized for: "Halaga sa
    // Mamamayan ng Tandag = ₱0" is 18.8em against the English 16.5em.
    //
    // The four-column step is at `xl` rather than `lg` because a quarter of the
    // measure at a 1024px viewport is ~181px, which drives the type to 7.8px.
    // It is still under 12px at 1280 and 1440 — recorded in the attachment
    // below rather than asserted away, because that is arithmetic, not a bug:
    // four equal columns of an 1140px-capped measure cannot be wider than
    // 261px, and 261px of this string is 11.9px of type.
    const measured: Record<string, unknown> = {};
    const small: string[] = [];

    for (const locale of ['en', 'fil']) {
      for (const width of [320, 390, 768, 1024, 1280, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}`);

        const line = await page.evaluate(() => {
          const pill = document.querySelector('footer .text-cost')!;
          const column = pill.parentElement!;
          const button = column.querySelector('ul a')!;
          const columns = Array.from(column.parentElement!.children).map(c =>
            Math.round(c.getBoundingClientRect().width)
          );
          const cs = getComputedStyle(pill);
          const range = document.createRange();
          range.selectNodeContents(pill);
          return {
            fontSizePx: Math.round(parseFloat(cs.fontSize) * 100) / 100,
            columnPx: Math.round(column.getBoundingClientRect().width),
            pillPx: Math.round(pill.getBoundingClientRect().width),
            buttonPx: Math.round(button.getBoundingClientRect().width),
            columnsEqual: new Set(columns).size === 1,
            // One client rect per rendered line of text.
            lines: range.getClientRects().length,
          };
        });

        measured[`${locale} @ ${width}`] = line;
        expect(line.lines, `${locale} @ ${width}`).toBe(1);
        // The pill hugs its text: never wider than the column, and never
        // wider than the buttons it sits above.
        expect(line.pillPx, `${locale} @ ${width}`).toBeLessThanOrEqual(
          line.columnPx
        );
        expect(line.pillPx, `${locale} @ ${width}`).toBeLessThanOrEqual(
          line.buttonPx
        );
        // The buttons are still full-column-width — only the pill changed.
        expect(line.buttonPx, `${locale} @ ${width}`).toBe(line.columnPx);
        // The point of requirement 4: no column is wider than any other.
        expect(line.columnsEqual, `${locale} @ ${width}`).toBe(true);

        // The key only — an exact px assertion would be measuring the font
        // rasteriser, which differs by a hundredth between machines.
        if (line.fontSizePx < 12) small.push(`${locale} @ ${width}`);
      }
    }

    await testInfo.attach('cost line: pill vs button vs column', {
      body: JSON.stringify({ measured, under12px: small }, null, 2),
      contentType: 'application/json',
    });

    // Not a failure — a ratchet. These are the widths where equal columns cost
    // legibility; the list must not grow without someone deciding it should.
    expect(small.sort()).toEqual([
      'en @ 1280',
      'en @ 1440',
      'en @ 320',
      'fil @ 1280',
      'fil @ 1440',
      'fil @ 320',
    ]);
  });

  test.describe('no horizontal scroll', () => {
    // Both locales: Filipino runs longer on every short label — the "Soon"
    // badge is nearly twice the width and the footer cost line is 14% wider —
    // so an English-only sweep would miss the case that actually overflows.
    for (const locale of ['en', 'fil']) {
      for (const width of [320, 360, 390, 768, 1024, 1280]) {
        test(`at ${width}px (${locale})`, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(`/${locale}`);

          const overflows = await page.evaluate(
            () =>
              document.documentElement.scrollWidth >
              document.documentElement.clientWidth
          );
          expect(overflows).toBe(false);
        });
      }
    }
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('every section is still visible and the search still submits', async ({
      page,
    }) => {
      await page.goto('/en');

      // The design hid all of these at opacity:0 and revealed them with JS, so
      // a blocked script left everything below the stat band invisible.
      await expect(page.locator('#services')).toBeVisible();
      await expect(page.locator('#history')).toBeVisible();
      await expect(page.locator('#emergency')).toBeVisible();
      await expect(page.locator('#getting-here')).toBeVisible();
      await expect(page.locator('#contact')).toBeVisible();

      // The ticker is server-rendered and CSS-driven end to end — its numbers
      // are dialable with the script blocked.
      await expect(
        page
          .locator('[aria-label="Emergency hotlines"] a[href^="tel:"]')
          .first()
      ).toBeVisible();

      // Submit by keyboard: with no JS there is nothing to settle the layout,
      // and a click races the font swap.
      const field = page.getByLabel('Search services');
      await field.fill('tax');
      await field.press('Enter');
      await expect(page).toHaveURL(/\/search\?q=tax/);
    });
  });
});
