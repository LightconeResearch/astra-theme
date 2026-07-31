import { decisionEvidenceIds } from '../store/decisionEvidence';
export function createInventoryModel(snapshot) {
    var _a;
    const scopeById = new Map(snapshot.scopes.map((scope) => [scope.id, scope]));
    const scopeByPath = new Map(snapshot.scopes.map((scope) => [scope.path, scope]));
    const recordByPath = new Map();
    const recordsById = new Map();
    for (const scope of snapshot.scopes) {
        for (const record of scope.records) {
            const located = { record, scope };
            recordByPath.set(record.path, located);
            const matches = (_a = recordsById.get(record.id)) !== null && _a !== void 0 ? _a : [];
            matches.push(located);
            recordsById.set(record.id, matches);
        }
    }
    return { snapshot, scopeById, scopeByPath, recordByPath, recordsById };
}
export function getInventoryScope(model, scopeId) {
    return model.scopeById.get(scopeId);
}
export function inventoryRecordsOfKind(scope, kind) {
    return scope.records.filter((record) => record.kind === kind);
}
export function inventoryRecordTitle(record) {
    var _a;
    return (_a = record.label) !== null && _a !== void 0 ? _a : record.id;
}
export function selectedOptionLabel(record) {
    var _a, _b;
    if (!record.selected)
        return 'Not selected';
    return (_b = (_a = record.options) === null || _a === void 0 ? void 0 : _a[record.selected]) !== null && _b !== void 0 ? _b : record.selected;
}
/** Root inventory views include descendants; a sub-analysis stays local. */
export function inventoryScopesForView(model, scope) {
    return scope.parent ? [scope] : model.snapshot.scopes;
}
export function inventoryScopeForRecord(model, record, fallback) {
    var _a, _b;
    return (_b = (_a = model.recordByPath.get(record.path)) === null || _a === void 0 ? void 0 : _a.scope) !== null && _b !== void 0 ? _b : fallback;
}
function matchesKind(record, kind) {
    return kind === undefined || record.kind === kind;
}
function parentScope(model, scope) {
    return scope.parent ? model.scopeById.get(scope.parent) : undefined;
}
const COLLECTION_KINDS = {
    inputs: 'input',
    decisions: 'decision',
    outputs: 'output',
    findings: 'finding',
    prior_insights: 'prior_insight',
};
/** Resolve local ids, relative aliases, and fully-qualified ASTRA paths. */
export function resolveInventoryRecordReference(model, scope, reference, kind) {
    var _a, _b, _c, _d;
    let normalized = reference.trim();
    if (!normalized)
        return undefined;
    let owner = scope;
    while (normalized.startsWith('../')) {
        const parent = parentScope(model, owner);
        if (!parent)
            return undefined;
        owner = parent;
        normalized = normalized.slice(3);
    }
    if (normalized.startsWith('./'))
        normalized = normalized.slice(2);
    const parts = normalized.split('.');
    if (parts.length > 1) {
        const id = (_a = parts[parts.length - 1]) !== null && _a !== void 0 ? _a : normalized;
        const scopePath = parts.slice(0, -1).join('.');
        const collectionKind = COLLECTION_KINDS[scopePath];
        if (collectionKind && (!kind || kind === collectionKind)) {
            let candidate = owner;
            while (candidate) {
                const local = candidate.records.find((record) => record.id === id && record.kind === collectionKind);
                if (local)
                    return { record: local, scope: candidate };
                candidate = parentScope(model, candidate);
            }
        }
    }
    const exact = model.recordByPath.get(normalized);
    if (exact && matchesKind(exact.record, kind))
        return exact;
    if (parts.length > 1) {
        const id = (_b = parts[parts.length - 1]) !== null && _b !== void 0 ? _b : normalized;
        const scopePath = parts.slice(0, -1).join('.');
        const qualifiedScope = (_c = model.scopeByPath.get(scopePath)) !== null && _c !== void 0 ? _c : model.scopeById.get(scopePath);
        const qualified = qualifiedScope === null || qualifiedScope === void 0 ? void 0 : qualifiedScope.records.find((record) => record.id === id && matchesKind(record, kind));
        if (qualifiedScope && qualified) {
            return { record: qualified, scope: qualifiedScope };
        }
    }
    let candidate = owner;
    while (candidate) {
        const local = candidate.records.find((record) => record.id === normalized && matchesKind(record, kind));
        if (local)
            return { record: local, scope: candidate };
        candidate = parentScope(model, candidate);
    }
    const matches = ((_d = model.recordsById.get(normalized)) !== null && _d !== void 0 ? _d : [])
        .filter(({ record }) => matchesKind(record, kind));
    return matches.length === 1 ? matches[0] : undefined;
}
export function inventoryDecisionInsights(model, scope, decision) {
    return decisionEvidenceIds(decision)
        .map((id) => {
        var _a;
        return (_a = resolveInventoryRecordReference(model, scope, id, 'prior_insight')) === null || _a === void 0 ? void 0 : _a.record;
    })
        .filter((record) => (record === null || record === void 0 ? void 0 : record.kind) === 'prior_insight');
}
export function inventoryInformedDecisions(model, scope, insight) {
    const decisions = new Map();
    for (const candidate of inventoryScopesForView(model, scope)) {
        for (const decision of inventoryRecordsOfKind(candidate, 'decision')) {
            if (inventoryDecisionInsights(model, candidate, decision)
                .some((record) => record.path === insight.path)
                && !decisions.has(decision.path)) {
                decisions.set(decision.path, decision);
            }
        }
    }
    return [...decisions.values()];
}
//# sourceMappingURL=model.js.map