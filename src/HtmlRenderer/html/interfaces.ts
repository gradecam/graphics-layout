import { CssPropertyMap } from '../css/interfaces';

export type FontSelector = (fontFamilyNames: string[]) => string;

export interface TagAttributes {
    [type: string]: string;
}

export interface BaseDomNode {
    tagName: string;
    attrs: TagAttributes;
}

export interface HtmlParser<PC> {
    parseHtml(callbacks: {
        onopentag(node: BaseDomNode, styles: CssPropertyMap): void,
        ontext(text: string): void,
        onclosetag(tagName: string): void
    }, html: string, css?: PC | string): void;
    parseCssString(cssString: string, opts?: ParseCssOpts<PC>): PC;
}

export interface ParseCssOpts<PC> {
    existing?: PC;
    fontSelector?: FontSelector;
}
