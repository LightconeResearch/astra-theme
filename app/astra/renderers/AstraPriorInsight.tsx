/**
 * AstraPriorInsight — block renderer for the `astra:prior-insight` directive.
 *
 * The plugin emits a stock `seealso` admonition carrying the class
 * `astra-prior-insight` and the identifier `prior_insight-<id>` (NOTE the
 * UNDERSCORE in the id — CONTRACT.md §1 subtlety). We join the matching
 * `SerializedInsight` out of the per-page store and render an editorial insight
 * card: kind row, the insight claim, an optional scope chip, a DOI citation,
 * and the exact quote (serif italic) when present.
 *
 * Graceful degradation: if the store, the table, or this entry is missing we
 * fall back to the node's own stock children (the plain `seealso` admonition).
 * This renderer never throws.
 */
import * as React from 'react';
import type { GenericNode } from 'myst-common';
import { MyST } from 'myst-to-react';
import type { SerializedInsight } from '@astra-spec/store-types';
import { useEntryByIdentifier } from '../store/useAstraStore';
import { labelFor } from '../glyphs';
import { AstraCite } from '../cite';

export const AstraPriorInsight: React.FC<{ node: GenericNode }> = ({ node }) => {
  const entry = useEntryByIdentifier(node.identifier) as
    | SerializedInsight
    | undefined;

  // Preserve the carrier's astra-* classes so the stylesheet applies. The
  // plugin emits "astra-prior-insight" on `node.class`; keep whatever is there.
  const className = ['astra-prior-insight', node.class]
    .filter(Boolean)
    .join(' ')
    .trim();

  // No store entry → fall back to the stock seealso admonition children.
  if (!entry) {
    return (
      <aside className={className || 'astra-prior-insight'}>
        <MyST ast={node.children} />
      </aside>
    );
  }

  const { label, claim, scope, doi, quote } = entry;

  return (
    <aside className={className || 'astra-prior-insight'}>
      <div className="astra-prior-insight__kind">
        {labelFor('prior_insight')}
        {scope ? <span className="astra-scope-chip">{scope}</span> : null}
      </div>

      {label ? <div className="astra-card__title">{label}</div> : null}

      {claim ? <div className="astra-insight__claim">{claim}</div> : null}

      {quote ? <blockquote className="astra-quote">{quote}</blockquote> : null}

      {doi ? (
        <div className="astra-cite">
          <span className="astra-cite__label">Source</span>
          <AstraCite doi={doi} />
        </div>
      ) : null}

      {/* If the entry carried nothing renderable, still surface the stock body
          so the directive is never silently empty. */}
      {!label && !claim && !quote && !doi ? (
        <MyST ast={node.children} />
      ) : null}
    </aside>
  );
};

export default AstraPriorInsight;
