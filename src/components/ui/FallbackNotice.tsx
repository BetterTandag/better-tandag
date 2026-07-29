import { AlertCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { lguConfig } from '@/lib/lgu-config';

/**
 * Shown when any part of the page had no Filipino translation and fell back to
 * English. The fallback is deliberate — but it is never silent.
 *
 * Overlaid, not inserted into the flow: `fixed` means it takes no layout space,
 * so the hero sits at exactly the same place whether or not the notice is
 * showing. It anchors bottom-start and stops short of the end edge
 * (`end-20`, 5rem) so it can never sit under the fixed BackToTop button, which
 * occupies `end-4` + `size-12` — the two are laid out to miss each other at
 * every width, including 320px.
 */
export async function FallbackNotice() {
  const t = await getTranslations('fallback');

  return (
    <div
      role="status"
      className="fixed bottom-4 inset-s-4 inset-e-20 z-40 sm:inset-e-auto sm:max-w-md"
    >
      <div className="flex items-start gap-3 rounded-xl border border-line-control bg-surface-raised px-4 py-3 text-sm shadow-panel backdrop-blur-sm">
        <AlertCircle
          aria-hidden="true"
          className="mt-0.5 size-4.5 shrink-0 text-ink-accent-strong"
        />
        <p className="text-ink-secondary">
          {t('notice')} {t('help', { email: lguConfig.contact.email })}
        </p>
      </div>
    </div>
  );
}
