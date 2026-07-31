const INVENTORY_IDENTIFIER = 'astra-inventory';
const INVENTORY_KINDS = new Set([
    'input',
    'decision',
    'output',
    'finding',
    'prior_insight',
]);
function inventoryRoot(snapshot) {
    const roots = snapshot.scopes.filter((scope) => scope.parent === undefined);
    if (roots.length !== 1)
        return undefined;
    const root = roots[0];
    if (root.id !== 'root'
        && snapshot.scopes.some((scope) => scope.id === 'root'))
        return undefined;
    return root;
}
function isInventorySnapshot(value) {
    var _a, _b;
    if (!value || typeof value !== 'object')
        return false;
    const snapshot = value;
    const structurallyValid = (snapshot.version === 1
        && Boolean(snapshot.analysis)
        && typeof ((_a = snapshot.analysis) === null || _a === void 0 ? void 0 : _a.id) === 'string'
        && typeof ((_b = snapshot.analysis) === null || _b === void 0 ? void 0 : _b.name) === 'string'
        && Array.isArray(snapshot.scopes)
        && snapshot.scopes.every((scope) => scope
            && typeof scope.id === 'string'
            && (scope.path === undefined || typeof scope.path === 'string')
            && typeof scope.name === 'string'
            && (scope.parent === undefined || typeof scope.parent === 'string')
            && Array.isArray(scope.children)
            && scope.children.every((child) => typeof child === 'string')
            && Array.isArray(scope.records)
            && scope.records.every((record) => record
                && typeof record.id === 'string'
                && typeof record.path === 'string'
                && typeof record.kind === 'string'
                && INVENTORY_KINDS.has(record.kind))));
    return structurallyValid
        && Boolean(inventoryRoot(snapshot));
}
function normalizeInventorySnapshot(snapshot, assetUrls) {
    const root = inventoryRoot(snapshot);
    if (!root)
        return undefined;
    const rawRootId = root.id;
    const scopeId = (id) => id === rawRootId ? 'root' : id;
    return {
        ...snapshot,
        scopes: snapshot.scopes.map((scope) => {
            var _a;
            return ({
                ...scope,
                id: scopeId(scope.id),
                path: (_a = scope.path) !== null && _a !== void 0 ? _a : scope.id,
                parent: scope.parent === undefined ? undefined : scopeId(scope.parent),
                children: scope.children.map(scopeId),
                records: scope.records.map((record) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                    const primaryEvidence = record.kind === 'prior_insight'
                        ? (_d = (_b = (_a = record.evidence) === null || _a === void 0 ? void 0 : _a.find((evidence) => evidence.doi && evidence.quote)) !== null && _b !== void 0 ? _b : (_c = record.evidence) === null || _c === void 0 ? void 0 : _c.find((evidence) => evidence.doi)) !== null && _d !== void 0 ? _d : (_e = record.evidence) === null || _e === void 0 ? void 0 : _e.find((evidence) => evidence.quote || evidence.page !== undefined)
                        : undefined;
                    const resultPreview = (_f = assetUrls.get(record.path)) !== null && _f !== void 0 ? _f : record.resultPreview;
                    return {
                        ...record,
                        doi: (_g = record.doi) !== null && _g !== void 0 ? _g : primaryEvidence === null || primaryEvidence === void 0 ? void 0 : primaryEvidence.doi,
                        quote: (_h = record.quote) !== null && _h !== void 0 ? _h : primaryEvidence === null || primaryEvidence === void 0 ? void 0 : primaryEvidence.quote,
                        page: (_j = record.page) !== null && _j !== void 0 ? _j : primaryEvidence === null || primaryEvidence === void 0 ? void 0 : primaryEvidence.page,
                        ...(resultPreview ? { resultPreview } : {}),
                    };
                }),
            });
        }),
    };
}
/**
 * Extract MySTRA's project snapshot from index.md and rejoin image URLs that
 * MyST rewrote through its asset pipeline. The small normalization here keeps
 * MySTRA's snapshot contract separate from the original inventory view model.
 */
export function findInventorySnapshot(mdast) {
    var _a, _b, _c;
    if (!mdast)
        return undefined;
    const roots = Array.isArray(mdast) ? mdast : [mdast];
    const stack = [...roots];
    const assetUrls = new Map();
    let snapshot;
    while (stack.length) {
        const node = stack.pop();
        if (!node || typeof node !== 'object')
            continue;
        if (node.identifier === INVENTORY_IDENTIFIER
            && isInventorySnapshot((_a = node.data) === null || _a === void 0 ? void 0 : _a.astraInventory)) {
            snapshot !== null && snapshot !== void 0 ? snapshot : (snapshot = (_b = node.data) === null || _b === void 0 ? void 0 : _b.astraInventory);
        }
        const recordPath = (_c = node.data) === null || _c === void 0 ? void 0 : _c.astraInventoryAsset;
        if (typeof recordPath === 'string' && typeof node.url === 'string') {
            assetUrls.set(recordPath, node.url);
        }
        if (Array.isArray(node.children))
            stack.push(...node.children);
    }
    return snapshot ? normalizeInventorySnapshot(snapshot, assetUrls) : undefined;
}
export function hasInventorySnapshot(mdast) {
    var _a;
    if (!mdast)
        return false;
    const stack = Array.isArray(mdast) ? [...mdast] : [mdast];
    while (stack.length) {
        const node = stack.pop();
        if (!node || typeof node !== 'object')
            continue;
        if (node.identifier === INVENTORY_IDENTIFIER
            && isInventorySnapshot((_a = node.data) === null || _a === void 0 ? void 0 : _a.astraInventory)) {
            return true;
        }
        if (Array.isArray(node.children))
            stack.push(...node.children);
    }
    return false;
}
//# sourceMappingURL=snapshot.js.map