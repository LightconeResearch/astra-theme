import { useBaseurl } from '@myst-theme/providers';

function routeHref(baseurl: string | undefined, route: string): string {
  const base = (baseurl ?? '').replace(/\/+$/, '');
  return `${base}${route}` || '/';
}

export function AnalysisModeTabs({
  active,
}: {
  active: 'report' | 'inventory';
}) {
  const baseurl = useBaseurl();
  return (
    <div className="analysis-mode-tabs article-left-grid subgrid-gap col-screen">
      <nav className="analysis-mode-tabs__inner col-body" aria-label="Analysis views">
        <a
          href={routeHref(baseurl, '/')}
          className={active === 'report' ? 'is-active' : undefined}
          aria-current={active === 'report' ? 'page' : undefined}
        >
          Report
        </a>
        <a
          href={routeHref(baseurl, '/inventory/')}
          className={active === 'inventory' ? 'is-active' : undefined}
          aria-current={active === 'inventory' ? 'page' : undefined}
        >
          Inventory
          <span className="analysis-mode-tabs__beta">Beta</span>
        </a>
      </nav>
    </div>
  );
}
