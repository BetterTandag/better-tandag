/**
 * Builds a dialable `tel:` href from a published number.
 *
 * Content stores numbers the way a reader recognises them ("0907 299 3793"),
 * which is not what a dialer wants. Spaces go, a leading 0 becomes the +63
 * country code, and a short national line such as 911 passes straight through.
 *
 * Shared by the hotline list and the promoted emergency band, so both produce
 * the identical href for the identical number.
 */
export function telHref(number: string): string {
  const digits = number.replace(/\s+/g, '');
  return digits.startsWith('0') ? `tel:+63${digits.slice(1)}` : `tel:${digits}`;
}
