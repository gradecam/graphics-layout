import {VerticalAlignment, HorizontalAlignment} from './Alignment';
import {PageSequence, PageContent} from './MultiPage';

export interface TextStyleDesc {
    fontSize?: number;
    font?: string;
    color?: string;
    bold?: boolean;
    italics?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
}

export interface TextRunDesc {
    text: string;
    style?: TextStyleDesc;
    lastWordToBeContinued?: boolean;
}

export type AnyView =
    RichTextDesc |
    ColumnDesc |
    RowDesc |
    FrameDesc |
    ViewDesc |
    RootDesc |
    ImageDesc;

export interface ViewDesc {
    type: string;
    name?: string;
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    parent?: ViewDesc;
    subviews?: Array<AnyView>;
    clip?: boolean;
    pageSequence?: PageSequence;
    pageContent?: PageContent;
    _debugOutlineColor?: string;
}

export interface RootDesc extends ViewDesc {
    type: 'Root';
}

export interface RichTextDesc extends ViewDesc {
    type: 'RichText';
    runs: TextRunDesc[];
    alignment?: HorizontalAlignment;
    lineGap?: number;
}

export interface ColumnDesc extends ViewDesc {
    type: 'Column';
    useSubviewContentHeights?: boolean;
}

export interface RowDesc extends ViewDesc {
    type: 'Row';
}

export interface FrameSideDesc {
    margin?: number;
    border?: number;
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
