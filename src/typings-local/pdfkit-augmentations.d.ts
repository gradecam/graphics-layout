// FIXME: why doesn't this need to import 'pdfkit' in order to augment it???
declare namespace PDFKit.Mixins {

    interface FontMetricsInfo {
        ascender: number;
        descender: number;
        gap: number;
        lineHeight: number;
    }

    interface RawTextOptions extends TextOptions {
        enableCache?: boolean;
    }

    interface PDFFont<TDocument> {
        currentFontMetrics(): FontMetricsInfo;
        rawText(text: string, x?: number, y?: number, options?: RawTextOptions): TDocument;
    }
}
