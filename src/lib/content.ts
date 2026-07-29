import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cacheLife, cacheTag } from 'next/cache';
import yaml from 'js-yaml';
import { z } from 'zod';
import type { Locale } from '@/i18n/routing';

/**
 * The ONLY module that touches the filesystem.
 *
 * Components receive parsed, typed, locale-resolved data — never a path, never
 * a raw YAML node. Adding a service card, a timeline entry, a hotline or an
 * advisory is a change under content/, not a code change. See
 * docs/coding-standards.md, "Content pipeline".
 */

const CONTENT_ROOT = path.join(process.cwd(), 'content');

/* -------------------------------------------------------------------------- */
/* Schemas                                                                    */
/* -------------------------------------------------------------------------- */

/** English is required; Filipino is optional and falls back visibly. */
const localized = z.object({
  en: z.string().min(1),
  fil: z.string().min(1).optional(),
});
type Localized = z.infer<typeof localized>;

/** Every off-page destination is `coming-soon` until its route is built. */
const linkStatus = z.enum(['live', 'coming-soon']);

const sourceRef = z.object({
  label: localized,
  url: z.url(),
  /** Set when the primary record was reached through a tertiary source. */
  via: z.string().optional(),
});

const advisorySchema = z.object({
  advisory: z
    .object({
      /** Dismissal is persisted against this id, so a NEW advisory reappears. */
      id: z.string().min(1),
      body: localized,
      updatedAt: z.iso.date(),
    })
    .nullable(),
});

const statsSchema = z.object({
  stats: z
    .array(
      z.object({
        key: z.enum(['population', 'households', 'barangays', 'landArea']),
        caption: localized,
        source: sourceRef,
      })
    )
    .length(4),
});

const servicesSchema = z.object({
  featured: z.object({
    title: localized,
    body: localized,
    href: z.string().startsWith('/'),
    status: linkStatus,
  }),
  cards: z
    .array(
      z.object({
        title: localized,
        meta: localized,
        href: z.string().startsWith('/'),
        status: linkStatus,
      })
    )
    .min(1),
});

const historySchema = z.object({
  etymology: z
    .array(
      z.object({
        word: z.string().min(1),
        gloss: localized,
        body: localized,
      })
    )
    .min(1),
  timeline: z
    .array(
      z.object({
        period: localized,
        title: localized,
        body: localized,
        milestone: z.boolean().default(false),
      })
    )
    .min(1),
});

const gettingHereSchema = z.object({
  cards: z
    .array(
      z.object({
        kicker: localized,
        title: localized,
        body: localized,
        surface: z.enum(['default', 'inverse']).default('default'),
      })
    )
    .min(1),
});

/**
 * A hotline's provenance. `url` is optional because not every number has a
 * public posting behind it — some are supplied by residents. What is NOT
 * optional is saying which, so the reader can weigh it.
 */
const hotlineSource = z.object({
  label: localized,
  url: z.url().optional(),
});

const emergencySchema = z.object({
  /** Shown above the list. Required — published numbers always carry a date. */
  provenance: z.object({
    note: localized,
    lastCheckedAt: z.iso.date(),
  }),
  hotlines: z.array(
    z.object({
      organisation: localized,
      role: localized,
      // Digits and spaces only, so a typo'd number cannot reach a `tel:` href.
      numbers: z.array(z.string().regex(/^\d[\d ]{2,}$/)).min(1),
      source: hotlineSource,
      emphasis: z.boolean().default(false),
    })
  ),
  /** Offices whose numbers we are still sourcing. Named, not guessed at. */
  pendingOffices: z.array(localized),
  preparedness: z.array(localized).min(1),
});

/**
 * The /sources page. Editorial copy ONLY — the citation list is derived from
 * the `source` blocks above, never restated here, so a figure and its entry on
 * the sources page cannot drift apart.
 */
const sourcesSchema = z.object({
  lastReviewedAt: z.iso.date(),
  intro: localized,
  caveats: z.array(localized).min(1),
});

/* -------------------------------------------------------------------------- */
/* Locale resolution                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Resolves one Localized value, reporting whether it fell back to English.
 * The fallback is deliberate — and surfaced to the reader by a banner, never
 * silent.
 */
export function pickLocalized(
  value: Localized,
  locale: Locale
): { text: string; fellBack: boolean } {
  if (locale === 'en') return { text: value.en, fellBack: false };
  if (value.fil) return { text: value.fil, fellBack: false };
  return { text: value.en, fellBack: true };
}

/** Accumulates the fallback flag across a whole page's worth of fields. */
class LocaleResolver {
  private fellBack = false;

  constructor(private readonly locale: Locale) {}

  text(value: Localized): string {
    const { text, fellBack } = pickLocalized(value, this.locale);
    if (fellBack) this.fellBack = true;
    return text;
  }

  get hasFallback(): boolean {
    return this.fellBack;
  }
}

