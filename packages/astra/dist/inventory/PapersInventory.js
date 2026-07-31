import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useRef, useState } from 'react';
import { InventoryProse } from './InventoryProse';
import { InsightDetailTrigger } from './InsightDetailDialog';
import { InventoryCountHeading, InventoryDetailDialog, InventoryEmptyState, InventoryRecordIdentity, InventoryRecordList, } from './InventoryPrimitives';
import { InventoryRelationList } from './InventoryRelations';
import { PaperPdfViewer } from './PaperPdfViewer';
import { citationTitleFromHtml, directCitationPdfUrl, doiHref, normalizeDoi, } from './citationMetadata';
import { getInventoryScope, inventoryDecisionInsights, inventoryRecordTitle, inventoryRecordsOfKind, inventoryScopesForView, } from './model';
export function paperMetadataFromCitations(citations) {
    if (!citations || typeof citations !== 'object')
        return {};
    return Object.fromEntries(Object.values(citations).flatMap((citation) => {
        const doi = typeof (citation === null || citation === void 0 ? void 0 : citation.doi) === 'string'
            ? normalizeDoi(citation.doi)
            : undefined;
        const title = citationTitleFromHtml(citation === null || citation === void 0 ? void 0 : citation.html);
        const pdfUrl = directCitationPdfUrl(citation === null || citation === void 0 ? void 0 : citation.url);
        return doi && (title || pdfUrl) ? [[doi, { title, pdfUrl }]] : [];
    }));
}
function paperFromDoi(doi, paperMetadata) {
    var _a, _b, _c, _d;
    const canonicalDoi = normalizeDoi(doi);
    const metadata = (_a = paperMetadata[canonicalDoi]) !== null && _a !== void 0 ? _a : paperMetadata[doi];
    const arxivId = (_b = /^10\.48550\/arxiv\.(.+)$/i.exec(canonicalDoi)) === null || _b === void 0 ? void 0 : _b[1];
    const arxivPdfId = arxivId === null || arxivId === void 0 ? void 0 : arxivId.split('/').map((segment) => encodeURIComponent(segment)).join('/');
    return {
        doi: canonicalDoi,
        title: (_c = metadata === null || metadata === void 0 ? void 0 : metadata.title) !== null && _c !== void 0 ? _c : (arxivId ? `arXiv ${arxivId}` : canonicalDoi),
        authors: metadata === null || metadata === void 0 ? void 0 : metadata.authors,
        pdfUrl: (_d = metadata === null || metadata === void 0 ? void 0 : metadata.pdfUrl) !== null && _d !== void 0 ? _d : (arxivPdfId ? `https://arxiv.org/pdf/${arxivPdfId}` : undefined),
        insights: [],
        decisions: [],
    };
}
function normalizedDoi(doi) {
    return normalizeDoi(doi);
}
function insightDois(insight) {
    var _a;
    const dois = [
        insight.doi,
        ...((_a = insight.evidence) !== null && _a !== void 0 ? _a : []).map((evidence) => evidence.doi),
    ].filter((doi) => Boolean(doi));
    return dois.filter((doi, index) => dois.findIndex((candidate) => normalizedDoi(candidate) === normalizedDoi(doi)) === index);
}
function paperEvidence(insight, doi) {
    var _a;
    const matching = ((_a = insight.evidence) !== null && _a !== void 0 ? _a : []).filter((evidence) => {
        var _a, _b;
        return evidence.quote
            && normalizedDoi((_b = (_a = evidence.doi) !== null && _a !== void 0 ? _a : insight.doi) !== null && _b !== void 0 ? _b : '') === normalizedDoi(doi);
    });
    if (matching.length)
        return matching;
    return insight.quote && insight.doi
        && normalizedDoi(insight.doi) === normalizedDoi(doi)
        ? [{ doi: insight.doi, quote: insight.quote, page: insight.page }]
        : [];
}
export function paperRecords(model, scope, paperMetadata = {}) {
    var _a, _b, _c, _d, _e;
    const scopes = inventoryScopesForView(model, scope);
    const insights = new Map();
    const decisions = new Map();
    for (const candidate of scopes) {
        for (const record of inventoryRecordsOfKind(candidate, 'decision')) {
            decisions.set(record.path, record);
        }
        for (const record of inventoryRecordsOfKind(candidate, 'prior_insight')) {
            insights.set(record.path, record);
        }
    }
    if (scope.parent) {
        for (const decision of decisions.values()) {
            const decisionScope = (_b = (_a = model.recordByPath.get(decision.path)) === null || _a === void 0 ? void 0 : _a.scope) !== null && _b !== void 0 ? _b : scope;
            for (const insight of inventoryDecisionInsights(model, decisionScope, decision)) {
                insights.set(insight.path, insight);
            }
        }
    }
    const papers = new Map();
    for (const insight of insights.values()) {
        for (const doi of insightDois(insight)) {
            const key = normalizedDoi(doi);
            const paper = (_c = papers.get(key)) !== null && _c !== void 0 ? _c : paperFromDoi(doi, paperMetadata);
            if (!paper.insights.some((candidate) => candidate.path === insight.path)) {
                paper.insights.push(insight);
            }
            papers.set(key, paper);
        }
    }
    for (const decision of decisions.values()) {
        const decisionScope = (_e = (_d = model.recordByPath.get(decision.path)) === null || _d === void 0 ? void 0 : _d.scope) !== null && _e !== void 0 ? _e : scope;
        const dois = new Set(inventoryDecisionInsights(model, decisionScope, decision)
            .flatMap(insightDois)
            .map(normalizedDoi));
        for (const key of dois) {
            const paper = papers.get(key);
            if (paper)
                paper.decisions.push(decision);
        }
    }
    return [...papers.values()].sort((left, right) => left.doi.localeCompare(right.doi));
}
export function PaperDialog({ paper, scope, initialFocusInsight, pdfAssetBaseUrl, onOpenInsight, onOpenDecision, onBack, onClose, }) {
    const initialEvidence = initialFocusInsight
        ? paperEvidence(initialFocusInsight, paper.doi)[0]
        : undefined;
    const [focusRequest, setFocusRequest] = useState(() => (initialFocusInsight && (initialEvidence === null || initialEvidence === void 0 ? void 0 : initialEvidence.quote) ? {
        key: `${initialFocusInsight.id}-source`,
        insightId: initialFocusInsight.id,
        quote: initialEvidence.quote,
        page: initialEvidence.page,
    } : undefined));
    const focusSequence = useRef(0);
    const focusInsight = (insight, evidence) => {
        if (!evidence.quote)
            return;
        focusSequence.current += 1;
        setFocusRequest({
            key: `${insight.id}-${focusSequence.current}`,
            insightId: insight.id,
            quote: evidence.quote,
            page: evidence.page,
        });
    };
    return (_jsx(InventoryDetailDialog, { className: "inventory-detail-dialog--paper", eyebrow: `Paper · ${scope.name}`, title: paper.title, onBack: onBack, closeLabel: "Close paper details", onClose: onClose, children: _jsxs("div", { className: "inventory-paper-dialog__layout", children: [paper.pdfUrl ? (_jsx(PaperPdfViewer, { pdfUrl: paper.pdfUrl, title: paper.title, focusRequest: focusRequest, pdfAssetBaseUrl: pdfAssetBaseUrl })) : _jsx("p", { className: "inventory-paper-dialog__unavailable", children: "No PDF source is available for this paper." }), _jsxs("aside", { className: "inventory-paper-dialog__rail", "aria-label": "Paper insights and decisions", children: [_jsxs("section", { className: "inventory-insight-list", children: [_jsx(InventoryCountHeading, { title: "Insights from this paper", count: paper.insights.length }), _jsx("ul", { className: "astra-evidence", children: paper.insights.map((insight) => {
                                        const evidence = paperEvidence(insight, paper.doi);
                                        return (_jsxs("li", { className: "astra-evidence__item", children: [_jsx(InsightDetailTrigger, { insight: insight, onOpen: () => onOpenInsight(insight) }), insight.label && insight.claim ? (_jsx("div", { className: "astra-evidence__note", children: _jsx(InventoryProse, { text: insight.claim }) })) : null, evidence.map((source, index) => (_jsxs(Fragment, { children: [_jsx("blockquote", { className: "inventory-paper-insight__quote", children: source.quote }), paper.pdfUrl ? (_jsx("button", { type: "button", className: "inventory-paper-insight__locate", onClick: () => focusInsight(insight, source), children: "Locate quote in PDF" })) : null] }, `${insight.path}-${index}`)))] }, insight.path));
                                    }) })] }), _jsxs("section", { className: "inventory-paper-doi", children: [_jsx("h4", { children: "DOI" }), _jsxs("a", { href: doiHref(paper.doi), target: "_blank", rel: "noreferrer", children: [paper.doi, " \u2197"] })] }), _jsx(InventoryRelationList, { title: "Informs", items: paper.decisions.map((decision) => ({
                                key: decision.path,
                                label: inventoryRecordTitle(decision),
                                identifier: decision.path,
                                accessibleLabel: `View decision: ${inventoryRecordTitle(decision)}`,
                                onOpen: () => onOpenDecision(decision),
                            })), empty: "No decisions in this scope cite insights from this paper." })] })] }) }));
}
export function PapersInventory({ model, scopeId, paperMetadata = {}, onOpenPaper, }) {
    const scope = getInventoryScope(model, scopeId);
    const papers = scope ? paperRecords(model, scope, paperMetadata) : [];
    if (!scope || !papers.length) {
        return (_jsx(InventoryEmptyState, { children: "No supporting papers are linked to this analysis." }));
    }
    return (_jsx("div", { className: "inventory-records inventory-records--papers", children: _jsx(InventoryRecordList, { ariaLabel: "Papers", columnTemplate: "minmax(16rem, 1.7fr) 7rem 7rem 1.5rem", columns: [
                { label: 'Paper', className: 'inventory-record-list__primary' },
                { label: 'Insights', className: 'inventory-record-list__count' },
                { label: 'Decisions', className: 'inventory-record-list__count' },
                { className: 'inventory-record-list__arrow' },
            ], rows: papers.map((paper) => ({
                key: paper.doi,
                accessibleLabel: `${paper.title}, ${paper.doi}, ${paper.insights.length} insights, ${paper.decisions.length} decisions`,
                onOpen: () => onOpenPaper(paper, scope),
                cells: [
                    _jsx(InventoryRecordIdentity, { kind: "paper", title: paper.title, subtitle: [paper.authors, paper.doi].filter(Boolean).join(' · ') }),
                    _jsxs("span", { children: [paper.insights.length, " ", paper.insights.length === 1 ? 'insight' : 'insights'] }),
                    _jsxs("span", { children: [paper.decisions.length, " ", paper.decisions.length === 1 ? 'decision' : 'decisions'] }),
                    _jsx("span", { "aria-hidden": "true", children: "\u2192" }),
                ],
            })) }) }));
}
//# sourceMappingURL=PapersInventory.js.map