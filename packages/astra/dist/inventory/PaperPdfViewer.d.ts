export interface PaperQuoteFocusRequest {
    key: string;
    insightId: string;
    quote: string;
    page?: number;
}
interface PaperPdfViewerProps {
    pdfUrl: string;
    title: string;
    focusRequest?: PaperQuoteFocusRequest;
    /**
     * Host-provided directory containing pdf.mjs and pdf.worker.min.mjs.
     * MyST leaves this unset so the files continue to resolve from its base URL.
     */
    pdfAssetBaseUrl?: string;
}
export declare function PaperPdfViewer({ pdfUrl, title, focusRequest, pdfAssetBaseUrl, }: PaperPdfViewerProps): import("react").JSX.Element;
export {};
