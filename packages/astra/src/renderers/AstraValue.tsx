import * as React from 'react';
import { InlineReference } from '@astra-spec/ui/primitives';
import { locateRecord } from '@astra-spec/ui/model';
import type { GenericNode } from 'myst-common';
import { MyST } from 'myst-to-react';

import { AstraPreviewPopover } from '../preview';
import { useAstraPublication } from '../publication/AstraPublicationProvider';
import {
  astraMetadata,
  publicationForMetadata,
  nodeClassName,
  stringMetadata,
} from '../rendererUtils';

export interface AstraValueProps {
  node: GenericNode;
}

/** Inline values keep their MySTRA-formatted children and preview their owner. */
export const AstraValue: React.FC<AstraValueProps> = ({ node }) => {
  const current = useAstraPublication();
  const metadata = astraMetadata(node);
  const publication = publicationForMetadata(current, metadata);
  const number = <MyST ast={node.children} />;
  const valueSpan = (
    <InlineReference
      kind="value"
      className={nodeClassName(node, 'astra-ref astra-ref--value')}
    >
      {number}
    </InlineReference>
  );

  if (!publication || metadata?.kind !== 'value') return valueSpan;
  const canonicalPath = stringMetadata(metadata, 'canonicalPath');
  const located = canonicalPath
    ? locateRecord(publication.index, canonicalPath)
    : undefined;
  if (!located || located.kind !== 'output') return valueSpan;
  const { record, analysis } = located;

  return (
    <AstraPreviewPopover
      publication={publication}
      trigger={valueSpan}
      entry={{
        kind: 'value',
        record,
        analysis,
        value: number,
        unit: stringMetadata(metadata, 'unit'),
        column: stringMetadata(metadata, 'col'),
        filter: stringMetadata(metadata, 'filter'),
        product: record.label ?? stringMetadata(metadata, 'product'),
        selection: stringMetadata(metadata, 'selection'),
      }}
    />
  );
};

export default AstraValue;
