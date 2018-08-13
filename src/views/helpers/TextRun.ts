import {Context} from '../../contexts';
import {TextRunDesc} from '../ViewDescriptions';
import {TextStyle} from './TextStyle';
import {Word} from './Word';

export class TextRun {
    public style: TextStyle;
    public ascender: number = 0;
    public descender: number = 0;
    public lastWordToBeContinued = false;
    public words: string[] = [];

    constructor(text: string) {
        this.setText(text);
        this.style = new TextStyle();
    }

    static fromDesc(desc: TextRunDesc): TextRun {
        let run = new TextRun(desc.text);
        if(desc.style) { run.style = TextStyle.fromDesc(desc.style); }
        if(desc.lastWordToBeContinued) { run.lastWordToBeContinued = desc.lastWordToBeContinued; }
        return run;
    }

    setText(text: string): TextRun {
        text = text ? text.toString() : '';
        const isNonBreakingSpace = text == "\u00A0";
        if(isNonBreakingSpace) {
            this.words = [text];
        } else {
            // trim and replace each substring of whitespace with one space
            let whiteSpaceCondensedText = text.trim().replace(/\s\s+/g, ' ');
            this.words = whiteSpaceCondensedText.split(' ');
        }

        return this;
    }

    /**
     * Breaks up the TextRun into an array of `Word`s.
     * @param context
     * @param carryOver
     * @param collect A callback to capture the results. `toBeContinued` is to be combined with the
     *                first word on the next run.
     */
    breakIntoGraphicsWords(
        context: Context,
        carryOver: Word | null,
        collect: (words: Word[], toBeContinued: Word | null) => void
    ) {
        context.font(context.fontToFullFontName(this.style.font, this.style.bold, this.style.italics));
        context.fontSize(this.style.fontSize);
        let words: Word[] = [];
        let toBeContinued: Word | null = null;
        let fontInfo = context.currentFontMetrics();
        this.words.forEach( (word, index) => {
            let graphicsWord: Word;
            if(carryOver && index == 0) {

                carryOver.cat(context, word, fontInfo.ascender, fontInfo.descender, this.style);
                graphicsWord = carryOver;
            } else {
                graphicsWord = new Word(context, word, this.style, fontInfo.ascender, fontInfo.descender, context.widthOfText(' '));
            }

            if(this.lastWordToBeContinued && index == this.words.length - 1) {
                toBeContinued = graphicsWord;
            } else {
                words.push(graphicsWord);
            }
        });

        collect(words, toBeContinued);
    }

     draw(context: Context, left: number, top: number): number {
        context.font(context.fontToFullFontName(this.style.font, this.style.bold, this.style.italics));
        context.fontSize(this.style.fontSize);
        context.fillColor(this.style.color);
        const textToDraw = this.words.join(' ');
        context.drawText(textToDraw, left, top + this.style.fontSize * this.style.vshift, {
            underline: this.style.underline,
            strike: this.style.strikethrough,
            lineBreak: false
        });
        const endSpace = this.lastWordToBeContinued ? '' : ' ';
        return context.widthOfText(textToDraw + endSpace);
     }
}