/* -------------------------------------------------------------------------- */
/* Reading                                                                    */
/* -------------------------------------------------------------------------- */

async function readFile_<T>(rel: string, schema: z.ZodType<T>): Promise<T> {
  const file = path.join(CONTENT_ROOT, rel);
  const parsed = yaml.load(await readFile(file, 'utf8'));
  const result = schema.safeParse(parsed);

  if (!result.success) {
    throw new Error(
      `content/${rel} is invalid:\n${z.prettifyError(result.error)}`
    );
  }
  return result.data;
}

async function readSection<T>(name: string, schema: z.ZodType<T>): Promise<T> {
  const file = path.join(CONTENT_ROOT, 'home', `${name}.yaml`);
  const parsed = yaml.load(await readFile(file, 'utf8'));
  const result = schema.safeParse(parsed);

  if (!result.success) {
    throw new Error(
      `content/home/${name}.yaml is invalid:\n${z.prettifyError(result.error)}`
    );
  }
  return result.data;
}

/* -------------------------------------------------------------------------- */
/* Public shape                                                               */
/* -------------------------------------------------------------------------- */

export type HomeSource = { label: string; url: string; via?: string };
export type HomeAdvisory = { id: string; body: string; updatedAt: string };
export type HomeStat = {
  key: 'population' | 'households' | 'barangays' | 'landArea';
  caption: string;
  source: HomeSource;
};
export type HomeServiceLink = {
  title: string;
  meta: string;
  href: string;
  status: 'live' | 'coming-soon';
};
export type HomeFeaturedService = Omit<HomeServiceLink, 'meta'> & {
  body: string;
};
export type HomeEtymology = { word: string; gloss: string; body: string };
export type HomeTimelineEntry = {
  period: string;
  title: string;
  body: string;
  milestone: boolean;
};
export type HomeTravelCard = {
  kicker: string;
  title: string;
  body: string;
  surface: 'default' | 'inverse';
};
export type HomeHotlineSource = { label: string; url?: string };
export type HomeHotline = {
  organisation: string;
  role: string;
  numbers: string[];
  source: HomeHotlineSource;
  emphasis: boolean;
};
export type HomeProvenance = { note: string; lastCheckedAt: string };

export type HomeContent = {
  advisory: HomeAdvisory | null;
  stats: HomeStat[];
  services: { featured: HomeFeaturedService; cards: HomeServiceLink[] };
  history: { etymology: HomeEtymology[]; timeline: HomeTimelineEntry[] };
  gettingHere: HomeTravelCard[];
  emergency: {
    provenance: HomeProvenance;
    hotlines: HomeHotline[];
    pendingOffices: string[];
    preparedness: string[];
  };
  /** True when any field on the page fell back to English. Drives the banner. */
  hasFallback: boolean;
};

/**
 * Everything the landing page renders, in one cached read per locale.
 *
 * `cacheComponents` is on, so nothing is cached implicitly — this opts in
 * explicitly. Content ships with the build, so it never goes stale on its own;
 * `revalidateTag('home-content')` invalidates it.
 */
export async function getHomeContent(locale: Locale): Promise<HomeContent> {
  'use cache';
  cacheLife('max');
  cacheTag('home-content');

  const [advisory, stats, services, history, gettingHere, emergency] =
    await Promise.all([
      readSection('advisory', advisorySchema),
      readSection('stats', statsSchema),
      readSection('services', servicesSchema),
      readSection('history', historySchema),
      readSection('getting-here', gettingHereSchema),
      readSection('emergency', emergencySchema),
    ]);

  const r = new LocaleResolver(locale);
  const source = (s: z.infer<typeof sourceRef>): HomeSource => ({
    label: r.text(s.label),
    url: s.url,
    ...(s.via ? { via: s.via } : {}),
  });

  return {
    advisory: advisory.advisory
      ? {
          id: advisory.advisory.id,
          body: r.text(advisory.advisory.body),
          updatedAt: advisory.advisory.updatedAt,
        }
      : null,
    stats: stats.stats.map(s => ({
      key: s.key,
      caption: r.text(s.caption),
      source: source(s.source),
    })),
    services: {
      featured: {
        title: r.text(services.featured.title),
        body: r.text(services.featured.body),
        href: services.featured.href,
        status: services.featured.status,
      },
      cards: services.cards.map(c => ({
        title: r.text(c.title),
        meta: r.text(c.meta),
        href: c.href,
        status: c.status,
      })),
    },
    history: {
      etymology: history.etymology.map(e => ({
        word: e.word,
        gloss: r.text(e.gloss),
        body: r.text(e.body),
      })),
      timeline: history.timeline.map(t => ({
        period: r.text(t.period),
        title: r.text(t.title),
        body: r.text(t.body),
        milestone: t.milestone,
      })),
    },
    gettingHere: gettingHere.cards.map(c => ({
      kicker: r.text(c.kicker),
      title: r.text(c.title),
      body: r.text(c.body),
      surface: c.surface,
    })),
    emergency: {
      provenance: {
        note: r.text(emergency.provenance.note),
        lastCheckedAt: emergency.provenance.lastCheckedAt,
      },
      hotlines: emergency.hotlines.map(h => ({
        organisation: r.text(h.organisation),
        role: r.text(h.role),
        numbers: h.numbers,
        source: {
          label: r.text(h.source.label),
          ...(h.source.url ? { url: h.source.url } : {}),
        },
        emphasis: h.emphasis,
      })),
      pendingOffices: emergency.pendingOffices.map(o => r.text(o)),
      preparedness: emergency.preparedness.map(p => r.text(p)),
    },
    hasFallback: r.hasFallback,
  };
}

