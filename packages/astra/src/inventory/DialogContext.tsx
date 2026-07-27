import { createContext, useContext, type ReactNode } from 'react';
import type { InventoryRecordReference } from './types';

type OpenInventoryDialog = (reference: InventoryRecordReference) => void;

const InventoryDialogContext = createContext<OpenInventoryDialog | undefined>(
  undefined,
);

export function InventoryDialogTriggerProvider({
  children,
  onOpen,
}: {
  children: ReactNode;
  onOpen?: OpenInventoryDialog;
}) {
  return (
    <InventoryDialogContext.Provider value={onOpen}>
      {children}
    </InventoryDialogContext.Provider>
  );
}

export function useInventoryDialogTrigger(): OpenInventoryDialog | undefined {
  return useContext(InventoryDialogContext);
}
