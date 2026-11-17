import { useBaseurl } from '@myst-theme/providers';
import { previewHref } from './viewerTransport';
import * as React from 'react';
import type {
  Analysis,
  Input,
  Output,
  Decision,
  Insight,
} from '@astra-spec/sdk/reports';
import type { GenericNode } from 'myst-common';
import { MyST } from 'myst-to-react';

import {
  useAstraPublication,
  type AstraPublication,
} from './publication/AstraPublicationProvider';

type UnknownRecord = Record<string, unknown>;

export interface AstraNodeMetadata extends UnknownRecord {
  kind?: unknown;
  id?: unknown;
  ref?: unknown;
  analysisKey?: unknown;
  href?: unknown;
  type?: unknown;
  col?: unknown;
  filter?: unknown;
  product?: unknown;
  selection?: unknown;
  universe?: unknown;
  unit?: unknown;
}

/** Read only MySTRA's canonical node metadata; identifiers are presentation only. */
export function astraMetadata(
  node: GenericNode,
): AstraNodeMetadata | undefined {
  const data = node.data;
  if (!data || typeof data !== 'object' || Array.isArray(data))
    return undefined;
  const value = (data as UnknownRecord).astra;
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as AstraNodeMetadata)
    : undefined;
}

export function stringMetadata(
  metadata: AstraNodeMetadata | undefined,
  key: keyof AstraNodeMetadata,
): string | undefined {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

/** A placed request can select a universe independently of its page. */
export function publicationForMetadata(
  publication: AstraPublication | undefined,
  metadata: AstraNodeMetadata | undefined,
): AstraPublication | undefined {
  if (!publication) return undefined;
  const universe = metadata?.universe;
  if (universe === undefined) return publication;
  if (
    typeof universe !== 'string' ||
    publication.index.elementByRef.get(universe)?.collection !== 'universes'
  )
    return undefined;
  return universe === publication.universe
    ? publication
    : { ...publication, universe };
}

/**
 * Preserve the released reader-facing scope: the active universe is already
 * page-wide context, so its conventional trailing clause is not repeated.
 */
export function displayScope(
  scope: string | undefined,
  universeId: string | undefined,
): string | undefined {
  if (!scope || !universeId) return scope || undefined;
  const escaped = universeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const clause = new RegExp(
    `\\s*(?:[,;:\u2014\u2013-]|\\b(?:under|in|for)\\s+the\\b)?\\s*(?:the\\s+)?${escaped}\\s+universe\\b`,
    'gi',
  );
  let result = scope.replace(clause, '');
  result = result.replace(/\s{2,}/g, ' ').trim();
  result = result
    .replace(/^[,;:\u2014\u2013-]\s*/, '')
    .replace(/\s*[,;:\u2014\u2013-]+\s*(\.?)$/, '$1')
    .trim();
  if (result === '.') result = '';
  if (result && /[A-Za-z0-9)\]]$/.test(result) && /\.\s*$/.test(scope)) {
    result += '.';
  }
  return result || undefined;
}

export function nodeClassName(node: GenericNode, fallback = ''): string {
  const value = (node as { class?: unknown }).class;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .join(' ');
  }
  return fallback;
}

/** Match MyST's renderer convention: a de-duplicated html_id wins. */
export function nodeHtmlId(node: GenericNode): string | undefined {
  const htmlId = (node as GenericNode & { html_id?: unknown }).html_id;
  if (typeof htmlId === 'string' && htmlId.trim()) return htmlId;
  return typeof node.identifier === 'string' && node.identifier.trim()
    ? node.identifier
    : undefined;
}

/**
 * Delegate a failed enrichment to the stock renderer without selecting this
 * ASTRA override again. Every complete recognition token that the boundary-safe
 * selectors can match is removed, together with its ASTRA modifiers; author
 * tokens that merely contain the same text remain untouched.
 */
