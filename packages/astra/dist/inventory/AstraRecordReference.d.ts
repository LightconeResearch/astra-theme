import { type ReactNode } from 'react';
import type { ResolvedStore } from '@astra-spec/store-types';
import type { InventoryModel } from './model';
import type { InventoryRecord } from './types';
/**
 * Adapt the project inventory indexes into the consolidated store expected by
 * the existing preview-card bodies. Canonical paths are always indexed; leaf
 * ids are added when unambiguous, and relationship spellings used by the
 * focused record are resolved relative to that record's scope.
 */
export declare function consolidatedStoreFromInventoryModel(model: InventoryModel, focusedRecord?: InventoryRecord): ResolvedStore;
export interface AstraRecordReferenceProps {
    /** Resolved ASTRA inventory record; the component never parses astra.yaml. */
    record: InventoryRecord;
    /** Visible prose label. Defaults to the record's authored label or id. */
    label?: ReactNode;
    /** Opens the host's full detail surface on click, Enter, or Space. */
    onActivate?: () => void;
    /** Project indexes used to resolve nested evidence shown in hover cards. */
    model?: InventoryModel;
    /** A host-supplied page/consolidated store. Takes precedence over `model`. */
    store?: ResolvedStore;
    className?: string;
}
/**
 * Host-neutral ASTRA reference used in prose outside MyST.
 *
 * It deliberately accepts resolved data rather than a MyST node while reusing
 * the exact token styling, Floating UI preview, and kind-specific card bodies
 * used by MySTRA publications.
 */
export declare function AstraRecordReference({ record, label, onActivate, model, store, className, }: AstraRecordReferenceProps): import("react").JSX.Element;
