import * as React from 'react';
import type { ResolvedInsight } from '@astra-spec/sdk';
import { Prose } from '@astra-spec/ui/primitives';
import type { GenericNode } from 'myst-common';

import {
  BlockKindLabel,
  NeutralNode,
  nodeClassName,
  nodeHtmlId,
  useAstraRecord,
} from '../rendererUtils';
import type { AstraPublication } from '../publication/AstraPublicationProvider';

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

/** MySTRA keeps authored show/hide choices only in the neutral subtree. */
function neutralIncludes(node: GenericNode, value: string): boolean {
  const expected = normalizedProse(value);
  return Boolean(expected) && normalizedProse(nodeText(node)).includes(expected);
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
  return (node.children ?? []).some((child) => isNeutralScopeNode(child, scope));
}

/**
 * A Markdown source string cannot be compared losslessly with its rendered
 * MDAST text (entities and reference definitions are two common examples).
 * If unmatched body nodes remain, preserve the authored neutral subtree
 * instead of guessing that notes were hidden and silently dropping content.
 */
function notesVisibilityIsUncertain(node: GenericNode, scope?: string): boolean {
  return (node.children ?? []).some(
    (child) =>
      child.type !== 'heading' &&
      !(scope && isNeutralScopeNode(child, scope)),
  );
}

function notesVisibilityIsAmbiguous(
  record: ResolvedInsight,
  publication: AstraPublication,
): boolean {
  if (!record.notes) return false;
  const notes = normalizedProse(record.notes);
  const competingText = [record.claim, record.scope];
  for (const evidence of record.evidence) {
    competingText.push(
      evidence.quote?.exact,
      evidence.doi,
      evidence.artifact,
    );
    const output = evidence.resolvedOutputPath
      ? publication.index.recordByPath.get(evidence.resolvedOutputPath)
      : undefined;
    if (output?.kind === 'output') {
      competingText.push(output.id, output.label, output.description);
    }
  }
  return competingText.some((value) => {
    if (!value) return false;
    return normalizedProse(value).includes(notes);
  });
}

/** Preserve the placed finding card while sourcing its content from the SDK. */
export function AstraFinding({ node }: AstraFindingProps): React.ReactElement {
  const located = useAstraRecord(node, 'finding');
  const rootClass = nodeClassName(node, 'astra-finding');

  if (!located) {
    return <NeutralNode node={node} recognitionClass="astra-finding" />;
  }

  const { publication, record } = located;
  const hasNeutralFallback = Boolean(node.children?.length);
  const notesAppearInNeutral = Boolean(
    record.notes && hasNeutralFallback && neutralIncludes(node, record.notes),
  );
  if (
    hasNeutralFallback &&
    record.notes &&
    (notesVisibilityIsAmbiguous(record, publication) ||
      (!notesAppearInNeutral && notesVisibilityIsUncertain(node, record.scope)))
  ) {
    return <NeutralNode node={node} recognitionClass="astra-finding" />;
  }
  const showScope = Boolean(
    record.scope &&
      (!hasNeutralFallback || neutralIncludesScope(node, record.scope)),
  );
  const showNotes = Boolean(
    record.notes &&
      (!hasNeutralFallback || notesAppearInNeutral),
  );
  return (
    <div className={rootClass} id={nodeHtmlId(node)}>
      <BlockKindLabel kind="finding" className="astra-finding__kind" />
      <div className="astra-finding__claim">
        <Prose text={record.claim} field="claim" />
      </div>
      {showScope && record.scope ? (
        <span className="astra-scope-chip">
          <Prose text={record.scope} />
        </span>
      ) : null}
      {showNotes && record.notes ? (
        <div className="astra-finding__notes">
          <Prose text={record.notes} field="notes" />
        </div>
      ) : null}
    </div>
  );
}

export default AstraFinding;
