import {Context} from '../Context';
import {Rect} from '../Rect';
import {ViewDesc} from '../ViewDescriptions';
import {Factory} from '../Factory';
import {PageSequence, PageContent} from '../MultiPage';

export interface HeightCache {
    [width: number]: number;
}

export class View {

    private parent: View | null = null;
    protected subviews: View[] = [];
    protected _pagesubs: View[] = [];
    protected frame: Rect;
    protected absoluteFrame: Rect;
    public name = 'unnamed';
    protected _debugOutlineColor: string | null;
    private _cacheContentHeights = true;
    private _contentHeightCache: HeightCache = {};
    protected _clip = false;
    protected _pageNumber = 1;
    protected _pageSequence: PageSequence = [1];
    protected _pageContent: PageContent = 'repeat';

    constructor() {
        this.setFrameWithRect(new Rect());
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
            '\t'.repeat(depth)+ `<${this.constructor.name} name="${this.name}" left="${this.frame.left}" `
            + `top="${this.frame.top}" width="${this.frame.width}" height="${this.frame.height}">\n`;
        for(let subview of this.subviews) {
            treeString += subview.stringifyRenderTree(depth + 1);
        }
        return treeString;
    }

    setDescFields(desc: ViewDesc) {
        // console.log('fromDesc:', desc.pageSequence);

        // handle the frame
        let rect = Rect.fromDesc(desc);
        this.setFrameWithRect(rect);

        // copy over the scalar fields
        if(desc.name) { this.name = desc.name; }
        if(desc.clip !== undefined) { this._clip = desc.clip; }
        if(desc.pageSequence !== undefined) { this._pageSequence = desc.pageSequence; }
        if(desc.pageContent !== undefined) { this._pageContent = desc.pageContent; }
        if(desc._debugOutlineColor !== undefined) { this._debugOutlineColor = desc._debugOutlineColor; }

        // handle the subviews
        if(!desc.subviews) { return; }
        for(let subviewDesc of desc.subviews) {
            this.addSubview( Factory(subviewDesc) );
        }
    }

    shouldDrawOnPage(pageNumber: number) {
        console.log('==========> shouldDrawOnPage:', this.name);
        if(this._pageSequence == 'content') {
            console.log('=====> content!');
            if(this._pageContent == 'flow') {
                console.log('=====> flow!');
                console.log(`shouldDrawOnPage returns: ${!this._contentDone}`);
                return !this._contentDone;
            }            
            return true;
        } else if(this._pageSequence instanceof Array) {
            // console.log('shouldDrawOnPage:', pageNumber, this._pageSequence);
            if(this._pageSequence.includes(pageNumber)) {
                console.log('shouldDrawOnPage returns: true');
                return true;
            }
        } else if(typeof this._pageSequence == 'string') {
            throw new Error('not yet implemented');
        } else {
            throw new Error('unknown page sequence type');
        }

        console.log('shouldDrawOnPage returns: false');
        return false;
    }

    /**
     * determines if there are any pages left for us to draw on
     * 
     * @return {boolean} whether or not we still need to draw on more pages
     */
    get doneDrawing(): boolean {
        // console.log('&&& doneDrawing:', this.name);
        if(this._pageSequence == 'content') {
            if(this._pageContent == 'flow') {
                return this._contentDone;
            }            
            return true;
        } else if(this._pageSequence instanceof Array) {
            if(this._pageNumber <= Math.max(...this._pageSequence)) {
                return false;
            }
        } else if(typeof this._pageSequence == 'string') {
            throw new Error('not yet implemented');
        } else {
            throw new Error('unknown page sequence type');
        }

        return true;
    }

    protected get _contentDone(): boolean {
        throw new Error(`only views that suport content = flow should implemnt this: ${this.name} ${this._pageContent}`);
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

    getContentHeightForWidth(context: Context, width: number): number {
        // console.log('getContentHeightForWidth ', this.name);
        if(!this.shouldDrawOnPage(this._pageNumber)) {
            console.log('getContentHeightForWidth:', 'return 0');
            return 0;
        }
        if(this._cacheContentHeights && this._contentHeightCache[width]) {
            return this._contentHeightCache[width];
        }
        this._contentHeightCache[width] = this._getContentHeightForWidth(context, width);
        return this._contentHeightCache[width];
    }

    protected _getContentHeightForWidth(context: Context, width: number): number {
        return this.frame.height;
    }

    layoutSubviews(context: Context) {
        console.log('layoutSubviews ', this.name);
        this._pagesubs = [];
        for(let subview of this.subviews) {
            subview.calculateAbsoluteFrameFromParent();
            this._pagesubs.push(subview);
            // console.log(subview.name, subview.absoluteFrame);
        }
    }

    layoutAll(context: Context) {
        console.log('=> layoutAll ', this.name);
        this.layoutSubviews(context);
        for(let subview of this._pagesubs) {
            subview.layoutAll(context);
        }
    }

    protected drawAll(context: Context): boolean {
        console.log('=> drawAll', this.name, this._pageNumber);
        if(!this.shouldDrawOnPage(this._pageNumber)) {
            // console.log('should not draw on this page', this.name);
            this._pageNumber++;
            return this.doneDrawing;
        }
        let subsDone = true;
        if(this._clip) {
            // console.log('clip frames:', this.name, this.frame, this.absoluteFrame);
            context.save();
            context.rect(0, 0, this.frame.width, this.frame.height)
            .clip();
        }
        this.drawSelf(context);
        for(const subview of this._pagesubs) {
            context.setOrigin(subview.absoluteFrame.left, subview.absoluteFrame.top);
            // console.log('about to drawAll ', subview.name);
            const subDone = subview.drawAll(context);
            // console.log('subDone:', this.name, subview.name, subDone);
            if(!subview.doneDrawing) {
                // console.log('drawAll -> doneDrawing:', this.name, subview.name, subview.doneDrawing);
                subsDone = false;
            }
        }
        if(this._clip) {
            context.restore();
        }
        this._pageNumber++;
        return subsDone;
    }

    draw(context: Context): boolean {
        // console.log('==> drawing single page', this.name);
        this.layoutAll(context);
        this.drawAll(context);
        return this.doneDrawing;
    }
}
