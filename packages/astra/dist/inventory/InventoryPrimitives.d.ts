import type { ReactNode, Ref } from 'react';
import type { InventoryKind } from './types';
export interface InventoryListColumn {
    label?: string;
    className?: string;
}
export interface InventoryListRow {
    key: string;
    accessibleLabel: string;
    cells: ReactNode[];
    onOpen: () => void;
}
export declare function InventoryRecordIdentity({ kind, title, subtitle, className, }: {
    kind: InventoryKind | 'paper' | 'file';
    title: ReactNode;
    subtitle?: ReactNode;
    className?: string;
}): import("react").JSX.Element;
export declare function InventoryEmptyState({ children, className }: {
    children: ReactNode;
    className?: string;
}): import("react").JSX.Element;
interface InventoryRecordListProps {
    ariaLabel: string;
    columns: InventoryListColumn[];
    columnTemplate: string;
    rows: InventoryListRow[];
}
export declare function InventoryRecordList({ ariaLabel, columns, columnTemplate, rows, }: InventoryRecordListProps): import("react").JSX.Element;
export interface InventoryDetailSurfaceProps {
    className?: string;
    eyebrow: string;
    title: string;
    identifier?: string;
    backLabel?: string;
    onBack?: () => void;
    closeLabel: string;
    onClose: () => void;
    children: ReactNode;
    closeRef?: Ref<HTMLButtonElement>;
    modal?: boolean;
}
/**
 * Presentational detail frame shared by modal and embedded hosts.
 *
 * InventoryDetailDialog owns modal focus and dismissal behavior. This surface
 * owns only the exact header, actions, and body presentation.
 */
export declare function InventoryDetailSurface({ className, eyebrow, title, identifier, backLabel, onBack, closeLabel, onClose, children, closeRef, modal, }: InventoryDetailSurfaceProps): import("react").JSX.Element;
interface InventoryDetailDialogProps extends Omit<InventoryDetailSurfaceProps, 'closeRef' | 'modal'> {
}
export declare function InventoryDetailDialog({ className, ...props }: InventoryDetailDialogProps): import("react").JSX.Element;
export declare function InventoryDetailLayout({ children, className }: {
    children: ReactNode;
    className?: string;
}): import("react").JSX.Element;
export declare function InventoryDetailMain({ children, as }: {
    children: ReactNode;
    as?: 'div' | 'main';
}): import("react").JSX.Element;
export declare function InventoryDetailRail({ children, label }: {
    children: ReactNode;
    label: string;
}): import("react").JSX.Element;
export declare function InventoryDetailProse({ label, children, className }: {
    label: string;
    children: ReactNode;
    className?: string;
}): import("react").JSX.Element;
export declare function InventoryCountHeading({ title, count }: {
    title: ReactNode;
    count: number;
}): import("react").JSX.Element;
export {};
