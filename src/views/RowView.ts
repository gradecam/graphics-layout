import { Context } from '../contexts';
import { View } from './View';
import { RowDesc } from './ViewDescriptions';

export class RowView extends View {

    static fromDesc(desc: RowDesc): RowView {
        let row = new RowView();
        row.setDescFields(desc);
        return row;
    }

    constructor() {
        super();
        this.useAutoWidths = true;
        this._debugOutlineColor = null;
    }

    toJSON(): any {
        return {type: 'Row', name: this.name, frame: this.frame, subviews: this.subviews};
    }

    setDescFields(desc: RowDesc) {
        super.setDescFields(desc);
    }

    getContentWidth(context: Context) {
        const contentWidth = this.subviews.reduce((totalWidth: number, sub) => {
            return totalWidth + sub.getContentWidth(context);
        }, 0);
        return contentWidth;
    }

    _getContentHeightForWidth(context: Context, width: number): number {
        // FIXME: Notice that the `width` paramater isn't actually used here which kinda doesn't make sense.
        //        Ideally the row would be capable of using the `width` number to force the content into a
        //        narrower space and making it taller. It's not currently capable of doing that.
        let contentHeight = 0;

        // the content height is simply the tallest height of all the subviews
        for(let subview of this.subviews) {
            const subWidth = this.useAutoWidths ? subview.getAutoWidth(context) : subview.getFrame().width;
            const subViewHeight = subview.getContentHeightForWidth(context, subWidth);
            contentHeight = subViewHeight > contentHeight ? subViewHeight : contentHeight;
        }
        return contentHeight;
    }

    layoutSubviews(context: Context) {
        let curx: number = 0;
        for(let subview of this.subviews) {
            const newFrame = subview.getFrame();
            if(this.useAutoWidths) {
                newFrame.width = subview.getAutoWidth(context);
            }
            newFrame.left = curx;
            subview.setFrameWithRect(newFrame);
            curx += subview.getFrame().width;
        }
    }
}
