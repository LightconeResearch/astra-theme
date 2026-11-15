import * as React from 'react';
import { Prose } from '@astra-spec/ui/primitives';
import type { GenericNode } from 'myst-common';

import {
  BlockKindLabel,
  displayScope,
  NeutralNode,
  nodeClassName,
  nodeHtmlId,
  useAstraRecord,
} from '../rendererUtils';

export interface AstraFindingProps {
  node: GenericNode;
}

function nodeText(node: GenericNode): string {
  if (typeof node.value === 'string') return node.value;
  return (node.children ?? []).map(nodeText).join(' ');
}

function normalizedProse(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function isNeutralScopeNode(node: GenericNode, scope: string): boolean {
  const expected = normalizedProse(`Scope: ${scope}`);
  return (
    node.type === 'paragraph' &&
    Boolean(node.children?.some((part) => part.type === 'emphasis')) &&
    normalizedProse(nodeText(node)) === expected
  );
}

function neutralIncludesScope(node: GenericNode, scope: string): boolean {
  return (node.children ?? []).some((child) =>
    isNeutralScopeNode(child, scope),
  );
}

/** Preserve the placed finding card while sourcing its content from the SDK. */
export function AstraFinding({ node }: AstraFindingProps): React.ReactElement {
  const located = useAstraRecord(node, 'finding');
  const rootClass = nodeClassName(node, 'astra-finding');

  if (!located) {
    return <NeutralNode node={node} recognitionClass="astra-finding" />;
  }

  const { publication, record } = located;
  const scope = displayScope(record.scope, publication.universe);
  const hasNeutralFallback = Boolean(node.children?.length);
  const showScope = Boolean(
    record.scope &&
      (!hasNeutralFallback || neutralIncludesScope(node, record.scope)),
  );
  return (
    <div className={rootClass} id={nodeHtmlId(node)}>
      <BlockKindLabel kind="finding" className="astra-finding__kind" />
      <div className="astra-finding__claim">
        <Prose text={record.claim} field="claim" />
      </div>
      {showScope && scope ? (
        <span className="astra-scope-chip">
          <Prose text={scope} />
        </span>
      ) : null}
    </div>
  );
}

export default AstraFinding;
