export interface FontMetrics {
    ascender: number;
    descender: number;
    gap: number;
    lineHeight: number;
}

export interface TextOpts {
    underline?: boolean;
    strike?: boolean;
    lineBreak?: boolean;
}

export interface Point {
    x: number;
    y: number;
}

export abstract class Context {
    protected originX: number = 0;
    protected originY: number = 0;

    setOrigin(x: number, y: number) : Context {
        this.originX = x;
        this.originY = y;
        return this;
    }

    pointToOrigin(x: number, y: number): {x: number; y: number} {
        return {x: x + this.originX, y: y + this.originY};
    }

    // abstract extractFontMetrics(): void;
    abstract addPage(): void;
    abstract get allFontNames(): string[];
    abstract moveTo(x: number, y: number): Context;
    abstract lineWidth(width: number): Context;
    abstract roundedRect(left: number, top: number, width: number, height: number, borderRadius: number): Context;
    abstract rect(left: number, top: number, width: number, height: number): Context;
    abstract stroke(): Context;
    abstract fill(color: string): Context;
    abstract clip(): Context;
    abstract scale(multiplier: number, origin?: Point): Context;
    abstract save(): Context;
    abstract restore(): Context;
    abstract fillColor(color: string): Context;
    abstract strokeColor(color: string): Context;
    abstract font(fontName: string): Context;
    abstract fontSize(fontSize: number): Context;
    abstract drawText(text: string, left: number, top: number, options?: TextOpts): Context;
    abstract currentLineHeight(): number;
    abstract currentFontMetrics(): FontMetrics;
    abstract widthOfText(text: string): number;
    abstract fontToFullFontName(baseFontName: string, bold: boolean, italics: boolean): string;
    abstract image(filename: string, left: number, top: number, opts?: ImageOpts): Context;
}

export interface ImageOpts {
    width: number;
}
