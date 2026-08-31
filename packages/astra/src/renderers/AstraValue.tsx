import * as React from 'react';
import type { GenericNode } from 'myst-common';
import { MyST } from 'myst-to-react';

import { AstraPreviewPopover } from '../preview';
import { useAstraPublication } from '../publication/AstraPublicationProvider';
import {
  astraMetadata,
  nodeClassName,
  stringMetadata,
} from '../rendererUtils';

export interface AstraValueProps {
  node: GenericNode;
}

/** Inline values keep their MySTRA-formatted children and preview their owner. */
export const AstraValue: React.FC<AstraValueProps> = ({ node }) => {
  const publication = useAstraPublication();
  const metadata = astraMetadata(node);
  const number = <MyST ast={node.children} />;
  const valueSpan = (
    <span className={nodeClassName(node, 'astra-ref astra-ref--value')}>
      {number}
    </span>
  );

  if (!publication || metadata?.kind !== 'value') return valueSpan;
  const canonicalPath = stringMetadata(metadata, 'canonicalPath');
  const record = canonicalPath
    ? publication.index.recordByPath.get(canonicalPath)
    : undefined;
  const analysis = canonicalPath
    ? publication.index.analysisByRecordPath.get(canonicalPath)
    : undefined;
  if (
    !record ||
    record.kind !== 'output' ||
    !analysis
  ) {
    return valueSpan;
  }

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
