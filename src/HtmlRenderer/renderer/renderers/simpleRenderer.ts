import * as htmlparser2 from 'htmlparser2';
import { HtmlParser, BaseDomNode, TagAttributes, ParseCssOpts, FontSelector } from '../../html';
import { CssSelectorMap, CssPropertyMap, cssStringToSelectorMap, combineSelectorMaps, parseTag } from '../../css';
import { userAgentStyleSheetString } from '../../user-agent-styles';
import { newRenderer } from '../newRenderer';
import { CssHandler, CssHandlerInstance, RendererOpts } from '../structures';

const parsedUACSS = cssStringToSelectorMap(userAgentStyleSheetString);

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

function getMatchingDeclarations(
    selectorMap: CssSelectorMap,
    tagName: string | undefined,
    id: string | undefined,
    classes: string[] | undefined
): CssPropertyMap {
    // tag names have the lowest specificity of the three
    let newPropertyMap: CssPropertyMap = {};
    if(tagName) {
        newPropertyMap = {...newPropertyMap, ...selectorMap[tagName]};
    }

    // classes are in the middle
    if(classes) {
        for(let className of classes) {
            newPropertyMap = {...newPropertyMap, ...selectorMap[`.${className}`]};
        }
    }

    // id selectors have the highest specificity of the three
    if(id) {
        newPropertyMap = {...newPropertyMap, ...selectorMap[`#${id}`]};
    }

    return newPropertyMap;
}

const htmlParser: HtmlParser<CssSelectorMap> = {
    parseHtml(callbacks: {
        onopentag(node: BaseDomNode, styles: CssPropertyMap): void,
        ontext(text: string): void,
        onclosetag(tagName: string): void
    }, html: string, css: CssSelectorMap | string): void {

        const parser = new htmlparser2.Parser({
            onopentag(tagName: string, attribs: TagAttributes) {

                const parsedTag = parseTag({name: tagName, attrs: attribs});

                // get the matching styles from the global styles map
                const globalDeclarations = getMatchingDeclarations(parsedUACSS, parsedTag.name, parsedTag.id, parsedTag.classes);

                // handle the inline styles from the tag's style attribute
                // console.log('attribs.style:', attribs.style);
                const tagDeclarations = attribs.style
                    ? parseCssString(`this { ${attribs.style} }`).this
                    : {} ;

                const combinedDeclarations: CssPropertyMap = {...globalDeclarations, ...tagDeclarations};

                callbacks.onopentag({tagName, attrs: attribs}, combinedDeclarations);
            },
            ontext: callbacks.ontext,
            onclosetag: callbacks.onclosetag
        }, {decodeEntities: true});
        parser.write(html);
        parser.end();
    },
    parseCssString
};

function parseCssString(cssString: string, opts?: ParseCssOpts<CssSelectorMap>): CssSelectorMap {
    const newPC = cssStringToSelectorMap(cssString, opts && opts.fontSelector || undefined);
    return opts && opts.existing ? combineSelectorMaps([opts.existing, newPC]): newPC;
}

export const simpleRenderer = newRenderer(htmlParser);
export type simpleRendererOpts = RendererOpts<CssSelectorMap>;
