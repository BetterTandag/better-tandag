import { z } from 'zod';
import rawConfig from '../../config/lgu.config.json';

/**
 * The ONLY module that reads config/lgu.config.json.
 *
 * Nothing about Tandag as an entity — its name, coordinates, domain, brand
 * colour, figures, or contacts — is hardcoded in a component. It comes from
 * here. That is what makes the portal re-pointable at another LGU by editing
 * one file. See docs/coding-standards.md, "Configuration & environment".
 */

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'must be a 6-digit hex');

const portalSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1),
  /**
   * The visible mark, in two lines: a de-emphasised `lead` over a larger `main`
   * that renders in caps. Stored split rather than derived from `name` by
   * slicing off `lgu.shortName` — that trick works only while the portal is
   * named "Better" + the city, and it would fail silently, mid-header, the day
   * it stopped being true. `main` is stored in sentence case; the uppercase is
   * a CSS transform, so the accessible text stays "Tandag".
   */
  wordmark: z.object({ lead: z.string().min(1), main: z.string().min(1) }),
  domain: z.url(),
  brandColor: hexColor,
  accentColor: hexColor,
  tagline: z.string().min(1),
  independent: z.boolean(),
  /** Where the code lives. Per-LGU: the org name is the LGU's, not shared. */
  repository: z.url(),
  /** The programme this portal belongs to, for the footer attribution. */
  network: z.object({ name: z.string().min(1), url: z.url() }),
});

const lguSchema = z.object({
  officialName: z.string().min(1),
  shortName: z.string().min(1),
  province: z.string().min(1),
  region: z.string().min(1),
  district: z.string().min(1),
  psgc: z.string().regex(/^\d{9,10}$/),
  postalCode: z.string().regex(/^\d{4}$/),
  incomeClass: z.string().min(1),
  cityhoodDate: z.iso.date(),
  charterDay: z.string().regex(/^\d{2}-\d{2}$/),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  landAreaKm2: z.number().positive(),
  provinceAreaSharePercent: z.number().positive().max(100),
  barangayCount: z.number().int().positive(),
  population: z.number().int().positive(),
  households: z.number().int().positive(),
  censusYear: z.number().int().min(1900).max(2100),
  annualRainfallMm: z.number().positive(),
});

const contactSchema = z.object({
  email: z.email(),
  cityHall: z.object({
    name: z.string().min(1),
    locality: z.string().min(1),
    /** Street address. Required — the contact card publishes it verbatim. */
    address: z.string().min(1),
    /** The map pin for `address`. A real destination, not a name search. */
    mapUrl: z.url(),
    /**
     * `placeholder` means the phone and email below are INVENTED and must never
     * be presented as dialable or mailable. The contact section reads this and
     * renders them as marked non-links; flipping it to `verified` turns them
     * into `tel:`/`mailto:` links with no code change. There is no third state
     * on purpose — "we are not sure" is `placeholder`.
     *
     * It does NOT govern `address`/`mapUrl`. Those are known good and are a
     * link either way — which is why they are separate fields rather than more
     * values behind the same flag.
     */
    status: z.enum(['verified', 'placeholder']),
    /** Developer note. Never rendered — user-facing copy lives in messages/. */
    note: z.string().optional(),
    phone: z.string().min(1),
    email: z.email(),
  }),
  /** The national line is the one number we publish without a local source. */
  nationalEmergencyLine: z.string().min(3),
});

const socialsSchema = z.object({
  cityGovernmentFacebook: z.url(),
  cdrrmoFacebook: z.url(),
});

const sourcesSchema = z.object({
  officialPortal: z.object({
    url: z.url(),
    status: z.enum(['live', 'unreachable']),
    note: z.string().optional(),
  }),
  psa: z.url(),
  wikipedia: z.url(),
});

const lguConfigSchema = z.object({
  portal: portalSchema,
  lgu: lguSchema,
  contact: contactSchema,
  socials: socialsSchema,
  sources: sourcesSchema,
});

export type LguConfig = z.infer<typeof lguConfigSchema>;

/**
 * Validated at module load, so a malformed config fails the build loudly
 * rather than rendering a page with a missing city name.
 */
export const lguConfig: LguConfig = lguConfigSchema.parse(rawConfig);

/** Absolute canonical URL for a locale-prefixed path. */
export function absoluteUrl(path: string): string {
  const base = lguConfig.portal.domain.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
