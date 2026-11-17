import { useBaseurl } from '@myst-theme/providers';
import { previewHref } from '../viewerTransport';
import * as React from 'react';
import {
  InlineReference,
  type InlineReferenceProps,
} from '@astra-spec/ui/primitives';
import { locateRecord, type RecordKind } from '@astra-spec/ui/model';
import { primaryLiteratureEvidence } from '@astra-spec/ui/model';
import type { GenericNode } from 'myst-common';
import { MyST } from 'myst-to-react';

import { AstraCite } from '../cite';
import { AstraPreviewPopover } from '../preview';
import { useAstraPublication } from '../publication/AstraPublicationProvider';
import {
  astraNodeMetadata,
  publicationForMetadata,
  analysisKeyMetadata,
  nodeClassName,
  safeNavigationHref,
  stringMetadata,
} from '../rendererUtils';

const PREVIEWABLE_RECORD_KINDS = new Set<RecordKind>([
  'decision',
  'output',
  'finding',
  'prior_insight',
  'input',
]);

type InlineKind = NonNullable<InlineReferenceProps['kind']>;

/**
 * The kinds the shared primitive colours. `satisfies` keeps this list honest
 * against the primitive's own union, and `find` narrows without a cast; any
 * other authored kind renders as a neutral token.
 */
const INLINE_REFERENCE_KINDS = [
  'analysis',
  'input',
  'output',
  'decision',
  'finding',
  'prior_insight',
  'paper',
  'value',
  'option',
] as const satisfies readonly InlineKind[];

/** Preserve the neutral inline token; shared UI only enriches it. */
function tokenSpan(node: GenericNode): React.ReactElement {
  const kind = stringMetadata(astraNodeMetadata(node), 'kind');
  return (
    <InlineReference
      kind={INLINE_REFERENCE_KINDS.find((candidate) => candidate === kind)}
      className={nodeClassName(node, 'astra-ref')}
    >
      <MyST ast={node.children} />
    </InlineReference>
  );
}

/** Rich inline ASTRA references resolved solely through canonical SDK identity. */
export const AstraInlineRef: React.FC<{ node: GenericNode }> = ({ node }) => {
  const current = useAstraPublication();
  const baseurl = useBaseurl();
  const metadata = astraNodeMetadata(node);
  const publication = publicationForMetadata(current, metadata);
  const kind = stringMetadata(metadata, 'kind');
  const token = tokenSpan(node);

  if (!publication || !kind) return token;

  if (kind === 'analysis') {
    const analysisKey = analysisKeyMetadata(metadata);
    const analysis =
      analysisKey === undefined
        ? undefined
        : publication.index.analysisByKey.get(analysisKey);
    if (!analysis) return token;

    const href = previewHref(
      safeNavigationHref(stringMetadata(metadata, 'href')),
      baseurl,
    );
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

  if (!PREVIEWABLE_RECORD_KINDS.has(kind as RecordKind)) {
    return token;
  }
  const ref = stringMetadata(metadata, 'ref');
  const located = ref
    ? locateRecord(publication.index, ref)
    : undefined;
  if (!located || located.kind !== kind) return token;
  const { record, analysis } = located;
  const source =
    located.kind === 'prior_insight'
      ? primaryLiteratureEvidence(located.record)
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
