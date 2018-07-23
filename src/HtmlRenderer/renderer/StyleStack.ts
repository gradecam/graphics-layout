import { InheritedStyle } from './utils';
import { HorizontalAlignment } from '../..';

export class StyleStack {
    private styleStack: InheritedStyle[];

    constructor(font: string, fontSize: number) {
        this.styleStack = [{
            font,
            fontSize,
            color: 'black',
            bold: false,
            italics: false,
            strikethrough: false,
            underline: false,
            vshift: 0,
            textAlignment: HorizontalAlignment.Left,
            displayNone: false
        }];
    }

    get top() {
        return this.styleStack[this.styleStack.length-1];
    }

    pop() {
        return this.styleStack.pop();
    }

    cloneTop() {
        const newStyle = cloneStyle(this.styleStack[this.styleStack.length-1]);
        this.styleStack.push(newStyle);
        return newStyle;
    }
}

function cloneStyle(style: InheritedStyle): InheritedStyle {
    return {
        font: style.font,
        fontSize: style.fontSize,
        color: style.color,
        bold: style.bold,
        italics: style.italics,
        underline: style.underline,
        strikethrough: style.strikethrough,
        vshift: style.vshift,
        textAlignment: style.textAlignment,
        displayNone: style.displayNone
    };
}
