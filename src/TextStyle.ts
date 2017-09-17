import {TextStyleDesc} from './ViewDescriptions';

export class TextStyle {
    public font: string = 'Helvetica';
    public fontSize: number = 10;
    public color: string = 'black';
    public bold: boolean = false;
    public italics: boolean = false;
    public underline: boolean = false;
    public strikethrough: boolean = false;

    static fromDesc(desc: TextStyleDesc): TextStyle {
        let style = new TextStyle();
        if(desc.font) { style.font = desc.font; }
        if(desc.fontSize) { style.fontSize = desc.fontSize; }
        if(desc.color) { style.color = desc.color; }
        if(desc.bold) {style.bold = desc.bold; }
        if(desc.italics) {style.italics = desc.italics; }
        if(desc.underline) {style.underline = desc.underline; }
        if(desc.strikethrough) {style.strikethrough = desc.strikethrough; }
        return style;
    }
}
