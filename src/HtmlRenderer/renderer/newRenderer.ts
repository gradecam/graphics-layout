import { ColumnDesc, FrameDesc, TextRunDesc, ViewDesc, Factory, View } from '../..'; // from 'graphics-layout';
import { HtmlParser, ParseCssOpts, BaseDomNode, TagAttributes} from '../html';
import { CssPropertyMap, convertCssUnitToPoints } from '../css'; // from 'graphics-render-css';
import { cssTextDeclarationHandlers } from './cssTextDeclarationHandlers';
import { cssFrameDeclarationHandlers } from './cssFrameDeclarationHandlers';
import { InheritedStyle } from './utils';
import { StyleStack } from './StyleStack';
import { Renderer, RendererOpts, ParserState } from './structures';

// FIXME: move these into the html module
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

export function newRenderer<PC>(htmlParser: HtmlParser<PC>): Renderer<PC> {
    return {
        /**
         * Takes html and creates a tree of `ViewDesc`s that will be used to generate an actual View tree
         * @param html The html to be rendered
         * @param opts Various rendering options. See `RendererOpts`
         */
        htmlToViewDescTree(html: string, opts?: RendererOpts<PC>): ViewDesc {
            const options: RendererOpts<PC> = {...{defaultFont: 'Helvetica', defaultFontSize: 12}, ...opts};
            const rootContainer: ViewDesc = newRootContainer();
            const state: ParserState = newInitialParserState(rootContainer, opts);

            htmlParser.parseHtml({
                onopentag(node: BaseDomNode, styles: CssPropertyMap): void {
                    // always push a new style onto the stack, even if we don't end up changing anything
                    const curStyle = state.styleStack.cloneTop();

                    // special case for `display: none`
                    if(styles.display && styles.display.string == 'none') { curStyle.displayNone = true; }
                    // this might have just been set or it could have been set by a parent element. Either way we just need to bail
                    if(curStyle.displayNone) { return; }

                    if(node.tagName == 'style') {
                        state.inStyleTag = true;
                    } else if(isContainerTag(node.tagName)) {
                        state.currentParagraph = null;
                        const newLayer = handleContainerTag(
                            node.tagName,
                            styles,
                            node.attrs,
                            state.currentContainer,
                            curStyle
                        );
                        state.currentContainer = newLayer.inner;
                        state.lastTextRun = null;
                        state.lastTextRunHasTrailingWhiteSpace = false;
                    } else if(isStyleTag(node.tagName)) {
                        handleStyleTag(node.tagName, styles, node.attrs, curStyle);
                    } else {
                        // handle <br> as a special case and ignore anything we don't regcognize
                        // FIXME: should we treat `<br>s` as generic containers?
                        if(node.tagName == 'br') {
                            if(state.lastTextRun) {
                                state.lastTextRun.lastWordToBeContinued = false;
                                state.lastTextRun = null;
                            }
                            state.currentParagraph = null;
                        }
                    }
                },
                ontext(text: string) {
                    // all styles need to be retreived and processed before rendering begins or not at all
                    if(state.inStyleTag) { return; }
                    if(state.styleStack.top.displayNone) { return; }

                    // check to see if we have a non-breaking space
                    let hasLeadingWhiteSpace: boolean;
                    let hasTrailingWhiteSpace: boolean;
                    // FIXME: non-breaking spaces are not handled correctly
                    // 1. simpleRenderer and mediumRenderer send text in differently from fullRenderer because
                    //    the dom handler used in fullRenderer consolidates all text parts into a single node
                    //    whereas using htmlparser2 directly as in simpleRenderer and mediumRenderer always passes
                    //    non-breaking spaces separately in a single call to ontext()
                    // 2. RichTextView and TextRun need to be updated to do proper wrapping with non-breaking spaces
                    //    what's happneing in there right now is passable but it's not correct
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
                        if(state.lastTextRun && !state.lastTextRunHasTrailingWhiteSpace && !hasLeadingWhiteSpace) {
                            state.lastTextRun.lastWordToBeContinued = true;
                        } else if(state.lastTextRun) {
                            state.lastTextRun.lastWordToBeContinued = false;
                        }

                        if(!state.currentParagraph) {
                            state.currentParagraph = {
                                type: 'RichText',
                                alignment: state.styleStack.top.textAlignment,
                                runs: []
                            };
                            if(!state.currentContainer) { throw new Error("there should always be a current container"); }
                            if(!state.currentContainer.subviews) { state.currentContainer.subviews = []; }
                            state.currentContainer.subviews.push(state.currentParagraph);
                        }
                        let newRun: TextRunDesc = {text: text, style: state.styleStack.top};
                        state.currentParagraph.runs.push(newRun);
                        state.lastTextRun = newRun;
                        state.lastTextRunHasTrailingWhiteSpace = hasTrailingWhiteSpace;
                    } else {
                        state.lastTextRun = null;
                        state.lastTextRunHasTrailingWhiteSpace = false;
                    }
                },
                onclosetag(tagName: string) {
                    if(state.styleStack.top.displayNone) {
                        state.styleStack.pop();
                        return;
                    }

                    const isContainerTag = containerTags.includes(tagName);
                    const isStyleTag = styleTags.includes(tagName);
                    if(tagName == 'style') {
                        state.inStyleTag = false;
                    } else if(isContainerTag) {
                        state.currentParagraph = null;
                        if(!state.currentContainer.parent) { throw new Error("the current container should always be asigned a parent"); }
                        state.currentContainer = state.currentContainer.parent;
                        state.lastTextRun = null;
                    } else if(isStyleTag) {
                        // style tags should be proessed before rendering beings if they are to be used at all
                    } else {
                        // just ignore any tags that we don't regcognize (this needs to mirror the behavior of onopentag)
                    }
                    state.styleStack.pop();
                }
            }, html, options.css || undefined);

            printDescTree(state.currentContainer);

            return state.currentContainer;
        },

        /**
         * Takes an html string, parses it, and renders it into a superview.
         * @param html The html to render
         * @param superView The view to render the html into
         * @param opts Various options to control rendering see `RendererOpts`
         */
        renderHtml(html: string, superView: View, opts?: RendererOpts<PC>): void {
            const viewDescTree = this.htmlToViewDescTree(html, opts);
            const viewTree = Factory(viewDescTree);
            superView.addSubview(viewTree);
        },

        /**
         * Parse a css string and return it in a generic format. The actual format will be
         * determined by the html parser given to newRenderer
         * @param cssString The css string to parse
         * @param opts Various options to control parsing. See `ParseCssOpts`
         */
        parseCssString(cssString: string, opts: ParseCssOpts<PC>): PC {
            return htmlParser.parseCssString(cssString, opts);
        }
    };
}

