import { View, ViewDesc, RichTextDesc, TextRunDesc } from '../../index';
import { FontSelector, ParseCssOpts } from '../html';
import { StyleStack } from './StyleStack';
import { CssPropertyMap } from '../css';

export interface Renderer<PC> {
    htmlToViewDescTree(html: string, opts?: RendererOpts<PC>): ViewDesc;
    renderHtml(html: string, superView: View, opts?: RendererOpts<PC>): void;
    parseCssString(cssString: string, opts?: ParseCssOpts<PC>): PC;
}


// FIXME: should this go in CSS?
export interface CssHandlerInstance<P> {
    addCssString(cssString: string): void;
    addParsedCss(parsedCss: P): void;
    // getPropertiesForTagStack(tagStack: TagStack): CssPropertyMap;
}

// FIXME: should this go in HTML?
export interface CssHandler<P> {
    parseStyleAttributeString(cssString: string, fontSelector?: FontSelector): CssPropertyMap;
    parseString(cssString: string): P;
    newInstance(): CssHandlerInstance<P>;
}

export interface RendererOpts<PC> {
    css?: PC | string;
    defaultFontSize?: number;
    defaultFont?: string;
    fontSelector?: FontSelector;
}

export interface ParserState {
    currentContainer: ViewDesc;
    currentParagraph: RichTextDesc | null;
    lastTextRun: TextRunDesc | null;
    lastTextRunHasTrailingWhiteSpace: boolean;
    inStyleTag: boolean;
    styleStack: StyleStack;
}
