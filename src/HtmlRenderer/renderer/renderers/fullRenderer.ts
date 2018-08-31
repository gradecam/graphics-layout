import * as htmlparser2 from 'htmlparser2';
import * as CSSselect from 'css-select';
import { FontSelector } from '../../..';
import { userAgentStyleSheetString } from '../../user-agent-styles';
import { newRenderer } from '../newRenderer';
import {HtmlParser, BaseDomNode, ParseCssOpts} from '../../html';
import {
    parseSelector, CssSelectorMap, CssPropertyMap, cssStringToSelectorMap, ParsedTag,
    ParsedRuleLookupMap, ParsedCssRule, ParsedCssRuleMap, combineRuleMaps
} from '../../css';
import { CssHandler, CssHandlerInstance, RendererOpts } from '../structures';

const parsedUACSS = parseSelectors(cssStringToSelectorMap(userAgentStyleSheetString));

const simpleCssHandler: CssHandler<CssSelectorMap> = {
    parseStyleAttributeString(cssString: string, fontSelector?: FontSelector): CssPropertyMap {
        return cssStringToSelectorMap(`this { ${cssString} }`, fontSelector).this;
    },
    parseString(cssString: string, fontSelector?: FontSelector): CssSelectorMap {
        return cssStringToSelectorMap(cssString, fontSelector);
    },
    newInstance() {
        return new BasicCssHandlerInstance();
    }
};

class BasicCssHandlerInstance implements CssHandlerInstance<CssSelectorMap> {
    private selectorMap: CssSelectorMap = {};

    addCssString(cssString: string) {
        this.addParsedCss(simpleCssHandler.parseString(cssString));
    }

    addParsedCss(parsedCss: CssSelectorMap) {
        this.selectorMap = {...this.selectorMap, ...parsedCss};
    }
}

class ParsedCssRuleCollection {
    private all: ParsedCssRuleMap = {};
    private classMap: ParsedRuleLookupMap = {};
    private idMap: ParsedRuleLookupMap = {};
    private tagMap: ParsedRuleLookupMap = {};

    get allRules() {
        return this.all;
    }

    addMany(rules: ParsedCssRuleMap) {
        for(const selectorString of Object.keys(rules)) {
            this.addOne(rules[selectorString]);
        }
    }

    addOne(rule: ParsedCssRule) {
        const rightSub = rule.selector[rule.selector.length-1];
        // FIXME: this will wipe out any rule with the same selector. they should be merged
        this.all[rule.selectorString] = rule;
        if(rightSub.id) {
            if(!this.idMap[rightSub.id]) {
                this.idMap[rightSub.id] = [];
            }
            this.idMap[rightSub.id].push(rule);
        }
        else if(rightSub.class) {
            if(!this.classMap[rightSub.class]) {
                this.classMap[rightSub.class] = [];
            }
            this.classMap[rightSub.class].push(rule);
        }
        else if(rightSub.tagName) {
            if(!this.tagMap[rightSub.tagName]) {
                this.tagMap[rightSub.tagName] = [];
            }
            this.tagMap[rightSub.tagName].push(rule);
        }
    }

    getRightSubPotentialMatches(tag: ParsedTag): ParsedCssRule[] {
        const idMatches = tag.id && this.idMap[tag.id] ? this.idMap[tag.id] : [];
        const classMatches = tag.classes ? tag.classes.reduce((acc, className) => {
            return this.classMap[className] ? [...acc, ...this.classMap[className]] : acc;
        }, []) : [];
        const tagMatches = this.tagMap[tag.name] || [];

        return [...idMatches, ...classMatches, ...tagMatches];
    }
}

function getMatchingDeclarations(node: htmlparser2.ElementNode, allRules: ParsedCssRuleCollection): CssPropertyMap {
    let propertyMap: CssPropertyMap = {};
    const all = allRules.allRules;
    for(const selectorString of Object.keys(all)) {
        const rule = all[selectorString];
        if(CSSselect.is(node, selectorString)) {
            propertyMap = {...propertyMap, ...rule.props};
        }
    }
    return propertyMap;
}

// FIXME: put this in a legit debugging module
function _r(o: any) {
    console.log(o);
    const cache: any[] = [];
    return JSON.stringify(o, function(key: any, value: any) {
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                // Circular reference found, discard key
                return;
            }
            // Store value in our collection
            cache.push(value);
        }
        return value;
    }, 4);
}

