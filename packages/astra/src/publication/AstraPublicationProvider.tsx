import * as React from 'react';
import { ArtifactPreview, RecordDialog, type ArtifactRenderer } from '@astra-spec/ui/components';
import {
  useDetailStack,
  type DetailEntry,
  type OpenRecordHandler,
  type PdfJsLoader,
} from '@astra-spec/ui/lib';
import { recordTitle } from '@astra-spec/ui/model';
import type { GenericNode, GenericParent, References } from 'myst-common';

import { doiCiteTitles } from '../cite';
import { citedPaperMetadata, type PaperTitles } from '../papers';
import { usePdfJsLoader } from '../pdf';
import { AstraThemeScope, useAstraColorScheme } from '../themeScope';
import {
  findAstraPublication,
  type AstraPublication,
} from './contract';

const AstraPublicationContext = React.createContext<
  AstraPublication | undefined
>(undefined);

interface AstraPublicationDetails {
  onOpenRecord: OpenRecordHandler;
}

const AstraPublicationDetailsContext = React.createContext<
  AstraPublicationDetails | undefined
>(undefined);

export interface AstraPublicationProviderProps {
  children: React.ReactNode;
  mdast?: GenericNode | GenericNode[] | undefined;
  /** A decoded publication supplied by tests or a host-owned cache. */
  publication?: AstraPublication | undefined;
  /** The page's resolved references; cited papers are named as the page cites them. */
  references?: References | undefined;
  /** A pdf.js runtime supplied by tests or a host; the site's own static copy otherwise. */
  loadPdfJs?: PdfJsLoader | undefined;
}

/** Render only transport-verified figure URLs supplied by the publication. */
export function createAstraArtifactRenderer(
  publication: AstraPublication,
): ArtifactRenderer {
  return (output, { compact }) => {
    const url = publication.artifactUrls.get(output.canonicalPath);
    if (output.type === 'figure' && url) {
      return (
        <ArtifactPreview
          output={output}
          preview={{
            kind: 'image',
            url,
            alt: output.label ?? output.id,
          }}
          compact={compact}
          caption={null}
          className={compact ? 'astra-output__thumb' : undefined}
        />
      );
    }
    if (output.type === 'figure' || output.type === 'table') {
      return compact ? null : <ArtifactPreview output={output} compact={false} />;
    }
    return null;
  };
}

function detailTitle(
  publication: AstraPublication,
  entry: DetailEntry | undefined,
): string | undefined {
  if (!entry) return undefined;
  if (entry.kind === 'paper') return entry.doi;
  const record = publication.index.recordByPath.get(entry.canonicalPath);
  return record ? recordTitle(record) : undefined;
}

function AstraPublicationBoundary({
  children,
  publication,
  paperTitles,
  loadPdfJs: explicitLoader,
}: {
  children: React.ReactNode;
  publication: AstraPublication | undefined;
  paperTitles: PaperTitles;
  loadPdfJs: PdfJsLoader | undefined;
}) {
  const scheme = useAstraColorScheme();
  const details = useDetailStack();
  const previousPublication = React.useRef(publication);
  const publicationChanged = previousPublication.current !== publication;

  React.useEffect(() => {
    if (previousPublication.current === publication) return;
    previousPublication.current = publication;
    details.close();
  }, [publication, details.close]);

  const detailContext = React.useMemo<AstraPublicationDetails | undefined>(
    () => publication ? { onOpenRecord: details.openRecord } : undefined,
    [publication, details.openRecord],
  );
  const renderArtifact = React.useMemo(
    () => publication ? createAstraArtifactRenderer(publication) : undefined,
    [publication],
  );
  // Papers are read straight from arXiv when a DOI names one; every other
  // paper keeps astra-ui's DOI-link state. See ../papers.ts.
  const paperMetadata = React.useMemo(
    () => (publication?.document ? citedPaperMetadata(publication.document, paperTitles) : undefined),
    [publication, paperTitles],
  );
  const siteLoader = usePdfJsLoader();
  const loadPdfJs = explicitLoader ?? siteLoader;
  const activeDetail = publicationChanged ? undefined : details.active;

  return (
    <AstraPublicationContext.Provider value={publication}>
      <AstraPublicationDetailsContext.Provider value={detailContext}>
        {children}
        {publication && activeDetail ? (
          <div
            className="lightcone-brand astra-ui"
            data-lightcone-color-scheme={scheme}
            data-astra-color-scheme={scheme}
            style={{ display: 'contents' }}
          >
            <RecordDialog
              entry={activeDetail}
              document={publication.document}
              index={publication.index}
              renderArtifact={renderArtifact}
              paperMetadata={paperMetadata}
              loadPdfJs={loadPdfJs}
              onOpenRecord={details.pushRecord}
              onOpenPaper={details.pushPaper}
              onBack={details.previous ? details.back : undefined}
              backText={detailTitle(publication, details.previous)}
              onClose={details.close}
            />
          </div>
        ) : null}
      </AstraPublicationDetailsContext.Provider>
    </AstraPublicationContext.Provider>
  );
}

/** Decode one MySTRA publication without adding an element to the article tree. */
export function AstraPublicationProvider({
  children,
  mdast,
  publication: explicitPublication,
  references,
  loadPdfJs,
}: AstraPublicationProviderProps) {
  const publication = React.useMemo(
    () => explicitPublication ?? findAstraPublication(mdast),
    [explicitPublication, mdast],
  );
  // The page names its papers through the cite nodes MyST resolved; the page
  // AST carries them when the references do not.
  const paperTitles = React.useMemo(() => {
    const article =
      references?.article ?? (Array.isArray(mdast) ? { type: 'root', children: mdast } : mdast);
    return doiCiteTitles(article ? { ...references, article: article as GenericParent } : references);
  }, [references, mdast]);

  return (
    <AstraThemeScope>
      <AstraPublicationBoundary
        publication={publication}
        paperTitles={paperTitles}
        loadPdfJs={loadPdfJs}
      >
        {children}
      </AstraPublicationBoundary>
    </AstraThemeScope>
  );
}

/** Return the current decoded publication, or undefined on any local failure. */
export function useAstraPublication(): AstraPublication | undefined {
  return React.useContext(AstraPublicationContext);
}

/** Open a full record detail surface owned by the nearest publication. */
export function useAstraPublicationDetails():
  | AstraPublicationDetails
  | undefined {
  return React.useContext(AstraPublicationDetailsContext);
}

export {
  ASTRA_PUBLICATION_SCHEMA_VERSION,
  findAstraPublication,
} from './contract';
export type { AstraPublication } from './contract';
