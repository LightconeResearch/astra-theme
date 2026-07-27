import type { GenericNode } from 'myst-common';
import type { InventoryScope, InventorySnapshot } from './types';

const INVENTORY_IDENTIFIER = 'astra-inventory';
const INVENTORY_KINDS = new Set([
  'input',
  'decision',
  'output',
  'finding',
  'prior_insight',
]);

type InventorySnapshotPayload = Omit<InventorySnapshot, 'scopes'> & {
  scopes: Array<Omit<InventoryScope, 'path'> & { path?: string }>;
};

function inventoryRoot(
  snapshot: InventorySnapshotPayload,
): InventorySnapshotPayload['scopes'][number] | undefined {
  const roots = snapshot.scopes.filter((scope) => scope.parent === undefined);
  if (roots.length !== 1) return undefined;
  const root = roots[0];
  if (
    root.id !== 'root'
    && snapshot.scopes.some((scope) => scope.id === 'root')
  ) return undefined;
  return root;
}

function isInventorySnapshot(value: unknown): value is InventorySnapshotPayload {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<InventorySnapshotPayload>;
  const structurallyValid = (
    snapshot.version === 1
    && Boolean(snapshot.analysis)
    && typeof snapshot.analysis?.id === 'string'
    && typeof snapshot.analysis?.name === 'string'
    && Array.isArray(snapshot.scopes)
    && snapshot.scopes.every(
      (scope) =>
        scope
        && typeof scope.id === 'string'
        && (scope.path === undefined || typeof scope.path === 'string')
        && typeof scope.name === 'string'
        && (scope.parent === undefined || typeof scope.parent === 'string')
        && Array.isArray(scope.children)
        && scope.children.every((child) => typeof child === 'string')
        && Array.isArray(scope.records)
        && scope.records.every(
          (record) =>
            record
            && typeof record.id === 'string'
            && typeof record.path === 'string'
            && typeof record.kind === 'string'
            && INVENTORY_KINDS.has(record.kind),
        ),
    )
  );
  return structurallyValid
    && Boolean(inventoryRoot(snapshot as InventorySnapshotPayload));
}

function normalizeInventorySnapshot(
  snapshot: InventorySnapshotPayload,
  assetUrls: ReadonlyMap<string, string>,
): InventorySnapshot | undefined {
  const root = inventoryRoot(snapshot);
  if (!root) return undefined;
  const rawRootId = root.id;
  const scopeId = (id: string) => id === rawRootId ? 'root' : id;

  return {
    ...snapshot,
    scopes: snapshot.scopes.map((scope) => ({
      ...scope,
      id: scopeId(scope.id),
      path: scope.path ?? scope.id,
      parent: scope.parent === undefined ? undefined : scopeId(scope.parent),
      children: scope.children.map(scopeId),
      records: scope.records.map((record) => {
        const primaryEvidence = record.kind === 'prior_insight'
          ? record.evidence?.find((evidence) => evidence.doi && evidence.quote)
            ?? record.evidence?.find((evidence) => evidence.doi)
            ?? record.evidence?.find(
              (evidence) => evidence.quote || evidence.page !== undefined,
            )
          : undefined;
        const resultPreview = assetUrls.get(record.path) ?? record.resultPreview;
        return {
          ...record,
          doi: record.doi ?? primaryEvidence?.doi,
          quote: record.quote ?? primaryEvidence?.quote,
          page: record.page ?? primaryEvidence?.page,
          ...(resultPreview ? { resultPreview } : {}),
        };
      }),
    })),
  };
}

/**
 * Extract MySTRA's project snapshot from index.md and rejoin image URLs that
 * MyST rewrote through its asset pipeline. The small normalization here keeps
 * MySTRA's snapshot contract separate from the original inventory view model.
 */
export function findInventorySnapshot(
  mdast: GenericNode | GenericNode[] | undefined | null,
): InventorySnapshot | undefined {
  if (!mdast) return undefined;
  const roots = Array.isArray(mdast) ? mdast : [mdast];
  const stack: GenericNode[] = [...roots];
  const assetUrls = new Map<string, string>();
  let snapshot: InventorySnapshotPayload | undefined;

  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;
    if (
      node.identifier === INVENTORY_IDENTIFIER
      && isInventorySnapshot(node.data?.astraInventory)
    ) {
      snapshot ??= node.data?.astraInventory as InventorySnapshotPayload;
    }
    const recordPath = node.data?.astraInventoryAsset;
    if (typeof recordPath === 'string' && typeof node.url === 'string') {
      assetUrls.set(recordPath, node.url);
    }
    if (Array.isArray(node.children)) stack.push(...node.children);
  }

  return snapshot ? normalizeInventorySnapshot(snapshot, assetUrls) : undefined;
}

export function hasInventorySnapshot(
  mdast: GenericNode | GenericNode[] | undefined | null,
): boolean {
  if (!mdast) return false;
  const stack = Array.isArray(mdast) ? [...mdast] : [mdast];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;
    if (
      node.identifier === INVENTORY_IDENTIFIER
      && isInventorySnapshot(node.data?.astraInventory)
    ) {
      return true;
    }
    if (Array.isArray(node.children)) stack.push(...node.children);
  }
  return false;
}
