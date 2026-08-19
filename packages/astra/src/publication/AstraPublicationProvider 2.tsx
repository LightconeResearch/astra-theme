import * as React from 'react';
import type {
  AstraRecordKind,
  ProjectRecordView,
  ProjectViewModelV1,
} from '@astra-spec/sdk/view-model';
import {
  AstraViewerProvider,
  DecisionDialog,
  FindingDialog,
  InputDialog,
  InsightDetailDialog,
  InventoryDetailPresentation,
  OutputDialog,
  PaperDialog,
  createInventoryModel,
  getInventoryScope,
  inventoryScopeForRecord,
  normalizeDoi,
  paperMetadataFromCitations,
  paperRecords,
  resolveInventoryRecordReference,
  type InventoryModel,
  type InventoryOpenReference,
  type InventoryPaper,
  type InventoryPaperMetadataMap,
  type InventoryRecord,
  type InventoryScope,
} from '@lightcone-research/astra-ui/components';
import { useReferences } from '@myst-theme/providers';
import type {
  PreviewRequest,
  ResourcePreview,
  ViewerHost,
  ViewerOpenReference,
} from '@lightcone-research/astra-ui/core';
import type { GenericNode } from 'myst-common';

import { AstraStoreProvider } from '../store/AstraStoreProvider';

const PUBLICATION_SCHEMA_VERSION = 'astra-publication-bundle.v1';
const MODEL_SCHEMA_VERSION = 'project-view-model.v1';
const RECORD_KINDS = new Set<AstraRecordKind>([
  'input',
  'decision',
  'output',
  'finding',
  'prior_insight',
]);

export interface AstraPublicationBundleV1 {
  schemaVersion: typeof PUBLICATION_SCHEMA_VERSION;
  revision: string;
  activeScopeId: string;
  model: ProjectViewModelV1;
}

export interface AstraPublicationResourceV1 {
  id: string;
  recordId: string;
  recordPath: string;
  mediaType: string;
  byteSize: number;
  revision: string;
  url: string;
}

export interface AstraPublicationData {
  bundle: AstraPublicationBundleV1;
  resources: ReadonlyMap<string, AstraPublicationResourceV1>;
}

function hasClass(node: GenericNode, className: string): boolean {
  const value = node.class;
  if (typeof value === 'string') return value.split(/\s+/).includes(className);
  if (Array.isArray(value)) return value.includes(className);
  return false;
}

function isPublicationBundle(value: unknown): value is AstraPublicationBundleV1 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AstraPublicationBundleV1>;
  return (
    candidate.schemaVersion === PUBLICATION_SCHEMA_VERSION &&
    typeof candidate.revision === 'string' &&
    typeof candidate.activeScopeId === 'string' &&
    candidate.model?.schemaVersion === MODEL_SCHEMA_VERSION
  );
}

/** Read the MySTRA model carrier and rejoin MyST's rewritten static URLs. */
export function findAstraPublication(
  mdast: GenericNode | GenericNode[] | undefined | null,
): AstraPublicationData | undefined {
  if (!mdast) return undefined;
  const stack = Array.isArray(mdast) ? [...mdast] : [mdast];
  let bundle: AstraPublicationBundleV1 | undefined;
  const resources = new Map<string, AstraPublicationResourceV1>();
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;
    const publication = node.data?.astraPublication;
    if (
      hasClass(node, 'astra-publication-bundle') &&
      isPublicationBundle(publication)
    ) {
      bundle ??= publication;
    }
    const resource = node.data?.astraResource as
      | Omit<AstraPublicationResourceV1, 'url'>
      | undefined;
    if (
      resource &&
      typeof resource.id === 'string' &&
      typeof resource.recordId === 'string' &&
      typeof resource.recordPath === 'string' &&
      typeof resource.mediaType === 'string' &&
      typeof resource.byteSize === 'number' &&
      typeof resource.revision === 'string' &&
      typeof node.url === 'string'
    ) {
      resources.set(resource.id, { ...resource, url: node.url });
    }
    if (Array.isArray(node.children)) stack.push(...node.children);
  }
  return bundle ? { bundle, resources } : undefined;
}

