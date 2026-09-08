import * as React from 'react';
import { InlineReference, type InlineReferenceProps } from '@astra-spec/ui/primitives';
import type { ResolvedRecord } from '@astra-spec/sdk';
import { primaryLiteratureEvidence } from '@astra-spec/ui/model';
import type { GenericNode } from 'myst-common';
import { MyST } from 'myst-to-react';

import { AstraCite } from '../cite';
import { AstraPreviewPopover } from '../preview';
import { useAstraPublication } from '../publication/AstraPublicationProvider';
import {
  astraMetadata,
  nodeClassName,
  safeNavigationHref,
  stringMetadata,
} from '../rendererUtils';

const PREVIEWABLE_RECORD_KINDS = new Set<ResolvedRecord['kind']>([
  'decision',
  'output',
  'finding',
  'prior_insight',
  'input',
]);

/** Preserve the neutral inline token; shared UI only enriches it. */
function tokenSpan(node: GenericNode): React.ReactElement {
  const kind = stringMetadata(astraMetadata(node), 'kind');
  const supported = ['analysis', 'input', 'output', 'decision', 'finding', 'prior_insight', 'paper', 'value', 'option'].includes(kind ?? '');
  return (
    <InlineReference kind={supported ? kind as InlineReferenceProps['kind'] : undefined} className={nodeClassName(node, 'astra-ref')}>
      <MyST ast={node.children} />
    </InlineReference>
  );
}

/** Rich inline ASTRA references resolved solely through canonical SDK identity. */
export const AstraInlineRef: React.FC<{ node: GenericNode }> = ({ node }) => {
  const publication = useAstraPublication();
  const metadata = astraMetadata(node);
  const kind = stringMetadata(metadata, 'kind');
  const token = tokenSpan(node);

  if (!publication || !kind) return token;

  if (kind === 'analysis') {
    const analysisPath = stringMetadata(metadata, 'analysisPath');
    const analysis = analysisPath
      ? publication.index.analysisByPath.get(analysisPath)
      : undefined;
    if (!analysis) return token;

    const href = safeNavigationHref(stringMetadata(metadata, 'href'));
    const trigger = href ? (
      <a className="astra-ref-anchor" href={href}>
        {token}
      </a>
    ) : (
      token
    );
    return (
      <AstraPreviewPopover
        publication={publication}
        entry={{ kind: 'analysis', analysis, ...(href ? { href } : {}) }}
        trigger={trigger}
        triggerClassName={href ? '' : undefined}
      />
    );
  }

  if (!PREVIEWABLE_RECORD_KINDS.has(kind as ResolvedRecord['kind'])) {
    return token;
  }
  const canonicalPath = stringMetadata(metadata, 'canonicalPath');
  const record = canonicalPath
    ? publication.index.recordByPath.get(canonicalPath)
    : undefined;
  const analysis = canonicalPath
    ? publication.index.analysisByRecordPath.get(canonicalPath)
    : undefined;
  if (!record || record.kind !== kind || !analysis) return token;

  const source = record.kind === 'prior_insight'
    ? primaryLiteratureEvidence(record)
    : undefined;

  return (
    <>
      <AstraPreviewPopover
        publication={publication}
        entry={{ kind: 'record', record, analysis }}
        trigger={token}
      />
      {source?.doi ? (
        <span className="astra-ref-citation">
          {' '}
          <AstraCite doi={source.doi} parenthetical />
        </span>
      ) : null}
    </>
  );
};

export default AstraInlineRef;
