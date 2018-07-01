import {View, HeightCache} from './View';
import {HorizontalAlignment, VerticalAlignment} from '../Alignment';
import {Context} from '../Context';
import {FrameDesc} from '../ViewDescriptions';
import {FrameSide} from '../FrameSide';
// import {Rect} from './Rect';

export class FrameView extends View {
    leftSide = new FrameSide();
    topSide = new FrameSide();
    rightSide = new FrameSide();
    bottomSide = new FrameSide();
    horizontalAlignment = HorizontalAlignment.Left;
    verticalAlignment = VerticalAlignment.Top;
    backgroundColor: string | null = null;
    useSubviewContentHeights: boolean = true;

    static fromDesc(desc: FrameDesc): FrameView {
        let frameView = new FrameView();
        frameView.setDescFields(desc);
        return frameView;
    }

    constructor() {
        super();
        this._debugOutlineColor = null;
    }

    toJSON(): any {
        return {type: 'Frame', name: this.name, frame: this.frame, subviews: this.subviews};
    }

    get leftMargin(): number {
        return this.leftSide.margin;
    }
    get topMargin(): number {
        return this.topSide.margin;
    }
    get rightMargin(): number {
        return this.rightSide.margin;
    }
    get bottomMargin(): number {
        return this.bottomSide.margin;
    }

    setDescFields(desc: FrameDesc) {
        super.setDescFields(desc);
        if(desc.horizontalAlignment) { this.horizontalAlignment = desc.horizontalAlignment; }
        if(desc.verticalAlignment) { this.verticalAlignment = desc.verticalAlignment; }
        if(desc.leftSide) { this.leftSide.setDescFields(desc.leftSide); }
        if(desc.topSide) { this.topSide.setDescFields(desc.topSide); }
        if(desc.rightSide) { this.rightSide.setDescFields(desc.rightSide); }
        if(desc.bottomSide) { this.bottomSide.setDescFields(desc.bottomSide); }
        if(desc.backgroundColor) { this.backgroundColor = desc.backgroundColor; }
        if(desc.useSubviewContentHeights != undefined) { this.useSubviewContentHeights = desc.useSubviewContentHeights; }
    }

    get _contentDone(): boolean {
        return this.subviews.reduce((acc, curVal) => {
            return acc && (<any>curVal)._contentDone;
        }, true);
    }

    _getContentHeightForWidth(context: Context, width: number): number {
        let contentHeight = 0;
        for(let subview of this.subviews) {
            const subviewHeight = subview.getContentHeightForWidth(context, width - (this.leftSide.thickness + this.rightSide.thickness));
            if(subviewHeight > contentHeight) {
                contentHeight = subviewHeight;
            }
        }
        const fullHeight = contentHeight + this.topSide.thickness + this.bottomSide.thickness;
        return fullHeight;
    }

    layoutSubviews(context: Context) {
        console.log('layoutSubviews ', this.name);
        this._pagesubs = [];
        const innerHeight = this.frame.height - (this.topSide.thickness + this.bottomSide.thickness);
        for(let subview of this.subviews) {
            let newFrame = subview.getFrame();
            newFrame.width = this.frame.width - (this.leftSide.thickness + this.rightSide.thickness);
            // console.log('this.useSubviewContentHeights:', this.name, this.useSubviewContentHeights);
            if(this.useSubviewContentHeights) {
                newFrame.height = subview.getContentHeightForWidth(context, newFrame.width);
            } else {
                newFrame.height = this.frame.height - (this.topSide.thickness + this.bottomSide.thickness);
                // console.log('newFrame.height:', newFrame.height);
            }
            
            // console.error('layoutSubviews:', this.frame.height, newFrame.height);
            // if(this.horizontalAlignment == HorizontalAlignment.Left) {
            //     newFrame.left = this.topSide.thickness;
            // } else if(this.horizontalAlignment == HorizontalAlignment.Center) {
            // } else if(this.horizontalAlignment == HorizontalAlignment.Right) {
            //     newFrame.top = this.frame.width - ;
            // }
            if(this.verticalAlignment == VerticalAlignment.Top) {
                newFrame.top = this.topSide.thickness;
            } else if(this.verticalAlignment == VerticalAlignment.Center) {
                newFrame.top = this.topSide.thickness + (innerHeight - newFrame.height)/2;
            } else if(this.verticalAlignment == VerticalAlignment.Bottom) {
                newFrame.top = this.frame.height - this.bottomSide.thickness - newFrame.height;
            }
            newFrame.left = this.leftSide.thickness;
            subview.setFrameWithRect(newFrame);
            this._pagesubs.push(subview);
        }
    }

    drawSelf(context: Context) {
        if(this.backgroundColor) {
            context.rect(
                this.leftMargin,
                this.topMargin,
                this.frame.width - (this.leftMargin - this.rightMargin),
                this.frame.height - (this.topMargin + this.bottomMargin)).fill(this.backgroundColor);
        }
        super.drawSelf(context);
    }
}
