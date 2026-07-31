import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { InsightEvidenceTitle } from '../card/InsightEvidenceTitle';
import { insightEvidenceName } from '../card/insightEvidenceName';
import { InventoryProse } from './InventoryProse';
import { InventoryDetailDialog, InventoryDetailLayout, InventoryDetailMain, InventoryDetailProse, InventoryDetailRail, } from './InventoryPrimitives';
import { InventoryRelationList } from './InventoryRelations';
import { doiHref } from './citationMetadata';
import { inventoryInformedDecisions, inventoryRecordTitle, } from './model';
export function InsightDetailTrigger({ insight, onOpen, tag = 'prior insight', variant = 'title', }) {
    var _a;
    const title = insightEvidenceName(insight);
    if (variant === 'claim') {
        return (_jsxs("div", { className: "inventory-insight-trigger inventory-insight-trigger--claim", role: "button", tabIndex: 0, "aria-label": `Open insight details: ${title}`, onClick: onOpen, onKeyDown: (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpen();
                }
            }, children: [_jsx("span", { className: "astra-evidence__glyph--insight", "aria-hidden": "true", children: "\u25C8" }), _jsx("div", { className: "inventory-insight-trigger__claim", children: _jsx(InventoryProse, { text: (_a = insight.claim) !== null && _a !== void 0 ? _a : title }) })] }));
    }
    return (_jsx("button", { type: "button", className: "astra-ref-trigger inventory-insight-trigger", "aria-label": `Open insight details: ${title}`, onClick: onOpen, children: _jsx(InsightEvidenceTitle, { entry: insight, name: title, tag: tag }) }));
}
export function InsightDetailDialog({ insight, model, scope, onOpenSource, onOpenDecision, onBack, onClose, }) {
    const decisions = inventoryInformedDecisions(model, scope, insight);
    const title = insightEvidenceName(insight);
    return (_jsx(InventoryDetailDialog, { eyebrow: `Insight · ${scope.name}`, title: title, identifier: insight.label ? insight.id : undefined, onBack: onBack, closeLabel: "Close insight details", onClose: onClose, children: _jsxs(InventoryDetailLayout, { className: "inventory-insight-detail", children: [_jsxs(InventoryDetailMain, { as: "main", children: [insight.claim ? (_jsx(InventoryDetailProse, { label: "Claim", children: _jsx(InventoryProse, { text: insight.claim }) })) : null, insight.quote ? (_jsxs("section", { className: "inventory-insight-detail__source-quote", children: [_jsx("h4", { children: "Source quote" }), _jsx("blockquote", { children: _jsx(InventoryProse, { text: insight.quote }) }), insight.doi && onOpenSource ? (_jsxs("button", { type: "button", className: "inventory-insight-detail__open-source", onClick: onOpenSource, children: ["View quote in paper ", _jsx("span", { "aria-hidden": "true", children: "\u2192" })] })) : null] })) : null, insight.notes ? (_jsxs("section", { className: "inventory-insight-detail__notes", children: [_jsx("h4", { children: "Notes" }), _jsx("div", { children: _jsx(InventoryProse, { text: insight.notes }) })] })) : null] }), _jsxs(InventoryDetailRail, { label: "Insight details", children: [insight.doi ? (_jsxs("section", { className: "inventory-paper-doi", children: [_jsx("h4", { children: "Source paper" }), _jsxs("a", { href: doiHref(insight.doi), target: "_blank", rel: "noreferrer", children: [insight.doi, insight.page ? ` · page ${insight.page}` : '', " \u2197"] })] })) : null, _jsx(InventoryRelationList, { title: "Informs", items: decisions.map((decision) => ({
                                key: decision.path,
                                label: inventoryRecordTitle(decision),
                                identifier: decision.path,
                                accessibleLabel: `View decision: ${inventoryRecordTitle(decision)}`,
                                onOpen: onOpenDecision ? () => onOpenDecision(decision) : undefined,
                            })), empty: "No decisions in this scope cite this insight." })] })] }) }));
}
//# sourceMappingURL=InsightDetailDialog.js.map