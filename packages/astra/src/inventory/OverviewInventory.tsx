import {
  DocumentOutlineLink,
  DocumentOutlineList,
} from '@myst-theme/site/src/components/DocumentOutline.js';
import { useMemo } from 'react';
import type { InventoryScope, InventorySnapshot } from './types';
import { SectionLabel } from '../card/CardChrome';
import { createInventoryModel } from './model';

interface OverviewInventoryProps {
  snapshot: InventorySnapshot;
  scopeId: string;
}

function scopeHref(scope: InventoryScope): string {
  return scope.path ? `/${scope.path.split('.').join('/')}` : '/';
}

function ScopeNode({
  scope,
  scopeById,
  currentScopeId,
  depth,
}: {
  scope: InventoryScope;
  scopeById: ReadonlyMap<string, InventoryScope>;
  currentScopeId: string;
  depth: number;
}) {
  const children = scope.children
    .map((id) => scopeById.get(id))
    .filter((child): child is InventoryScope => Boolean(child));
  return (
    <>
      <DocumentOutlineLink
        href={scopeHref(scope)}
        active={scope.id === currentScopeId}
        ariaCurrent={scope.id === currentScopeId ? 'page' : undefined}
        level={Math.min(depth + 2, 5)}
      >
        <span className={depth > 0 ? 'inventory-project-structure__subanalysis' : undefined}>
          {scope.name}
        </span>
      </DocumentOutlineLink>
      {children.map((child) => (
        <ScopeNode
          key={child.id}
          scope={child}
          scopeById={scopeById}
          currentScopeId={currentScopeId}
          depth={depth + 1}
        />
      ))}
    </>
  );
}

export function OverviewInventory({ snapshot, scopeId }: OverviewInventoryProps) {
  const model = useMemo(() => createInventoryModel(snapshot), [snapshot]);
  const roots = snapshot.scopes.filter(
    (scope) => !scope.parent || !model.scopeById.has(scope.parent),
  );

  return (
    <section
      className="inventory-project-structure exclude-from-outline"
      aria-labelledby="inventory-project-structure-title"
    >
      <header>
        <div>
          <span>Analysis navigation</span>
          <SectionLabel
            as="h3"
            className="astra-outline-section-label myst-supporting-documents my-4 text-sm leading-6 font-normal uppercase text-slate-900 dark:text-slate-100"
          >
            PROJECT HIERARCHY
          </SectionLabel>
        </div>
        <span>{snapshot.scopes.length} {snapshot.scopes.length === 1 ? 'analysis' : 'analyses'}</span>
      </header>
      <DocumentOutlineList>
        {roots.map((scope) => (
          <ScopeNode
            key={scope.id}
            scope={scope}
            scopeById={model.scopeById}
            currentScopeId={scopeId}
            depth={0}
          />
        ))}
      </DocumentOutlineList>
    </section>
  );
}
