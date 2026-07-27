import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';
import type { InventoryKind } from './types';

export interface InventoryListColumn {
  label?: string;
  className?: string;
}

export interface InventoryListRow {
  key: string;
  accessibleLabel: string;
  cells: ReactNode[];
  onOpen: () => void;
}

const INVENTORY_GLYPHS: Record<InventoryKind | 'paper' | 'file', string> = {
  analysis: '◐',
  input: '↳',
  decision: '◇',
  output: '◆',
  finding: '●',
  prior_insight: '◈',
  paper: '▧',
  file: '▱',
};

export function InventoryRecordIdentity({
  kind,
  title,
  subtitle,
  className,
}: {
  kind: InventoryKind | 'paper' | 'file';
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}) {
  return (
    <span className={`inventory-record-list__name${className ? ` ${className}` : ''}`}>
      <span className="inventory-record-list__glyph" data-kind={kind} aria-hidden="true">
        {INVENTORY_GLYPHS[kind]}
      </span>
      <span>
        <strong>{title}</strong>
        {subtitle != null ? <small>{subtitle}</small> : null}
      </span>
    </span>
  );
}

export function InventoryEmptyState({ children, className }: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`inventory-record-empty${className ? ` ${className}` : ''}`}>
      {children}
    </p>
  );
}

interface InventoryRecordListProps {
  ariaLabel: string;
  columns: InventoryListColumn[];
  columnTemplate: string;
  rows: InventoryListRow[];
}

type InventoryListStyle = CSSProperties & {
  '--inventory-record-columns': string;
};

export function InventoryRecordList({
  ariaLabel,
  columns,
  columnTemplate,
  rows,
}: InventoryRecordListProps) {
  const style: InventoryListStyle = { '--inventory-record-columns': columnTemplate };
  return (
    <div className="inventory-record-list" aria-label={ariaLabel} style={style}>
      <div className="inventory-record-list__head" aria-hidden="true">
        {columns.map((column, index) => (
          <span key={`${column.label ?? 'blank'}-${index}`} className={column.className}>
            {column.label}
          </span>
        ))}
      </div>
      <div className="inventory-record-list__body">
        {rows.map((row) => (
          <button
            key={row.key}
            type="button"
            aria-label={row.accessibleLabel}
            onClick={row.onOpen}
          >
            {row.cells.map((cell, index) => (
              <span key={index} className={columns[index]?.className}>{cell}</span>
            ))}
          </button>
        ))}
      </div>
    </div>
  );
}

interface InventoryDetailDialogProps {
  className?: string;
  eyebrow: string;
  title: string;
  identifier?: string;
  backLabel?: string;
  onBack?: () => void;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}

export function InventoryDetailDialog({
  className,
  eyebrow,
  title,
  identifier,
  backLabel = 'Back to previous details',
  onBack,
  closeLabel,
  onClose,
  children,
}: InventoryDetailDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [onClose]);

  return (
    <div className={`inventory-detail-dialog${className ? ` ${className}` : ''}`} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="inventory-detail-dialog__header">
          <div>
            <span>{eyebrow}</span>
            <h3 id={titleId}>{title}</h3>
            {identifier ? <code>{identifier}</code> : null}
          </div>
          <div className="inventory-detail-dialog__actions">
            {onBack ? (
              <button type="button" onClick={onBack} aria-label={backLabel} title="Back">
                <span aria-hidden="true">←</span>
              </button>
            ) : null}
            <button ref={closeRef} type="button" onClick={onClose} aria-label={closeLabel} title="Close all details">×</button>
          </div>
        </header>
        <div className="inventory-detail-dialog__body">{children}</div>
      </section>
    </div>
  );
}

export function InventoryDetailLayout({ children, className }: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`inventory-record-detail__layout${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}

export function InventoryDetailMain({ children, as = 'div' }: {
  children: ReactNode;
  as?: 'div' | 'main';
}) {
  const Component = as;
  return <Component className="inventory-record-detail__main">{children}</Component>;
}

export function InventoryDetailRail({ children, label }: {
  children: ReactNode;
  label: string;
}) {
  return (
    <aside className="inventory-record-detail__aside" aria-label={label}>
      {children}
    </aside>
  );
}

export function InventoryDetailProse({ label, children, className }: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`inventory-record-detail__prose${className ? ` ${className}` : ''}`}>
      <span>{label}</span>
      <div>{children}</div>
    </section>
  );
}

export function InventoryCountHeading({ title, count }: {
  title: ReactNode;
  count: number;
}) {
  return <h4 className="inventory-count-heading">{title} <span>{count}</span></h4>;
}
