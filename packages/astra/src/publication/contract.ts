import {
  indexAnalysis,
  parseResolvedAnalysisBundle,
  type AnalysisIndex,
  type ResolvedAnalysisBundle,
  type ResolvedAnalysisDocument,
  type ResolvedAnalysisNode,
} from '@astra-spec/sdk';
import type { GenericNode } from 'myst-common';

export const ASTRA_PUBLICATION_SCHEMA_VERSION =
  'astra-publication-bundle.v1' as const;

/** The decoded, indexed publication data exposed to React renderers. */
export interface AstraPublication {
  bundle: ResolvedAnalysisBundle;
  document: ResolvedAnalysisDocument;
  index: AnalysisIndex;
  activeAnalysis: ResolvedAnalysisNode;
  /** MyST-rewritten artifact URLs keyed by canonical output path. */
  artifactUrls: ReadonlyMap<string, string>;
  /** HTML anchors that are actually present in this page's rendered AST. */
  placedIdentifiers: ReadonlySet<string>;
}

type UnknownRecord = Record<string, unknown>;

function object(value: unknown): UnknownRecord | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : undefined;
}

function hasClass(node: UnknownRecord, className: string): boolean {
  const value = node.class;
  if (typeof value === 'string') {
    return value.split(/\s+/).includes(className);
  }
  return (
    Array.isArray(value) &&
    value.some((item) => item === className)
  );
}

/**
 * Accept only browser-safe site-relative and explicit HTTP(S) resource URLs.
 * In particular, URL parsing against the sentinel rejects protocol-relative
 * (including backslash-spelled) cross-origin targets.
 */
function safeArtifactUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/.test(value)) {
    return undefined;
  }
  const url = value.trim();
  if (!url || /^[\\/]{2}/.test(url)) return undefined;

  const base = new URL('https://astra-publication.invalid/');
  try {
    const parsed = new URL(url, base);
    const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(url);
    if (hasScheme) {
      return /^https?:\/\//i.test(url) &&
        (parsed.protocol === 'http:' || parsed.protocol === 'https:')
        ? url
        : undefined;
    }
    return parsed.origin === base.origin ? url : undefined;
  } catch {
    return undefined;
  }
}

function artifactUrls(
  resourceCarrier: unknown,
  bundle: ResolvedAnalysisBundle,
): ReadonlyMap<string, string> {
  const carrier = object(resourceCarrier);
  if (
    !carrier ||
    carrier.type !== 'div' ||
    !hasClass(carrier, 'astra-publication-resources') ||
    !Array.isArray(carrier.children)
  ) {
    return new Map();
  }

  const bindings = new Map(
    bundle.bindings.map((binding) => [binding.outputPath, binding] as const),
  );
  const urls = new Map<string, string>();

  for (const value of carrier.children) {
    const link = object(value);
    const data = object(link?.data);
    const identity = object(data?.astraArtifact);
    if (
      !link ||
      link.type !== 'link' ||
      link.static !== true ||
      !identity ||
      typeof identity.outputPath !== 'string' ||
      typeof identity.cacheToken !== 'string'
    ) {
      continue;
    }

    const binding = bindings.get(identity.outputPath);
    const url = safeArtifactUrl(link.url);
    if (
      !binding ||
      binding.cacheToken !== identity.cacheToken ||
      !url ||
      urls.has(identity.outputPath)
    ) {
      continue;
    }
    urls.set(identity.outputPath, url);
  }

  return urls;
}

/** Reject identities that the SDK's convenience index would overwrite. */
function hasIdentityCollisions(bundle: ResolvedAnalysisBundle): boolean {
  const canonicalPaths = new Set<string>();
  const pending: ResolvedAnalysisNode[] = [bundle.document.analysis];

  while (pending.length > 0) {
    const analysis = pending.pop()!;
    if (canonicalPaths.has(analysis.canonicalPath)) return true;
    canonicalPaths.add(analysis.canonicalPath);

    for (const record of [
      ...analysis.inputs,
      ...analysis.outputs,
      ...analysis.decisions,
      ...analysis.prior_insights,
      ...analysis.findings,
    ]) {
      if (canonicalPaths.has(record.canonicalPath)) return true;
      canonicalPaths.add(record.canonicalPath);
    }
    pending.push(...analysis.analyses);
  }

  const boundOutputs = new Set<string>();
  for (const binding of bundle.bindings) {
    if (boundOutputs.has(binding.outputPath)) return true;
    boundOutputs.add(binding.outputPath);
  }
  return false;
}

function decodeCarrier(
  value: unknown,
  resourceSibling: unknown,
  placedIdentifiers: ReadonlySet<string>,
): AstraPublication | undefined {
  const node = object(value);
  const data = object(node?.data);
  const envelope = object(data?.astraPublication);
  if (
    !node ||
    node.type !== 'div' ||
    !hasClass(node, 'astra-publication-bundle') ||
    !envelope ||
    envelope.schemaVersion !== ASTRA_PUBLICATION_SCHEMA_VERSION ||
    typeof envelope.activeAnalysisPath !== 'string'
  ) {
    return undefined;
  }

  try {
    const bundle = parseResolvedAnalysisBundle(envelope.bundle);
    if (hasIdentityCollisions(bundle)) return undefined;
    const index = indexAnalysis(bundle.document);
    const activeAnalysis = index.analysisByPath.get(
      envelope.activeAnalysisPath,
    );
    if (!activeAnalysis) return undefined;

    return {
      bundle,
      document: bundle.document,
      index,
      activeAnalysis,
      artifactUrls: artifactUrls(resourceSibling, bundle),
      placedIdentifiers,
    };
  } catch {
    return undefined;
  }
}

interface TraversalFrame {
  siblings: unknown[];
  index: number;
}

/** Collect the identifiers that MyST will materialize as page anchors. */
function collectPlacedIdentifiers(roots: unknown[]): ReadonlySet<string> {
  const identifiers = new Set<string>();
  const pending = [...roots];

  while (pending.length > 0) {
    const node = object(pending.pop());
    if (!node) continue;

    const identifier =
      typeof node.html_id === 'string' && node.html_id.trim()
        ? node.html_id
        : typeof node.identifier === 'string' && node.identifier.trim()
          ? node.identifier
          : undefined;
    if (identifier) identifiers.add(identifier);
    if (Array.isArray(node.children)) pending.push(...node.children);
  }

  return identifiers;
}

/**
 * Find MySTRA's first valid publication carrier in document order. Traversal
 * retains each node's original sibling array so only an immediately following
 * resource carrier can contribute URLs. Invalid candidates fail locally and
 * leave the neutral MyST publication untouched.
 */
export function findAstraPublication(
  mdast: GenericNode | GenericNode[] | undefined | null,
): AstraPublication | undefined {
  if (!mdast) return undefined;

  const roots: unknown[] = Array.isArray(mdast) ? mdast : [mdast];
  const placedIdentifiers = collectPlacedIdentifiers(roots);
  const frames: TraversalFrame[] = [{ siblings: roots, index: 0 }];

  while (frames.length > 0) {
    const frame = frames[frames.length - 1]!;
    if (frame.index >= frame.siblings.length) {
      frames.pop();
      continue;
    }

    const index = frame.index;
    frame.index += 1;
    const value = frame.siblings[index];
    const publication = decodeCarrier(
      value,
      frame.siblings[index + 1],
      placedIdentifiers,
    );
    if (publication) return publication;

    const node = object(value);
    if (Array.isArray(node?.children)) {
      frames.push({ siblings: node.children, index: 0 });
    }
  }

  return undefined;
}
