import {FrameSideDesc} from './ViewDescriptions';

export class FrameSide {
    margin = 0;
    borderWidth = 0;
    borderColor = 'black';
    padding = 0;

    setDescFields(desc: FrameSideDesc) {
        if(desc.margin) { this.margin = desc.margin; }
        if(desc.borderWidth) { this.borderWidth = desc.borderWidth; }
        if(desc.borderColor) { this.borderColor = desc.borderColor; }
        if(desc.padding) { this.padding = desc.padding; }
    }

    get thickness(): number {
        return this.borderWidth + this.padding;
    }
}
