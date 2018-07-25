import { TagStack } from './utils';

export interface CssValuePart {
    type: string;
    string: string;
    unit: string;
    value: number;
}

export interface SimpleCssDeclaration {
    property: string;
    value: CssValuePart;
}

export interface CssPropertyMap {
    [property: string]: CssValuePart;
}

export interface CssSelectorMap {
    [selector: string]: CssPropertyMap;
}

// FIXME: does TagAttributes belong in CSS?
export interface TagAttributes {
    [type: string]: string;
}

// FIXME: does Tag belong in CSS?
export interface Tag {
    name: string;
    attrs: TagAttributes;
}

// FIXME: does Tag belong in CSS?
export interface ParsedTag extends Tag {
    id?: string;
    classes?: string[];
    children: number;
}

export interface CssHandlerStatic<P> {
    parseString(cssString: string): P;
}
export interface CssHandler<P> {
    addCssString(cssString: string): void;
    addParsedCss(parsedCss: P): void;
    getPropertiesForTagStack(tagStack: TagStack): CssPropertyMap;
}


export interface ParsedCssSubSelector {
    id?: string;
    class?: string;
    tagName?: string;
    direct?: boolean;
    pseudo?: string;
}

export interface ParsedCssRule {
    selectorString: string;
    selector: ParsedCssSubSelector[];
    props: CssPropertyMap;
}

export interface ParsedRuleLookupMap {
    [subSelectorString: string]: ParsedCssRule[];
}

export interface ParsedCssRuleMap {
    [selectorString: string]: ParsedCssRule;
}
