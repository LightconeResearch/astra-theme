import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { DecisionDialog, DecisionsInventory } from './DecisionsInventory';
import { FindingDialog, FindingsInventory } from './FindingsInventory';
import { InputDialog, InputsInventory } from './InputsInventory';
import { InsightDetailDialog } from './InsightDetailDialog';
import { OutputDialog, OutputsInventory } from './OutputsInventory';
import { PaperDialog, PapersInventory, paperRecords, } from './PapersInventory';
import { createInventoryModel, getInventoryScope, inventoryScopeForRecord, resolveInventoryRecordReference, } from './model';
import { normalizeDoi } from './citationMetadata';
const EMPTY_PAPER_METADATA = {};
export function InventoryExplorer({ snapshot, scopeId = 'root', paperMetadata = EMPTY_PAPER_METADATA, paperPdfAssetBaseUrl, decisionTagLabels = {}, dialogsOnly = false, openReference, onClose, onOpenReference, }) {
    const [modalStack, setModalStack] = useState([]);
    const model = useMemo(() => snapshot ? createInventoryModel(snapshot) : undefined, [snapshot]);
    useEffect(() => setModalStack([]), [scopeId]);
    useEffect(() => {
        var _a, _b, _c;
        if (!model || !openReference)
            return;
        const fallbackScope = (_a = getInventoryScope(model, scopeId)) !== null && _a !== void 0 ? _a : model.snapshot.scopes[0];
        if (!fallbackScope)
            return;
        if (openReference.kind === 'paper') {
            const paper = paperRecords(model, fallbackScope, paperMetadata)
                .find((candidate) => normalizeDoi(candidate.doi) === normalizeDoi(openReference.doi));
            if (!paper)
                return;
            setModalStack([{
                    kind: 'paper',
                    paper,
                    scopeId: fallbackScope.id,
                }]);
            return;
        }
        const located = (_b = (openReference.path
            ? model.recordByPath.get(openReference.path)
            : undefined)) !== null && _b !== void 0 ? _b : resolveInventoryRecordReference(model, fallbackScope, (_c = openReference.path) !== null && _c !== void 0 ? _c : openReference.id, openReference.kind);
        if (!located || located.record.kind !== openReference.kind)
            return;
        const { record, scope } = located;
        if (record.kind === 'prior_insight') {
            setModalStack([{
                    kind: 'insight',
                    record: record,
                    scopeId: scope.id,
                }]);
        }
        else {
            setModalStack([{ kind: record.kind, record, scopeId: scope.id }]);
        }
    }, [model, openReference, paperMetadata, scopeId]);
    const startModal = (entry) => setModalStack([entry]);
    const openFromOverview = (entry) => {
        if (!onOpenReference) {
            startModal(entry);
            return;
        }
        if (entry.kind === 'paper') {
            onOpenReference({ kind: 'paper', doi: entry.paper.doi }, entry.scopeId);
            return;
        }
        onOpenReference({
            kind: entry.kind === 'insight'
                ? 'prior_insight'
                : entry.kind,
            id: entry.record.id,
            path: entry.record.path,
        }, entry.scopeId);
    };
    const pushModal = (entry) => setModalStack((stack) => [...stack, entry]);
    const goBack = () => setModalStack((stack) => stack.slice(0, -1));
    const closeAll = () => {
        setModalStack([]);
        onClose === null || onClose === void 0 ? void 0 : onClose();
    };
    const activeModal = modalStack[modalStack.length - 1];
    const activeScope = model && activeModal
        ? getInventoryScope(model, activeModal.scopeId)
        : undefined;
    const backAction = modalStack.length > 1 ? goBack : undefined;
    let modal = null;
    if (model && activeModal && activeScope) {
        if (activeModal.kind === 'output') {
            modal = (_jsx(OutputDialog, { record: activeModal.record, scope: activeScope, model: model, onOpenDependency: (record, scope) => {
                    if (record.kind === 'output'
                        || record.kind === 'input'
                        || record.kind === 'decision') {
                        pushModal({ kind: record.kind, record, scopeId: scope.id });
                    }
                }, onBack: backAction, onClose: closeAll }));
        }
        else if (activeModal.kind === 'input') {
            modal = (_jsx(InputDialog, { record: activeModal.record, scope: activeScope, onBack: backAction, onClose: closeAll }));
        }
        else if (activeModal.kind === 'decision') {
            modal = (_jsx(DecisionDialog, { record: activeModal.record, scope: activeScope, model: model, onOpenInsight: (insight) => pushModal({
                    kind: 'insight',
                    record: insight,
                    scopeId: inventoryScopeForRecord(model, insight, activeScope).id,
                }), onBack: backAction, onClose: closeAll }));
        }
        else if (activeModal.kind === 'finding') {
            modal = (_jsx(FindingDialog, { record: activeModal.record, scope: activeScope, model: model, onOpenEvidence: (output, scope) => pushModal({
                    kind: 'output',
                    record: output,
                    scopeId: scope.id,
                }), onBack: backAction, onClose: closeAll }));
        }
        else if (activeModal.kind === 'insight') {
            const insightDoi = activeModal.record.doi;
            const sourcePaper = insightDoi
                ? paperRecords(model, activeScope, paperMetadata)
                    .find((paper) => normalizeDoi(paper.doi) === normalizeDoi(insightDoi))
                : undefined;
            modal = (_jsx(InsightDetailDialog, { insight: activeModal.record, model: model, scope: activeScope, onOpenSource: sourcePaper ? () => pushModal({
                    kind: 'paper',
                    paper: sourcePaper,
                    scopeId: activeScope.id,
                    focusInsight: activeModal.record,
                }) : undefined, onOpenDecision: (decision) => pushModal({
                    kind: 'decision',
                    record: decision,
                    scopeId: inventoryScopeForRecord(model, decision, activeScope).id,
                }), onBack: backAction, onClose: closeAll }));
        }
        else {
            modal = (_jsx(PaperDialog, { paper: activeModal.paper, scope: activeScope, initialFocusInsight: activeModal.focusInsight, pdfAssetBaseUrl: paperPdfAssetBaseUrl, onOpenInsight: (insight) => pushModal({
                    kind: 'insight',
                    record: insight,
                    scopeId: inventoryScopeForRecord(model, insight, activeScope).id,
                }), onOpenDecision: (decision) => pushModal({
                    kind: 'decision',
                    record: decision,
                    scopeId: inventoryScopeForRecord(model, decision, activeScope).id,
                }), onBack: backAction, onClose: closeAll }));
        }
    }
    if (dialogsOnly)
        return _jsx(_Fragment, { children: modal });
    const sections = [
        {
            id: 'outputs',
            label: 'Outputs',
            content: model ? (_jsx(OutputsInventory, { model: model, scopeId: scopeId, onOpenOutput: (record, scope) => openFromOverview({
                    kind: 'output',
                    record,
                    scopeId: scope.id,
                }) })) : null,
        },
        {
            id: 'decisions',
            label: 'Decisions',
            content: model ? (_jsx(DecisionsInventory, { model: model, scopeId: scopeId, tagLabels: decisionTagLabels, onOpenDecision: (record, scope) => openFromOverview({
                    kind: 'decision',
                    record,
                    scopeId: scope.id,
                }) })) : null,
        },
        {
            id: 'inputs',
            label: 'Inputs',
            content: model ? (_jsx(InputsInventory, { model: model, scopeId: scopeId, onOpenInput: (record, scope) => openFromOverview({
                    kind: 'input',
                    record,
                    scopeId: scope.id,
                }) })) : null,
        },
        {
            id: 'findings',
            label: 'Findings',
            content: model ? (_jsx(FindingsInventory, { model: model, scopeId: scopeId, onOpenFinding: (record, scope) => openFromOverview({
                    kind: 'finding',
                    record,
                    scopeId: scope.id,
                }) })) : null,
        },
        {
            id: 'papers',
            label: 'Papers',
            content: model ? (_jsx(PapersInventory, { model: model, scopeId: scopeId, paperMetadata: paperMetadata, onOpenPaper: (paper, scope) => openFromOverview({
                    kind: 'paper',
                    paper,
                    scopeId: scope.id,
                }) })) : null,
        },
    ];
    return (_jsxs("div", { className: "inventory-outline", children: [_jsx("div", { className: "inventory-outline__sections", children: sections.map((item, index) => (_jsxs("section", { className: `inventory-outline__section inventory-outline__section--${item.id}`, children: [_jsx("h2", { id: item.id, tabIndex: -1, children: _jsxs("span", { className: "heading-text", children: [index + 1, ". ", item.label] }) }), item.content, !model ? (_jsx("div", { className: "inventory-outline__empty-slot", "aria-hidden": "true" })) : null] }, item.id))) }), modal] }));
}
/** Backwards-compatible name for the inventory's original public entry point. */
export const InventoryOutline = InventoryExplorer;
//# sourceMappingURL=InventoryOutline.js.map