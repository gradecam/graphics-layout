// exports
export {
    FontSelector,
    CssSelectorMap,
    CssValuePart
} from './utils';

// node modules
import * as htmlparser from 'htmlparser2';
import * as css from 'css';
import * as parseCssValue from 'css-value';

// dependencies in graphics-layout
import {
    ViewDesc,
    RichTextDesc,
    ColumnDesc,
    FrameDesc,
    TextRunDesc,
    // printDescTree
} from '../ViewDescriptions';
import {Factory} from '../Factory';
import {View} from '../views';
import {HorizontalAlignment} from '../Alignment';

// internal imports
import {
    convertCssUnitToPoints,
    CssPropertyMap,
    CssSelectorMap,
    FontSelector,
    InheritedStyle,
    SimpleCssDeclaration
} from './utils';
import {cssTextDeclarationHandlers} from './cssTextDeclarationHandlers';
import {cssFrameDeclarationHandlers} from './cssFrameDeclarationHandlers';
import {cssShorthandExpansionMap} from './cssShorthandExpansionMap';

const userAgentStyleSheet = `
p  {
    margin-top: 1.00em;
    margin-bottom: 1.00em;
}
h1 {
    font-size: 2.00em;
    margin-top: 0.67em;
    margin-bottom: 0.67em;
    font-weight: bold;
}
h2 {
    font-size: 1.50em;
    margin-top: 0.83em;
    margin-bottom: 0.83em;
    font-weight: bold;
}
h3 {
    font-size: 1.17em;
    margin-top: 1.00em;
    margin-bottom: 1.00em;
    font-weight: bold;
}
h4 {
    font-size: 1.00em;
    margin-top: 1.33em;
    margin-bottom: 1.33em;
    font-weight: bold;
}
h5 {
    font-size: 0.83em;
    margin-top: 1.67em;
    margin-bottom: 1.67em;
    font-weight: bold;
}
h6 {
    font-size: 0.67em;
    margin-top: 2.33em;
    margin-bottom: 2.33em;
    font-weight: bold;
}
b, strong {
    font-weight: bold;
}
sub {
    vertical-align: sub;
    font-size: smaller;
}
sup {
    vertical-align: super;
    font-size: smaller;
}
i, em, address {
    font-style: italic;
}
u, ins {
    text-decoration: underline;
}
s, strike, del {
    text-decoration: line-through;
}
`;

const containerTags = [
    'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'address', 'article', 'aside', 'div', 'footer', 'header', 'hgroup', 'layer', 'main', 'nav', 'section'
];
function isContainerTag(tagName: string): boolean {
    return containerTags.indexOf(tagName) != -1;
}

const styleTags = ['b', 'strong', 'i', 'em', 'u', 'ins', 's', 'strike', 'del', 'span', 'sub', 'sup'];
function isStyleTag(tagName: string): boolean {
    return styleTags.indexOf(tagName) != -1;
}

function cssStringToSelectorMap(cssString: string, fontSelector?: FontSelector): CssSelectorMap {

    const stylesheet = css.parse(cssString).stylesheet;
    // console.log({stylesheet});
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
                    if(declaration.value.match(/^#[A-F0-9]{3}$|^#[A-F0-9]{6}$/)) {
                        cssValueParts = <any>[{ type: 'ident', string: declaration.value }];
                    } else {
                        cssValueParts = parseCssValue(declaration.value);
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
                selectorMap[selector] = propertyMap;
            }
        }
    }
    return selectorMap;
}

function parseCssClassTag(classString: string): string[] {
    // FIXME: this could be more robust
    return classString.trim().split(' ');
}

function getMatchingDeclarations(
    selectorMap: CssSelectorMap,
    tagName: string | undefined,
    id: string | undefined,
    classes: string[] | undefined
): CssPropertyMap {
    // tag names have the lowest specificity of the three
    let newPropertyMap: CssPropertyMap = {};
    if(tagName) {
        newPropertyMap = Object.assign(newPropertyMap, selectorMap[tagName]);
    }

    // classes are in the middle
    if(classes) {
        for(let className of classes) {
            newPropertyMap = Object.assign(newPropertyMap, selectorMap[`.${className}`]);
        }
    }

    // id selectors have the highest specificity of the three
    if(id) {
        newPropertyMap = Object.assign(newPropertyMap, selectorMap[`#${id}`]);
    }

    return newPropertyMap;
}

