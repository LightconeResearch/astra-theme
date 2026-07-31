import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { InventoryProse } from './InventoryProse';
import { InventoryDetailDialog, InventoryDetailLayout, InventoryDetailMain, InventoryDetailProse, InventoryEmptyState, InventoryRecordIdentity, InventoryRecordList, } from './InventoryPrimitives';
import { getInventoryScope, inventoryRecordTitle, inventoryRecordsOfKind, } from './model';
function sourceLabel(record) {
    var _a, _b;
    return (_b = (_a = record.source) !== null && _a !== void 0 ? _a : record.from) !== null && _b !== void 0 ? _b : 'Source not declared';
}
export function InputDialog({ record, scope, onBack, onClose, }) {
    var _a;
    return (_jsx(InventoryDetailDialog, { eyebrow: `Input · ${(_a = record.type) !== null && _a !== void 0 ? _a : 'data'} · ${scope.name}`, title: inventoryRecordTitle(record), identifier: record.label ? record.id : undefined, onBack: onBack, closeLabel: "Close input details", onClose: onClose, children: _jsx(InventoryDetailLayout, { className: "inventory-record-detail__layout--single", children: _jsxs(InventoryDetailMain, { children: [record.description ? (_jsx(InventoryDetailProse, { label: "Description", children: _jsx(InventoryProse, { text: record.description }) })) : null, _jsxs("section", { className: "inventory-input-source", children: [_jsx("h4", { children: record.from ? 'Resolved from' : 'Source' }), _jsx("code", { children: sourceLabel(record) })] })] }) }) }));
}
export function InputsInventory({ model, scopeId, onOpenInput }) {
    const scope = getInventoryScope(model, scopeId);
    const records = scope ? inventoryRecordsOfKind(scope, 'input') : [];
    if (!scope || !records.length) {
        return _jsx(InventoryEmptyState, { children: "No inputs are declared in this analysis." });
    }
    return (_jsx("div", { className: "inventory-records inventory-records--inputs", children: _jsx(InventoryRecordList, { ariaLabel: "Inputs", columnTemplate: "minmax(14rem, 1.2fr) minmax(12rem, 1fr) 1.5rem", columns: [
                { label: 'Input', className: 'inventory-record-list__primary' },
                { label: 'Source', className: 'inventory-record-list__source' },
                { className: 'inventory-record-list__arrow' },
            ], rows: records.map((record) => ({
                key: record.path,
                accessibleLabel: inventoryRecordTitle(record),
                onOpen: () => onOpenInput(record, scope),
                cells: [
                    _jsx(InventoryRecordIdentity, { kind: "input", title: inventoryRecordTitle(record) }),
                    _jsx("code", { title: sourceLabel(record), children: sourceLabel(record) }),
                    _jsx("span", { "aria-hidden": "true", children: "\u2192" }),
                ],
            })) }) }));
}
//# sourceMappingURL=InputsInventory.js.map