const htmlParser: HtmlParser<ParsedCssRuleMap> = {
    parseHtml(callbacks: {
        onopentag(node: BaseDomNode, styles: CssPropertyMap): void,
        ontext(text: string): void,
        onclosetag(tagName: string): void
    }, html: string, css?: ParsedCssRuleMap | string): void {
        const rules: ParsedCssRuleCollection = new ParsedCssRuleCollection();
        rules.addMany(parsedUACSS);
        let parsedCustomCss: ParsedCssRuleMap = {};
        if(css) {
            if(typeof css == 'string') {
                parsedCustomCss = parseSelectors(cssStringToSelectorMap(css));
            } else {
                parsedCustomCss = css;
            }
        }
        rules.addMany(parsedCustomCss);

        const domUtils = htmlparser2.DomUtils;
        const domHandler = new htmlparser2.DomHandler((err, dom) => {
            if(err) {
                throw err;
            } else {
                const root = dom[0];
                let depth = 0;
                function traverseNode(node: htmlparser2.Node) {
                    if(domUtils.isTag(node)) {
                        // handle the inline styles from the tag's style attribute
                        const tagDeclarations: CssPropertyMap = node.attribs.style
                            ? cssStringToSelectorMap(`this { ${node.attribs.style} }`).this
                            : {};
                        const globalDeclarations = getMatchingDeclarations(node, rules);
                        const combinedDeclarations: CssPropertyMap = {...globalDeclarations, ...tagDeclarations};

                        callbacks.onopentag({tagName: domUtils.getName(node), attrs: node.attribs}, combinedDeclarations);
                    } else if (domUtils.getText(node).trim()) {
                        // FIXME: simpleRenderer and mediumRenderer send text in differently from fullRenderer because
                        //    the dom handler used here consolidates all text parts into a single node whereas using
                        //    htmlparser2 directly as in simpleRenderer and mediumRenderer always passes non-breaking
                        //    spaces separately in a single call to ontext()
                        //
                        //    What we need to do is
                        //      1. figure out how to best handle wrapping non-breaking spaces in views/RichTextView
                        //         and views/helpers/TestRun, and implment that
                        //      2. figure out what kind of input newRenderer needs in order to create the text runs
                        //         in a way that RichTextView and TextRun can handle
                        //      3. make sure all of the renderers can and are passing in text that way
                        //
                        //    We may need to do something like this in order ot mimic what htmlparser2 does when it calls ontext()
                        //
                        // const parts = domUtils.getText(node).split("\u00A0");
                        // callbacks.ontext(parts.shift() || '');
                        // for(const part of parts) {
                        //     callbacks.ontext("\u00A0");
                        //     callbacks.ontext(part);
                        // }

                        callbacks.ontext(domUtils.getText(node));
                    }
                    depth++;
                    const children = domUtils.getChildren(node) || [];
                    for(const child of children) {
                        traverseNode(child);
                    }
                    if(domUtils.isTag(node)) {
                        callbacks.onclosetag(domUtils.getName(node));
                    }
                    depth--;
                }
                traverseNode(root);
            }
        }, {normalizeWhitespace: true});
        const domParser = new htmlparser2.Parser(domHandler, {decodeEntities: true});
        domParser.write(`<html>${html}</html>`);
        domParser.end();
    },
    parseCssString
};

function parseCssString(cssString: string, opts?: ParseCssOpts<ParsedCssRuleMap>): ParsedCssRuleMap {
    const newRuleMap = parseSelectors(cssStringToSelectorMap(cssString));
    return opts && opts.existing ? combineRuleMaps([opts.existing, newRuleMap]): newRuleMap;
}

// FIXME: make this more type safe
function parseSelectors(selectorMap: CssSelectorMap): ParsedCssRuleMap {
    return Object.keys(selectorMap).reduce((ruleMap: ParsedCssRuleMap, selectorString) => {
        ruleMap[selectorString] = {
            selectorString,
            selector: parseSelector(selectorString),
            props: selectorMap[selectorString]
        };
        return ruleMap;
    }, {});
}

export const fullRenderer = newRenderer(htmlParser);
export type fullRendererOpts = RendererOpts<ParsedCssRuleMap>;
