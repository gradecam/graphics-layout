// internal imports
import {SimpleCssDeclaration} from './interfaces';

type CssShorthandExpansion = (parts: CssValuePart[]) => SimpleCssDeclaration[];
interface CssShorthandExpansionMap {
    [property: string]: CssShorthandExpansion;
}

const cssShorthandExpansionMap: CssShorthandExpansionMap = {
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
    return simpleDeclarations;
}

// FIXME: expandCssShorthand and expandCssShorthand2 should probably just be one recursive function
export function expandCssShorthand(property: string, parts: CssValuePart[]): SimpleCssDeclaration[] {
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
