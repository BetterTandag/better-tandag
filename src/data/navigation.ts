/**
 * Header, mobile and footer link structure.
 *
 * `messageKey` indexes `nav.*` in messages/{en,fil}.json — no user-facing string
 * lives here. `status` is `coming-soon` until the route exists; those items
 * render as non-links with an accessible hint rather than as links that 404.
 */

import { lguConfig } from '@/lib/lgu-config';

export type NavStatus = 'live' | 'coming-soon';

export type NavItem = {
  messageKey: string;
  href: string;
  status: NavStatus;
  /**
   * A submenu. Present on a parent that groups routes; absent on a leaf.
   *
   * A parent is rendered as a disclosure `<button>` rather than a link even
   * when its own `href` is live — one control cannot both navigate and reveal.
   * `href` is kept regardless so the group's own index page is reachable as the
   * first child, and so nothing is lost if a parent is ever flattened back to a
   * leaf. A parent whose children are ALL `coming-soon` still opens: seeing
   * what is planned is the point.
   */
  children?: NavItem[];
};

/** In-page anchors. These always work — the sections are on this page. */
export type AnchorItem = {
  label: string;
  href: `#${string}`;
};

/**
 * The one navigation tree. Header, mobile sheet and the search index all read
 * it, so a destination cannot appear in one and be missing from another —
 * which is what the old PRIMARY_NAV / MOBILE_NAV split kept producing.
 *
 * The shape follows the portal's planned route map: `/services` with its
 * categories, `/government` with officials / transparency / departments, and
 * `/city-profile` for what the city IS. Everything off this page is
 * `coming-soon`; the three in-page anchors (`#history`, `#emergency`,
 * `#contact`) are live because their sections are right there.
 *
 * Five top-level items, not six. Filipino runs 15-25% longer on every one of
 * these labels, and the desktop row has to hold the logo, the nav and three
 * controls inside an 80% measure at 1024px. `news`, `tourism` and `barangays`
 * used to sit at the top level; News keeps its footer entry, Tourism moved
 * under City profile, and Barangays is folded into the city profile page the
 * route map says already contains all 21 of them.
 */
export const PRIMARY_NAV: NavItem[] = [
  {
    messageKey: 'services',
    href: '/services',
    status: 'coming-soon',
    children: [
      { messageKey: 'allServices', href: '/services', status: 'coming-soon' },
      {
        messageKey: 'business',
        href: '/services/business',
        status: 'coming-soon',
      },
      {
        messageKey: 'socialWelfare',
        href: '/services/social-welfare',
        status: 'coming-soon',
      },
      { messageKey: 'health', href: '/services/health', status: 'coming-soon' },
    ],
  },
  {
    messageKey: 'government',
    href: '/government',
    status: 'coming-soon',
    children: [
      {
        messageKey: 'officials',
        href: '/government/officials',
        status: 'coming-soon',
      },
      {
        messageKey: 'transparency',
        href: '/government/transparency',
        status: 'coming-soon',
      },
      {
        messageKey: 'departments',
        href: '/government/departments',
        status: 'coming-soon',
      },
    ],
  },
  {
    messageKey: 'cityProfile',
    href: '/city-profile',
    status: 'coming-soon',
    children: [
      {
        messageKey: 'cityAtAGlance',
        href: '/city-profile',
        status: 'coming-soon',
      },
      { messageKey: 'tourism', href: '/tourism', status: 'coming-soon' },
      // Live, and deliberately so: a group whose every child is `coming-soon`
      // is easy to write off as decorative, and this one proves the pattern
      // works end to end.
      { messageKey: 'history', href: '#history', status: 'live' },
    ],
  },
  { messageKey: 'emergency', href: '#emergency', status: 'live' },
  { messageKey: 'contact', href: '#contact', status: 'live' },
];

/** Parents and children in one flat list, for the search index. */
export const NAV_INDEX: NavItem[] = PRIMARY_NAV.flatMap(item => [
  item,
  ...(item.children ?? []),
]);

export const FOOTER_PAGES: NavItem[] = [
  { messageKey: 'services', href: '/services', status: 'coming-soon' },
  {
    messageKey: 'transparency',
    href: '/government/transparency',
    status: 'coming-soon',
  },
  {
    messageKey: 'officials',
    href: '/government/officials',
    status: 'coming-soon',
  },
  { messageKey: 'news', href: '/news', status: 'coming-soon' },
  { messageKey: 'tourism', href: '/tourism', status: 'coming-soon' },
  // Live, and the only entry in this column that is. The consolidated citation
  // list had no home after the footer's "Sources on this page" block was
  // dropped; a transparency portal needs a reachable one.
  { messageKey: 'sources', href: '/sources', status: 'live' },
];

/**
 * Off-site destinations, for the footer's "Resources" column.
 *
 * A separate type from `NavItem` because nothing here is routable: no locale
 * prefix, no `coming-soon` route that will one day exist, and `messageKey`
 * indexes `resources.*` rather than `nav.*`. `href: null` means "the body
 * exists but its site does not" — rendered as a non-link, never as a guess.
 */
export type ExternalNavItem = {
  messageKey: string;
  href: string | null;
};

export const FOOTER_RESOURCES: ExternalNavItem[] = [
  { messageKey: 'openData', href: 'https://data.gov.ph' },
  { messageKey: 'foi', href: 'https://www.foi.gov.ph/' },
  // Tandag is a CITY, so its legislature is the Sangguniang Panlungsod. The
  // list this column was adapted from says "Sangguniang Bayan" because Cainta
  // is a municipality — copying that across would have named the wrong body.
  // No SP site is known (tandag.gov.ph does not resolve), so it ships as a
  // non-link rather than an invented URL.
  { messageKey: 'sangguniangPanlungsod', href: null },
  // The City Government's Facebook page — in practice the only channel that
  // does resolve. The URL comes from the config, not from a literal here:
  // there is exactly one place that knows which LGU this portal is.
  {
    messageKey: 'lguFacebook',
    href: lguConfig.socials.cityGovernmentFacebook,
  },
  { messageKey: 'blgf', href: 'https://blgf.gov.ph/' },
  { messageKey: 'cmci', href: 'https://cmci.dti.gov.ph/' },
  { messageKey: 'philgeps', href: 'https://www.philgeps.gov.ph/' },
  { messageKey: 'govph', href: 'https://www.gov.ph/' },
];

/**
 * The numbered in-page sections, in PAGE ORDER. Also the section half of the
 * search index, so the order here is what a reader sees in results.
 *
 * Emergency is 03 and Getting here is 04 — the two were swapped so the numbers
 * needed in a storm come before the travel guide. The eyebrow strings in
 * messages/{en,fil}.json carry the same numbers and were swapped with them.
 */
export const PAGE_SECTIONS = [
  { anchor: '#services', messageNamespace: 'services' },
  { anchor: '#history', messageNamespace: 'history' },
  { anchor: '#emergency', messageNamespace: 'emergency' },
  { anchor: '#getting-here', messageNamespace: 'gettingHere' },
  { anchor: '#contact', messageNamespace: 'contact' },
] as const;
