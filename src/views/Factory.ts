import { ViewDesc } from './ViewDescriptions';
import { View } from './View';
import { FrameView } from './FrameView';
import { ImageView } from './ImageView';
import { RichTextView } from './RichTextView';
import { RowView } from './RowView';
import { ColumnView } from './ColumnView';

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
    if(!viewTypeMap[desc.type]) { throw new Error(`view type '${desc.type}' not recognized`); }
    const container = viewTypeMap[desc.type].fromDesc(desc);
    if(desc.subviews) {
        for(const subviewDesc of desc.subviews) {
            container.addSubview( Factory(subviewDesc) );
        }
    }
    return container;
}
