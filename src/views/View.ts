import { Context } from '../contexts';
import { Rect } from './helpers';
import { ViewDesc } from './ViewDescriptions';

export interface HeightCache {
    [width: number]: number;
}

export class View {

    private parent: View | null = null;
    private _cacheContentHeights = true;
    private _contentHeightCache: HeightCache = {};
    protected frame: Rect;
    protected absoluteFrame: Rect;
    public subviews: View[] = [];
    public fixedWidth?: number;

    /**
     * useAutoWidths is a flag to determine if a container should use the automatically calculated
     * width of it's subviews during layoutSubviews, or if it should give it a width according to it's
     * own internal logic. For instance if `useAutoWidths = false` then a FrameView might expand a subview's
     * frame to fit it's own width - the sum of it's side thicknesses. A column view might expand the width
     * of it's subviews to be the same as it's own width.
     *
     * "useAutoWidths" is perhaps a bit ambiguous since it's not clear what auto refers to the "auto" refers to.
     * maybe we should negate it and call it useSubvewFrameWidths
     */
    public useAutoWidths = false;
    public name: string = 'unnamed';
    public _debugOutlineColor: string | null;

    constructor() {
        this.frame = new Rect();
        this.absoluteFrame = new Rect();
        this.setFrameWithRect(new Rect());
        this._debugOutlineColor = null;
    }

    static fromDesc(desc: ViewDesc): View {
        let view = new View();
        view.setDescFields(desc);
        return view;
    }

    toJSON(): any {
        return {type: 'View', name: this.name, frame: this.frame, subviews: this.subviews};
    }

    stringifyRenderTree(depth: number = 0): string {
        let treeString =
            '\t'.repeat(depth)+ `<${this.constructor.name} left="${this.frame.left}" `
            + `top="${this.frame.top}" width="${this.frame.width}" height="${this.frame.height}">\n`;
        for(let subview of this.subviews) {
            treeString += subview.stringifyRenderTree(depth + 1);
        }
        return treeString;
    }

    setDescFields(desc: ViewDesc) {
        if(desc.name) { this.name = desc.name; }
        // handle the frame
        let rect = Rect.fromDesc(desc);
        this.setFrameWithRect(rect);
        if(desc._debugOutlineColor !== undefined) { this._debugOutlineColor = desc._debugOutlineColor; }
        if(desc.fixedWidth !== undefined) { this.fixedWidth = desc.fixedWidth; }
    }

    get leftMargin(): number {
        return 0;
    }
    get topMargin(): number {
        return 0;
    }
    get rightMargin(): number {
        return 0;
    }
    get bottomMargin(): number {
        return 0;
    }

    setParent(newParent: View) {
        this.parent = newParent;
    }

    getFrame() {
        return this.frame.clone();
    }

    addSubview(newSubview: View) {
        newSubview.parent = this;
        newSubview.calculateAbsoluteFrameFromParent();
        this.subviews.push(newSubview);
    }

    setFrameWithRect(newFrame: Rect) {
        this.frame = newFrame.clone();
        if(this.parent) {
            this.calculateAbsoluteFrameFromParent();
        } else {
            this.absoluteFrame = newFrame.clone();
        }
    }

    calculateAbsoluteFrameFromParent() {
        if(!this.parent) {
            throw new Error("Only call this from a View that already has a parent View");
        }

        let newAbsoluteFrame = this.parent.absoluteFrame.clone();
        newAbsoluteFrame.left += this.frame.left;
        newAbsoluteFrame.top += this.frame.top;
        newAbsoluteFrame.width = this.frame.width;
        newAbsoluteFrame.height = this.frame.height;
        this.absoluteFrame = newAbsoluteFrame;
    }

    setFrame(left: number, top: number, width: number, height: number) {
        let newFrame = new Rect();
        newFrame.left = left;
        newFrame.top = top;
        newFrame.width = width;
        newFrame.height = height;
        this.setFrameWithRect(newFrame);
    }

    setHeight(newHeight: number) {
        let newFrame = this.frame.clone();
        newFrame.height = newHeight;
        this.setFrameWithRect(newFrame);
    }

    drawSelf(context: Context) {
        // console.error('drawSelf:', this.name, this.absoluteFrame);
        if(this._debugOutlineColor) {
            context
                .lineWidth(1)
                .strokeColor(this._debugOutlineColor)
                .rect(0, 0, this.frame.width, this.frame.height)
                .stroke();
        }
    }

    /**
     * There are basically two situations for View widths. One is we set the frame ahead of time and don't touch the width
     * whille rendering. The other is we want some view to auto-calculate the width based on the View's settings. This is
     * how we auto-calculate the width in second case. The rules for when it uses which method are complex and outside the
     * scope of this comment.
     */
    getAutoWidth(context: Context): number {
        if(this.fixedWidth !== undefined) {
            return this.fixedWidth;
        } else {
            return this.getContentWidth(context);
        }
    }

    // FIXME: would it make sense to return the leftmost leftside and rightmost rightside
    //        of the frames of it's subviews?
    getContentWidth(context: Context): number {
        return 0;
    }

    getContentHeightForWidth(context: Context, width: number): number {
        if(this._cacheContentHeights && this._contentHeightCache[width]) {
            return this._contentHeightCache[width];
        }
        this._contentHeightCache[width] = this._getContentHeightForWidth(context, width);
        return this._contentHeightCache[width];
    }

    _getContentHeightForWidth(context: Context, width: number): number {
        return this.frame.height;
    }

    layoutSubviews(context: Context) {
        for(let subview of this.subviews) {
            subview.calculateAbsoluteFrameFromParent();
        }
    }

    layoutAll(context: Context) {
        this.layoutSubviews(context);
        for(let subview of this.subviews) {
            subview.layoutAll(context);
        }
    }

    drawAll(context: Context) {
        this.drawSelf(context);
        this.subviews.forEach((subview) => {
            context.setOrigin(subview.absoluteFrame.left, subview.absoluteFrame.top);
            // subview.draw(context);
            subview.drawAll(context);
        });
    }

    draw(context: Context) {
        this.layoutAll(context);
        this.drawAll(context);
    }
}
