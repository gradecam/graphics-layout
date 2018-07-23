import { FrameDesc } from '../../views';
import { convertCssUnitToPoints } from '../css';

// FIXME: this is identical to whats in cssTextDeclarationHandlers, combine them
export type CssFramePropertyHandler = (value: CssValuePart, frameViewDesc: FrameDesc, emSize: number) => void;
export interface CssFramePropertyHandlerMap {
    [propertyName: string]: CssFramePropertyHandler;
}

export const cssFrameDeclarationHandlers: CssFramePropertyHandlerMap = {
    'width': (value: CssValuePart, frameViewDesc: FrameDesc, emSize: number) => {
        frameViewDesc.fixedWidth = convertCssUnitToPoints(value, emSize);
    },
    'padding-top': (value: CssValuePart, frameViewDesc: FrameDesc, emSize: number) => {
        if(!frameViewDesc.topSide) { frameViewDesc.topSide = {};}
        frameViewDesc.topSide.padding = convertCssUnitToPoints(value, emSize);
    },
    'padding-bottom': (value: CssValuePart, frameViewDesc: FrameDesc, emSize: number) => {
        if(!frameViewDesc.bottomSide) { frameViewDesc.bottomSide = {};}
        frameViewDesc.bottomSide.padding = convertCssUnitToPoints(value, emSize);
    },
    'padding-left': (value: CssValuePart, frameViewDesc: FrameDesc, emSize: number) => {
        if(!frameViewDesc.leftSide) { frameViewDesc.leftSide = {};}
        frameViewDesc.leftSide.padding = convertCssUnitToPoints(value, emSize);
    },
    'padding-right': (value: CssValuePart, frameViewDesc: FrameDesc, emSize: number) => {
        if(!frameViewDesc.rightSide) { frameViewDesc.rightSide = {};}
        frameViewDesc.rightSide.padding = convertCssUnitToPoints(value, emSize);
    },
    'margin-top': (value: CssValuePart, frameViewDesc: FrameDesc, emSize: number) => {
        if(!frameViewDesc.topSide) { frameViewDesc.topSide = {};}
        frameViewDesc.topSide.margin = convertCssUnitToPoints(value, emSize);
    },
    'margin-bottom': (value: CssValuePart, frameViewDesc: FrameDesc, emSize: number) => {
        if(!frameViewDesc.bottomSide) { frameViewDesc.bottomSide = {};}
        frameViewDesc.bottomSide.margin = convertCssUnitToPoints(value, emSize);
    },
    'margin-left': (value: CssValuePart, frameViewDesc: FrameDesc, emSize: number) => {
        if(!frameViewDesc.leftSide) { frameViewDesc.leftSide = {};}
        frameViewDesc.leftSide.margin = convertCssUnitToPoints(value, emSize);
    },
    'margin-right': (value: CssValuePart, frameViewDesc: FrameDesc, emSize: number) => {
        if(!frameViewDesc.rightSide) { frameViewDesc.rightSide = {};}
        frameViewDesc.rightSide.margin = convertCssUnitToPoints(value, emSize);
    },
    'border-top-width': (value: CssValuePart, frameViewDesc: FrameDesc, emSize: number) => {
        if(!frameViewDesc.topSide) { frameViewDesc.topSide = {};}
        frameViewDesc.topSide.borderWidth = convertCssUnitToPoints(value, emSize);
    },
    'border-right-width': (value: CssValuePart, frameViewDesc: FrameDesc, emSize: number) => {
        if(!frameViewDesc.rightSide) { frameViewDesc.rightSide = {};}
        frameViewDesc.rightSide.borderWidth = convertCssUnitToPoints(value, emSize);
    },
    'border-bottom-width': (value: CssValuePart, frameViewDesc: FrameDesc, emSize: number) => {
        if(!frameViewDesc.bottomSide) { frameViewDesc.bottomSide = {};}
        frameViewDesc.bottomSide.borderWidth = convertCssUnitToPoints(value, emSize);
    },
    'border-left-width': (value: CssValuePart, frameViewDesc: FrameDesc, emSize: number) => {
        if(!frameViewDesc.leftSide) { frameViewDesc.leftSide = {};}
        frameViewDesc.leftSide.borderWidth = convertCssUnitToPoints(value, emSize);
    },
    'border-top-color': (value: CssValuePart, frameViewDesc: FrameDesc, emSize: number) => {
        if(!frameViewDesc.topSide) { frameViewDesc.topSide = {};}
        frameViewDesc.topSide.borderColor = value.string;
    },
    'border-right-color': (value: CssValuePart, frameViewDesc: FrameDesc, emSize: number) => {
        if(!frameViewDesc.rightSide) { frameViewDesc.rightSide = {};}
        frameViewDesc.rightSide.borderColor = value.string;
    },
    'border-bottom-color': (value: CssValuePart, frameViewDesc: FrameDesc, emSize: number) => {
        if(!frameViewDesc.bottomSide) { frameViewDesc.bottomSide = {};}
        frameViewDesc.bottomSide.borderColor = value.string;
    },
    'border-left-color': (value: CssValuePart, frameViewDesc: FrameDesc, emSize: number) => {
        if(!frameViewDesc.leftSide) { frameViewDesc.leftSide = {};}
        frameViewDesc.leftSide.borderColor = value.string;
    },
    'background-color': (value: CssValuePart, frameViewDesc: FrameDesc, emSize: number) => {
        frameViewDesc.backgroundColor = value.string;
    },
};
