import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { InventoryProse } from './InventoryProse';
import { InventoryArtifactPreview, inventoryFileName, } from './InventoryArtifactPreview';
import { InventoryDetailDialog, InventoryEmptyState, InventoryRecordIdentity, InventoryRecordList, } from './InventoryPrimitives';
import { InventoryRelationList } from './InventoryRelations';
import { getInventoryScope, inventoryRecordTitle, inventoryRecordsOfKind, resolveInventoryRecordReference, } from './model';
function OutputCard({ record, onOpen }) {
    var _a;
    return (_jsxs("button", { type: "button", className: "inventory-output-card", onClick: onOpen, children: [_jsxs("span", { className: "inventory-output-card__preview", children: [_jsx(InventoryArtifactPreview, { record: record, compact: true }), _jsx("span", { className: "inventory-output-card__open", "aria-hidden": "true", children: "Open \u2197" })] }), _jsxs("span", { className: "inventory-output-card__body", children: [_jsx("span", { className: "inventory-output-card__kind", children: (_a = record.type) !== null && _a !== void 0 ? _a : 'output' }), _jsx("strong", { children: inventoryRecordTitle(record) }), record.label ? _jsx("code", { children: record.id }) : null] })] }));
}
function OutputGallery({ id, title, records, onOpen, }) {
    if (!records.length)
        return null;
    return (_jsxs("section", { className: "inventory-output-section", "aria-labelledby": id, children: [_jsx("h3", { id: id, className: "inventory-output-section__heading exclude-from-outline", children: _jsx("span", { className: "heading-text", children: title }) }), _jsx("div", { className: "inventory-output-gallery", children: records.map((record) => (_jsx(OutputCard, { record: record, onOpen: () => onOpen(record) }, record.path))) })] }));
}
function Files({ records, onOpen }) {
    if (!records.length)
        return null;
    return (_jsxs("section", { className: "inventory-output-section inventory-output-files", "aria-labelledby": "files", children: [_jsx("h3", { id: "files", className: "inventory-output-section__heading exclude-from-outline", children: _jsx("span", { className: "heading-text", children: "Files" }) }), _jsx(InventoryRecordList, { ariaLabel: "Files", columnTemplate: "minmax(14rem, 1fr) 1.5rem", columns: [
                    { label: 'File', className: 'inventory-record-list__primary' },
                    { className: 'inventory-record-list__arrow' },
                ], rows: records.map((record) => ({
                    key: record.path,
                    accessibleLabel: inventoryFileName(record),
                    onOpen: () => onOpen(record),
                    cells: [
                        _jsx(InventoryRecordIdentity, { kind: "file", title: inventoryFileName(record) }),
                        _jsx("span", { "aria-hidden": "true", children: "\u2192" }),
                    ],
                })) })] }));
}
function resolveDecisionDependency(model, scope, id, via) {
    var _a;
    const owner = via
        ? (_a = model.scopeById.get(via)) !== null && _a !== void 0 ? _a : model.scopeByPath.get(via)
        : undefined;
    const ownedDecision = owner === null || owner === void 0 ? void 0 : owner.records.find((record) => record.kind === 'decision' && record.id === id);
    if (owner && ownedDecision)
        return { record: ownedDecision, scope: owner };
    const resolved = resolveInventoryRecordReference(model, scope, id);
    return (resolved === null || resolved === void 0 ? void 0 : resolved.record.kind) === 'decision' ? resolved : undefined;
}
function decisionDependencies(model, scope, output) {
    var _a, _b;
    const directIds = (_a = output.decisions) !== null && _a !== void 0 ? _a : [];
    const directIdSet = new Set(directIds);
    const transitive = (_b = output.decisions_transitive) !== null && _b !== void 0 ? _b : [];
    const direct = directIds.map((id) => {
        var _a, _b;
        const metadata = transitive.find((candidate) => candidate.id === id);
        const resolved = resolveDecisionDependency(model, scope, id, metadata === null || metadata === void 0 ? void 0 : metadata.via);
        return {
            id,
            label: (_b = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.label) !== null && _a !== void 0 ? _a : resolved === null || resolved === void 0 ? void 0 : resolved.record.label) !== null && _b !== void 0 ? _b : id,
            via: metadata === null || metadata === void 0 ? void 0 : metadata.via,
            relationship: 'direct',
            record: resolved === null || resolved === void 0 ? void 0 : resolved.record,
            scope: resolved === null || resolved === void 0 ? void 0 : resolved.scope,
        };
    });
    const indirect = transitive
        .filter((dependency) => !directIdSet.has(dependency.id))
        .map((dependency) => {
        var _a, _b;
        const resolved = resolveDecisionDependency(model, scope, dependency.id, dependency.via);
        return {
            id: dependency.id,
            label: (_b = (_a = dependency.label) !== null && _a !== void 0 ? _a : resolved === null || resolved === void 0 ? void 0 : resolved.record.label) !== null && _b !== void 0 ? _b : dependency.id,
            via: dependency.via,
            relationship: 'indirect',
            record: resolved === null || resolved === void 0 ? void 0 : resolved.record,
            scope: resolved === null || resolved === void 0 ? void 0 : resolved.scope,
        };
    });
    return [...direct, ...indirect];
}
function upstreamRecords(model, scope, output) {
    var _a, _b, _c;
    const references = [
        ...((_a = output.inputs) !== null && _a !== void 0 ? _a : []).map((id) => ({ id })),
        ...((_b = output.inputs_root) !== null && _b !== void 0 ? _b : []).map((input) => ({ id: input.id, label: input.label })),
        ...(output.from ? [{ id: output.from }] : []),
    ];
    const records = new Map();
    for (const reference of references) {
        if (records.has(reference.id))
            continue;
        const resolved = resolveInventoryRecordReference(model, scope, reference.id);
        records.set(reference.id, {
            id: reference.id,
            label: (_c = reference.label) !== null && _c !== void 0 ? _c : resolved === null || resolved === void 0 ? void 0 : resolved.record.label,
            record: resolved === null || resolved === void 0 ? void 0 : resolved.record,
            scope: resolved === null || resolved === void 0 ? void 0 : resolved.scope,
        });
    }
    return [...records.values()];
}
/**
 * Host-neutral output detail body.
 *
 * MyST renders this inside InventoryDetailDialog. Other hosts, such as
 * JupyterLab, can supply their own panel chrome while preserving the exact
 * ASTRA result, description, recipe, and provenance presentation.
 */
