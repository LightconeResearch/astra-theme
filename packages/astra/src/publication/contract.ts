import {
  RESOLVED_ANALYSIS_SCHEMA_VERSION,
  indexAnalysis,
  type AnalysisIndex,
  type ArtifactBinding,
  type ResolvedAnalysisBundle,
  type ResolvedAnalysisDocument,
} from '@astra-spec/sdk';
import type { GenericNode } from 'myst-common';

export const ASTRA_PUBLICATION_SCHEMA_VERSION =
  'astra-publication-bundle.v1' as const;

export interface AstraPublicationBundleV1 {
  schemaVersion: typeof ASTRA_PUBLICATION_SCHEMA_VERSION;
  activeAnalysisPath: string;
  bundle: ResolvedAnalysisBundle;
}

export interface AstraArtifactResource {
  outputPath: string;
  cacheToken: string;
  path: string;
  url: string;
}

export interface IndexedAstraPublication {
  publication: AstraPublicationBundleV1;
  index: AnalysisIndex;
  resources: ReadonlyMap<string, AstraArtifactResource>;
}

interface ResourceCandidate {
  outputPath: string;
  cacheToken: string;
  url: string;
}

function hasClass(node: GenericNode, className: string): boolean {
  const value = node.class;
  if (typeof value === 'string') return value.split(/\s+/).includes(className);
  if (Array.isArray(value)) return value.includes(className);
  return false;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function optionalField(
  value: Record<string, unknown>,
  key: string,
  guard: (candidate: unknown) => boolean,
): boolean {
  return value[key] === undefined || guard(value[key]);
}

function optionalStrings(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return keys.every((key) =>
    optionalField(value, key, (item) => typeof item === 'string'),
  );
}

function optionalStringArrays(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return keys.every((key) => optionalField(value, key, isStringArray));
}

function isResources(value: unknown): boolean {
  const candidate = asRecord(value);
  return Boolean(
    candidate &&
      ['cpus', 'gpus'].every((key) =>
        optionalField(candidate, key, isFiniteNumber),
      ) &&
      optionalStrings(candidate, ['memory', 'time_limit', 'disk']),
  );
}

function isRecipe(value: unknown): boolean {
  const candidate = asRecord(value);
  return Boolean(
    candidate &&
      optionalStrings(candidate, ['command', 'container']) &&
      optionalField(candidate, 'resources', isResources),
  );
}

function isTextQuoteSelector(value: unknown): boolean {
  const candidate = asRecord(value);
  return Boolean(
    candidate &&
      typeof candidate.exact === 'string' &&
      optionalStrings(candidate, ['prefix', 'suffix']),
  );
}

function isFragmentSelector(value: unknown): boolean {
  const candidate = asRecord(value);
  return Boolean(
    candidate &&
      optionalStrings(candidate, ['value']) &&
      optionalField(candidate, 'page', isFiniteNumber),
  );
}

function isResolvedEvidence(value: unknown): boolean {
  const candidate = asRecord(value);
  return Boolean(
    candidate &&
      typeof candidate.id === 'string' &&
      optionalStrings(candidate, [
        'doi',
        'artifact',
        'snapshot',
        'source_commit',
        'resolvedOutputPath',
      ]) &&
      optionalField(candidate, 'version', isFiniteNumber) &&
      optionalField(candidate, 'quote', isTextQuoteSelector) &&
      optionalField(candidate, 'location', isFragmentSelector),
  );
}

function isResolvedOption(value: unknown): boolean {
  const candidate = asRecord(value);
  return Boolean(
    candidate &&
      typeof candidate.id === 'string' &&
      typeof candidate.label === 'string' &&
      isStringArray(candidate.resolvedInsightPaths) &&
      optionalStrings(candidate, ['description', 'excluded_reason']) &&
      optionalStringArrays(candidate, [
        'insights',
        'incompatible_with',
        'requires',
      ]) &&
      optionalField(candidate, 'excluded', (item) => typeof item === 'boolean'),
  );
}

const INPUT_TYPES = new Set([
  'data',
  'analysis',
  'metric',
  'figure',
  'table',
  'report',
]);
const OUTPUT_TYPES = new Set(['metric', 'figure', 'table', 'data', 'report']);

function hasResolvedIdentity(
  value: Record<string, unknown>,
  kind: string,
): boolean {
  return (
    value.kind === kind &&
    typeof value.id === 'string' &&
    typeof value.canonicalPath === 'string'
  );
}

function isResolvedInput(value: unknown): boolean {
  const candidate = asRecord(value);
  return Boolean(
    candidate &&
      hasResolvedIdentity(candidate, 'input') &&
      typeof candidate.type === 'string' &&
      INPUT_TYPES.has(candidate.type) &&
      optionalStrings(candidate, [
        'label',
        'description',
        'source',
        'ref',
        'ref_version',
        'from',
        'resolvedFrom',
      ]) &&
      optionalStringArrays(candidate, ['use_outputs']),
  );
}

function isResolvedOutput(value: unknown): boolean {
  const candidate = asRecord(value);
  if (
    !candidate ||
    !hasResolvedIdentity(candidate, 'output') ||
    typeof candidate.type !== 'string' ||
    !OUTPUT_TYPES.has(candidate.type) ||
    typeof candidate.active !== 'boolean' ||
    !optionalStrings(candidate, [
      'label',
      'format',
      'description',
      'from',
      'resolvedFrom',
    ]) ||
    !optionalStringArrays(candidate, ['inputs', 'decisions', 'when']) ||
    !optionalField(candidate, 'recipe', isRecipe)
  ) {
    return false;
  }
  const provenance = asRecord(candidate.provenance);
  if (
    !provenance ||
    !isStringArray(provenance.inputPaths) ||
    !isStringArray(provenance.decisionPaths)
  ) {
    return false;
  }
  if (candidate.artifact === undefined) return true;
  const artifact = asRecord(candidate.artifact);
  return Boolean(
    artifact &&
      typeof artifact.byteSize === 'number' &&
      Number.isFinite(artifact.byteSize) &&
      artifact.byteSize >= 0,
  );
}

function isResolvedDecision(value: unknown): boolean {
  const candidate = asRecord(value);
  return Boolean(
    candidate &&
      hasResolvedIdentity(candidate, 'decision') &&
      typeof candidate.label === 'string' &&
      typeof candidate.active === 'boolean' &&
      optionalStrings(candidate, [
        'rationale',
        'default',
        'from',
        'resolvedFrom',
      ]) &&
      optionalStringArrays(candidate, ['tags', 'when']) &&
      Array.isArray(candidate.options) &&
      candidate.options.every(isResolvedOption) &&
      (candidate.selectedOptionId === undefined ||
        typeof candidate.selectedOptionId === 'string'),
  );
}

function isResolvedInsight(
  value: unknown,
  kind: 'finding' | 'prior_insight',
): boolean {
  const candidate = asRecord(value);
  return Boolean(
    candidate &&
      hasResolvedIdentity(candidate, kind) &&
      typeof candidate.claim === 'string' &&
      typeof candidate.created_at === 'string' &&
      optionalStrings(candidate, [
        'label',
        'snapshot',
        'source_commit',
        'scope',
        'notes',
      ]) &&
      optionalStringArrays(candidate, ['tags']) &&
      optionalField(
        candidate,
        'derived',
        (item) => typeof item === 'boolean',
      ) &&
      Array.isArray(candidate.evidence) &&
      candidate.evidence.every(isResolvedEvidence),
  );
}

function isResolvedAnalysisNode(
  value: unknown,
  seen: WeakSet<object>,
): boolean {
  const candidate = asRecord(value);
  if (!candidate || seen.has(candidate)) return false;
  seen.add(candidate);
  if (
    typeof candidate.canonicalPath !== 'string' ||
    !optionalStrings(candidate, [
      'id',
      'version',
      'name',
      'description',
      'container',
    ]) ||
    !optionalStringArrays(candidate, ['tags']) ||
    !Array.isArray(candidate.inputs) ||
    !candidate.inputs.every(isResolvedInput) ||
    !Array.isArray(candidate.outputs) ||
    !candidate.outputs.every(isResolvedOutput) ||
    !Array.isArray(candidate.decisions) ||
    !candidate.decisions.every(isResolvedDecision) ||
    !Array.isArray(candidate.prior_insights) ||
    !candidate.prior_insights.every((record) =>
      isResolvedInsight(record, 'prior_insight'),
    ) ||
    !Array.isArray(candidate.findings) ||
    !candidate.findings.every((record) =>
      isResolvedInsight(record, 'finding'),
    ) ||
    !Array.isArray(candidate.analyses)
  ) {
    return false;
  }
  return candidate.analyses.every((value) => {
    const child = asRecord(value);
    return Boolean(
      child &&
        typeof child.id === 'string' &&
        isResolvedAnalysisNode(child, seen),
    );
  });
}

function isResolvedDocument(value: unknown): value is ResolvedAnalysisDocument {
  const candidate = asRecord(value);
  const universe = asRecord(candidate?.universe);
  const analysis = asRecord(candidate?.analysis);
  return Boolean(
    candidate &&
      candidate.schemaVersion === RESOLVED_ANALYSIS_SCHEMA_VERSION &&
      universe &&
      typeof universe.universeId === 'string' &&
      isStringArray(universe.availableUniverseIds) &&
      optionalStrings(universe, ['description']) &&
      (universe.source === 'explicit' ||
        universe.source === 'implicit' ||
        universe.source === 'none') &&
      analysis &&
      typeof analysis.version === 'string' &&
      typeof analysis.name === 'string' &&
      isResolvedAnalysisNode(analysis, new WeakSet()),
  );
}

function isArtifactBinding(value: unknown): value is ArtifactBinding {
  const candidate = asRecord(value);
  return (
    Boolean(candidate) &&
    typeof candidate?.outputPath === 'string' &&
    typeof candidate.path === 'string' &&
    typeof candidate.cacheToken === 'string'
  );
}

function isResolvedBundle(value: unknown): value is ResolvedAnalysisBundle {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ResolvedAnalysisBundle>;
  return (
    isResolvedDocument(candidate.document) &&
    Array.isArray(candidate.bindings) &&
    candidate.bindings.every(isArtifactBinding)
  );
}

function isPublication(value: unknown): value is AstraPublicationBundleV1 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AstraPublicationBundleV1>;
  return (
    candidate.schemaVersion === ASTRA_PUBLICATION_SCHEMA_VERSION &&
    typeof candidate.activeAnalysisPath === 'string' &&
    isResolvedBundle(candidate.bundle)
  );
}

