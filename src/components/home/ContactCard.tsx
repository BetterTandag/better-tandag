import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ContactCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
  /** `null` when the value is a placeholder — the card is then not a link. */
  href: string | null;
  external?: boolean;
  pending: boolean;
  pendingLabel: string;
  externalLabel: string;
};

const SHELL =
  'flex h-full flex-col gap-4 rounded-2xl border border-line bg-surface-raised p-5';

/**
 * One contact route: an icon tile, an uppercase label, the value, a muted line.
 *
 * The whole card is the target when there is somewhere to go — a 44px `tel:`
 * link inside a 160px card means a thumb that lands anywhere else does nothing.
 * When the value is a placeholder there is nowhere to go, so it is NOT a link:
 * a `tel:` to an invented number is worse than no link at all, because it looks
 * like it works right up until someone is on the phone to nobody.
 *
 * That state is carried three ways, never by colour alone — the value drops to
 * secondary ink, a "(placeholder)" marker follows it in text, and the muted
 * line says so in a sentence. The section states it a fourth time above the
 * cards.
 *
 * The `<h3>` is the LABEL, not the value: "Phone" is what a reader browsing by
 * heading is looking for, and the number is the answer to it. It sits inside
 * the anchor in the linked branch, which is valid — `<a>` takes flow content,
 * and only nested INTERACTIVE content is disallowed.
 */
export function ContactCard({
  icon: Icon,
  label,
  value,
  note,
  href,
  external = false,
  pending,
  pendingLabel,
  externalLabel,
}: ContactCardProps) {
  const body: ReactNode = (
    <>
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-surface-control">
        <Icon aria-hidden="true" className="size-5 text-ink-accent" />
      </span>
      <div>
        <h3 className="mb-1.5 text-2xs font-bold tracking-label text-ink-accent uppercase">
          {label}
        </h3>
        {/*
          `wrap-anywhere`, not `wrap-break-word`. An email address is one
          unbreakable token, and `overflow-wrap: break-word` does not reduce an
          element's MIN-CONTENT width — it only breaks the rendered line once a
          width is already fixed. In a grid track sized from its contents that
          is the difference between a card that fits and one that does not:
          measured at 320px, `placeholder@example.invalid(pansamantala)` gave
          the card a 343px min-content inside a 256px measure, and the section's
          `overflow-hidden` clipped the result rather than scrolling — so the
          page-level horizontal-overflow check never saw it. `anywhere` is the
          value that actually feeds back into intrinsic sizing.

          The explicit space before the marker is load-bearing for the same
          reason: with none, the value and "(placeholder)" are one run with no
          break opportunity between them.
        */}
        <p
          className={cn(
            'text-sm font-bold wrap-anywhere',
            pending ? 'text-ink-secondary' : 'text-ink'
          )}
        >
          {value}
          {pending ? (
            <>
              {' '}
              <span className="font-semibold whitespace-nowrap text-ink-tertiary">
                ({pendingLabel})
              </span>
            </>
          ) : null}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-ink-secondary">
          {note}
        </p>
      </div>
    </>
  );

  if (href === null) {
    return (
      <div aria-disabled="true" className={SHELL}>
        {body}
      </div>
    );
  }

  return (
    <a
      href={href}
      {...(external ? { rel: 'noreferrer' } : {})}
      className={cn(
        SHELL,
        'motion-safe:transition-colors motion-safe:duration-200 hover:border-ink-link hover:bg-surface-sunken'
      )}
    >
      {body}
      {external ? <span className="sr-only">({externalLabel})</span> : null}
    </a>
  );
}
