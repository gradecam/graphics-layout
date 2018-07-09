// dependencies in graphics-layout
import {HorizontalAlignment} from '../Alignment';
import {TextStyleDesc} from '../ViewDescriptions';

export const subSupParams = {
    shrink: 0.9,
    subShift: 0.3,
    supShift: -0.4
};

export type FontSelector = (fontFamilyNames: string[]) => string;

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

// FIXME: this should probably extend TextStyleDesc from graphics-layout
export interface InheritedStyle extends Required<TextStyleDesc> {
    textAlignment: HorizontalAlignment;
    displayNone: boolean;
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