export function NeutralNode({
  node,
  recognitionClass,
}: {
  node: GenericNode;
  recognitionClass: string | string[];
}) {
  const recognition = Array.isArray(recognitionClass)
    ? recognitionClass
    : [recognitionClass];
  const classes = nodeClassName(node)
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => {
      const isRecognitionToken = recognition.some(
        (marker) => token === marker || token.startsWith(`${marker}--`),
      );
      return !isRecognitionToken;
    });
  const clone = { ...node } as GenericNode & { class?: unknown };
  if (classes.length) clone.class = classes.join(' ');
  else delete clone.class;
  return <MyST ast={clone} />;
}

export type RecordKind =
  | 'input'
  | 'output'
  | 'decision'
  | 'finding'
  | 'prior_insight';
interface RecordTypes {
  input: Input;
  output: Output;
  decision: Decision;
  finding: Insight;
  prior_insight: Insight;
}
const RECORD_COLLECTIONS = {
  input: 'inputs',
  output: 'outputs',
  decision: 'decisions',
  finding: 'findings',
  prior_insight: 'prior_insights',
} as const;

export interface LocatedRecord<K extends RecordKind> {
  publication: AstraPublication;
  record: RecordTypes[K];
  analysis: Analysis;
}

/** Look up the placed element and its owner without parsing its ref. */
export function useAstraRecord<K extends RecordKind>(
  node: GenericNode,
  kind: K,
): LocatedRecord<K> | undefined {
  const current = useAstraPublication();
  const metadata = astraMetadata(node);
  const publication = publicationForMetadata(current, metadata);
  if (!publication || metadata?.kind !== kind) return undefined;
  const ref = stringMetadata(metadata, 'ref');
  const entry = ref ? publication.index.elementByRef.get(ref) : undefined;
  if (!entry || entry.collection !== RECORD_COLLECTIONS[kind]) return undefined;
  return {
    publication,
    record: entry.element as RecordTypes[K],
    analysis: entry.analysis,
  };
}

/** Analysis keys include the root's empty string. */
export function analysisKeyMetadata(
  metadata: AstraNodeMetadata | undefined,
): string | undefined {
  return typeof metadata?.analysisKey === 'string'
    ? metadata.analysisKey
    : undefined;
}

export interface LocatedAnalysis {
  publication: AstraPublication;
  analysis: Analysis;
  href?: string;
}

/** Canonical SDK lookup for an analysis reference/card. */
export function useAstraAnalysis(
  node: GenericNode,
): LocatedAnalysis | undefined {
  const current = useAstraPublication();
  const baseurl = useBaseurl();
  const metadata = astraMetadata(node);
  const publication = publicationForMetadata(current, metadata);
  if (!publication || metadata?.kind !== 'analysis') return undefined;
  const analysisKey = analysisKeyMetadata(metadata);
  const analysis =
    analysisKey === undefined
      ? undefined
      : publication.index.analysisByKey.get(analysisKey);
  if (!analysis) return undefined;
  const href = previewHref(
    safeNavigationHref(stringMetadata(metadata, 'href')),
    baseurl,
  );
  return { publication, analysis, ...(href ? { href } : {}) };
}

/** Relative or explicit HTTP(S) navigation only. */
export function safeNavigationHref(
  value: string | undefined,
): string | undefined {
  if (!value || /[\u0000-\u001f\u007f]/.test(value)) return undefined;
  const href = value.trim();
  if (!href || /^[\\/]{2}/.test(href)) return undefined;
  const base = new URL('https://astra-theme.invalid/');
  try {
    const parsed = new URL(href, base);
    const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(href);
    if (hasScheme) {
      return /^https?:\/\//i.test(href) &&
        (parsed.protocol === 'http:' || parsed.protocol === 'https:')
        ? href
        : undefined;
    }
    return parsed.origin === base.origin ? href : undefined;
  } catch {
    return undefined;
  }
}

const KIND_LABELS: Record<string, string> = {
  decision: 'DECISION',
  prior_insight: 'PRIOR INSIGHT',
  finding: 'FINDING',
  analysis: 'SUB-ANALYSIS',
  output: 'OUTPUT',
  input: 'INPUT',
};

export function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind.toUpperCase();
}

/** Block-only label: its glyph remains supplied by the existing CSS pseudo-element. */
export function BlockKindLabel({
  kind,
  className,
}: {
  kind: string;
  className: string;
}) {
  return <div className={className}>{kindLabel(kind)}</div>;
}