// FIXME: expandCssShorthand and expandCssShorthand2 should probably just be one recursive function
function expandCssShorthand(property: string, parts: CssValuePart[]): SimpleCssDeclaration[] {
    if(!cssShorthandExpansionMap[property]) {
        if(parts.length > 1) { console.warn('css property with no expansions has more than one value'); }
        return [{property: property, value: parts[0]}];
    }
    const expandedDeclarations = cssShorthandExpansionMap[property](parts);
    let allDeclarations: SimpleCssDeclaration[] = [];
    for(const expandedDelaration of expandedDeclarations) {
        const furtherExpanded = expandCssShorthand2(expandedDelaration.property, expandedDelaration.value);
        allDeclarations = allDeclarations.concat(furtherExpanded);
    }
    return allDeclarations;
}

function expandCssShorthand2(property: string, part: CssValuePart): SimpleCssDeclaration[] {
    if(!cssShorthandExpansionMap[property]) { return [{property: property, value: part}]; }
    return cssShorthandExpansionMap[property]([part]);
}

let textCount = 0;

export interface HtmlRenderOpts {
    defaultFontSize?: number;
    defaultFont?: string;
}

interface TagAttributes { [type: string]: string; }

const userAgentSelectorMap = cssStringToSelectorMap(userAgentStyleSheet);