function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      row.push(value);
      value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value);
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }
  if (value !== '' || row.length > 0) {
    row.push(value);
    if (row.some((cell) => cell !== '')) rows.push(row);
  }
  return rows;
}

function metricPreview(value: unknown): ResourcePreview | undefined {
  if (typeof value === 'number' || typeof value === 'string') {
    return { kind: 'metric', value };
  }
  if (Array.isArray(value) && (typeof value[0] === 'number' || typeof value[0] === 'string')) {
    return {
      kind: 'metric',
      value: value[0],
      ...(typeof value[1] === 'number' || typeof value[1] === 'string'
        ? { uncertainty: value[1] }
        : {}),
    };
  }
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.value !== 'number' && typeof record.value !== 'string') return undefined;
  return {
    kind: 'metric',
    value: record.value,
    ...(typeof record.uncertainty === 'number' || typeof record.uncertainty === 'string'
      ? { uncertainty: record.uncertainty }
      : typeof record.error === 'number' || typeof record.error === 'string'
        ? { uncertainty: record.error }
        : {}),
    ...(typeof record.unit === 'string' ? { unit: record.unit } : {}),
    ...(typeof record.label === 'string' ? { label: record.label } : {}),
  };
}

function tablePreview(
  text: string,
  delimiter: string,
  request: PreviewRequest,
  sourceTruncated: boolean,
): ResourcePreview {
  const parsed = parseDelimited(text, delimiter);
  const maxRows = request.maxRows ?? 50;
  const maxColumns = request.maxColumns ?? 30;
  const headers = (parsed[0] ?? []).slice(0, maxColumns);
  const body = parsed.slice(1);
  return {
    kind: 'table',
    headers,
    rows: body.slice(0, maxRows).map((row) => row.slice(0, maxColumns)),
    totalRows: body.length,
    totalColumns: parsed.reduce((largest, row) => Math.max(largest, row.length), 0),
    truncated:
      sourceTruncated ||
      body.length > maxRows ||
      parsed.some((row) => row.length > maxColumns),
  };
}

/** Static-file host used by the shared ASTRA result/detail components. */
export function createStaticViewerHost(data: AstraPublicationData): ViewerHost {
  const resourceDescriptors = new Map(
    data.bundle.model.resources.map((resource) => [resource.id, resource]),
  );
  const getBinding = (resourceId: string): AstraPublicationResourceV1 => {
    const resource = data.resources.get(resourceId);
    if (!resource) throw new Error(`Static publication resource not found: ${resourceId}`);
    return resource;
  };
  return {
    capabilities: {
      preview: true,
      download: true,
      externalNavigation: true,
    },
    async getPreview(resourceId, request) {
      const binding = getBinding(resourceId);
      const descriptor = resourceDescriptors.get(resourceId);
      if (binding.mediaType.startsWith('image/')) {
        return { kind: 'image', url: binding.url, alt: descriptor?.fileName };
      }
      const maxBytes = request.maxBytes ?? 512_000;
      const response = await fetch(binding.url, { signal: request.signal });
      if (!response.ok) {
        return { kind: 'unavailable', reason: `Could not load result (${response.status}).` };
      }
      const fullText = await response.text();
      const sourceTruncated = fullText.length > maxBytes;
      const text = fullText.slice(0, maxBytes);
      if (binding.mediaType === 'text/csv') {
        return tablePreview(text, ',', request, sourceTruncated);
      }
      if (binding.mediaType === 'text/tab-separated-values') {
        return tablePreview(text, '\t', request, sourceTruncated);
      }
      if (binding.mediaType === 'application/json' && descriptor?.kind === 'metric') {
        const preview = metricPreview(JSON.parse(text));
        return preview ?? { kind: 'unavailable', reason: 'Metric JSON has no scalar value.' };
      }
      if (
        binding.mediaType.startsWith('text/') ||
        binding.mediaType === 'application/json'
      ) {
        return {
          kind: 'text',
          text,
          ...(binding.mediaType === 'application/json' ? { language: 'json' } : {}),
          truncated: sourceTruncated,
        };
      }
      return {
        kind: 'unavailable',
        reason: 'Use “Open result” to inspect this file.',
      };
    },
    async getDownloadUrl(resourceId) {
      return getBinding(resourceId).url;
    },
    openExternal(url) {
      if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
    },
  };
}