/**
 * MyST may rewrite static links to a same-origin path or an absolute CDN URL.
 * Cross-origin HTTP(S) is allowed; active schemes and protocol-relative URLs
 * are not, so carrier data can never become a javascript: or data: target.
 */
function safeArtifactUrl(value: string): string | undefined {
  const url = value.trim();
  if (!url || /[\u0000-\u001f\u007f]/.test(url)) return undefined;
  const sentinel = new URL('https://astra-publication.invalid/');
  try {
    const parsed = new URL(url, sentinel);
    const explicitScheme = /^[a-z][a-z\d+.-]*:/i.test(url);
    if (explicitScheme) {
      return /^https?:\/\//i.test(url) &&
        (parsed.protocol === 'http:' || parsed.protocol === 'https:')
        ? url
        : undefined;
    }
    return parsed.origin === sentinel.origin ? url : undefined;
  } catch {
    return undefined;
  }
}

function readResource(node: GenericNode): ResourceCandidate | undefined {
  if (node.type !== 'link' || node.static !== true) return undefined;
  const value = (node.data as { astraArtifact?: unknown } | undefined)
    ?.astraArtifact;
  if (!value || typeof value !== 'object' || typeof node.url !== 'string')
    return undefined;
  const candidate = value as Partial<ResourceCandidate>;
  const url = safeArtifactUrl(node.url);
  if (
    typeof candidate.outputPath !== 'string' ||
    typeof candidate.cacheToken !== 'string'
  ) {
    return undefined;
  }
  return url
    ? {
        outputPath: candidate.outputPath,
        cacheToken: candidate.cacheToken,
        url,
      }
    : undefined;
}

