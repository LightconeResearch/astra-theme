import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { inventoryRecordTitle } from './model';
import { TABLE_PREVIEW_DISPLAY_COLUMNS, TABLE_PREVIEW_DISPLAY_ROWS, } from '../tablePreview';
export function inventoryFileName(record) {
    var _a, _b;
    const segments = (_a = record.resolved_path) === null || _a === void 0 ? void 0 : _a.split('/').filter(Boolean);
    return (_b = segments === null || segments === void 0 ? void 0 : segments[segments.length - 1]) !== null && _b !== void 0 ? _b : record.id;
}
export function inventoryFileExtension(record) {
    var _a;
    const name = inventoryFileName(record);
    const dot = name.lastIndexOf('.');
    return dot > 0
        ? name.slice(dot + 1).toUpperCase()
        : ((_a = record.type) !== null && _a !== void 0 ? _a : 'FILE').toUpperCase();
}
function compactValue(value) {
    if (value == null || value === '')
        return 'Value unavailable';
    if (typeof value === 'number') {
        return value.toLocaleString(undefined, { maximumSignificantDigits: 5 });
    }
    return value;
}
function FigurePreview({ record }) {
    const [failed, setFailed] = useState(false);
    if (!record.resultPreview || failed) {
        return (_jsxs("div", { className: "inventory-output-preview__placeholder", "aria-label": "Figure preview unavailable", children: [_jsx("span", { "aria-hidden": "true", children: "\u25A6" }), _jsx("span", { children: "Figure preview unavailable" })] }));
    }
    return (_jsx("img", { src: record.resultPreview, alt: `Preview of ${inventoryRecordTitle(record)}`, onError: () => setFailed(true) }));
}
function TablePreview({ record, compact = false }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const table = (_a = record.table_preview) !== null && _a !== void 0 ? _a : record.table_data;
    if (!(table === null || table === void 0 ? void 0 : table.headers.length)) {
        const label = record.table_preview_omitted
            ? 'Table preview omitted to keep this project page small'
            : 'Table preview unavailable';
        return (_jsxs("div", { className: "inventory-output-preview__placeholder", "aria-label": label, children: [_jsx("span", { "aria-hidden": "true", children: "\u25A4" }), _jsx("span", { children: label })] }));
    }
    const columnLimit = compact ? 5 : TABLE_PREVIEW_DISPLAY_COLUMNS;
    const rowLimit = compact ? 4 : TABLE_PREVIEW_DISPLAY_ROWS;
    const headers = table.headers.slice(0, columnLimit);
    const rows = table.rows.slice(0, rowLimit);
    const totalRows = (_d = (_c = (_b = record.table_preview) === null || _b === void 0 ? void 0 : _b.total_rows) !== null && _c !== void 0 ? _c : record.table_rows_total) !== null && _d !== void 0 ? _d : table.rows.length;
    const totalColumns = (_g = (_f = (_e = record.table_preview) === null || _e === void 0 ? void 0 : _e.total_columns) !== null && _f !== void 0 ? _f : record.table_columns_total) !== null && _g !== void 0 ? _g : table.headers.length;
    return (_jsxs("div", { className: `inventory-output-table${compact ? ' is-compact' : ''}`, children: [_jsxs("table", { children: [_jsx("thead", { children: _jsx("tr", { children: headers.map((header) => _jsx("th", { children: header }, header)) }) }), _jsx("tbody", { children: rows.map((row, rowIndex) => (_jsx("tr", { children: row.slice(0, columnLimit).map((value, columnIndex) => (_jsx("td", { children: String(value) }, columnIndex))) }, rowIndex))) })] }), !compact && (totalRows > rows.length || totalColumns > headers.length) ? (_jsxs("p", { children: ["Showing ", rows.length, " of ", totalRows, " rows and", ' ', headers.length, " of ", totalColumns, " columns."] })) : null] }));
}
function MetricPreview({ record }) {
    var _a, _b;
    const metric = record.metric;
    const uncertainty = (_a = metric === null || metric === void 0 ? void 0 : metric.uncertainty) !== null && _a !== void 0 ? _a : metric === null || metric === void 0 ? void 0 : metric.error;
    const unit = (_b = metric === null || metric === void 0 ? void 0 : metric.unit) !== null && _b !== void 0 ? _b : metric === null || metric === void 0 ? void 0 : metric.units;
    return (_jsxs("div", { className: "inventory-output-metric", children: [_jsx("span", { className: "inventory-output-metric__value", children: compactValue(metric === null || metric === void 0 ? void 0 : metric.value) }), uncertainty != null ? (_jsxs("span", { className: "inventory-output-metric__uncertainty", children: ["\u00B1 ", uncertainty] })) : null, unit ? _jsx("span", { className: "inventory-output-metric__unit", children: unit }) : null] }));
}
export function InventoryArtifactPreview({ record, compact = false }) {
    if (record.type === 'figure')
        return _jsx(FigurePreview, { record: record });
    if (record.type === 'table')
        return _jsx(TablePreview, { record: record, compact: compact });
    if (record.type === 'metric')
        return _jsx(MetricPreview, { record: record });
    return (_jsxs("div", { className: "inventory-output-file-hero", children: [_jsx("span", { "aria-hidden": "true", children: "\u21B3" }), _jsx("strong", { children: inventoryFileName(record) }), _jsx("small", { children: inventoryFileExtension(record) })] }));
}
//# sourceMappingURL=InventoryArtifactPreview.js.map