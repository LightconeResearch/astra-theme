import * as React from 'react';
export interface DataFlowProps {
    /** Ordered labels for each node box (left → right). */
    nodes: string[];
}
export declare const DataFlow: React.FC<DataFlowProps>;
