import * as React from 'react';
import type { ResolvedOutput } from '@astra-spec/sdk';
import {
  RecordDialog,
  useDetailStack,
  type ArtifactRenderer,
} from '@astra-spec/ui/components';
import { collectInventoryPapers } from '@astra-spec/ui/model';
import { useThemeSwitcher } from '@myst-theme/providers';
import type { GenericNode } from 'myst-common';

import {
  findAstraPublication,
  type IndexedAstraPublication,
} from './contract';
import { StaticArtifactPreview } from './StaticArtifactPreview';

export {
  ASTRA_PUBLICATION_SCHEMA_VERSION,
  findAstraPublication,
} from './contract';
export type {
  AstraArtifactResource,
  AstraPublicationBundleV1,
  IndexedAstraPublication,
} from './contract';

type ColorScheme = 'light' | 'dark';

function useHydratedColorScheme(isDark: boolean): ColorScheme | undefined {
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated ? (isDark ? 'dark' : 'light') : undefined;
}

export interface AstraPublicationContextValue extends IndexedAstraPublication {
  colorScheme: ColorScheme | undefined;
  openRecordPath: (canonicalPath: string) => void;
}

const AstraPublicationContext = React.createContext<
  AstraPublicationContextValue | undefined
>(undefined);

export function useAstraPublication():
  | AstraPublicationContextValue
  | undefined {
  return React.useContext(AstraPublicationContext);
}

export interface AstraPublicationProviderProps {
  children: React.ReactNode;
  mdast?: GenericNode | GenericNode[] | undefined;
  publication?: IndexedAstraPublication | undefined;
}

/**
 * The complete host adapter between MySTRA's serializable bundle and
 * `@astra-spec/ui`. It owns only static-resource loading and detail-stack
 * state; record presentation stays in the shared UI package.
 */
export function AstraPublicationProvider({
  children,
  mdast,
  publication: explicitPublication,
}: AstraPublicationProviderProps) {
  const publication = React.useMemo(
    () => explicitPublication ?? findAstraPublication(mdast),
    [explicitPublication, mdast],
  );
  const detail = useDetailStack();
  const { isDark } = useThemeSwitcher();
  const colorScheme = useHydratedColorScheme(isDark);
  const publicationIdentity = publication?.publication;
  const previousPublication = React.useRef(publicationIdentity);
  React.useEffect(() => {
    if (previousPublication.current === publicationIdentity) return;
    previousPublication.current = publicationIdentity;
    detail.set([]);
  }, [detail.set, publicationIdentity]);

  const openRecordPath = React.useCallback(
    (canonicalPath: string) => {
      const record = publication?.index.recordByPath.get(canonicalPath);
      const analysis =
        publication?.index.analysisByRecordPath.get(canonicalPath);
      if (record && analysis) detail.openRecord(record, analysis);
    },
    [detail, publication],
  );

  const context = React.useMemo<AstraPublicationContextValue | undefined>(
    () =>
      publication ? { ...publication, colorScheme, openRecordPath } : undefined,
    [colorScheme, openRecordPath, publication],
  );

  const activeAnalysis = publication?.index.analysisByPath.get(
    publication.publication.activeAnalysisPath,
  );
  const papers = React.useMemo(
    () =>
      publication && activeAnalysis
        ? collectInventoryPapers(
            publication.publication.bundle.document,
            publication.index,
            activeAnalysis,
          )
        : [],
    [activeAnalysis, publication],
  );
  const renderArtifact = React.useCallback<ArtifactRenderer>(
    (output, { compact }) => {
      if (
        output.type !== 'figure' &&
        output.type !== 'table' &&
        output.type !== 'metric'
      ) {
        return null;
      }
      return (
        <StaticArtifactPreview
          output={output}
          resource={publication?.resources.get(output.canonicalPath)}
          compact={compact}
        />
      );
    },
    [publication],
  );
  const openArtifact = React.useCallback(
    (output: ResolvedOutput) => {
      const url = publication?.resources.get(output.canonicalPath)?.url;
      if (url && typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    [publication],
  );

  if (!publication || !context) return <>{children}</>;
  return (
    <AstraPublicationContext.Provider value={context}>
      {children}
      {detail.active ? (
        <div
          className="lightcone-brand astra-ui astra-publication-dialog-scope"
          data-lightcone-color-scheme={colorScheme}
          data-astra-color-scheme={colorScheme}
        >
          <RecordDialog
            entry={detail.active}
            document={publication.publication.bundle.document}
            index={publication.index}
            papers={papers}
            renderArtifact={renderArtifact}
            onOpenArtifact={openArtifact}
            onOpenRecord={detail.pushRecord}
            onOpenPaper={detail.pushPaper}
            onBack={detail.previous ? detail.back : undefined}
            onClose={detail.close}
          />
        </div>
      ) : null}
    </AstraPublicationContext.Provider>
  );
}
