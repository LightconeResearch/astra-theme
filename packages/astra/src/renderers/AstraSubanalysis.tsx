import * as React from 'react';
import type { GenericNode } from 'myst-common';

import {
  BlockKindLabel,
  NeutralNode,
  nodeClassName,
  nodeHtmlId,
  useAstraAnalysis,
} from '../rendererUtils';

function plural(count: number, singular: string): string {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

/** MySTRA's neutral card carries its label in `title`, while the stock React
 * card renderer consumes a `cardTitle` child. Preserve that readable fallback
 * if publication enrichment is unavailable. */
function readableNeutralCard(node: GenericNode): GenericNode {
  const title = (node as GenericNode & { title?: unknown }).title;
  if (node.children?.length || typeof title !== 'string' || !title.trim()) {
    return node;
  }
  return {
    ...node,
    children: [
      {
        type: 'cardTitle',
        key: 'astra-neutral-subanalysis-title',
        children: [
          {
            type: 'text',
            key: 'astra-neutral-subanalysis-title-text',
            value: title,
          },
        ],
      },
    ],
  } as GenericNode;
}

/** Placed analysis navigation card backed by data.astra.analysisPath. */
export const AstraSubanalysis: React.FC<{ node: GenericNode }> = ({ node }) => {
  const located = useAstraAnalysis(node);
  if (!located) {
    return (
      <NeutralNode
        node={readableNeutralCard(node)}
        recognitionClass="astra-subanalysis"
      />
    );
  }

  const { analysis, href } = located;
  const name = analysis.name ?? analysis.id ?? analysis.canonicalPath;
  const counts = `${plural(analysis.decisions.length, 'decision')} · ${plural(
    analysis.outputs.length,
    'output',
  )}`;

  return (
    <div className={nodeClassName(node, 'astra-subanalysis')} id={nodeHtmlId(node)}>
      <BlockKindLabel kind="analysis" className="astra-subanalysis__kind" />
      <div className="astra-subanalysis__name">
        {href ? (
          <a className="astra-subanalysis__link" href={href}>
            {name}
          </a>
        ) : (
          name
        )}
      </div>
      <div className="astra-subanalysis__counts">{counts}</div>
    </div>
  );
};

export default AstraSubanalysis;
