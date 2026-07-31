import type { ReactNode } from 'react';
export interface InventoryRelationItem {
    key: string;
    label: ReactNode;
    identifier?: ReactNode;
    detail?: ReactNode;
    accessibleLabel?: string;
    onOpen?: () => void;
}
export declare function InventoryRelationList({ title, items, empty, className, headerAction, }: {
    title: ReactNode;
    items: InventoryRelationItem[];
    empty: ReactNode;
    className?: string;
    headerAction?: ReactNode;
}): import("react").JSX.Element;
