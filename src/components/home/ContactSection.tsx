import { AlertTriangle, ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { LucideIcon } from 'lucide-react';
import { lguConfig } from '@/lib/lgu-config';
import { telHref } from '@/lib/tel';
import { Logo } from '@/components/ui/Logo';
import { ContactCard } from './ContactCard';

/**
 * "Get in touch" — how to reach City Hall.
 *
 * The information architecture is ported from another portal in the same
 * programme (BetterGeneralTrias, a separate project): a full-bleed band on a
 * deep gradient with two faint decorative circles, an accent eyebrow over an h2
 * and a short accent rule, a "more" link top-right, and three cards — phone,
 * email, address. None of the CODE is: that one is a Vite SPA with React
 * Router, i18next and its own greens hardcoded in a `style` attribute.
 *
 * ## It is the last section on the page
 *
 * The Contribute panel that used to follow it is gone — the volunteer ask now
 * lives only in the footer column of the same name, which is where a closing
 * call to action belongs on a reference document. Contact is 05 and last, so a
 * resident looking for a number reaches it without scrolling past an ask.
 *
 * `contact-slab` runs bright at the top-left because it once met the flat deep
 * navy of the emergency slab directly. Getting here sits between them now, so
 * the gradient is doing less work than it was — but it still gives the footer's
 * near-black a lighter edge to sit against, which is the other half of the job.
 * See the utility in globals.css.
 *
 * ## Nothing here is a working contact yet
 *
 * `contact.cityHall.status` in config/lgu.config.json is `placeholder`: the
 * switchboard number and the enquiries address are invented, and deliberately
 * unusable (`000-0000` is not a dialable subscriber number, `.invalid` can
 * never resolve). While that flag is set they render as non-links under a
 * stated notice, the same way the hotline list states its provenance above the
 * numbers rather than in a footnote. Flipping the flag to `verified` turns them
 * into `tel:` and `mailto:` links with no code change.
 *
 * The address card is the exception, and is now a real address behind a real
 * pin — `contact.cityHall.address` and `.mapUrl`, both supplied by the project
 * owner. It was previously City Hall's name behind a map SEARCH, precisely
 * because the street address was unknown; that hedge is no longer needed. The
 * `status` flag deliberately does not gate it: the phone and email are invented
 * and the address is not, and collapsing those two facts into one flag is how a
 * good value ends up hidden behind a caveat about a different one.
 */
export async function ContactSection() {
  const [t, tCommon] = await Promise.all([
    getTranslations('contact'),
    getTranslations('common'),
  ]);

  const { cityHall } = lguConfig.contact;
  const pending = cityHall.status === 'placeholder';

  const cards: {
    icon: LucideIcon;
    label: string;
    value: string;
    note: string;
    href: string | null;
    external?: boolean;
  }[] = [
    {
      icon: Phone,
      label: t('phoneLabel'),
      value: cityHall.phone,
      note: pending ? t('placeholderNote') : t('phoneHours'),
      href: pending ? null : telHref(cityHall.phone),
    },
    {
      icon: Mail,
      label: t('emailLabel'),
      value: cityHall.email,
      note: pending ? t('placeholderNote') : t('emailResponse'),
      href: pending ? null : `mailto:${cityHall.email}`,
    },
    {
      icon: MapPin,
      label: t('addressLabel'),
      value: cityHall.address,
      // The office name moves to the note now that the street address is the
      // value — the card answers "where is it", and "Tandag City Hall" is the
      // thing at that address rather than the address itself.
      note: `${cityHall.name} · ${t('addressNote')}`,
      href: cityHall.mapUrl,
      external: true,
    },
  ];

  return (
    <section
      id="contact"
      data-surface="inverse"
      aria-labelledby="contact-heading"
      className="reveal-on-scroll contact-slab relative mt-16 overflow-hidden text-ink sm:mt-20"
    >
      {/*
        The mark as a silhouette, replacing the two faint discs this section
        carried over from the reference portal. Texture, not content — `Logo`
        is `aria-hidden` by construction and the utility adds
        `pointer-events-none`.

        It needs no colour of its own: this slab is `data-surface="inverse"`,
        where `--mark-land` and `--mark-sun` both already resolve to white, so
        the two-tone mark flattens to a single silhouette on its own. Opacity is
        the only thing set here, and it matches the 5% the discs used.
      */}
      <Logo idPrefix="contact-mark" className="contact-mark opacity-5" />

      <div className="relative page-measure py-14 sm:py-18">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-2xs font-semibold tracking-label text-ink-accent uppercase">
              {t('eyebrow')}
            </p>
            <h2
              id="contact-heading"
              className="font-display text-section font-bold text-balance"
            >
              {t('heading')}
            </h2>
            {/* The reference's short accent rule under the title. Purely a
                flourish, so it is out of the accessibility tree. */}
            <div
              aria-hidden="true"
              className="mt-3 h-1 w-12 rounded-full bg-accent-400"
            />
          </div>
          {/*
            The reference's "view all" goes to its departments index. We have no
            departments route, and a second dead affordance on a page that
            already carries several would be the wrong answer — so this points
            at the hotline list one section up. It is live, it is on this page,
            and it is genuinely the next thing a reader who wants a number wants.
          */}
          <a
            href="#emergency"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-semibold text-ink-link hover:text-ink-link-hover"
          >
            {t('viewHotlines')}
            <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
          </a>
        </div>

        {pending ? (
          // Same shape as the emergency section's provenance box: the caveat
          // sits ABOVE the values, because a reader deciding whether to trust a
          // number needs it before they read one, not after.
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-accent-400 bg-surface-raised px-4 py-3.5">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 size-4.5 shrink-0 text-ink-accent"
            />
            <p className="text-sm leading-relaxed text-ink-secondary">
              {t('placeholderNotice', {
                office: cityHall.name,
                email: lguConfig.contact.email,
              })}
            </p>
          </div>
        ) : null}

        <ul className="grid gap-4 sm:grid-cols-3">
          {cards.map(card => (
            <li key={card.label}>
              <ContactCard
                {...card}
                pending={card.href === null}
                pendingLabel={t('placeholderTag')}
                externalLabel={tCommon('opensExternalSite')}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
