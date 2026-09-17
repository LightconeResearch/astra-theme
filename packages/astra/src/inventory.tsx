import * as React from 'react';
import { createPortal } from 'react-dom';
import { Inventory, type InventoryProps } from '@astra-spec/ui/views';
import { DetailDialog } from '@astra-spec/ui/primitives';
import type { AstraPublication } from './publication/contract';
import { useAstraColorScheme } from './themeScope';

const INVENTORY_HASH = '#astra-inventory';
// React bubbles these through ancestors even though their DOM types only
// declare them on <dialog>. Closing a record must leave the inventory open.
const dialogEvents = {
  onCancel: (event: React.SyntheticEvent) => event.stopPropagation(),
  onClose: (event: React.SyntheticEvent) => event.stopPropagation(),
};

function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener);
  window.addEventListener('popstate', listener);
  return () => {
    window.removeEventListener('hashchange', listener);
    window.removeEventListener('popstate', listener);
  };
}

/** Reuse the publication's artifacts and papers in astra-ui's complete view. */
export function AstraInventory({
  publication,
  ...props
}: Pick<InventoryProps, 'renderArtifact' | 'paperMetadata' | 'loadPdfJs'> & {
  publication: AstraPublication;
}) {
  const scheme = useAstraColorScheme();
  const hash = React.useSyncExternalStore(subscribe, () => window.location.hash, () => '');
  const open = hash === INVENTORY_HASH || hash.startsWith(`${INVENTORY_HASH}-`);
  const returnHash = React.useRef('');
  React.useEffect(() => {
    if (!open) returnHash.current = hash;
    // A direct section link arrives before the hydrated dialog exists.
    else document.getElementById(hash.slice(1))?.scrollIntoView?.();
  }, [hash, open]);

  if (!open) return null;
  const close = () => {
    // Keep unrelated query parameters and the original article anchor intact.
    window.history.replaceState(
      window.history.state, '',
      `${window.location.pathname}${window.location.search}${returnHash.current}`,
    );
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };
  // Keep publication prose styles from leaking into this page-level dialog.
  return createPortal(
    <div
      className="lightcone-brand astra-ui astra-isolate"
      data-lightcone-color-scheme={scheme}
      data-astra-color-scheme={scheme}
    >
      <InventoryDialog
        {...props}
        key={publication.activeAnalysis.canonicalPath}
        publication={publication}
        onClose={close}
      />
    </div>,
    document.body,
  );
}

/** Keyed by the page's analysis and mounted only while open, so a page change or reopening starts there again. */
function InventoryDialog({
  publication,
  onClose,
  ...props
}: Pick<InventoryProps, 'renderArtifact' | 'paperMetadata' | 'loadPdfJs'> & {
  publication: AstraPublication;
  onClose: () => void;
}) {
  const [analysisPath, setAnalysisPath] = React.useState(publication.activeAnalysis.canonicalPath);
  const analysis = publication.index.analysisByPath.get(analysisPath) ?? publication.activeAnalysis;
  return (
    <DetailDialog
      className="astra-inventory-dialog"
      title={analysis.name}
      kindLabel="Inventory"
      onClose={onClose}
      closeLabel="Close inventory"
    >
      <Inventory
        {...props}
        {...dialogEvents}
        document={publication.document}
        index={publication.index}
        analysisPath={analysisPath}
        onSelectAnalysis={setAnalysisPath}
        idPrefix="astra-inventory-"
      />
    </DetailDialog>
  );
}
