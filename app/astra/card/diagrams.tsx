import * as React from 'react';

/* ------------------------------------------------------------------ *
 * DataFlow — a horizontal row of mono "node" boxes joined by ▸ arrows.
 * Used to sketch input → recipe → artifact chains inside a card.
 * ------------------------------------------------------------------ */

export interface DataFlowProps {
  /** Ordered labels for each node box (left → right). */
  nodes: string[];
}

export const DataFlow: React.FC<DataFlowProps> = ({ nodes }) => {
  const items = (nodes ?? []).filter((n) => n != null && n !== '');
  if (items.length === 0) return null;
  return (
    <div className="astra-flow" role="img" aria-label={items.join(' to ')}>
      {items.map((label, i) => (
        <React.Fragment key={`${label}-${i}`}>
          {i > 0 ? (
            <span className="astra-flow__arrow" aria-hidden="true">
              ▸
            </span>
          ) : null}
          <span className="astra-flow__node" title={label}>
            {label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};
