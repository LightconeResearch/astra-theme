import { type ReactNode } from 'react';
import type { InventoryRecordReference } from './types';
type OpenInventoryDialog = (reference: InventoryRecordReference) => void;
export declare function InventoryDialogTriggerProvider({ children, onOpen, }: {
    children: ReactNode;
    onOpen?: OpenInventoryDialog;
}): import("react").JSX.Element;
export declare function useInventoryDialogTrigger(): OpenInventoryDialog | undefined;
export {};