type OpenPublicationReference = (reference: ViewerOpenReference) => void;
const PublicationOpenContext = React.createContext<OpenPublicationReference | undefined>(undefined);

export function usePublicationOpenReference(): OpenPublicationReference | undefined {
  return React.useContext(PublicationOpenContext);
}

function findRecord(
  data: AstraPublicationData,
  reference: ViewerOpenReference,
): ProjectRecordView | undefined {
  const records = data.bundle.model.records;
  if (reference.canonicalPath) {
    const exact = records.find((record) => record.canonicalPath === reference.canonicalPath);
    if (exact) return exact;
  }
  const byId = records.find((record) => record.id === reference.id);
  if (byId) return byId;
  return (
    records.find(
      (record) =>
        record.scopeId === data.bundle.activeScopeId &&
        record.kind === reference.kind &&
        record.localId === reference.id,
    ) ??
    records.find(
      (record) => record.kind === reference.kind && record.localId === reference.id,
    )
  );
}

export function postReferenceToParent(reference: InventoryOpenReference): boolean {
  if (typeof window === 'undefined' || window.parent === window) return false;
  window.parent.postMessage({ type: 'astra:open-reference', reference }, '*');
  return true;
}

type PublicationModalEntry =
  | { kind: 'record'; record: InventoryRecord; scopeId: string }
  | { kind: 'paper'; paper: InventoryPaper; scopeId: string };

function modalCrumb(entry: PublicationModalEntry): string {
  return entry.kind === 'record' ? entry.record.localId : entry.paper.title;
}

function locatePublicationRecord(
  model: InventoryModel,
  fallbackScope: InventoryScope,
  reference: ViewerOpenReference,
): PublicationModalEntry | undefined {
  const located = (
    reference.canonicalPath
      ? model.recordByPath.get(reference.canonicalPath)
      : undefined
  ) ?? resolveInventoryRecordReference(
    model,
    fallbackScope,
    reference.canonicalPath ?? reference.id,
    reference.kind,
  );
  if (!located || located.record.kind !== reference.kind) return undefined;
  return { kind: 'record', record: located.record, scopeId: located.scope.id };
}

function locatePublicationPaper(
  model: InventoryModel,
  fallbackScope: InventoryScope,
  doi: string,
  paperMetadata: InventoryPaperMetadataMap,
): PublicationModalEntry | undefined {
  const canonical = normalizeDoi(doi);
  const paper = paperRecords(model, fallbackScope, paperMetadata).find(
    (candidate) => normalizeDoi(candidate.doi) === canonical,
  );
  return paper ? { kind: 'paper', paper, scopeId: fallbackScope.id } : undefined;
}

/**
 * Publication adapter for astra-ui's canonical kind-specific dialogs.
 *
 * The theme owns only selection/back-stack state. Modal behavior, headers,
 * artifact presentation, relationships, and focus management stay in
 * astra-ui so the same record surface is shared with JupyterLab and IDE hosts.
 */
