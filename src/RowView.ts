import {View} from './View';
import {Context} from './Context';
import {RowDesc} from './ViewDescriptions';

export class RowView extends View {
    public fitHorizontal = true;

    static fromDesc(desc: RowDesc): RowView {
        let row = new RowView();
        row.setDescFields(desc);
        return row;
    }

    toJSON(): any {
        return {type: 'Column', name: this.name, frame: this.frame, subviews: this.subviews};
    }

    setDescFields(desc: RowDesc) {
        super.setDescFields(desc);
    }

    _getContentHeightForWidth(context: Context, width: number): number {
        let contentHeight = 0;

        // the content height is simply the tallest height of all the subviews
        for(let subview of this.subviews) {
            const subViewHeight = subview.getContentHeightForWidth(context, subview.getFrame().width);
            // console.error('subViewHeight:', subViewHeight);
            contentHeight = subViewHeight > contentHeight ? subViewHeight : contentHeight;
        }
        // if(this.name != 'unnamed') {
        //     console.log('RowView:', `${this.name} => ${contentHeight}`);
        // }
        return contentHeight;
    }

    layoutSubviews(context: Context) {
        let curx: number = 0;
        // if(this.name != 'unnamed') {
        //     console.log('RowView:', this.name);
        // }
        for(let subview of this.subviews) {
            let newFrame = subview.getFrame();
            newFrame.left = curx;
            subview.setFrameWithRect(newFrame);
            curx += subview.getFrame().width;
        }
    }
}
