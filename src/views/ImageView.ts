import {View, HeightCache} from './View';
import {ImageDesc} from '../ViewDescriptions';
import {Context} from '../Context';


export class ImageView extends View {

    filename: string = '';

    static fromDesc(desc: ImageDesc): ImageView {
        let imageView = new ImageView();
        imageView.setDescFields(desc);
        return imageView;
    }

    constructor() {
        super();
        this._debugOutlineColor = null;
    }

    toJSON(): any {
        return {type: 'Image', name: this.name, frame: this.frame, subviews: this.subviews};
    }

    setDescFields(desc: ImageDesc) {
        super.setDescFields(desc);
        if(desc.filename) { this.filename = desc.filename; }
    }

    drawSelf(context: Context) {
        super.drawSelf(context);
        // console.log(this.getFrame());
        context.image(this.filename, this.frame.left, this.frame.top, {width: this.frame.width});
    }
}
