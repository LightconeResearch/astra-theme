import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { InventoryProse } from './InventoryProse';
import { InsightDetailTrigger } from './InsightDetailDialog';
import { InventoryCountHeading, InventoryDetailDialog, InventoryDetailLayout, InventoryDetailMain, InventoryDetailProse, InventoryEmptyState, InventoryRecordIdentity, InventoryRecordList, } from './InventoryPrimitives';
import { getInventoryScope, inventoryDecisionInsights, inventoryRecordTitle, inventoryRecordsOfKind, selectedOptionLabel, } from './model';
function tagLabel(tag, labels) {
    var _a;
    return (_a = labels[tag]) !== null && _a !== void 0 ? _a : tag.replace(/_/g, ' ').replace(/^./, (character) => character.toUpperCase());
}
export function DecisionDialog({ record, scope, model, onOpenInsight, onBack, onClose, }) {
    var _a;
    const options = Object.entries((_a = record.options) !== null && _a !== void 0 ? _a : {});
    const insights = inventoryDecisionInsights(model, scope, record);
    return (_jsx(InventoryDetailDialog, { eyebrow: `Decision · ${scope.name}`, title: inventoryRecordTitle(record), identifier: record.id, onBack: onBack, closeLabel: "Close decision details", onClose: onClose, children: _jsx(InventoryDetailLayout, { className: "inventory-record-detail__layout--single", children: _jsxs(InventoryDetailMain, { children: [record.rationale ? (_jsx(InventoryDetailProse, { label: "Rationale", children: _jsx(InventoryProse, { text: record.rationale }) })) : null, _jsxs("section", { className: "inventory-decision-options", "aria-labelledby": "inventory-decision-options-title", children: [_jsx("h4", { id: "inventory-decision-options-title", children: "Options" }), _jsx("ul", { children: options.map(([id, label]) => {
                                    const selected = id === record.selected;
                                    return (_jsxs("li", { className: selected ? 'is-selected' : undefined, children: [_jsx("span", { className: "inventory-decision-options__marker", "aria-hidden": "true", children: selected ? '●' : '○' }), _jsxs("span", { children: [_jsx("strong", { children: label !== null && label !== void 0 ? label : id }), _jsx("code", { children: id })] }), selected ? _jsx("small", { children: "Selected" }) : null] }, id));
                                }) })] }), _jsxs("section", { className: "inventory-insight-list", children: [_jsx(InventoryCountHeading, { title: "Insights", count: insights.length }), insights.length ? (_jsx("ul", { className: "inventory-decision-insights", children: insights.map((insight) => (_jsx("li", { children: _jsx(InsightDetailTrigger, { insight: insight, variant: "claim", onOpen: () => onOpenInsight(insight) }) }, insight.path))) })) : _jsx("p", { children: "No prior insights are linked to this decision." })] })] }) }) }));
}
export function DecisionsInventory({ model, scopeId, tagLabels = {}, onOpenDecision, }) {
    const [tagFilter, setTagFilter] = useState('all');
    const scope = getInventoryScope(model, scopeId);
    useEffect(() => {
        setTagFilter('all');
    }, [scopeId]);
    const records = scope ? inventoryRecordsOfKind(scope, 'decision') : [];
    const tags = [...new Set(records.flatMap((record) => { var _a; return (_a = record.tags) !== null && _a !== void 0 ? _a : []; }))];
    const visibleRecords = tagFilter === 'all'
        ? records
        : records.filter((record) => { var _a; return (_a = record.tags) === null || _a === void 0 ? void 0 : _a.includes(tagFilter); });
    if (!scope || !records.length) {
        return _jsx(InventoryEmptyState, { children: "No decisions are declared in this analysis." });
    }
    return (_jsxs("div", { className: "inventory-records inventory-records--decisions", children: [tags.length ? (_jsxs("div", { className: "inventory-record-filter", children: [_jsxs("select", { "aria-label": "Decision tag", value: tagFilter, onChange: (event) => setTagFilter(event.target.value), children: [_jsxs("option", { value: "all", children: ["All tags (", records.length, ")"] }), tags.map((tag) => (_jsxs("option", { value: tag, children: [tagLabel(tag, tagLabels), " (", records.filter((record) => { var _a; return (_a = record.tags) === null || _a === void 0 ? void 0 : _a.includes(tag); }).length, ")"] }, tag)))] }), _jsxs("span", { children: [visibleRecords.length, " ", visibleRecords.length === 1 ? 'decision' : 'decisions'] })] })) : null, _jsx(InventoryRecordList, { ariaLabel: "Decisions", columnTemplate: "minmax(14rem, 1.4fr) minmax(12rem, 1fr) 1.5rem", columns: [
                    { label: 'Decision', className: 'inventory-record-list__primary' },
                    { label: 'Selected option', className: 'inventory-record-list__selection' },
                    { className: 'inventory-record-list__arrow' },
                ], rows: visibleRecords.map((record) => ({
                    key: record.path,
                    accessibleLabel: `${inventoryRecordTitle(record)}, selected option ${selectedOptionLabel(record)}`,
                    onOpen: () => onOpenDecision(record, scope),
                    cells: [
                        _jsx(InventoryRecordIdentity, { kind: "decision", title: inventoryRecordTitle(record) }),
                        _jsx("span", { className: "inventory-record-list__selected", children: selectedOptionLabel(record) }),
                        _jsx("span", { "aria-hidden": "true", children: "\u2192" }),
                    ],
                })) })] }));
}
//# sourceMappingURL=DecisionsInventory.js.map