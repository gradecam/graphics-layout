import {ViewDesc} from './ViewDescriptions';
import {View} from './View';
import {RichTextView} from './RichTextView';
import {ColumnView} from './ColumnView';
import {FrameView} from './FrameView';
import {ImageView} from './ImageView';
import {RowView} from './RowView';

interface ViewConstructor {
    new(): View;
    fromDesc(desc: ViewDesc): View;
}

interface ViewTypeMap {
    [viewTypeName: string]: ViewConstructor;
}

const viewTypeMap: ViewTypeMap = {
    View: View,
    RichText: RichTextView,
    Column: ColumnView,
    Frame: FrameView,
    Row: RowView,
    Image: ImageView
};

export function Factory(desc: ViewDesc): View {
    if(!viewTypeMap[desc.type]) { throw new Error(`view type ${desc.type} not recognized`); }
    return viewTypeMap[desc.type].fromDesc(desc);
}
