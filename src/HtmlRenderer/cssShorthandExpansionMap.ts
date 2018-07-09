// internal imports
import {
    convertCssUnitToPoints,
    CssPropertyMap,
    CssSelectorMap,
    FontSelector,
    InheritedStyle,
    SimpleCssDeclaration
} from './utils';

export type CssShorthandExpansion = (parts: CssValuePart[]) => SimpleCssDeclaration[];
export interface CssShorthandExpansionMap {
    [property: string]: CssShorthandExpansion;
}

export const cssShorthandExpansionMap: CssShorthandExpansionMap = {
    'border': (parts: CssValuePart[]): SimpleCssDeclaration[] => {
        const borderStyleValues = [
            'none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset', 'initial', 'inherit'
        ];
        let simpleDeclarations: SimpleCssDeclaration[] = [];
        for(let i = 0; i < 3; i++) {
            if(parts[i] && parts[i].type == 'number') {
                simpleDeclarations.push({property: 'border-width', value: parts[i]});
            } else if(parts[i] && borderStyleValues.indexOf(parts[i].string) != -1) {
                simpleDeclarations.push({property: 'border-style', value: parts[i]});
            } else if(parts[i]) {
                simpleDeclarations.push({property: 'border-color', value: parts[i]});
            }
        }
        return simpleDeclarations;
    },
    'border-style': (parts: CssValuePart[]): SimpleCssDeclaration[] => {
        return CssSideExpansion('border', 'style', parts);
    },
    'border-width': (parts: CssValuePart[]): SimpleCssDeclaration[] => {
        return CssSideExpansion('border', 'width', parts);
    },
    'border-color': (parts: CssValuePart[]): SimpleCssDeclaration[] => {
        return CssSideExpansion('border', 'color', parts);
    },
    'margin': (parts: CssValuePart[]): SimpleCssDeclaration[] => {
        return CssSideExpansion('margin', '', parts);
    },
    'padding': (parts: CssValuePart[]): SimpleCssDeclaration[] => {
        return CssSideExpansion('padding', '', parts);
    },
};

function CssSideExpansion(propertyPrefix: string, propertySuffix: string, parts: CssValuePart[]): SimpleCssDeclaration[] {
    // console.log({propertyPrefix, propertySuffix, parts});
    let simpleDeclarations: SimpleCssDeclaration[] = [];
    propertySuffix = propertySuffix != '' ? `-${propertySuffix}` : '';
    if(parts.length == 1) {
        simpleDeclarations.push({property: `${propertyPrefix}-top${propertySuffix}`, value: parts[0]});
        simpleDeclarations.push({property: `${propertyPrefix}-right${propertySuffix}`, value: parts[0]});
        simpleDeclarations.push({property: `${propertyPrefix}-bottom${propertySuffix}`, value: parts[0]});
        simpleDeclarations.push({property: `${propertyPrefix}-left${propertySuffix}`, value: parts[0]});
    } else if(parts.length == 2) {
        simpleDeclarations.push({property: `${propertyPrefix}-top${propertySuffix}`, value: parts[0]});
        simpleDeclarations.push({property: `${propertyPrefix}-bottom${propertySuffix}`, value: parts[0]});
        simpleDeclarations.push({property: `${propertyPrefix}-left${propertySuffix}`, value: parts[1]});
        simpleDeclarations.push({property: `${propertyPrefix}-right${propertySuffix}`, value: parts[1]});
    } else if(parts.length == 3) {
        simpleDeclarations.push({property: `${propertyPrefix}-top${propertySuffix}`, value: parts[0]});
        simpleDeclarations.push({property: `${propertyPrefix}-right${propertySuffix}`, value: parts[1]});
        simpleDeclarations.push({property: `${propertyPrefix}-left${propertySuffix}`, value: parts[1]});
        simpleDeclarations.push({property: `${propertyPrefix}-bottom${propertySuffix}`, value: parts[2]});
    } else if(parts.length == 4) {
        simpleDeclarations.push({property: `${propertyPrefix}-top${propertySuffix}`, value: parts[0]});
        simpleDeclarations.push({property: `${propertyPrefix}-right${propertySuffix}`, value: parts[1]});
        simpleDeclarations.push({property: `${propertyPrefix}-bottom${propertySuffix}`, value: parts[2]});
        simpleDeclarations.push({property: `${propertyPrefix}-left${propertySuffix}`, value: parts[3]});
    }
    // console.log(JSON.stringify({simpleDeclarations}, null, 4));
    return simpleDeclarations;
}
