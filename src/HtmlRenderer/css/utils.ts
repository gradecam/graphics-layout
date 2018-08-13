import * as css from 'css';
import * as cssParse from 'css-what';
import * as parseCssValue from 'css-value';
import { FontSelector } from '../../HtmlRenderer';
import {
    CssSelectorMap,
    CssPropertyMap,
    ParsedCssSubSelector,
    ParsedCssRuleMap,
    ParsedTag,
    Tag,
} from './interfaces';
import {expandCssShorthand} from './cssShorthandExpansions';

// FIXME: does TagStack belong in CSS?
export class TagStack {
    private stack: ParsedTag[] = [];
    private reversed: ParsedTag[] = [];

    reverse() {
        this.reversed = this.stack.slice(0).reverse();
    }

    push(tag: Tag) {
        if(this.stack.length) {
            this.top.children++;
        }
        this.stack.push(parseTag(tag));
    }

    pop() {
        return this.stack.pop();
    }

    get top() {
        return this.stack[this.stack.length-1];
    }

    get all(): ParsedTag[] {
        return this.stack;
    }

    newIterator() {
        return this.reversed[Symbol.iterator]();
    }
}

// FIXME: does parseTag belong in CSS?
export function parseTag(tag: Tag): ParsedTag {
    const parsedTag: ParsedTag = {
        name: tag.name,
        attrs: tag.attrs,
        children: 0
    };
    if(tag.attrs['id']) {
        parsedTag.id = tag.attrs['id'];
    }
    if(tag.attrs['class']) {
        const classes = parseCssClassAttr(tag.attrs['class']);
        if(classes.length) {
            parsedTag.classes = classes;
        }
    }
    return parsedTag;
}

function parseCssClassAttr(classString: string): string[] {
    return classString.trim().replace(/\s\s+/g, ' ').split(' ');
}

export function combineSelectorMaps(maps: CssSelectorMap[]): CssSelectorMap {
    return maps.reduce((combined: CssSelectorMap, map: CssSelectorMap) => {
        return combineTwoSelectorMaps(combined, map);
    }, {});
}

function combineTwoSelectorMaps(mapa: CssSelectorMap, mapb: CssSelectorMap): CssSelectorMap {
    // FIXME: this is not the right way to do this. in this implementation one rule with a specific selector
    //        will overwrite the previous rule with the same selector. they attributes for each selector should be merged
    return {...mapa, ...mapb};
}

export function combineRuleMaps(maps: ParsedCssRuleMap[]): ParsedCssRuleMap {
    return maps.reduce((combined: ParsedCssRuleMap, map: ParsedCssRuleMap) => {
        return combineTwoRuleMaps(combined, map);
    }, {});
}

function combineTwoRuleMaps(mapa: ParsedCssRuleMap, mapb: ParsedCssRuleMap): ParsedCssRuleMap {
    // FIXME: this is not the right way to do this. in this implementation one rule with a specific selector
    //        will overwrite the previous rule with the same selector. they attributes for each selector should be merged
    return {...mapa, ...mapb};
}

export function cssStringToSelectorMap(cssString: string, fontSelector?: FontSelector): CssSelectorMap {

    const stylesheet = css.parse(cssString).stylesheet;
    const selectorMap: CssSelectorMap = {};
    if(stylesheet && stylesheet.rules) {

        for(let rule of <css.Rule[]>stylesheet.rules) {
            if(
                rule.type != 'rule' ||
                !rule.selectors ||
                !rule.declarations
            ) { continue; }

            const propertyMap: CssPropertyMap = {};
            for(let declaration of <css.Declaration[]>rule.declarations) {
                if(
                    declaration.type != 'declaration' ||
                    !declaration.property ||
                    !declaration.value
                ) { continue; }

                // special case for font-family
                if(declaration.property == 'font-family') {
                    // FIXME: fontSelector is a hack, and not a great one at that
                    if(!fontSelector) {
                        throw new Error('you must pass in a fontSelector function in order to use font-family');
                    }
                    declaration.value = fontSelector(declaration.value.split(','));
                }

                // parse the css value string
                let cssValueParts: CssValuePart[] = [];
                try {
                    if(declaration.value && declaration.value.match(/^#[A-F0-9]{3}$|^#[A-F0-9]{6}$/)) {
                        cssValueParts = <any>[{ type: 'ident', string: declaration.value }];
                    } else {
                        cssValueParts = parseCssValue(declaration.value || '');
                    }
                }
                catch(e) {
                    console.warn(`CSS Parse Error. Style '${declaration.property}' will not be rendered`);
                    continue;
                }

                const expandedDeclarations = expandCssShorthand(declaration.property, cssValueParts);
                if(expandedDeclarations.length > 0) {
                    for(let expandedDeclaration of expandedDeclarations) {
                        propertyMap[expandedDeclaration.property] = expandedDeclaration.value;
                    }
                } else {
                    if(cssValueParts.length > 1) {
                        console.warn(`CSS rule error: rule has more than one value but no expanions`);
                        continue;
                    }
                    propertyMap[declaration.property] = cssValueParts[0];
                }
            }

            for(let selector of rule.selectors) {
                // FIXME: if we get two rules with the exact same selector then one will overwrite the other
                //        they shuld be merged with the later set taking precedence when there is a collision
                selectorMap[selector] = propertyMap;
            }
        }
    }
    return selectorMap;
}

export function parseSelector(selectorString: string): ParsedCssSubSelector[] {
    const subs: ParsedCssSubSelector[] = [];
    const wrappedParsedSelector = cssParse(selectorString);
    const parsedSelector = wrappedParsedSelector[0];
    const subIt = parsedSelector[Symbol.iterator]();
    let parsedSub: ParsedCssSubSelector = {};
    while(true) {
        const i = subIt.next();
        if(i.done) { break; }
        const sub = i.value;
        if(sub.type == 'tag') {
            parsedSub.tagName = sub.name;
        } else if(sub.type == 'attribute') {
            if(sub.name == 'id') {
                if(sub.action != 'equals') { console.warn(`css selector ${selectorString} not supported. Behavior undefined.`); }
                parsedSub.id = sub.value;
            } else if(sub.name == 'class') {
                if(sub.action != 'element') { console.warn(`css selector ${selectorString} not supported. Behavior undefined.`); }
                parsedSub.class = sub.value;
            }
        } else if(sub.type == 'pseudo') {
            parsedSub.pseudo = sub.name;
        } else if(sub.type == 'descendant') {
            parsedSub.direct = false;
            subs.push(parsedSub);
            parsedSub = {};
        } else if(sub.type == 'child') {
            parsedSub.direct = true;
            subs.push(parsedSub);
            parsedSub = {};
        }
    }
    subs.push(parsedSub);
    return subs;
}

export function convertCssUnitToPoints(value: CssValuePart, emSize: number) {
    const unitConversionMap: {[unit: string]: number} = {
        'pt': 1,
        'px': 3/4,
        'in': 72,
        'cm':  72.0/2.54,
        'mm':  72.0/25.4,
        'pc': 12
    };
    value.unit = value.unit == '' ? 'pt' : value.unit;
    let multiplier = 1;
    if(unitConversionMap[value.unit]) {
        multiplier = unitConversionMap[value.unit];
    } else if(value.unit == 'em') {
        multiplier = emSize;
    }
    return value.value * multiplier;
}
