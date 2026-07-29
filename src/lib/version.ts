import pkg from '../../package.json';

/**
 * The portal version, rendered in the footer.
 *
 * `package.json` is the single source of truth — same pattern as
 * `lgu-config.ts` reading `config/lgu.config.json`. Nothing else in the app
 * should hardcode a version string.
 *
 * How it increments is a documented project rule; see the "Versioning" section
 * in CLAUDE.md. In short: MAJOR = the IA changed or a published URL broke,
 * MINOR = a page/route/section shipped, PATCH = content, copy, styling, a11y
 * or dependency work.
 */
export const PORTAL_VERSION: string = pkg.version;
