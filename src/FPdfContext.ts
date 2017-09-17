import {
    Context,
    FontMetrics,
    TextOpts,
    Point,
    ImageOpts
} from './Context';
import * as fpdf from 'fpdfjs';

// function strEnum<T extends string>(o: Array<T>): {[K in T]: K} {
//   return o.reduce((res, key) => {
//     res[key] = key;
//     return res;
//   }, Object.create(null));
// }

// export const StandardPdfFonts = strEnum([
//   'Courier',
//   'Helvetica',
//   'Times',
//   'Symbol',
//   'ZapfDingbats'
// ]);

// type CustomFontNameHandler = (bold: boolean, italics: boolean) => string;
// interface CustomFontMap {
//     [fontName: string]: CustomFontNameHandler;
// }

// interface WordWidthCache {
//     [word: string]: number;
// }

// interface CharMetricCache {
//     [fontName: string]: WordWidthCache;
// }

export class FPdfContext extends Context {
    private doc: fpdf.FPdf;
    // private customFontHandlers: CustomFontMap = {};
    private _currentFontKey = 'Helvetica';
    private _currentFontSize = 12;

    setDoc(newDoc: fpdf.FPdf): FPdfContext {
        this.doc = newDoc;
        return this;
    }

    moveTo(x: number, y: number): FPdfContext {
        // this.doc.moveTo(x, y);
        return this;
    }

    lineWidth(width: number): FPdfContext {
        // this.doc.lineWidth(width);
        return this;
    }

    roundedRect(left: number, top: number, width: number, height: number, borderRadius: number): FPdfContext {
        let adjustedLeft = left + this.originX;
        let adjustedTop = top + this.originY;
        // this.doc.roundedRect(adjustedLeft, adjustedTop, width, height, borderRadius);
        return this;
    }

    // FIXME: PdfKit requires you to stroke after a rect call, do we want to require this?
    rect(left: number, top: number, width: number, height: number): FPdfContext {
        let {x, y} = this.pointToOrigin(left, top);
        this.doc.rect(x, y, width, height);
        return this;
    }

    stroke(): FPdfContext {
        this.doc.stroke();
        return this;
    }

    fill(color: string): FPdfContext {
        // this.doc.fill(color);
        return this;
    }

    clip(): FPdfContext {
        // this.doc.clip();
        return this;
    }

    scale(multiplier: number, origin?: Point): FPdfContext {
        const originArray = origin ? [origin.x, origin.y] : undefined;
        // this.doc.scale(multiplier, multiplier, <any>{origin: originArray});
        return this;
    }

    save(): FPdfContext {
        // this.doc.save();
        return this;
    }

    restore(): FPdfContext {
        // this.doc.restore();
        return this;
    }

    fillColor(color: string): FPdfContext {
        // console.log('fillColor:', color);
        // this.doc.fillColor(color);
        return this;
    }

    strokeColor(color: string): FPdfContext {
        const components: {red: number; green: number; blue: number} = {red: 0, green: 0, blue: 0};
        if(color == 'blue') {
            components.red = 0;
            components.green = 0;
            components.blue = 255;
        } else if (color == 'green') {
            components.red = 0;
            components.green = 128;
            components.blue = 0;
        }

        // console.error('strokeColor:', color);
        this.doc.strokeColor(components.red, components.green, components.blue);
        return this;
    }

    font(fontName: string): FPdfContext {
        this._currentFontKey = fontName;
        this.doc.setFont(fontName, '', this._currentFontSize);
        return this;
    }

    fontSize(fontSize: number): FPdfContext {
        this._currentFontSize = fontSize;
        this.doc.setFont(this._currentFontKey, fontSize);
        return this;
    }

    get allFontNames(): string[] {
        return [];
    }

    // FIXME: refactor this to use an opts parmater
    // registerFont(
    //     fontName: string,
    //     dir: string,
    //     baseFontFile: string,
    //     boldFontFile: string,
    //     italicFontFile: string,
    //     boldItalicFontFile: string
    // ): void {
    //     fontName = fontName.toLowerCase();
    //     this.customFontHandlers[fontName] = (bold: boolean, italics: boolean) => {
    //         if(bold) {
    //             if(italics) {
    //                 return `${dir}/${boldItalicFontFile}`;
    //             } else {
    //                 return `${dir}/${boldFontFile}`;
    //             }
    //         } else {
    //             if(italics) {
    //                 return `${dir}/${italicFontFile}`;
    //             } else {
    //                 return `${dir}/${baseFontFile}`;
    //             }
    //         }
    //     };
    // }

    fontToFullFontName(baseFontName: string, bold: boolean, italic: boolean): string {
        // FIXME: this obviously isn't a correct implementation
        return baseFontName.toLowerCase();
    }
        // baseFontName = baseFontName.toLowerCase();
        // if(this.customFontHandlers[baseFontName]) {
        //     return this.customFontHandlers[baseFontName](bold, italic);
        // }

    //     const fullFontNameMap: any = {
    //         courier: {
    //             bold: {
    //                 italic: 'Courier-BoldOblique',
    //                 notItalic: 'Courier-Bold'
    //             },
    //             notBold: {
    //                 italic: 'Courier-Oblique',
    //                 notItalic: 'Courier'
    //             }
    //         },
    //         helvetica: {
    //             bold: {
    //                 italic: 'Helvetica-BoldOblique',
    //                 notItalic: 'Helvetica-Bold'
    //             },
    //             notBold: {
    //                 italic: 'Helvetica-Oblique',
    //                 notItalic: 'Helvetica'
    //             }
    //         },
    //         times: {
    //             bold: {
    //                 italic: 'Times-BoldItalic',
    //                 notItalic: 'Times-Bold'
    //             },
    //             notBold: {
    //                 italic: 'Times-Italic',
    //                 notItalic: 'Times-Roman'
    //             }
    //         }
    //     };
    //     if(
    //         fullFontNameMap[baseFontName] !== undefined
    //         && fullFontNameMap[baseFontName][bold ? 'bold' : 'notBold'] != undefined
    //         && fullFontNameMap[baseFontName][bold ? 'bold' : 'notBold'][italic ? 'italic' : 'notItalic'] != undefined
    //     ) {
    //         return fullFontNameMap[baseFontName][bold ? 'bold' : 'notBold'][italic ? 'italic' : 'notItalic'];
    //     }
    //     return baseFontName;
    // }

    drawText(text: string, left: number, top: number, options: TextOpts = {}): FPdfContext {
        // console.error('drawText before:', text, left, top);
        let {x, y} = this.pointToOrigin(left, top);
        // console.error('drawText after :', text, x, y);
        this.doc.text(x, y, text);
        return this;
    }

    currentLineHeight(): number {
        return this._currentFontSize;
        // return this.doc.currentLineHeight();
    }

    currentFontMetrics(): FontMetrics {
        if(!this.doc._currentFont) {
            throw new Error('a font must be set before metrics can be obtained');
        }
        const multiplier = this._currentFontSize / 1000;
        return {
            ascender: this.doc._currentFont.fontMetrics.ascender * multiplier,
            descender: this.doc._currentFont.fontMetrics.descender * multiplier,
            lineHeight: (this.doc._currentFont.fontMetrics.ascender - this.doc._currentFont.fontMetrics.descender) * multiplier,
            gap: 0
        };
    }

    widthOfText(text: string): number {
        return this.doc.getTextWidth(text);
    }

    image(filename: string, left: number, top: number, opts?: ImageOpts): FPdfContext {
        // let {x, y} = this.pointToOrigin(left, top);
        // this.doc.image(filename, x, y, opts);
        return this;
    }
}
