import * as React from 'react';
import { primaryLiteratureEvidence } from '@astra-spec/ui/components';
import { Prose } from '@astra-spec/ui/primitives';
import type { GenericNode } from 'myst-common';

import { AstraCite } from '../cite';
import {
  displayScope,
  kindLabel,
  NeutralNode,
  nodeClassName,
  nodeHtmlId,
  useAstraRecord,
} from '../rendererUtils';

/** Placed prior-insight chrome retained over canonical SDK evidence. */
export const AstraPriorInsight: React.FC<{ node: GenericNode }> = ({ node }) => {
  const located = useAstraRecord(node, 'prior_insight');
  const className = Array.from(
    new Set([
      'astra-prior-insight',
      ...nodeClassName(node).split(/\s+/).filter(Boolean),
    ]),
  ).join(' ');

  if (!located) {
    return <NeutralNode node={node} recognitionClass="astra-prior-insight" />;
  }

  const { publication, record } = located;
  const scope = displayScope(
    record.scope,
    publication.document.universe.universeId,
  );
  const source = primaryLiteratureEvidence(record);
  const quote = source?.quote;
  return (
    <aside
      className={className || 'astra-prior-insight'}
      id={nodeHtmlId(node)}
    >
      <div className="astra-prior-insight__kind">
        {kindLabel('prior_insight')}
        {scope ? (
          <span className="astra-scope-chip">
            <Prose text={scope} />
          </span>
        ) : null}
      </div>
      {record.label ? <div className="astra-card__title">{record.label}</div> : null}
      <div className="astra-insight__claim">
        <Prose text={record.claim} field="claim" />
      </div>
      {quote ? (
        <blockquote className="astra-quote">
          <Prose text={quote.exact} field="quote" />
        </blockquote>
      ) : null}
      {source?.doi ? (
        <div className="astra-cite">
          <span className="astra-cite__label">Source</span>
          <AstraCite doi={source.doi} />
        </div>
      ) : null}
    </aside>
  );
};

export default AstraPriorInsight;
