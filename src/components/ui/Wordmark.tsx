import { lguConfig } from '@/lib/lgu-config';
import { cn } from '@/lib/utils';

/**
 * The portal name, set as a two-line lockup beside the mark.
 *
 *     Better
 *     TANDAG
 *
 * One component rather than the same spans copied into the header and the
 * footer: the two marks diverging is a bug that only shows up when someone
 * scrolls the whole page, which is to say almost never during development.
 *
 * ## The pieces
 *
 * `lead` is de-emphasised by SIZE alone — same family, same weight, same
 * colour, and `leading-none` on the stack — because that is what makes two
 * lines read as one object rather than as a label above a title. Setting it
 * lighter or greyer would separate them.
 *
 * `main` is uppercased in CSS, not in the config, so the accessible text stays
 * "Tandag". The link that wraps this carries its own `aria-label`, and the
 * visible text still concatenates to "BetterTandag" — which is what keeps
 * WCAG 2.5.3 (Label in Name) satisfied.
 *
 * ## Colour
 *
 * `--ink-wordmark`: brand navy on the page, `primary-300` in dark theme (the
 * navy is 1.16:1 on that ground), white inside `[data-surface='inverse']`.
 * A wordmark cannot use `--ink-link`, which turns GOLD on inverse surfaces.
 */
export function Wordmark({ className }: { className?: string }) {
  const { lead, main } = lguConfig.portal.wordmark;

  return (
    <span
      className={cn('flex flex-col font-wordmark text-ink-wordmark', className)}
    >
      {/*
        `text-sm` over `text-xl` — 14px over 20px, which is exactly 70%.

        ONE pair at every width, and the same pair in the header and the footer.
        It was 12/18 (67%) at base stepping to 14/20 (70%) at `sm`, so the ratio
        itself moved with the breakpoint; a single pair is both exactly the
        ratio asked for and one fewer thing to keep in step. It costs 2px of
        main on a phone, and the lockup still measures 34px against the mark's
        40 — which is also why the footer no longer needs its own size.

        `leading-none` sits on each LINE, not on the stack: Tailwind v4
        registers --tw-leading with `inherits: false` and every text-* utility
        re-reads it, so a `leading-none` on the parent is silently overridden by
        the child's own size utility. Measured, before it was moved: the lead
        kept a 16px line box around 12px type, opening a 4px gap between the two
        words and breaking the single-unit read.
      */}
      <span className="font-bold text-sm leading-none tracking-tight">
        {lead}
      </span>
      <span className="font-black text-xl leading-none tracking-tight uppercase">
        {main}
      </span>
    </span>
  );
}
