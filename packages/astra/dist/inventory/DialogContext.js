import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
const InventoryDialogContext = createContext(undefined);
export function InventoryDialogTriggerProvider({ children, onOpen, }) {
    return (_jsx(InventoryDialogContext.Provider, { value: onOpen, children: children }));
}
export function useInventoryDialogTrigger() {
    return useContext(InventoryDialogContext);
}
//# sourceMappingURL=DialogContext.js.map