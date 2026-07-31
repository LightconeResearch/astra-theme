import type { InventorySnapshot } from './types';
export interface OverviewInventoryProps {
    snapshot: InventorySnapshot;
    scopeId: string;
    onSelectScope: (scopeId: string) => void;
}
export declare function OverviewInventory({ snapshot, scopeId, onSelectScope, }: OverviewInventoryProps): import("react").JSX.Element;
