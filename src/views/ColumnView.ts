import { View, HeightCache } from './View';
import { Context } from '../contexts';
import { ColumnDesc } from './ViewDescriptions';

export class ColumnView extends View {
    public fitHorizontal = true;
    public useContentHeight = true; // FIXME: change this to useSubviewContentHeights
    private heightCache: HeightCache = {};

    static fromDesc(desc: ColumnDesc): ColumnView {
        let column = new ColumnView();
        if(desc.useContentHeight !== undefined) { column.useContentHeight = desc.useContentHeight; }
        column.setDescFields(desc);
        return column;
    }

    constructor() {
        super();
        this.useAutoWidths = true;
        this._debugOutlineColor = null;
    }

    toJSON(): any {
        return {type: 'Column', name: this.name, frame: this.frame, subviews: this.subviews};
    }

    setDescFields(desc: ColumnDesc) {
        super.setDescFields(desc);
    }

    getContentWidth(context: Context) {
        const width = this.subviews.reduce((maxWidth: number, sub) => {
            const subContentWidth = sub.getContentWidth(context);
            return maxWidth > subContentWidth ? maxWidth : subContentWidth;
        }, 0);
        return width;
    }

    _getContentHeightForWidth(context: Context, width: number): number {
        if(this.heightCache[width]) {
            return this.heightCache[width];
        }

        let contentHeight = 0;
        let previousBottomMargin = 0;
        for(let subview of this.subviews) {
            let largerMargin = subview.topMargin > previousBottomMargin ? subview.topMargin : previousBottomMargin;
            if(this.useContentHeight) {
                const subWidth = this.fitHorizontal ? width : subview.getAutoWidth(context);
                contentHeight += subview.getContentHeightForWidth(context, subWidth) + largerMargin;
            } else {
                contentHeight += subview.getFrame().height;
            }
            previousBottomMargin = subview.bottomMargin;
        }
        contentHeight += previousBottomMargin;
        this.heightCache[width] = contentHeight;
        return contentHeight;
    }

    layoutSubviews(context: Context) {
        let cury: number = 0;
        let previousBottomMargin = 0;
        for(let subview of this.subviews) {
            let newFrame = subview.getFrame();
            let largerMargin = subview.topMargin > previousBottomMargin ? subview.topMargin : previousBottomMargin;
            cury += largerMargin;
            newFrame.top = cury;
            if(this.fitHorizontal) {
                newFrame.left = subview.leftMargin;
                newFrame.width = this.getFrame().width;
            }
            if(this.useContentHeight) {
                newFrame.height = subview.getContentHeightForWidth(context, newFrame.width);
            }
            subview.setFrameWithRect(newFrame);
            cury += subview.getFrame().height;
            previousBottomMargin = subview.bottomMargin;
        }
    }
}