function readCarrierSiblings(children: GenericNode[]):
  | {
      publication: AstraPublicationBundleV1;
      candidates: ResourceCandidate[];
    }
  | undefined {
  for (let index = 0; index < children.length; index += 1) {
    const node = children[index];
    if (node.type !== 'div' || !hasClass(node, 'astra-publication-bundle'))
      continue;
    const carrier = (node.data as { astraPublication?: unknown } | undefined)
      ?.astraPublication;
    if (!isPublication(carrier)) continue;
    const resourceCarrier = children[index + 1];
    const candidates =
      resourceCarrier?.type === 'div' &&
      hasClass(resourceCarrier, 'astra-publication-resources') &&
      Array.isArray(resourceCarrier.children)
        ? resourceCarrier.children.flatMap((child) => {
            const resource = readResource(child);
            return resource ? [resource] : [];
          })
        : [];
    return { publication: carrier, candidates };
  }
  return undefined;
}

/**
 * Read MySTRA's data-only publication carrier and rejoin the static URLs that
 * MyST rewrote. Malformed or version-mismatched carriers degrade to no ASTRA
 * integration instead of breaking the surrounding publication.
 */
export function findAstraPublication(
  mdast: GenericNode | GenericNode[] | undefined | null,
): IndexedAstraPublication | undefined {
  if (!mdast) return undefined;
  const roots = Array.isArray(mdast) ? mdast : [mdast];
  const siblingGroups: GenericNode[][] = [roots];

  while (siblingGroups.length) {
    const children = siblingGroups.pop();
    if (!children) continue;
    const pair = readCarrierSiblings(children);
    if (pair) {
      const { publication, candidates } = pair;
      try {
        const index = indexAnalysis(publication.bundle.document);
        if (!index.analysisByPath.has(publication.activeAnalysisPath)) continue;
        const bindingByOutput = new Map(
          publication.bundle.bindings.map((binding) => [
            binding.outputPath,
            binding,
          ]),
        );
        const resources = new Map<string, AstraArtifactResource>();
        for (const candidate of candidates) {
          const binding = bindingByOutput.get(candidate.outputPath);
          if (!binding || binding.cacheToken !== candidate.cacheToken) continue;
          resources.set(candidate.outputPath, {
            ...candidate,
            path: binding.path,
          });
        }
        return { publication, index, resources };
      } catch {
        // Continue looking for another well-formed sibling pair.
      }
    }
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const child = children[index];
      if (Array.isArray(child?.children)) siblingGroups.push(child.children);
    }
  }
  return undefined;
}
