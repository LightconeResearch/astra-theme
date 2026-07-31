import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef } from 'react';
const INVENTORY_GLYPHS = {
    analysis: '◐',
    input: '↳',
    decision: '◇',
    output: '◆',
    finding: '●',
    prior_insight: '◈',
    paper: '▧',
    file: '▱',
};
export function InventoryRecordIdentity({ kind, title, subtitle, className, }) {
    return (_jsxs("span", { className: `inventory-record-list__name${className ? ` ${className}` : ''}`, children: [_jsx("span", { className: "inventory-record-list__glyph", "data-kind": kind, "aria-hidden": "true", children: INVENTORY_GLYPHS[kind] }), _jsxs("span", { children: [_jsx("strong", { children: title }), subtitle != null ? _jsx("small", { children: subtitle }) : null] })] }));
}
export function InventoryEmptyState({ children, className }) {
    return (_jsx("p", { className: `inventory-record-empty${className ? ` ${className}` : ''}`, children: children }));
}
export function InventoryRecordList({ ariaLabel, columns, columnTemplate, rows, }) {
    const style = { '--inventory-record-columns': columnTemplate };
    return (_jsxs("div", { className: "inventory-record-list", "aria-label": ariaLabel, style: style, children: [_jsx("div", { className: "inventory-record-list__head", "aria-hidden": "true", children: columns.map((column, index) => {
                    var _a;
                    return (_jsx("span", { className: column.className, children: column.label }, `${(_a = column.label) !== null && _a !== void 0 ? _a : 'blank'}-${index}`));
                }) }), _jsx("div", { className: "inventory-record-list__body", children: rows.map((row) => (_jsx("button", { type: "button", "aria-label": row.accessibleLabel, onClick: row.onOpen, children: row.cells.map((cell, index) => {
                        var _a;
                        return (_jsx("span", { className: (_a = columns[index]) === null || _a === void 0 ? void 0 : _a.className, children: cell }, index));
                    }) }, row.key))) })] }));
}
/**
 * Presentational detail frame shared by modal and embedded hosts.
 *
 * InventoryDetailDialog owns modal focus and dismissal behavior. This surface
 * owns only the exact header, actions, and body presentation.
 */
export function InventoryDetailSurface({ className, eyebrow, title, identifier, backLabel = 'Back to previous details', onBack, closeLabel, onClose, children, closeRef, modal = false, }) {
    const titleId = useId();
    return (_jsxs("section", { className: className, role: modal ? 'dialog' : 'region', "aria-modal": modal || undefined, "aria-labelledby": titleId, children: [_jsxs("header", { className: "inventory-detail-dialog__header", children: [_jsxs("div", { children: [_jsx("span", { children: eyebrow }), _jsx("h3", { id: titleId, children: title }), identifier ? _jsx("code", { children: identifier }) : null] }), _jsxs("div", { className: "inventory-detail-dialog__actions", children: [onBack ? (_jsx("button", { type: "button", onClick: onBack, "aria-label": backLabel, title: "Back", children: _jsx("span", { "aria-hidden": "true", children: "\u2190" }) })) : null, _jsx("button", { ref: closeRef, type: "button", onClick: onClose, "aria-label": closeLabel, title: "Close all details", children: "\u00D7" })] })] }), _jsx("div", { className: "inventory-detail-dialog__body", children: children })] }));
}
export function InventoryDetailDialog({ className, ...props }) {
    const closeRef = useRef(null);
    useEffect(() => {
        var _a;
        const previousOverflow = document.body.style.overflow;
        const previouslyFocused = document.activeElement;
        document.body.style.overflow = 'hidden';
        (_a = closeRef.current) === null || _a === void 0 ? void 0 : _a.focus();
        const onKeyDown = (event) => {
            if (event.key === 'Escape')
                props.onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKeyDown);
            if (previouslyFocused instanceof HTMLElement)
                previouslyFocused.focus();
        };
    }, [props.onClose]);
    return (_jsx("div", { className: `inventory-detail-dialog${className ? ` ${className}` : ''}`, role: "presentation", onMouseDown: (event) => {
            if (event.target === event.currentTarget)
                props.onClose();
        }, children: _jsx(InventoryDetailSurface, { ...props, closeRef: closeRef, modal: true }) }));
}
export function InventoryDetailLayout({ children, className }) {
    return (_jsx("div", { className: `inventory-record-detail__layout${className ? ` ${className}` : ''}`, children: children }));
}
export function InventoryDetailMain({ children, as = 'div' }) {
    const Component = as;
    return _jsx(Component, { className: "inventory-record-detail__main", children: children });
}
export function InventoryDetailRail({ children, label }) {
    return (_jsx("aside", { className: "inventory-record-detail__aside", "aria-label": label, children: children }));
}
export function InventoryDetailProse({ label, children, className }) {
    return (_jsxs("section", { className: `inventory-record-detail__prose${className ? ` ${className}` : ''}`, children: [_jsx("span", { children: label }), _jsx("div", { children: children })] }));
}
export function InventoryCountHeading({ title, count }) {
    return _jsxs("h4", { className: "inventory-count-heading", children: [title, " ", _jsx("span", { children: count })] });
}
//# sourceMappingURL=InventoryPrimitives.js.map