import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { ComingSoonBadge } from '@/components/ui/ComingSoonBadge';
import { Section } from '@/components/ui/Section';
import type { HomeContent } from '@/lib/content';
import { cn } from '@/lib/utils';

type ServicesProps = HomeContent['services'];

/** Where "View all services" will point once the route exists. */
const SERVICES_ROUTE = '/services';

/**
 * "I want to…" — five cards under one "Most asked" group.
 *
 * Four of them are content: the featured card and three small ones, all from
 * content/home/services.yaml. The fifth, "View all services", is NOT — it is a
 * navigation affordance, not a service, so it has no manifest entry and is
 * rendered here. It points at /services, which does not exist yet, so it takes
 * the same `coming-soon` treatment as everything else rather than shipping a
 * link that 404s from our own page. That is the weakest card on the section
 * and the fix is the services route, not a different badge.
 *
 * Card titles are `<h4>` under the `<h3>` that names the group, which is under
 * the section's `<h2>`. The design used sized `<div>`s throughout, which left a
 * screen-reader user with six headings for the whole page.
 *
 * ## The "Soon" badge overlays; it does not displace
 *
 * Each card is the positioning context and the badge is inset by the card's own
 * padding, so the marker lands on the same corner on every card regardless of
 * how the copy inside wraps. `top-4 end-4` on a `rounded-2xl` (16px radius)
 * card clears the corner arc — the curve is entirely inside a 16x16 square, so
 * a 16px inset starts where the straight edge does. Logical insets (`end`, not
 * `right`) so the badge follows the writing direction.
 *
 * The card reserves NO room for it. What used to be extra top padding on the
 * card (`pt-10` / `pt-12 sm:pt-13`) cost every card 24-32px of height whether
 * or not the title needed it. Instead the TITLE steps around the badge, using a
 * floated spacer that is an invisible copy of the badge itself:
 *
 * · Exact, in any locale. "Soon" is ~45px and Filipino "Malapit na" is ~87px; a
 *   hand-picked `pe-` value has to be sized for the longer one and then over-
 *   reserves by ~40px in the other. A copy of the real badge is always right.
 * · First line only. A flat `pe-` narrows EVERY line, and at 1024px each small
 *   card is at its narrowest (~149px of content box) — 87px off every line
 *   leaves 62px, which is narrower than the word "property" and would push ink
 *   out of the card. A float is cleared once the text passes it, so lines two
 *   and three get the full measure back.
 * · Zero height. The spacer is the badge's own 16px, shorter than one line of
 *   either title size, so it never adds a row on its own.
 *
 * The badge stays LAST in the DOM on every card. It is a marker on something,
 * so a screen reader has to reach the title before it reaches "Soon" — and the
 * spacer is `aria-hidden` and `invisible`, so it is in neither the accessibility
 * tree nor the picture.
 */
function TitleSpacer({ tone }: { tone?: 'accent' | 'on-accent' }) {
  return (
    <span aria-hidden="true" className="invisible float-end ms-2">
      <ComingSoonBadge tone={tone} />
    </span>
  );
}

export async function ServicesSection({ featured, cards }: ServicesProps) {
  const t = await getTranslations('services');
  const tCommon = await getTranslations('common');

  return (
    <Section
      id="services"
      eyebrow={t('eyebrow')}
      heading={t('heading')}
      aside={
        <p className="max-w-sm text-sm leading-relaxed text-ink-tertiary">
          {t('note')}
        </p>
      }
    >
      {/* "Most asked" names the whole group now, not just the gold card. It is a
          real heading so the five card titles below it nest at h4 rather than
          all sitting directly under the section's h2. */}
      <h3 className="mb-4 text-2xs font-bold tracking-caps text-ink-tertiary uppercase">
        {t('mostAsked')}
      </h3>

      <div className="grid gap-4 lg:grid-cols-featured">
        <article
          data-surface="accent"
          className="relative flex min-h-56 flex-col justify-between rounded-2xl bg-accent-400 p-6 text-ink sm:p-7"
        >
          <div>
            <h4 className="mb-3 font-display text-feature font-bold">
              {featured.status === 'coming-soon' ? (
                <TitleSpacer tone="on-accent" />
              ) : null}
              {featured.title}
              {featured.status === 'coming-soon' ? (
                <span className="sr-only"> — {tCommon('comingSoon')}</span>
              ) : null}
            </h4>
            <p className="max-w-prose leading-relaxed">{featured.body}</p>
          </div>
          {featured.status === 'coming-soon' ? (
            // Same component, same size as every other badge — inverted,
            // because this one sits on the gold card and gold-on-gold would
            // disappear. Out of flow, so `justify-between` still spaces the
            // card's real content.
            <ComingSoonBadge
              tone="on-accent"
              className="absolute inset-e-6 top-6 sm:inset-e-7 sm:top-7"
            />
          ) : (
            <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
              <a
                href={featured.href}
                className="inline-flex min-h-11 items-center gap-2 hover:text-ink-link-hover"
              >
                {t('openChecklist')}
                <ArrowRight aria-hidden="true" className="size-4" />
              </a>
            </p>
          )}
        </article>

        <ul className="grid gap-3 sm:grid-cols-2">
          {cards.map(card => (
            <li key={card.href}>
              <ServiceCard
                title={card.title}
                meta={card.meta}
                href={card.href}
                status={card.status}
                comingSoonLabel={tCommon('comingSoon')}
              />
            </li>
          ))}

          {/* The fifth card. Not in the manifest — see the note at the top. */}
          <li>
            <ServiceCard
              title={t('viewAll')}
              meta={t('viewAllMeta')}
              href={SERVICES_ROUTE}
              status="coming-soon"
              comingSoonLabel={tCommon('comingSoon')}
              navigational
            />
          </li>
        </ul>
      </div>
    </Section>
  );
}

/**
 * One small card. `navigational` marks the card that goes to an index rather
 * than to a single service — it earns the arrow and the sunken ground, so it
 * reads as the end of the list rather than as a sixth thing to do.
 */
function ServiceCard({
  title,
  meta,
  href,
  status,
  comingSoonLabel,
  navigational = false,
}: {
  title: string;
  meta: string;
  href: string;
  status: 'live' | 'coming-soon';
  comingSoonLabel: string;
  navigational?: boolean;
}) {
  const pending = status === 'coming-soon';

  return (
    <article
      className={cn(
        'relative h-full rounded-2xl border border-line p-4 motion-safe:transition-transform motion-safe:duration-300 hover:border-ink-link motion-safe:hover:-translate-y-1',
        navigational ? 'bg-surface-sunken' : 'bg-surface-raised'
      )}
    >
      <h4 className="text-sm leading-snug font-semibold text-ink">
        {pending ? <TitleSpacer /> : null}
        {pending ? (
          <>
            {title}
            <span className="sr-only"> — {comingSoonLabel}</span>
          </>
        ) : (
          <a href={href} className="hover:text-ink-link-hover">
            {title}
          </a>
        )}
        {navigational ? (
          <ArrowRight
            aria-hidden="true"
            className="ms-1.5 inline size-3.5 align-middle text-ink-link"
          />
        ) : null}
      </h4>
      <p className="mt-2 text-xs leading-relaxed text-ink-tertiary">{meta}</p>
      {pending ? (
        <ComingSoonBadge className="absolute inset-e-4 top-4" />
      ) : null}
    </article>
  );
}
