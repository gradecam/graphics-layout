import {View, HeightCache} from './View';
import {Context} from '../Context';
import {ColumnDesc} from '../ViewDescriptions';

export class ColumnView extends View {
    public fitHorizontal = true;
    public useSubviewContentHeights = true;
    private heightCache: HeightCache = {};
    protected _layoutQueue: View[] = [];

    static fromDesc(desc: ColumnDesc): ColumnView {
        let column = new ColumnView();
        column.setDescFields(desc);
        return column;
    }

    constructor() {
        super();
        this._pageContent = 'flow';
    }

    toJSON(): any {
        return {type: 'Column', name: this.name, frame: this.frame, subviews: this.subviews};
    }

    setDescFields(desc: ColumnDesc) {
        if(desc.useSubviewContentHeights !== undefined) { this.useSubviewContentHeights = desc.useSubviewContentHeights; }
        super.setDescFields(desc);
        this._layoutQueue = this.subviews.slice(0);
    }

    protected get _contentDone(): boolean {
        console.log(this.name, 'column queue length:', this._layoutQueue.length);
        const undrawn = this._layoutQueue.length + this._pagesubs.length;
        return undrawn == 0;
    }

    _getContentHeightForWidth(context: Context, width: number): number {
        if(this.heightCache[width]) {
            return this.heightCache[width];
        }

        let contentHeight = 0;
        let previousBottomMargin = 0;
        for(let subview of this.subviews) {
            let largerMargin = subview.topMargin > previousBottomMargin ? subview.topMargin : previousBottomMargin;
            if(this.useSubviewContentHeights) {
                // FIXME: if this.fitHorizontal is false then the width here should probably be the frame width
                contentHeight += subview.getContentHeightForWidth(context, width) + largerMargin;
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
        console.log('ColumnView:layoutSubviews ', this.name);
        let cury: number = 0;
        let previousBottomMargin = 0;
        this._pagesubs = [];
        // for(let subview of this.subviews) {
        let subview;
        while(subview = this._layoutQueue.shift()) {
            let newFrame = subview.getFrame();
            let largerMargin = subview.topMargin > previousBottomMargin ? subview.topMargin : previousBottomMargin;
            cury += largerMargin;
            newFrame.top = cury;
            if(this.fitHorizontal) {
                newFrame.left = subview.leftMargin;
                newFrame.width = this.getFrame().width;
            }
            if(this.useSubviewContentHeights) {
                console.log('ColumnView:layoutSubviews:', 'before getContentHeightForWidth');
                newFrame.height = subview.getContentHeightForWidth(context, newFrame.width);
            }
            if(this._pageContent == 'flow' && cury + newFrame.height - subview.bottomMargin > this.getFrame().height) {
                // console.log(`${subview.name} didn't fit`, cury, );
                console.log(`${subview.name} wouldn't fit`);
                this._layoutQueue.unshift(subview);
                return;
            }
            console.log(`${subview.name} fit`);

            subview.setFrameWithRect(newFrame);
            cury += subview.getFrame().height;
            previousBottomMargin = subview.bottomMargin;

            this._pagesubs.push(subview);
        }
    }
}