function PublicationDialogs({
  model: source,
  host,
  activeScopeId,
  reference,
  onClose,
}: {
  model: ProjectViewModelV1;
  host: ViewerHost;
  activeScopeId: string;
  reference: ViewerOpenReference;
  onClose: () => void;
}) {
  const model = React.useMemo(() => createInventoryModel(source), [source]);
  const fallbackScope = getInventoryScope(model, activeScopeId) ?? source.scopes[0];
  const initial = fallbackScope
    ? locatePublicationRecord(model, fallbackScope, reference)
    : undefined;
  const [stack, setStack] = React.useState<PublicationModalEntry[]>(
    initial ? [initial] : [],
  );

  if (!stack.length) return null;
  const active = stack[stack.length - 1];
  const scope = active ? getInventoryScope(model, active.scopeId) : undefined;
  if (!active || !scope) return null;

  const push = (record: InventoryRecord, owner?: InventoryScope) => {
    const resolvedOwner = owner ?? inventoryScopeForRecord(model, record, scope);
    if (resolvedOwner) {
      setStack((current) => [
        ...current,
        { record, scopeId: resolvedOwner.id },
      ]);
    }
  };
  const closeAll = () => {
    setStack([]);
    onClose();
  };
  const onBack = stack.length > 1
    ? () => setStack((current) => current.slice(0, -1))
    : undefined;
  const previous = stack.length > 1 ? stack[stack.length - 2] : undefined;
  const { record } = active;

  let dialog: React.ReactNode;
  switch (record.kind) {
    case 'output':
      dialog = (
        <OutputDialog
          record={record}
          scope={scope}
          model={model}
          onOpenDependency={(dependency, owner) => push(dependency, owner)}
          onBack={onBack}
          onClose={closeAll}
        />
      );
      break;
    case 'input':
      dialog = (
        <InputDialog
          record={record}
          scope={scope}
          onBack={onBack}
          onClose={closeAll}
        />
      );
      break;
    case 'decision':
      dialog = (
        <DecisionDialog
          record={record}
          scope={scope}
          model={model}
          onOpenInsight={(insight) => push(insight)}
          onBack={onBack}
          onClose={closeAll}
        />
      );
      break;
    case 'finding':
      dialog = (
        <FindingDialog
          record={record}
          scope={scope}
          model={model}
          onOpenEvidence={(output, owner) => push(output, owner)}
          onBack={onBack}
          onClose={closeAll}
        />
      );
      break;
    case 'prior_insight':
      dialog = (
        <InsightDetailDialog
          insight={record}
          model={model}
          scope={scope}
          onOpenDecision={(decision) => push(decision)}
          onBack={onBack}
          onClose={closeAll}
        />
      );
      break;
  }

  return (
    <AstraViewerProvider model={source} host={host}>
      <div className="astra-ui">
        <InventoryDetailPresentation
          mode="modal"
          backLabel="Back to previous record"
          backText={previous ? modalCrumb(previous) : undefined}
        >
          {dialog}
        </InventoryDetailPresentation>
      </div>
    </AstraViewerProvider>
  );
}

export interface AstraPublicationProviderProps {
  children: React.ReactNode;
  mdast?: GenericNode | GenericNode[];
  publication?: AstraPublicationData;
}

/** Mount the legacy page store and the canonical shared viewer together. */
export function AstraPublicationProvider({
  children,
  mdast,
  publication: explicitPublication,
}: AstraPublicationProviderProps) {
  const publication = React.useMemo(
    () => explicitPublication ?? findAstraPublication(mdast),
    [explicitPublication, mdast],
  );
  const host = React.useMemo(
    () => (publication ? createStaticViewerHost(publication) : undefined),
    [publication],
  );
  const [selected, setSelected] = React.useState<ViewerOpenReference>();

  const openInventoryReference = React.useCallback(
    (reference: InventoryOpenReference) => {
      if (postReferenceToParent(reference)) return;
      if (reference.kind === 'paper') {
        if (typeof window !== 'undefined') {
          window.open(`https://doi.org/${encodeURIComponent(reference.doi)}`, '_blank', 'noopener,noreferrer');
        }
        return;
      }
      setSelected(reference);
    },
    [],
  );

  const openReference = React.useCallback<OpenPublicationReference>(
    (reference) => {
      if (!publication) return;
      const record = findRecord(publication, reference);
      if (!record) return;
      openInventoryReference({
        kind: record.kind,
        id: record.id,
        canonicalPath: record.canonicalPath,
      });
    },
    [openInventoryReference, publication],
  );

  const legacy = (
    <AstraStoreProvider mdast={mdast}>
      {children}
    </AstraStoreProvider>
  );
  if (!publication || !host) return legacy;
  return (
    <PublicationOpenContext.Provider value={openReference}>
      <AstraStoreProvider mdast={mdast}>
        {children}
        {selected ? (
          <PublicationDialogs
            key={`${selected.kind}:${selected.canonicalPath ?? selected.id}`}
            model={publication.bundle.model}
            host={host}
            activeScopeId={publication.bundle.activeScopeId}
            reference={selected}
            onClose={() => setSelected(undefined)}
          />
        ) : null}
      </AstraStoreProvider>
    </PublicationOpenContext.Provider>
  );
}

export function isPublicationRecordKind(kind: string): kind is AstraRecordKind {
  return RECORD_KINDS.has(kind as AstraRecordKind);
}
