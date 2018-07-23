import { Context } from '../contexts';
import { FrameDesc } from './ViewDescriptions';
import { View } from './View';
import { FrameSide, HorizontalAlignment, VerticalAlignment } from './helpers';

export class FrameView extends View {
    leftSide = new FrameSide();
    topSide = new FrameSide();
    rightSide = new FrameSide();
    bottomSide = new FrameSide();
    // FIXME: make horizontal alignment work
    horizontalAlignment = HorizontalAlignment.Left;
    verticalAlignment = VerticalAlignment.Top;
    backgroundColor: string | null = null;

    static fromDesc(desc: FrameDesc): FrameView {
        let frameView = new FrameView();
        frameView.setDescFields(desc);
        return frameView;
    }

    constructor() {
        super();
        this.useAutoWidths = false;
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
    }

    getContentWidth(context: Context) {
        const sideWidths = this.leftSide.thickness + this.rightSide.thickness;
        const width = this.subviews[0] ? this.subviews[0].getContentWidth(context) + sideWidths : sideWidths;
        return width;
    }

    _getContentHeightForWidth(context: Context, width: number): number {
        let contentHeight = 0;
        // FIXME: I think if `this.useAutoWidths = true` then this will only be correct if `this.getAutoWidth(context) < width` otherwise
        //        we're essentially just overflowing the content View outside of the content area of the FrameView
        const subWidth = this.useAutoWidths ? this.getAutoWidth(context) : width - (this.leftSide.thickness + this.rightSide.thickness);
        for(let subview of this.subviews) {
            const subviewHeight = subview.getContentHeightForWidth(context, subWidth);
            if(subviewHeight > contentHeight) {
                contentHeight = subviewHeight;
            }
        }
        const fullHeight = contentHeight + this.topSide.thickness + this.bottomSide.thickness;
        return fullHeight;
    }

    layoutSubviews(context: Context) {
        const innerHeight = this.frame.height - (this.topSide.thickness + this.bottomSide.thickness);
        for(let subview of this.subviews) {
            let newFrame = subview.getFrame();
            if(this.useAutoWidths) {
                newFrame.width = this.getAutoWidth(context);
            } else {
                newFrame.width = this.frame.width - (this.leftSide.thickness + this.rightSide.thickness);
            }
            newFrame.height = subview.getContentHeightForWidth(context, newFrame.width);
            if(this.verticalAlignment == VerticalAlignment.Top) {
                newFrame.top = this.topSide.thickness;
            } else if(this.verticalAlignment == VerticalAlignment.Center) {
                newFrame.top = this.topSide.thickness + (innerHeight - newFrame.height)/2;
            } else if(this.verticalAlignment == VerticalAlignment.Bottom) {
                newFrame.top = this.frame.height - this.bottomSide.thickness - newFrame.height;
            }
            newFrame.left = this.leftSide.thickness;
            subview.setFrameWithRect(newFrame);
        }
    }

    drawBackground(context: Context) {
        if(this.backgroundColor) {
            context.rect(
                this.leftMargin,
                this.topMargin,
                this.frame.width - (this.leftMargin - this.rightMargin),
                this.frame.height - (this.topMargin + this.bottomMargin)).fill(this.backgroundColor);
        }
    }

    drawBorder(context: Context) {
        const left = this.leftMargin;
        const top = this.topMargin;
        const right = left + this.frame.width - (this.leftMargin + this.rightMargin);
        const bottom = top + this.frame.height - (this.topMargin + this.bottomMargin);

        context.moveTo(left, top);
        FrameView.handleNextBorderCorner(context, right, top, this.topSide.borderWidth, this.topSide.borderColor,
            this.topSide.borderWidth != this.rightSide.borderWidth || this.topSide.borderColor != this.rightSide.borderColor);
        FrameView.handleNextBorderCorner(context, right, bottom, this.rightSide.borderWidth, this.rightSide.borderColor,
            this.rightSide.borderWidth != this.bottomSide.borderWidth || this.rightSide.borderColor != this.bottomSide.borderColor);
        FrameView.handleNextBorderCorner(context, left, bottom, this.bottomSide.borderWidth, this.bottomSide.borderColor,
            this.bottomSide.borderWidth != this.leftSide.borderWidth || this.bottomSide.borderColor != this.leftSide.borderColor);
        FrameView.handleNextBorderCorner(context, left, top, this.leftSide.borderWidth, this.leftSide.borderColor,
            this.leftSide.borderWidth != this.topSide.borderWidth || this.leftSide.borderColor != this.topSide.borderColor);
        // FIXME: there's probably a better way to do this with like line caps or something but this gets
        //        the job done. if it's not there then the top left corner won't be joined up right
        FrameView.handleNextBorderCorner(context, right, top, this.topSide.borderWidth, this.topSide.borderColor, false);
        context.stroke();
}

    drawSelf(context: Context) {
        this.drawBackground(context);
        this.drawBorder(context);
        super.drawSelf(context);
    }

    private static handleNextBorderCorner(context: Context, x: number, y: number, width: number, color: string, stroke: boolean) {
        if(width != 0) {
            if(stroke) {
                // FIXME: this is how we're handling things if the line changes width between sides. It looks terrible though.
                //        compare to how it looks in a browser. the corners are all wrong. we probably needs to do something with
                //        the end caps in order to make it right
                context.lineWidth(width).strokeColor(color).lineTo(x, y).stroke().moveTo(x, y);
            } else {
                context.lineWidth(width).strokeColor(color).lineTo(x, y);
            }
        } else {
            context.moveTo(x, y);
        }
    }
}
