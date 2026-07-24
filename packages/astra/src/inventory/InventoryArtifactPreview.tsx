import { useState } from 'react';
import { inventoryRecordTitle } from './model';
import type { InventoryRecord } from './types';

export function inventoryFileName(record: InventoryRecord): string {
  const segments = record.resolved_path?.split('/').filter(Boolean);
  return segments?.[segments.length - 1] ?? record.id;
}

export function inventoryFileExtension(record: InventoryRecord): string {
  const name = inventoryFileName(record);
  const dot = name.lastIndexOf('.');
  return dot > 0
    ? name.slice(dot + 1).toUpperCase()
    : (record.type ?? 'FILE').toUpperCase();
}

function compactValue(value: string | number | undefined): string {
  if (value == null || value === '') return 'Value unavailable';
  if (typeof value === 'number') {
    return value.toLocaleString(undefined, { maximumSignificantDigits: 5 });
  }
  return value;
}

function FigurePreview({ record }: { record: InventoryRecord }) {
  const [failed, setFailed] = useState(false);
  if (!record.resultPreview || failed) {
    return (
      <div className="inventory-output-preview__placeholder" aria-label="Figure preview unavailable">
        <span aria-hidden="true">▦</span>
        <span>Figure preview unavailable</span>
      </div>
    );
  }
  return (
    <img
      src={record.resultPreview}
      alt={`Preview of ${inventoryRecordTitle(record)}`}
      onError={() => setFailed(true)}
    />
  );
}

function TablePreview({ record, compact = false }: {
  record: InventoryRecord;
  compact?: boolean;
}) {
  const table = record.table_data;
  if (!table?.headers.length) {
    return (
      <div className="inventory-output-preview__placeholder" aria-label="Table preview unavailable">
        <span aria-hidden="true">▤</span>
        <span>Table preview unavailable</span>
      </div>
    );
  }

  const columnLimit = compact ? 5 : 10;
  const rowLimit = compact ? 4 : 10;
  const headers = table.headers.slice(0, columnLimit);
  const rows = table.rows.slice(0, rowLimit);
  return (
    <div className={`inventory-output-table${compact ? ' is-compact' : ''}`}>
      <table>
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.slice(0, columnLimit).map((value, columnIndex) => (
                <td key={columnIndex}>{String(value)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!compact && (table.rows.length > rowLimit || table.headers.length > columnLimit) ? (
        <p>
          Showing {Math.min(rowLimit, table.rows.length)} of {table.rows.length} rows and{' '}
          {Math.min(columnLimit, table.headers.length)} of {table.headers.length} columns.
        </p>
      ) : null}
    </div>
  );
}

function MetricPreview({ record }: { record: InventoryRecord }) {
  const metric = record.metric;
  const uncertainty = metric?.uncertainty ?? metric?.error;
  const unit = metric?.unit ?? metric?.units;
  return (
    <div className="inventory-output-metric">
      <span className="inventory-output-metric__value">{compactValue(metric?.value)}</span>
      {uncertainty != null ? (
        <span className="inventory-output-metric__uncertainty">± {uncertainty}</span>
      ) : null}
      {unit ? <span className="inventory-output-metric__unit">{unit}</span> : null}
    </div>
  );
}

export function InventoryArtifactPreview({ record, compact = false }: {
  record: InventoryRecord;
  compact?: boolean;
}) {
  if (record.type === 'figure') return <FigurePreview record={record} />;
  if (record.type === 'table') return <TablePreview record={record} compact={compact} />;
  if (record.type === 'metric') return <MetricPreview record={record} />;
  return (
    <div className="inventory-output-file-hero">
      <span aria-hidden="true">↳</span>
      <strong>{inventoryFileName(record)}</strong>
      <small>{inventoryFileExtension(record)}</small>
    </div>
  );
}
