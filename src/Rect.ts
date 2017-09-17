import {ViewDesc} from './ViewDescriptions';

export class Rect {
    public left:  number = 0;
    public top:  number = 0;
    public width:  number = 0;
    public height:  number = 0;

    static fromDesc(desc: ViewDesc): Rect {
        let rect = new Rect();
        if(desc.top !== undefined) { rect.top = desc.top; }
        if(desc.left !== undefined) { rect.left = desc.left; }
        if(desc.width !== undefined) { rect.width = desc.width; }
        if(desc.height !== undefined) { rect.height = desc.height; }
        return rect;
    }

    clone(): Rect {
        let newRect = new Rect();
        newRect.left = this.left;
        newRect.top = this.top;
        newRect.width = this.width;
        newRect.height = this.height;
        return newRect;
    }
}
