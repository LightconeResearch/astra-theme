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

/* ------------------------------------------------------------------ *
 * ProvenanceGraph — a small vertical provenance ladder:
 *   inputs → recipe → artifact → finding(optional)
 * Each stage is a labelled row; stages are joined by a downward connector.
 * ------------------------------------------------------------------ */

export interface ProvenanceGraphProps {
  /** Input labels feeding the output. */
  inputs?: string[];
  /** The recipe (command / container) that produced the artifact. */
  recipe?: string;
  /** The resolved artifact (path / label). */
  artifact?: string;
  /** Optional downstream finding this provenance supports. */
  finding?: string;
}

interface ProvStage {
  key: string;
  label: string;
  values: string[];
  variant: string;
}

export const ProvenanceGraph: React.FC<ProvenanceGraphProps> = ({
  inputs,
  recipe,
  artifact,
  finding,
}) => {
  const cleanInputs = (inputs ?? []).filter((v) => v != null && v !== '');

  const stages: ProvStage[] = [];
  if (cleanInputs.length > 0) {
    stages.push({ key: 'inputs', label: 'INPUTS', values: cleanInputs, variant: 'input' });
  }
  if (recipe) {
    stages.push({ key: 'recipe', label: 'RECIPE', values: [recipe], variant: 'recipe' });
  }
  if (artifact) {
    stages.push({ key: 'artifact', label: 'ARTIFACT', values: [artifact], variant: 'artifact' });
  }
  if (finding) {
    stages.push({ key: 'finding', label: 'FINDING', values: [finding], variant: 'finding' });
  }

  if (stages.length === 0) return null;

  // Flatten to the CSS ladder: a list of `astra-prov__node` items, each with an
  // `astra-prov__label`. The connectors are drawn by the CSS via __node::after.
  // The artifact stage gets the `--artifact` modifier for the filled dot.
  return (
    <div className="astra-prov">
      {stages.flatMap((stage) =>
        stage.values.map((v, j) => (
          <div
            key={`${stage.key}-${j}`}
            className={
              'astra-prov__node' +
              (stage.variant === 'artifact' ? ' astra-prov__node--artifact' : '')
            }
            title={v}
          >
            <span className="astra-prov__label">{stage.label}</span>
            {v}
          </div>
        )),
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * PosteriorSketch — a stylised "decision contour" sketch: concentric
 * nested ellipses (the option space), with the selected option emphasised
 * and a small legend of dots. Pure CSS via .astra-posterior* classes —
 * no SVG required (the ellipses are nested rounded divs).
 * ------------------------------------------------------------------ */

export interface PosteriorSketchProps {
  /** All option labels in the decision. */
  options: string[];
  /** The selected option label (matched against `options`). */
  selected?: string;
}

export const PosteriorSketch: React.FC<PosteriorSketchProps> = ({ options, selected }) => {
  const items = (options ?? []).filter((o) => o != null && o !== '');
  if (items.length === 0) return null;

  // Order rings so the selected option is the innermost (emphasised) contour.
  const selectedIdx = selected ? items.indexOf(selected) : -1;

  return (
    <div className="astra-posterior">
      {/* Concentric contour rings + axes + the selected peak point. The CSS
          defines three fixed rings (__ring--1..3) and a __point. */}
      <div className="astra-posterior__field" aria-hidden="true">
        <span className="astra-posterior__axis astra-posterior__axis--x" />
        <span className="astra-posterior__axis astra-posterior__axis--y" />
        <span className="astra-posterior__ring astra-posterior__ring--1" />
        <span className="astra-posterior__ring astra-posterior__ring--2" />
        <span className="astra-posterior__ring astra-posterior__ring--3" />
        {selectedIdx >= 0 ? <span className="astra-posterior__point" /> : null}
      </div>
      <div className="astra-posterior__legend">
        {items.map((opt, i) => {
          const isSelected = i === selectedIdx;
          return (
            <span key={`${opt}-${i}`} className={isSelected ? undefined : 'is-excluded'}>
              {opt}
            </span>
          );
        })}
      </div>
    </div>
  );
};
