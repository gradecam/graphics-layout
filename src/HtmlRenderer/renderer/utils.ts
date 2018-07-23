import { HorizontalAlignment, TextStyleDesc } from '../../views';

export const subSupParams = {
    shrink: 0.9,
    subShift: 0.3,
    supShift: -0.4
};

// FIXME: this should probably extend TextStyleDesc from graphics-layout
export interface InheritedStyle extends Required<TextStyleDesc> {
    textAlignment: HorizontalAlignment;
    displayNone: boolean;
}