export function renderHtml(
    html: string,
    customCss: CssSelectorMap,
    superView: View,
    fontSelector: FontSelector,
    opts?: HtmlRenderOpts
) {
    let cssSelectorMap = Object.assign({}, userAgentSelectorMap, customCss);

    const defaultOpts: HtmlRenderOpts = {defaultFont: 'Helvetica', defaultFontSize: 12};
    const options = Object.assign({}, defaultOpts, opts);

    let currentContainer: ViewDesc = <ColumnDesc>{
        type: 'Column',
        name: 'renderRoot',
        left: 5,
        top: 5,
        width: 240,
        height: 140
    };
    let rootContainer = currentContainer;
    let currentParagraph: RichTextDesc | null = null;
    let lastTextRun: TextRunDesc | null = null;
    let lastTextRunHasTrailingWhiteSpace = false;
    let inStyleTag = false;
    let styleStack: InheritedStyle[] = [{
        font: options.defaultFont || 'Helvetica',
        fontSize: options.defaultFontSize || 12,
        color: 'black',
        bold: false,
        italics: false,
        strikethrough: false,
        underline: false,
        vshift: 0,
        textAlignment: HorizontalAlignment.Left,
        displayNone: false
    }];

    const parser = new htmlparser.Parser({
        onopentag: function(tagName: string, attribs: TagAttributes){
            // always push a new style onto the stack, even if we don't end up changing anything
            const newStyle = cloneStyle(styleStack[styleStack.length-1]);
            styleStack.push(newStyle);

            // Get all applicable styles. If any contains "display: none" then we need to ingnore everything else
            let matchingDeclarations = getMatchingDeclarations(
                cssSelectorMap,
                tagName,
                attribs.id || undefined,
                parseCssClassTag(attribs.class || '') || undefined
            );
            let combinedDeclarations = matchingDeclarations;
            if(attribs.style) {
                let styleAttributeSelectorMap = cssStringToSelectorMap(`this { ${attribs.style} }`, fontSelector);
                combinedDeclarations = Object.assign({}, matchingDeclarations, styleAttributeSelectorMap.this);
            }
            if(combinedDeclarations.display && combinedDeclarations.display.string == 'none') {
                newStyle.displayNone = true;
            }

            // this might have just been set or it could have been set by a parent element. Either way we just need to bail
            if(newStyle.displayNone) {
                return;
            }

            if(tagName == 'style') {
                inStyleTag = true;
            } else if(isContainerTag(tagName)) {
                currentParagraph = null;
                const newLayer = handleContainerTag(tagName, combinedDeclarations, attribs, currentContainer, newStyle);
                currentContainer = newLayer.inner;
                lastTextRun = null;
                lastTextRunHasTrailingWhiteSpace = false;
            } else if(isStyleTag(tagName)) {
                // console.log({tagName});
                handleStyleTag(tagName, combinedDeclarations, attribs, newStyle);
                // console.log({newStyle});
            } else {
                // handle <br> as a special case, ignore anything we don't regcognize (should we treat them all as generic containers?)
                if(tagName == 'br') {
                    if(lastTextRun) {
                        lastTextRun.lastWordToBeContinued = false;
                        lastTextRun = null;
                    }
                    currentParagraph = null;
                }
            }
        },
        ontext: function(text: string){

            if(inStyleTag) {
                return;
            }

            if(styleStack[styleStack.length-1].displayNone) {
                return;
            }

            // check to see if we have a non-breaking space
            let hasLeadingWhiteSpace: boolean;
            let hasTrailingWhiteSpace: boolean;
            const isNonBreakingSpace = text == "\u00A0";
            if(isNonBreakingSpace) {
                hasLeadingWhiteSpace = false;
                hasTrailingWhiteSpace = false;
            } else {
                hasLeadingWhiteSpace = text.charAt(0) == ' ';
                hasTrailingWhiteSpace = text.charAt(text.length-1) == ' ';
                text = text.trim();
            }

            if(text != '') {
                if(lastTextRun && !lastTextRunHasTrailingWhiteSpace && !hasLeadingWhiteSpace) {
                    lastTextRun.lastWordToBeContinued = true;
                } else if(lastTextRun) {
                    lastTextRun.lastWordToBeContinued = false;
                }

                let topStyle = styleStack[styleStack.length-1];

                if(!currentParagraph) {
                    textCount++;
                    currentParagraph = {type: 'RichText', name: `textBox${textCount}`, alignment: topStyle.textAlignment, runs: []};

                    if(!currentContainer) { throw new Error("there should always be a current container"); }
                    if(!currentContainer.subviews) { currentContainer.subviews = []; }
                    currentContainer.subviews.push(currentParagraph);
                }
                // console.log({text, topStyle});
                let newRun: TextRunDesc = {text: text, style: topStyle};
                // console.log(newRun);
                currentParagraph.runs.push(newRun);
                lastTextRun = newRun;
                lastTextRunHasTrailingWhiteSpace = hasTrailingWhiteSpace;
            } else {
                lastTextRun = null;
                lastTextRunHasTrailingWhiteSpace = false;
            }
        },
        onclosetag: function(tagName: string){
            if(styleStack[styleStack.length-1].displayNone) {
                styleStack.pop();
                return;
            }

            const isContainerTag = containerTags.indexOf(tagName) != -1;
            const isStyleTag = styleTags.indexOf(tagName) != -1;
            if(tagName == 'style') {
                inStyleTag = false;
            } else if(isContainerTag) {
                currentParagraph = null;
                if(!currentContainer.parent) { throw new Error("the current container should always be asigned a parent"); }
                currentContainer = currentContainer.parent;
                lastTextRun = null;
            } else if(isStyleTag) {
            } else {
                // just ignore any tags that we don't regcognize (this needs to mirror the behavior of onopentag)
            }
            styleStack.pop();
        }
    }, {decodeEntities: true});
    parser.write(html);
    parser.end();

    // printDescTree(rootContainer);
    let generatedViewTree = Factory(rootContainer);
    superView.addSubview(generatedViewTree);
}

function printDescTree(rootView: ViewDesc, depth: number = 0) {
    // JSON.stringify(rootView, null, 4);
    console.log("  ".repeat(depth) + `{${rootView.type}}`);
    if(!rootView.subviews) { return; }
    for(const sub of rootView.subviews) {
        printDescTree(sub, depth + 1);
    }
}

