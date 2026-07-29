import { ExternalLink } from 'lucide-react';
import type { HomeHotlineSource } from '@/lib/content';
import { cn } from '@/lib/utils';

/**
 * Where a published number came from.
 *
 * A citation link only when there is something to cite. A contributor-supplied
 * number gets its provenance as plain text — never styled as a source link it
 * has not earned.
 *
 * The link is underlined rather than colour-only: on the promoted emergency
 * band the surface is `data-surface="accent"`, where `--ink-link` resolves to
 * the same navy as the body ink, so colour alone would not mark it as a link.
 */
export function HotlineSource({
  source,
  className,
}: {
  source: HomeHotlineSource;
  className?: string;
}) {
  return (
    <p className={cn('text-2xs text-ink-secondary', className)}>
      {source.url ? (
        <a
          href={source.url}
          rel="noreferrer"
          className="text-ink-link underline hover:text-ink-link-hover"
        >
          {source.label}
          {/* Inline, not a flex item: these labels wrap to two lines at 320px,
              and in a flex row the glyph strands itself beside the block
              instead of following the last word. */}
          <ExternalLink
            aria-hidden="true"
            className="ms-1 inline size-3 align-middle"
          />
        </a>
      ) : (
        source.label
      )}
    </p>
  );
}