export function OutputDetail({ record, scope, model, onOpenDependency, }) {
    var _a, _b, _c;
    const inputs = upstreamRecords(model, scope, record);
    const dependencies = decisionDependencies(model, scope, record);
    const directDependencies = dependencies.filter((dependency) => dependency.relationship === 'direct');
    const indirectDependencies = dependencies.filter((dependency) => dependency.relationship === 'indirect');
    const [showIndirectDependencies, setShowIndirectDependencies] = useState(false);
    useEffect(() => {
        setShowIndirectDependencies(false);
    }, [record.path]);
    const visibleDependencies = showIndirectDependencies
        ? dependencies
        : directDependencies;
    return (_jsxs("div", { className: "inventory-output-dialog__layout inventory-output-dialog__layout--stacked", children: [_jsx("div", { className: "inventory-output-dialog__result", children: _jsx("div", { className: `inventory-output-dialog__preview is-${(_a = record.type) !== null && _a !== void 0 ? _a : 'output'}`, children: _jsx(InventoryArtifactPreview, { record: record }) }) }), _jsx("div", { className: "inventory-output-provenance-slot", children: _jsxs("aside", { className: "inventory-output-provenance", "aria-label": "Output details", children: [_jsxs("header", { className: "inventory-output-provenance__header", children: [_jsx("span", { children: "Output details" }), _jsx("strong", { children: (_b = record.type) !== null && _b !== void 0 ? _b : 'output' })] }), record.description ? (_jsxs("section", { className: "inventory-output-description", children: [_jsx("h4", { children: "Description" }), _jsx("div", { className: "inventory-output-description__text", children: _jsx(InventoryProse, { text: record.description }) })] })) : null, ((_c = record.recipe) === null || _c === void 0 ? void 0 : _c.command) ? (_jsxs("details", { className: "inventory-output-recipe", open: true, children: [_jsx("summary", { children: "Recipe" }), _jsx("pre", { children: _jsx("code", { children: record.recipe.command }) }), record.recipe.container ? _jsxs("p", { children: ["Container: ", _jsx("code", { children: record.recipe.container })] }) : null] })) : _jsx("p", { className: "inventory-output-provenance__empty", children: "No recipe is declared for this output." }), _jsx(InventoryRelationList, { title: "Decision dependencies", className: "inventory-output-provenance__group inventory-output-dependencies", headerAction: indirectDependencies.length ? (_jsxs("label", { className: "inventory-dependency-toggle", children: [_jsx("input", { type: "checkbox", "aria-label": "Include indirect decision dependencies", checked: showIndirectDependencies, onChange: (event) => setShowIndirectDependencies(event.target.checked) }), _jsx("span", { children: "Include indirect" })] })) : undefined, items: visibleDependencies.map((dependency) => {
                                var _a;
                                return ({
                                    key: `${dependency.relationship}-${(_a = dependency.via) !== null && _a !== void 0 ? _a : 'local'}-${dependency.id}`,
                                    label: dependency.label,
                                    accessibleLabel: dependency.record
                                        ? `View ${dependency.relationship} decision dependency: ${dependency.label}`
                                        : undefined,
                                    onOpen: dependency.record && dependency.scope && onOpenDependency
                                        ? () => onOpenDependency(dependency.record, dependency.scope)
                                        : undefined,
                                });
                            }), empty: indirectDependencies.length
                                ? 'No decisions are referenced directly by this output recipe.'
                                : 'No decision dependencies are resolved in this snapshot.' }), _jsx(InventoryRelationList, { title: "Inputs and upstream outputs", className: "inventory-output-provenance__group inventory-output-provenance__group--scrollable", items: inputs.map((input) => {
                                var _a, _b;
                                return ({
                                    key: input.id,
                                    label: (_a = input.label) !== null && _a !== void 0 ? _a : input.id,
                                    accessibleLabel: input.record
                                        ? `View ${input.record.kind}: ${(_b = input.label) !== null && _b !== void 0 ? _b : input.id}`
                                        : undefined,
                                    onOpen: input.record && input.scope && onOpenDependency
                                        ? () => onOpenDependency(input.record, input.scope)
                                        : undefined,
                                });
                            }), empty: "No upstream dependencies are resolved in this snapshot." })] }) })] }));
}
export function OutputDialog({ record, scope, model, onOpenDependency, onBack, onClose, }) {
    var _a;
    return (_jsx(InventoryDetailDialog, { eyebrow: `${(_a = record.type) !== null && _a !== void 0 ? _a : 'output'} · ${scope.name}`, title: inventoryRecordTitle(record), identifier: record.label ? record.id : undefined, onBack: onBack, closeLabel: "Close output details", onClose: onClose, children: _jsx(OutputDetail, { record: record, scope: scope, model: model, onOpenDependency: onOpenDependency }) }));
}
export function OutputsInventory({ model, scopeId, onOpenOutput }) {
    const scope = getInventoryScope(model, scopeId);
    const records = scope ? inventoryRecordsOfKind(scope, 'output') : [];
    const figures = records.filter((record) => record.type === 'figure');
    const tables = records.filter((record) => record.type === 'table');
    const additional = records.filter((record) => record.type !== 'figure' && record.type !== 'table');
    if (!scope || records.length === 0) {
        return (_jsx(InventoryEmptyState, { className: "inventory-output-empty", children: "No outputs are declared in this analysis." }));
    }
    return (_jsxs("div", { className: "inventory-outputs", children: [_jsx(OutputGallery, { id: "figures", title: "Figures", records: figures, onOpen: (record) => onOpenOutput(record, scope) }), _jsx(OutputGallery, { id: "tables", title: "Tables", records: tables, onOpen: (record) => onOpenOutput(record, scope) }), _jsx(Files, { records: additional, onOpen: (record) => onOpenOutput(record, scope) })] }));
}
//# sourceMappingURL=OutputsInventory.js.map