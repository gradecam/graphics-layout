import * as htmlparser2 from 'htmlparser2';
import { HtmlParser, BaseDomNode, TagAttributes, ParseCssOpts, FontSelector } from '../../html';
import {
    CssSelectorMap, CssPropertyMap, cssStringToSelectorMap, combineRuleMaps, ParsedTag, TagStack,
    ParsedCssRuleMap, parseSelector, ParsedRuleLookupMap, ParsedCssRule, ParsedCssSubSelector
} from '../../css';
import { userAgentStyleSheetString } from '../../user-agent-styles';
import { newRenderer } from '../newRenderer';
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

    addMany(rules: ParsedCssRuleMap) {
        for(const selectorString of Object.keys(rules)) {
            this.addOne(rules[selectorString]);
        }
    }

    addOne(rule: ParsedCssRule) {
        const rightSub = rule.selector[rule.selector.length-1];
        // FIXME: this will wipe out any rule with the same selector.
        //        they should be merged
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

function tagStackMatchesRule(tagStack: TagStack, rule: ParsedCssRule) {
    // FIXME: use a reverse iterator here and see if it speeds it up at all
    const stack = tagStack.all;
    const stackEnd = stack.length - 1;
    let stackIndex = stackEnd;
    const reversedSubs = rule.selector.slice(0).reverse();
    outer: for(const [index, sub] of reversedSubs.entries()) {
        let siblingNumber;
        if(stackIndex == -1) { return false; }
        let tag = stack[stackIndex];
        siblingNumber = stackIndex > 0 ? stack[stackIndex - 1].children : undefined;
        stackIndex--;
        const subMatches = tagMatchesSub(tag, sub, siblingNumber);
        if(!subMatches) {
            if(index === 0 || sub.direct) { return false; }

            while(true) {
                if(stackIndex == -1) { return false; }
                tag = stack[stackIndex];
                siblingNumber = stackIndex > 0 ? stack[stackIndex - 1].children : undefined;
                stackIndex--;
                if(tagMatchesSub(tag, sub, siblingNumber)) {  continue outer; }
            }
        }
    }
    return true;
}

function tagMatchesSub(tag: ParsedTag, sub: ParsedCssSubSelector, siblingNumber?: number) {
    const idMatch = sub.id ? sub.id === tag.id : true;
    const tagMatch = sub.tagName ? sub.tagName === tag.name : true;
    const classMatch = sub.class ? (tag.classes ? tag.classes.includes(sub.class) : false) : true;
    const pseudoMatch = sub.pseudo && sub.pseudo == 'first-child' ? siblingNumber == 1 : true;
    return idMatch && tagMatch && classMatch && pseudoMatch;
}

function getMatchingDeclarations(tagStack: TagStack, allRules: ParsedCssRuleCollection): CssPropertyMap {
    const potentialRightMatches = allRules.getRightSubPotentialMatches(tagStack.top);
    // FIXME: this is a hack to get this done faster. We should create a reverse iterator for the stack and use that directly
    //        rather than incurring the overhead to clone and reverse the stack every single time we evaluate a tag
    //        we should also do that for the rule reversals that we are doing in `tagStackMatchesRule`
    tagStack.reverse();
    const matches = potentialRightMatches.filter(r => tagStackMatchesRule(tagStack, r));
    let propertyMap: CssPropertyMap = {};
    for(const rule of matches) {
        propertyMap = {...propertyMap, ...rule.props};
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

        const tagStack = new TagStack();
        const rules: ParsedCssRuleCollection = new ParsedCssRuleCollection();
        rules.addMany(parsedUACSS);
        const parser = new htmlparser2.Parser({
            onopentag(tagName: string, attribs: TagAttributes) {

                const tag = {name: tagName, attrs: attribs};
                tagStack.push(tag);

                // get the matching styles from the global styles map
                const globalDeclarations = getMatchingDeclarations(tagStack, rules);

                // handle the inline styles from the tag's style attribute
                const tagDeclarations: CssPropertyMap = attribs.style
                    ? cssStringToSelectorMap(`this { ${attribs.style} }`).this
                    : {};

                const combinedDeclarations: CssPropertyMap = {...globalDeclarations, ...tagDeclarations};

                callbacks.onopentag({tagName, attrs: attribs}, combinedDeclarations);
            },
            ontext: callbacks.ontext,
            onclosetag(tagName: string) {
                callbacks.onclosetag(tagName);
                tagStack.pop();
            }
        }, {decodeEntities: true});
        parser.write(html);
        parser.end();
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

export const mediumRenderer = newRenderer(htmlParser);
export type mediumRendererOpts = RendererOpts<ParsedCssRuleMap>;