//
// FIXME: move everythign below here into `renderer-helpers.ts`
//

// FIXME: make this more robust, maybe make it controllable via an environmental variable or log level
function printDescTree(rootView: ViewDesc, depth: number = 0) {
    if(1 < 2) {
        return false;
    }
    const extra = rootView.type == 'RichText'
        ? (<any>rootView).runs.map((r: any) => `{"${r.text}" ${r.lastWordToBeContinued || false}}`).join(' ')
        : '' ;
    console.log("  ".repeat(depth) + `{${rootView.type} ${extra}}`);
    if(!rootView.subviews) { return; }
    for(const sub of rootView.subviews) {
        printDescTree(sub, depth + 1);
    }
}


// FIXME: this is all pretty arbitrary, make it customizable
function newRootContainer(): ColumnDesc {
    return {
        type: 'Column',
        name: 'renderRoot',
        left: 5,
        top: 5,
        width: 240,
        height: 140
    };
}

function newInitialParserState<PC>(rootContainer: ViewDesc, options?: RendererOpts<PC>): ParserState {
    return {
        currentContainer: rootContainer,
        currentParagraph: null,
        lastTextRun: null,
        lastTextRunHasTrailingWhiteSpace: false,
        inStyleTag: false,
        styleStack: new StyleStack(options && options.defaultFont || 'Helvetica', options && options.defaultFontSize || 12),
    };
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
    const newContainer: ViewDesc = chooseContainer(tagName, cssPropertyMap);
    newFrameView.subviews.push(newContainer);
    newContainer.parent = currentContainer;
    return {outer: newFrameView, inner: newContainer};
}

function chooseContainer(tagName: string, styles: CssPropertyMap): ViewDesc {
    if(
        styles['display'] && styles['display'].string == 'flex' &&
        styles['flex-direction'] && styles['flex-direction'].string == 'row'
    ) {
        return {type: 'Row'};
    }

    return {type: 'Column'};
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