/* -------------------------------------------------------------------------- */
/* Sources                                                                    */
/* -------------------------------------------------------------------------- */

/** What a citation backs, as a reference the page resolves to a label. */
export type SourceUsage =
  | { kind: 'stat'; key: HomeStat['key'] }
  | { kind: 'hotline'; organisation: string };

export type SourceCitation = {
  label: string;
  url?: string;
  /** Set when the primary record was reached through a tertiary source. */
  via?: string;
  usedBy: SourceUsage[];
};

export type SourcesContent = {
  lastReviewedAt: string;
  intro: string;
  caveats: string[];
  citations: SourceCitation[];
  hasFallback: boolean;
};

/**
 * Every citation on the site, in one list.
 *
 * **Derived, never restated.** The list is built from the same `source` blocks
 * the figures themselves render, so adding a source to a stat or a hotline puts
 * it on this page with no second edit — and there is no way for the two to
 * disagree. Only the intro, the review date and the caveats come from
 * `content/sources.yaml`.
 *
 * Deduped on `url ?? label`, because one record commonly backs several figures;
 * what it backs is collected into `usedBy` rather than repeated as its own row.
 */
/**
 * Groups raw citations into the list the page renders.
 *
 * Pure and exported so the grouping rule can be unit-tested: `getSources`
 * carries `'use cache'`, which needs the Next runtime and cannot be called from
 * Vitest — and a cached result in a dev server is exactly what hid the bug this
 * function's key was changed to fix.
 */
export function collectCitations(
  entries: { label: string; url?: string; via?: string; usage: SourceUsage }[]
): SourceCitation[] {
  const byKey = new Map<string, SourceCitation>();

  for (const entry of entries) {
    /*
     * Keyed on the LABEL, not the URL.
     *
     * Keying on the URL looked right and rendered wrong: the barangay
     * classification and the land area both cite the same Wikipedia article
     * under different labels, so they merged into one row whose heading said
     * "barangay classification" while also claiming to back the land area. The
     * label is what a reader sees, so the label decides identity; the URL is in
     * the key only to separate two sources that happen to share a name.
     */
    const key = `${entry.label} ${entry.url ?? ''}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.usedBy.push(entry.usage);
      continue;
    }
    byKey.set(key, {
      label: entry.label,
      ...(entry.url ? { url: entry.url } : {}),
      ...(entry.via ? { via: entry.via } : {}),
      usedBy: [entry.usage],
    });
  }

  // Cited records first, contributor-supplied claims last: a reader scanning
  // this page is looking for what can be checked.
  return [...byKey.values()].sort((a, b) =>
    a.url === b.url ? 0 : a.url ? -1 : 1
  );
}

export async function getSources(locale: Locale): Promise<SourcesContent> {
  'use cache';
  cacheLife('max');
  cacheTag('home-content');

  const [page, stats, emergency] = await Promise.all([
    readFile_('sources.yaml', sourcesSchema),
    readSection('stats', statsSchema),
    readSection('emergency', emergencySchema),
  ]);

  const r = new LocaleResolver(locale);

  const citations = collectCitations([
    ...stats.stats.map(stat => ({
      label: r.text(stat.source.label),
      url: stat.source.url,
      ...(stat.source.via ? { via: stat.source.via } : {}),
      usage: { kind: 'stat' as const, key: stat.key },
    })),
    ...emergency.hotlines.map(hotline => ({
      label: r.text(hotline.source.label),
      ...(hotline.source.url ? { url: hotline.source.url } : {}),
      usage: {
        kind: 'hotline' as const,
        organisation: r.text(hotline.organisation),
      },
    })),
  ]);

  return {
    lastReviewedAt: page.lastReviewedAt,
    intro: r.text(page.intro),
    caveats: page.caveats.map(c => r.text(c)),
    citations,
    hasFallback: r.hasFallback,
  };
}

/** Exported for unit tests — not for component use. */
export const schemas = {
  sources: sourcesSchema,
  advisory: advisorySchema,
  stats: statsSchema,
  services: servicesSchema,
  history: historySchema,
  gettingHere: gettingHereSchema,
  emergency: emergencySchema,
};
