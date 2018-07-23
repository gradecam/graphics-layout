import {VerticalAlignment, HorizontalAlignment} from './helpers';

export type AnyView =
    RichTextDesc |
    ColumnDesc |
    RowDesc |
    FrameDesc |
    ViewDesc |
    ImageDesc;

export interface ViewDesc {
    type: string;
    name?: string;
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    fixedWidth?: number;
    parent?: ViewDesc;
    subviews?: AnyView[];
    _debugOutlineColor?: string;
}

export interface RichTextDesc extends ViewDesc {
    type: 'RichText';
    runs: TextRunDesc[];
    alignment?: HorizontalAlignment;
    lineGap?: number;
}

export interface ColumnDesc extends ViewDesc {
    type: 'Column';
    useContentHeight?: boolean;
}

export interface RowDesc extends ViewDesc {
    type: 'Row';
}

export interface FrameSideDesc {
    margin?: number;
    borderWidth?: number;
    borderColor?: string;
    padding?: number;
}

export interface FrameDesc extends ViewDesc {
    type: 'Frame';
    leftSide?: FrameSideDesc;
    topSide?: FrameSideDesc;
    rightSide?: FrameSideDesc;
    bottomSide?: FrameSideDesc;
    horizontalAlignment?: HorizontalAlignment;
    verticalAlignment?: VerticalAlignment;
    backgroundColor?: string;
    useSubviewContentHeights?: boolean;
}

export interface ImageDesc extends ViewDesc {
    type: 'Image';
    filename: string;
}

export interface TextStyleDesc {
    fontSize?: number;
    font?: string;
    color?: string;
    bold?: boolean;
    italics?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    vshift?: number;
}

export interface TextRunDesc {
    text: string;
    style?: TextStyleDesc;
    lastWordToBeContinued?: boolean;
}
