import {PdfKitContext, } from './PdfKitContext';
import {
    TextOpts,
    Point,
    ImageOpts
} from './Context';

type Color = {r: number; g: number; b: number};

function hexToRgb(hex: string): Color {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if(!result) {
        return {r: 0, g: 0, b: 0};
    }
    return {r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16)};
    // return result ? {
    //     r: parseInt(result[1], 16),
    //     g: parseInt(result[2], 16),
    //     b: parseInt(result[3], 16)
    // } : null;
}

function stringToColor(color: string): Color {
    let rgb: {r: number; g: number; b: number} = {r: 0, g: 0, b: 0};
    if(color == 'black') {
        rgb = {r: 0, g: 0, b: 0};
    } else {
        rgb = hexToRgb(color);
    }
    return rgb;
}

export class JsonContext extends PdfKitContext {
    private commands: any[] = [];

    moveTo(x: number, y: number): JsonContext {
        this._out({command: 'moveTo', x, y});
        return this;
    }

    lineWidth(width: number): JsonContext {
        return this;
    }

    roundedRect(left: number, top: number, width: number, height: number, borderRadius: number): JsonContext {
        this._out({command: 'roundedRect', left, top, width, height, borderRadius});
        return this;
    }

    rect(left: number, top: number, width: number, height: number): JsonContext {
        let {x, y} = this.pointToOrigin(left, top);
        this._out({command: 'rect', left: x, top: y, width, height});
        return this;
    }

    stroke(): JsonContext {
        this._out({command: 'stroke'});
        return this;
    }

    fill(color: string): JsonContext {
        console.log('color:', color);
        let rgb = stringToColor(color);
        this._out({command: 'fillColor', r: rgb.r, g: rgb.g, b: rgb.b});
        this._out({command: 'fill'});
        return this;
    }

    clip(): JsonContext {
        this._out({command: 'clip'});
        return this;
    }

    scale(multiplier: number, origin?: Point): JsonContext {
        this._out({command: 'scale'});
        return this;
    }

    save(): JsonContext {
        this._out({command: 'save'});
        return this;
    }

    restore(): JsonContext {
        this._out({command: 'restore'});
        return this;
    }

    fillColor(color: string): JsonContext {
        let rgb = stringToColor(color);
        this._out({command: 'fillColor', r: rgb.r, g: rgb.g, b: rgb.b});
        return this;
    }

    strokeColor(color: string): JsonContext {
        this._out({command: 'strokeColor'});
        return this;
    }

    font(fontName: string): JsonContext {
        this._out({command: 'font', fontName});
        super.font(fontName);
        return this;
    }

    fontSize(fontSize: number): JsonContext {
        this._out({command: 'fontSize', fontSize});
        super.fontSize(fontSize);
        return this;
    }


    drawText(text: string, left: number, top: number, options: TextOpts = {}): JsonContext {
        let {x, y} = this.pointToOrigin(left, top);
        this._out({command: 'drawText', text, x, y});
        return this;
    }


    image(filename: string, left: number, top: number, opts?: ImageOpts): JsonContext {
        this._out({command: 'image'});
        return this;
    }

    private _out(command: any) {
        const s = JSON.stringify(command);
        this.commands.push(command);
        // console.log(s);
    }

    get allCommands(): string {
        return JSON.stringify(this.commands);
    }
}