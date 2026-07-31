import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo } from 'react';
import { createInventoryModel } from './model';
function ProjectDocumentIcon() {
    return (_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor", "aria-hidden": "true", className: "inline mr-2 shrink-0", width: "1.25rem", height: "1.25rem", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" }) }));
}
function ScopeNode({ scope, model, currentScopeId, depth, ancestors, onSelectScope, }) {
    const active = scope.id === currentScopeId;
    const nextAncestors = new Set(ancestors).add(scope.id);
    const children = scope.children
        .map((id) => model.scopeById.get(id))
        .filter((child) => Boolean(child && !nextAncestors.has(child.id)));
    return (_jsxs(_Fragment, { children: [_jsx("li", { children: _jsxs("button", { type: "button", className: [
                        'no-underline flex self-center w-full text-left hover:text-blue-700',
                        active ? 'text-blue-600' : '',
                    ].join(' '), style: { paddingInlineStart: `${Math.min(depth, 3) * 1.25}rem` }, "aria-current": active ? 'page' : undefined, onClick: () => onSelectScope(scope.id), children: [_jsx(ProjectDocumentIcon, {}), _jsx("span", { children: scope.name })] }) }), children.map((child) => (_jsx(ScopeNode, { scope: child, model: model, currentScopeId: currentScopeId, depth: depth + 1, ancestors: nextAncestors, onSelectScope: onSelectScope }, child.id || 'root')))] }));
}
export function OverviewInventory({ snapshot, scopeId, onSelectScope, }) {
    const model = useMemo(() => createInventoryModel(snapshot), [snapshot]);
    const roots = snapshot.scopes.filter((scope) => scope.parent === undefined || !model.scopeById.has(scope.parent));
    return (_jsxs("div", { className: "inventory-project-structure exclude-from-outline", "aria-labelledby": "inventory-project-structure-title", children: [_jsx("div", { id: "inventory-project-structure-title", role: "heading", "aria-level": 2, className: "myst-supporting-documents my-4 text-sm leading-6 uppercase text-slate-900 dark:text-slate-100", children: "Project hierarchy" }), _jsx("ul", { className: "flex flex-col gap-2 pl-0 text-sm leading-6 list-none text-slate-700 dark:text-slate-300", children: roots.map((scope) => (_jsx(ScopeNode, { scope: scope, model: model, currentScopeId: scopeId, depth: 0, ancestors: new Set(), onSelectScope: onSelectScope }, scope.id || 'root'))) })] }));
}
//# sourceMappingURL=OverviewInventory.js.map