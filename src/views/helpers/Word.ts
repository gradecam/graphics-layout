import { Context } from '../../contexts';
import { TextStyle } from './TextStyle';

/**
 * A Word is an atomic unit of text that can't be broken accross lines.
 * It maybe have multiple style runs within the word represented as `WordPart`s
 */
export class Word {
    public parts: WordPart[];
    private _spaceWidth: number;
    private _width?: number;

    constructor(
        context: Context,
        wordPart: string,
        style: TextStyle,
        ascender: number,
        descender: number,
        spaceWidth: number
    ) {
        this.parts = [{
            wordPart: wordPart,
            style: style,
            width: context.widthOfText(wordPart),
            ascender: ascender,
            descender: descender
        }];
        this._spaceWidth = spaceWidth;
    }

    get width(): number {
        if(this._width === undefined) {
            this._width = this.parts.reduce((acc, part) => acc + part.width, 0);
        }
        return this._width;
    }

    get ascender(): number {
        let wordAscender = 0;
        this.parts.forEach( (part) => {
            if(part.ascender > wordAscender) { wordAscender = part.ascender; }
        });
        return wordAscender;
    }

    get descender(): number {
        let wordDescender = 0;
        this.parts.forEach( (part) => {
            if(part.descender < wordDescender) { wordDescender = part.descender; }
        });
        return wordDescender;
    }

    get spaceWidth(): number {
        return this._spaceWidth;
    }

    get widthWithSpace(): number {
        return this.width + this.spaceWidth;
    }

    cat(context: Context, wordPart: string, ascender: number, descender: number, style: TextStyle) {
        this.parts.push({
            wordPart: wordPart,
            style: style,
            width: context.widthOfText(wordPart),
            ascender: ascender,
            descender: descender
        });
    }
}

export interface WordPart {
    wordPart: string;
    style: TextStyle;
    width: number;
    ascender: number;
    descender: number;
}
