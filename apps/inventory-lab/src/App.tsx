import {
  InventoryOutline,
  OverviewInventory,
  type InventorySnapshot,
  type InventoryPaperMetadataMap,
} from '@astra-spec/theme-astra/inventory';
import {
  AnalysisArticleBody,
  AnalysisArticleHeader,
  AnalysisDocumentOutline,
  AnalysisPageFrame,
  type AnalysisFrontmatter,
} from '@astra-spec/theme-astra/shell';
import { Theme, ThemeProvider } from '@myst-theme/providers';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import snapshotJson from '../public/fixtures/desi.snapshot.json';

const PREVIEW_URLS: Record<string, string> = {
  bao_fit_plot: new URL('../public/fixtures/assets/bao_fit_plot.png', import.meta.url).href,
  bao_detection_plot: new URL('../public/fixtures/assets/bao_detection_plot.png', import.meta.url).href,
  hubble_diagram_plot: new URL('../public/fixtures/assets/hubble_diagram_plot.png', import.meta.url).href,
};

const DESI_PAPER_METADATA: InventoryPaperMetadataMap = {
  '10.48550/arXiv.0812.2905': {
    title: 'Reconstructing Baryon Oscillations: A Lagrangian Theory Perspective',
    authors: 'Nikhil Padmanabhan, Martin White, J. D. Cohn',
    pdfUrl: 'https://arxiv.org/pdf/0812.2905#view=FitH',
  },
  '10.48550/arXiv.1807.06209': {
    title: 'Planck 2018 results. VI. Cosmological parameters',
    authors: 'Planck Collaboration',
    pdfUrl: 'https://arxiv.org/pdf/1807.06209#view=FitH',
  },
  '10.48550/arXiv.2402.14070': {
    title: 'Baryon Acoustic Oscillation Theory and Modelling Systematics for the DESI 2024 results',
    authors: 'Shi-Fan Chen, Cullan Howlett, Martin White, et al.',
    pdfUrl: 'https://arxiv.org/pdf/2402.14070#view=FitH',
  },
  '10.48550/arXiv.astro-ph/0604362': {
    title: 'Improving Cosmological Distance Measurements by Reconstruction of the Baryon Acoustic Peak',
    authors: 'Daniel J. Eisenstein, Hee-jong Seo, Edwin Sirko, David Spergel',
    pdfUrl: 'https://arxiv.org/pdf/astro-ph/0604362#view=FitH',
  },
  '10.48550/arXiv.astro-ph/0701079': {
    title: 'Improved forecasts for the baryon acoustic oscillations and cosmological distance scale',
    authors: 'Hee-Jong Seo, Daniel J. Eisenstein',
    pdfUrl: 'https://arxiv.org/pdf/astro-ph/0701079#view=FitH',
  },
};

const DESI_DECISION_TAG_LABELS: Readonly<Record<string, string>> = {
  bao_fit: 'BAO fit',
};

const RAW_SNAPSHOT = snapshotJson as InventorySnapshot;

const DESI_SNAPSHOT: InventorySnapshot = {
  ...RAW_SNAPSHOT,
  scopes: RAW_SNAPSHOT.scopes.map((scope) => ({
    ...scope,
    records: scope.records.map((record) => ({
      ...record,
      resultPreview: PREVIEW_URLS[record.id] ?? record.resultPreview,
    })),
  })),
};

const PROJECT_FRONTMATTER = {
  title: 'DESI DR1 BAO Analysis',
  subtitle: 'Reproducing the configuration-space baryon-acoustic-oscillation measurement',
  subject: 'Inventory prototype',
  venue: { title: 'Lightcone Research' },
  open_access: true,
  license: { content: 'CC-BY-4.0', code: 'MIT' },
  github: 'https://github.com/EiffL/myst_proto',
  date: '2026-07-06',
  authors: [
    {
      name: 'Liam Parker',
      orcid: '0009-0007-4952-1674',
      corresponding: true,
      email: 'lhparker@berkeley.edu',
      github: 'lhparker1',
      affiliations: ['berkeley'],
    },
    {
      name: 'Francois Lanusse',
      orcid: '0000-0001-7956-0542',
      email: 'francois.lanusse@cnrs.fr',
      github: 'EiffL',
      affiliations: ['aim'],
    },
  ],
  affiliations: [
    {
      id: 'berkeley',
      institution: 'University of California, Berkeley',
      department: 'Department of Physics',
      city: 'Berkeley',
      region: 'California',
      country: 'USA',
    },
    {
      id: 'aim',
      institution: 'AIM, CEA, CNRS, Université Paris-Saclay',
      city: 'Gif-sur-Yvette',
      country: 'France',
    },
  ],
} as AnalysisFrontmatter;

function StandaloneThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState(Theme.light);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === Theme.dark);
  }, [theme]);

  return (
    <ThemeProvider theme={theme} setTheme={setTheme} top={0}>
      {children}
    </ThemeProvider>
  );
}

export function App() {
  const location = useLocation();
  const routePath = location.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean).join('.');
  const activeScope = DESI_SNAPSHOT.scopes.find((scope) => scope.path === routePath)
    ?? DESI_SNAPSHOT.scopes.find((scope) => !scope.parent)
    ?? DESI_SNAPSHOT.scopes[0];
  const frontmatter: AnalysisFrontmatter = activeScope?.path
    ? {
        ...PROJECT_FRONTMATTER,
        title: activeScope.name,
        subtitle: `Sub-analysis of ${DESI_SNAPSHOT.analysis.name}`,
        subject: 'Analysis inventory',
      }
    : PROJECT_FRONTMATTER;

  return (
    <StandaloneThemeProvider>
      <AnalysisPageFrame>
        <AnalysisArticleHeader frontmatter={frontmatter} />
        <AnalysisArticleBody isIndex>
          <aside className="inventory-preview-notice col-body" role="note">
            <strong>Frozen design preview</strong>
            <span>
              {DESI_SNAPSHOT.fixture.label} · frozen {DESI_SNAPSHOT.fixture.frozen}.
              {' '}{DESI_SNAPSHOT.fixture.disclaimer}
            </span>
          </aside>
          <AnalysisDocumentOutline
            title="In this article"
            maxdepth={2}
            childrenPosition="after"
          >
            <OverviewInventory
              snapshot={DESI_SNAPSHOT}
              scopeId={activeScope?.id ?? 'root'}
            />
          </AnalysisDocumentOutline>
          <InventoryOutline
            snapshot={DESI_SNAPSHOT}
            scopeId={activeScope?.id}
            paperMetadata={DESI_PAPER_METADATA}
            decisionTagLabels={DESI_DECISION_TAG_LABELS}
          />
        </AnalysisArticleBody>
      </AnalysisPageFrame>
    </StandaloneThemeProvider>
  );
}
