import * as React from 'react';
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
  return (
    <div
      className="lightcone-brand astra-ui"
      data-lightcone-color-scheme={scheme}
      data-astra-color-scheme={scheme}
    >
      <DetailDialog
        className="astra-inventory-dialog"
        title={publication.activeAnalysis.name}
        kindLabel="Inventory"
        onClose={close}
        closeLabel="Close inventory"
        actions={(
          <button type="button" className="astra-dialog__action" onClick={close}>
            Back to reading
          </button>
        )}
      >
        <Inventory
          {...props}
          {...dialogEvents}
          document={publication.document}
          index={publication.index}
          analysisPath={publication.activeAnalysis.canonicalPath}
          idPrefix="astra-inventory-"
        />
      </DetailDialog>
    </div>
  );
}
