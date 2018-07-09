import * as PDFDocument from 'pdfkit';
import {
    Context,
    FontMetrics,
    TextOpts,
    Point,
    ImageOpts
} from './Context';

function strEnum<T extends string>(o: Array<T>): {[K in T]: K} {
  return o.reduce((res, key) => {
    res[key] = key;
    return res;
  }, Object.create(null));
}

export const StandardPdfFonts = strEnum([
  'Courier',
  'Helvetica',
  'Times',
  'Symbol',
  'ZapfDingbats'
]);

type CustomFontNameHandler = (bold: boolean, italics: boolean) => string;
interface CustomFontMap {
    [fontName: string]: CustomFontNameHandler;
}

export class PdfKitContext extends Context {
    private doc: PDFKit.PDFDocument;
    private customFontHandlers: CustomFontMap = {};
    private _currentFont: string;
    private _currentFontSize: number;

    setDoc(newDoc: PDFKit.PDFDocument): PdfKitContext {
        if(!newDoc.currentFontMetrics) {
            throw new Error('the PDFDocument instance you passed in does not include the requried extensions.');
        }
        this.doc = newDoc;
        return this;
    }

    moveTo(x: number, y: number): PdfKitContext {
        ({x, y} = this.pointToOrigin(x, y));
        this.doc.moveTo(x, y);
        return this;
    }

    lineTo(x: number, y: number): PdfKitContext {
        ({x, y} = this.pointToOrigin(x, y));
        this.doc.lineTo(x, y);
        return this;
    }

    lineWidth(width: number): PdfKitContext {
        this.doc.lineWidth(width);
        return this;
    }

    roundedRect(left: number, top: number, width: number, height: number, borderRadius: number): PdfKitContext {
        let {x, y} = this.pointToOrigin(left, top);
        this.doc.roundedRect(x, y, width, height, borderRadius);
        return this;
    }

    rect(left: number, top: number, width: number, height: number): PdfKitContext {
        let {x, y} = this.pointToOrigin(left, top);
        this.doc.rect(x, y, width, height);
        return this;
    }

    stroke(): PdfKitContext {
        this.doc.stroke();
        return this;
    }

    fill(color: string): PdfKitContext {
        this.doc.fill(color);
        return this;
    }

    clip(): PdfKitContext {
        this.doc.clip();
        return this;
    }

    scale(multiplier: number, origin?: Point): PdfKitContext {
        const originArray = origin ? [origin.x, origin.y] : undefined;
        this.doc.scale(multiplier, multiplier, <any>{origin: originArray});
        return this;
    }

    save(): PdfKitContext {
        this.doc.save();
        return this;
    }

    restore(): PdfKitContext {
        this.doc.restore();
        return this;
    }

    fillColor(color: string): PdfKitContext {
        this.doc.fillColor(color);
        return this;
    }

    strokeColor(color: string): PdfKitContext {
        this.doc.strokeColor(color);
        return this;
    }

    font(fontName: string): PdfKitContext {
        this._currentFont = fontName;
        this.doc.font(fontName);
        return this;
    }

    fontSize(fontSize: number): PdfKitContext {
        this._currentFontSize = fontSize;
        this.doc.fontSize(fontSize);
        return this;
    }

    get allFontNames(): string[] {
        return Object.keys(StandardPdfFonts).concat(Object.keys(this.customFontHandlers));
    }

    // FIXME: refactor this to use an opts parmater
    registerFont(
        fontName: string,
        dir: string,
        baseFontFile: string,
        boldFontFile: string,
        italicFontFile: string,
        boldItalicFontFile: string
    ): void {
        fontName = fontName.toLowerCase();
        this.customFontHandlers[fontName] = (bold: boolean, italics: boolean) => {
            if(bold) {
                if(italics) {
                    return `${dir}/${boldItalicFontFile}`;
                } else {
                    return `${dir}/${boldFontFile}`;
                }
            } else {
                if(italics) {
                    return `${dir}/${italicFontFile}`;
                } else {
                    return `${dir}/${baseFontFile}`;
                }
            }
        };
    }

    fontToFullFontName(baseFontName: string, bold: boolean, italic: boolean): string {
        baseFontName = baseFontName.toLowerCase();
        if(this.customFontHandlers[baseFontName]) {
            return this.customFontHandlers[baseFontName](bold, italic);
        }

        const fullFontNameMap: any = {
            courier: {
                bold: {
                    italic: 'Courier-BoldOblique',
                    notItalic: 'Courier-Bold'
                },
                notBold: {
                    italic: 'Courier-Oblique',
                    notItalic: 'Courier'
                }
            },
            helvetica: {
                bold: {
                    italic: 'Helvetica-BoldOblique',
                    notItalic: 'Helvetica-Bold'
                },
                notBold: {
                    italic: 'Helvetica-Oblique',
                    notItalic: 'Helvetica'
                }
            },
            times: {
                bold: {
                    italic: 'Times-BoldItalic',
                    notItalic: 'Times-Bold'
                },
                notBold: {
                    italic: 'Times-Italic',
                    notItalic: 'Times-Roman'
                }
            }
        };
        if(
            fullFontNameMap[baseFontName] !== undefined
            && fullFontNameMap[baseFontName][bold ? 'bold' : 'notBold'] != undefined
            && fullFontNameMap[baseFontName][bold ? 'bold' : 'notBold'][italic ? 'italic' : 'notItalic'] != undefined
        ) {
            return fullFontNameMap[baseFontName][bold ? 'bold' : 'notBold'][italic ? 'italic' : 'notItalic'];
        }
        return baseFontName;
    }

    drawText(text: string, left: number, top: number, options: TextOpts = {}): PdfKitContext {
        let {x, y} = this.pointToOrigin(left, top);
        if (this.doc.rawText) {
            this.doc.rawText(text, x, y, options);
        } else {
            this.doc.text(text, x, y, options);
        }
        return this;
    }

    currentLineHeight(): number {
        return this.doc.currentLineHeight();
    }

    currentFontMetrics(): FontMetrics {
        return this.doc.currentFontMetrics();
    }

    widthOfText(text: string): number {
        return this.doc.widthOfString(text);
    }

    image(filename: string, left: number, top: number, opts?: ImageOpts): PdfKitContext {
        let {x, y} = this.pointToOrigin(left, top);
        this.doc.image(filename, x, y, opts);
        return this;
    }
}
