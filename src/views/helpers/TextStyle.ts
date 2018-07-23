import { TextStyleDesc } from '../ViewDescriptions';

export class TextStyle {
    // FIXME: a large text document could require a lot of styles and that could use a lot of memory/CPU
    //        try to do some profiling to see how much it's actually impacting performance
    public font: string = 'Helvetica';
    public fontSize: number = 10;
    public color: string = 'black';
    public bold: boolean = false;
    public italics: boolean = false;
    public underline: boolean = false;
    public strikethrough: boolean = false;
    public vshift: number = 0;

    static fromDesc(desc: TextStyleDesc): TextStyle {
        let style = new TextStyle();
        if(desc.font) { style.font = desc.font; }
        if(desc.fontSize) { style.fontSize = desc.fontSize; }
        if(desc.color) { style.color = desc.color; }
        if(desc.bold) {style.bold = desc.bold; }
        if(desc.italics) {style.italics = desc.italics; }
        if(desc.underline) {style.underline = desc.underline; }
        if(desc.strikethrough) {style.strikethrough = desc.strikethrough; }
        if(desc.vshift) {style.vshift = desc.vshift; }
        return style;
    }
}
