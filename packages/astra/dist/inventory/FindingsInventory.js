import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { InventoryProse } from './InventoryProse';
import { InventoryArtifactPreview } from './InventoryArtifactPreview';
import { InventoryCountHeading, InventoryDetailDialog, InventoryDetailLayout, InventoryDetailMain, InventoryDetailProse, InventoryEmptyState, InventoryRecordList, } from './InventoryPrimitives';
import { getInventoryScope, inventoryRecordTitle, inventoryRecordsOfKind, resolveInventoryRecordReference, } from './model';
function evidenceLabel(count) {
    return `${count} ${count === 1 ? 'artifact' : 'artifacts'}`;
}
function findingEvidence(model, scope, finding) {
    var _a;
    return ((_a = finding.evidence) !== null && _a !== void 0 ? _a : []).map((evidence) => {
        const resolved = evidence.artifact
            ? resolveInventoryRecordReference(model, scope, evidence.artifact)
            : undefined;
        return {
            artifact: evidence.artifact,
            quote: evidence.quote,
            record: resolved === null || resolved === void 0 ? void 0 : resolved.record,
            scope: resolved === null || resolved === void 0 ? void 0 : resolved.scope,
        };
    });
}
export function FindingDialog({ record, scope, model, onOpenEvidence, onBack, onClose, }) {
    const evidence = findingEvidence(model, scope, record);
    return (_jsx(InventoryDetailDialog, { eyebrow: `Finding · ${scope.name}`, title: inventoryRecordTitle(record), identifier: record.label ? record.id : undefined, onBack: onBack, closeLabel: "Close finding details", onClose: onClose, children: _jsx(InventoryDetailLayout, { className: "inventory-finding-detail inventory-record-detail__layout--single", children: _jsxs(InventoryDetailMain, { as: "main", children: [record.claim ? (_jsx(InventoryDetailProse, { label: "Finding", className: "inventory-finding-detail__claim", children: _jsx(InventoryProse, { text: record.claim }) })) : null, record.notes ? (_jsxs("section", { className: "inventory-finding-detail__notes", children: [_jsx("h4", { children: "Notes" }), _jsx("div", { children: _jsx(InventoryProse, { text: record.notes }) })] })) : null, _jsxs("section", { className: "inventory-finding-evidence-previews", children: [_jsx(InventoryCountHeading, { title: "Evidence", count: evidence.length }), evidence.length ? (_jsx("div", { className: "inventory-finding-evidence-previews__list", children: evidence.map((item, index) => {
                                    var _a, _b, _c, _d, _e, _f, _g;
                                    const title = (_e = (_d = (_b = (_a = item.record) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : (_c = item.record) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : item.artifact) !== null && _e !== void 0 ? _e : `Evidence ${index + 1}`;
                                    return (_jsxs("article", { className: "inventory-finding-evidence-preview", children: [item.record && item.scope ? (_jsxs("button", { type: "button", className: "inventory-finding-evidence-preview__open", "aria-label": `View evidence output: ${title}`, onClick: () => onOpenEvidence(item.record, item.scope), children: [_jsxs("span", { children: [_jsx("strong", { children: title }), _jsx("code", { children: item.record.path })] }), _jsx("span", { "aria-hidden": "true", children: "\u2192" })] })) : (_jsxs("div", { className: "inventory-finding-evidence-preview__unresolved", children: [_jsx("strong", { children: title }), item.artifact ? _jsx("code", { children: item.artifact }) : null] })), item.record ? (_jsx("div", { className: `inventory-output-dialog__preview inventory-finding-evidence-preview__media is-${(_f = item.record.type) !== null && _f !== void 0 ? _f : 'output'}`, children: _jsx(InventoryArtifactPreview, { record: item.record }) })) : null, item.quote ? (_jsx("blockquote", { children: _jsx(InventoryProse, { text: item.quote }) })) : null] }, `${(_g = item.artifact) !== null && _g !== void 0 ? _g : 'evidence'}-${index}`));
                                }) })) : _jsx("p", { children: "No evidence artifacts are linked to this finding." })] })] }) }) }));
}
export function FindingsInventory({ model, scopeId, onOpenFinding, }) {
    const scope = getInventoryScope(model, scopeId);
    const records = scope ? inventoryRecordsOfKind(scope, 'finding') : [];
    if (!scope || !records.length) {
        return _jsx(InventoryEmptyState, { children: "No findings are declared in this analysis." });
    }
    return (_jsx("div", { className: "inventory-records inventory-records--findings", children: _jsx(InventoryRecordList, { ariaLabel: "Findings", columnTemplate: "minmax(18rem, 1fr) 7rem 1.5rem", columns: [
                { label: 'Finding', className: 'inventory-record-list__primary' },
                { label: 'Evidence', className: 'inventory-record-list__count inventory-record-list__secondary' },
                { className: 'inventory-record-list__arrow' },
            ], rows: records.map((record) => {
                var _a, _b, _c, _d;
                const count = (_b = (_a = record.evidence) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
                return {
                    key: record.path,
                    accessibleLabel: `${inventoryRecordTitle(record)}: ${(_c = record.claim) !== null && _c !== void 0 ? _c : 'Finding claim unavailable'} ${evidenceLabel(count)}`,
                    onOpen: () => onOpenFinding(record, scope),
                    cells: [
                        _jsxs("span", { className: "inventory-record-list__name inventory-finding-list__claim", children: [_jsx("span", { className: "inventory-record-list__glyph", "aria-hidden": "true", children: "\u25CF" }), _jsxs("span", { children: [record.label ? _jsx("small", { children: record.label }) : null, _jsx("strong", { children: (_d = record.claim) !== null && _d !== void 0 ? _d : inventoryRecordTitle(record) })] })] }),
                        _jsx("span", { children: evidenceLabel(count) }),
                        _jsx("span", { "aria-hidden": "true", children: "\u2192" }),
                    ],
                };
            }) }) }));
}
//# sourceMappingURL=FindingsInventory.js.map