interface ContainerLayer {
    outer: ViewDesc;
    inner: ViewDesc;
}

let count = 0;
function handleContainerTag(
    tagName: string,
    cssPropertyMap: CssPropertyMap,
    attribs: TagAttributes,
    currentContainer: ViewDesc,
    currentStyle: InheritedStyle
): ContainerLayer {
    count++;
    // create a new frame view to handle margin, border, padding, centering, etc
    const newFrameView: FrameDesc = {type: 'Frame', name: `${tagName}-Frame${count}`};
    newFrameView.subviews = [];
    if(!currentContainer.subviews) { currentContainer.subviews = []; }
    currentContainer.subviews.push(newFrameView);

    // figure out if we have a new font size
    // this is necessary to do separately and before the other styles because if it's given in relative units then
    // it's absolute value is calculated relative to it's container. The other relative styles however are calculated
    // relative to the result we come up with here
    let fontSizePart: CssValuePart | undefined;
    let newFontSize: number | undefined;

    if(cssPropertyMap['font-size']) {
        fontSizePart = cssPropertyMap['font-size']; //getFontSizeFromDeclarations(attribsDeclarations);
    }
    const oldEmSize = currentStyle.fontSize;
    if(fontSizePart) {
        newFontSize = convertCssUnitToPoints(fontSizePart, oldEmSize);
    }

    if(newFontSize) {
        currentStyle.fontSize = newFontSize;
    }

    // now that that's all done, the font size is for the current style is up to date so we can use it for the
    // rest of the relative size calculations
    const emSize = currentStyle.fontSize;

    // now apply the frame styles based on our newly calculated emSize
    applyFrameViewProprtiesFromCssPropertyMap(cssPropertyMap, newFrameView, emSize);

    // now apply the text styles to currentStyle based on the emSize we just calculated
    applyCssTextStylesFromPropertyMap(cssPropertyMap, currentStyle, emSize, false);

    // now create column view and put it inside the frame
    const newContainer: ColumnDesc = {type: 'Column', name: `${tagName}${count}`};
    newFrameView.subviews.push(newContainer);
    newContainer.parent = currentContainer;
    return {outer: newFrameView, inner: newContainer};
}

function handleStyleTag(tagName: string, cssPropertyMap: CssPropertyMap, attribs: TagAttributes, currentStyle: InheritedStyle) {
    if(!currentStyle.fontSize) {throw new Error("font size should always be set");}
    const emSize = currentStyle.fontSize;
    applyCssTextStylesFromPropertyMap(cssPropertyMap, currentStyle, emSize, true);
}

function applyCssTextStylesFromPropertyMap(
    cssPropertyMap: CssPropertyMap,
    style: InheritedStyle,
    emSize: number,
    includeFontSize: boolean
) {
    for(let propertyName of Object.keys(cssPropertyMap)) {
        if(!includeFontSize && propertyName == 'font-size') { continue; }
        if(cssTextDeclarationHandlers[propertyName]) {
            cssTextDeclarationHandlers[propertyName](cssPropertyMap[propertyName], style, emSize);
        }
    }
}

function applyFrameViewProprtiesFromCssPropertyMap(cssPropertyMap: CssPropertyMap, frameViewDesc: FrameDesc, emSize: number) {
    for(let propertyName of Object.keys(cssPropertyMap)) {
        if(cssFrameDeclarationHandlers[propertyName]) {
            cssFrameDeclarationHandlers[propertyName](cssPropertyMap[propertyName], frameViewDesc, emSize);
        }
    }
}

function cloneStyle(style: InheritedStyle): InheritedStyle {
    return {
        font: style.font,
        fontSize: style.fontSize,
        color: style.color,
        bold: style.bold,
        italics: style.italics,
        underline: style.underline,
        strikethrough: style.strikethrough,
        vshift: style.vshift,
        textAlignment: style.textAlignment,
        displayNone: style.displayNone
    };
}
