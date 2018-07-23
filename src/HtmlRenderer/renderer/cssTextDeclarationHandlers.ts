import { HorizontalAlignment } from '../../views';
import { convertCssUnitToPoints } from '../css';
import { InheritedStyle, subSupParams } from './utils';

// FIXME: this is identical to whats in cssFrameDeclarationHandlers, combine them into just CssPropertyHandler
export type CssTextPropertyHandler = (value: CssValuePart, style: InheritedStyle, emSize: number) => void;
export interface CssTextPropertyHandlerMap {
    [propertyName: string]: CssTextPropertyHandler;
}

export const cssTextDeclarationHandlers: CssTextPropertyHandlerMap = {
    'font-family': (part: CssValuePart, style: InheritedStyle, emSize: number) => {
        style.font = part.string;
    },
    'font-size': (part: CssValuePart, style: InheritedStyle, emSize: number) => {
        if(part.string == 'smaller') {
            style.fontSize = convertCssUnitToPoints({unit: 'em', value: subSupParams.shrink, type: '', string: ''}, emSize);
        } else {
            style.fontSize = convertCssUnitToPoints(part, emSize);
        }
    },
    'font-style': (part: CssValuePart, style: InheritedStyle, emSize: number) => {
        if(part.string == 'italic' || part.string == 'oblique') {
            style.italics = true;
        }
    },
    'font-weight': (part: CssValuePart, style: InheritedStyle, emSize: number) => {
        if(part.string == 'bold') {
            style.bold = true;
        }
    },
    'text-decoration': (part: CssValuePart, style: InheritedStyle, emSize: number) => {
        if(part.string == 'underline') {
            style.underline = true;
        } else if(part.string == 'line-through') {
            style.strikethrough = true;
        }
    },
    'color': (part: CssValuePart, style: InheritedStyle, emSize: number) => {
        style.color = part.string;
    },
    'text-align': (part: CssValuePart, style: InheritedStyle, emSize: number) => {
        let newAlignment = HorizontalAlignment.Left;
        if(part.string == 'center') {
            newAlignment = HorizontalAlignment.Center;
        } else if(part.string == 'right') {
            newAlignment = HorizontalAlignment.Right;
        }
        style.textAlignment = newAlignment;
    },
    'vertical-align': (part: CssValuePart, style: InheritedStyle, emSize: number) => {
        if(part.string == 'sub') {
            style.vshift = subSupParams.subShift;
        } else if(part.string == 'super') {
            style.vshift = subSupParams.supShift;
        } else {
            style.vshift = 0;
        }
    },
};
