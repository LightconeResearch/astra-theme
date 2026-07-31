import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { PreviewCard } from '../card/PreviewCard';
import { AstraRecordPreview } from '../renderers/AstraInlineRef';
import { AstraStoreProvider } from '../store/AstraStoreProvider';
import { decisionEvidenceIds } from '../store/decisionEvidence';
import { inventoryRecordTitle, resolveInventoryRecordReference } from './model';
const TABLE_BY_KIND = {
    input: 'inputs',
    decision: 'decisions',
    output: 'outputs',
    finding: 'findings',
    prior_insight: 'prior_insights',
};
function emptyStore(model) {
    var _a;
    return {
        analysis: {
            id: model === null || model === void 0 ? void 0 : model.snapshot.analysis.id,
            name: model === null || model === void 0 ? void 0 : model.snapshot.analysis.name,
            slug: (_a = model === null || model === void 0 ? void 0 : model.snapshot.analysis.id) !== null && _a !== void 0 ? _a : 'astra',
        },
        inputs: {},
        outputs: {},
        decisions: {},
        findings: {},
        prior_insights: {},
        subanalyses: {},
    };
}
function addRecord(store, record, key) {
    const table = TABLE_BY_KIND[record.kind];
    store[table][key] =
        record;
}
/**
 * Adapt the project inventory indexes into the consolidated store expected by
 * the existing preview-card bodies. Canonical paths are always indexed; leaf
 * ids are added when unambiguous, and relationship spellings used by the
 * focused record are resolved relative to that record's scope.
 */
export function consolidatedStoreFromInventoryModel(model, focusedRecord) {
    var _a, _b, _c, _d;
    const store = emptyStore(model);
    for (const scope of model.snapshot.scopes) {
        for (const record of scope.records) {
            addRecord(store, record, record.path);
            if (((_b = (_a = model.recordsById.get(record.id)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) === 1) {
                addRecord(store, record, record.id);
            }
        }
    }
    if (!focusedRecord)
        return store;
    const scope = (_c = model.recordByPath.get(focusedRecord.path)) === null || _c === void 0 ? void 0 : _c.scope;
    if (!scope)
        return store;
    if (focusedRecord.kind === 'decision') {
        for (const reference of decisionEvidenceIds(focusedRecord)) {
            const resolved = resolveInventoryRecordReference(model, scope, reference, 'prior_insight');
            if (resolved)
                addRecord(store, resolved.record, reference);
        }
    }
    else if (focusedRecord.kind === 'finding') {
        for (const evidence of (_d = focusedRecord.evidence) !== null && _d !== void 0 ? _d : []) {
            if (!evidence.artifact)
                continue;
            const resolved = resolveInventoryRecordReference(model, scope, evidence.artifact, 'output');
            if (resolved)
                addRecord(store, resolved.record, evidence.artifact);
        }
    }
    return store;
}
/**
 * Host-neutral ASTRA reference used in prose outside MyST.
 *
 * It deliberately accepts resolved data rather than a MyST node while reusing
 * the exact token styling, Floating UI preview, and kind-specific card bodies
 * used by MySTRA publications.
 */
export function AstraRecordReference({ record, label, onActivate, model, store, className, }) {
    const previewStore = useMemo(() => store !== null && store !== void 0 ? store : (model
        ? consolidatedStoreFromInventoryModel(model, record)
        : (() => {
            const minimal = emptyStore();
            addRecord(minimal, record, record.path);
            addRecord(minimal, record, record.id);
            return minimal;
        })()), [model, record, store]);
    const subtype = record.kind === 'output' && record.type
        ? ` astra-ref--${record.type}`
        : '';
    const tokenClassName = [
        'astra-ref',
        `astra-ref--${record.kind}`,
        subtype.trim(),
        className,
    ].filter(Boolean).join(' ');
    return (_jsx(PreviewCard, { kind: record.kind, onActivate: onActivate, trigger: _jsx("span", { className: tokenClassName, children: label !== null && label !== void 0 ? label : inventoryRecordTitle(record) }), children: _jsx(AstraStoreProvider, { store: previewStore, children: _jsx(AstraRecordPreview, { record: record }) }) }));
}
//# sourceMappingURL=AstraRecordReference.js.map