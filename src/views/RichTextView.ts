import { Context } from '../contexts/Context';
import { View } from './View';
import { RichTextDesc } from './ViewDescriptions';
import { Word, TextRun, TextLine, Rect, HorizontalAlignment } from './helpers';

export interface LineCache {
    [width: number]: TextLine[];
}

export class RichTextView extends View {
    private textRuns: TextRun[] = [];
    public alignment: HorizontalAlignment = HorizontalAlignment.Left;
    public lineGap = 0;
    private lineCache: LineCache = {};

    static fromDesc(desc: RichTextDesc): RichTextView {
        let rich = new RichTextView();
        if(desc.name) { rich.name = desc.name; }
        if(desc.alignment) { rich.alignment = desc.alignment; }
        if(desc.lineGap) { rich.lineGap = desc.lineGap; }
        let rect = Rect.fromDesc(desc);
        rich.setFrameWithRect(rect);
        if(desc.runs) {
            desc.runs.forEach( (runDesc) => {
                rich.addTextRun( TextRun.fromDesc(runDesc) );
            });
        }
        return rich;
    }

    constructor() {
        super();
        this._debugOutlineColor = null;
    }

    toJSON(): any {
        return {type: 'RichText', name: this.name, frame: this.frame, subviews: this.subviews, runs: this.textRuns};
    }

    addTextRun(textRun: TextRun): void {
        this.textRuns.push(textRun);
    }

    breakTextRunsIntoGraphicWords(context: Context): Word[] {
        let allWords: Word[] = [];
        let carryOver: Word | null;
        this.textRuns.forEach( (textRun, runIndex) => {
            textRun.breakIntoGraphicsWords(context, carryOver, (words, toBeContinued) => {
                allWords = allWords.concat(words);
                carryOver = toBeContinued;
            });
            if(runIndex == this.textRuns.length - 1) {
                if(textRun.lastWordToBeContinued) {throw new Error("the last word of the last run by definition can not be toBeContinued");}
                if(carryOver) {throw new Error("the last word of the last run should never be returned as a toBeContinued");}
            }
        });
        return allWords;
    }

    breakTextRunsIntoLinesForWidth(context: Context, lineWidth: number): TextLine[] {
        if(this.lineCache[lineWidth]) {
            return this.lineCache[lineWidth];
        }

        let lines: TextLine[] = [];
        let curLineWidth = 0;
        let curLine = new TextLine();
        lines.push(curLine);

        let words = this.breakTextRunsIntoGraphicWords(context);
        words.forEach( (word) => {
            // FIXME: There are two options here:
            //          1. just draw the line and overflow outside of the frame
            //          2. break the word up onto multiple lines
            //        First do 1, then do 2 and make it an option
            if(word.width > lineWidth) { throw new Error("case not yet handled: single word longer than line"); }

            let isFirstWordOfLine = curLine.wordCount == 0;
            // here we are always using the space width of the latter word, which isn't perfect but in practice
            // it should be fine as long as we are consistent using this method when we draw
            let effectiveWordWidth = isFirstWordOfLine ? word.width : word.widthWithSpace;
            let itFits = curLineWidth + effectiveWordWidth <= lineWidth;
            if(!itFits) {
                curLine = new TextLine();
                curLineWidth = 0;
                lines.push(curLine);
            }
            curLineWidth += effectiveWordWidth;
            curLine.addWord(word);
        });
        this.lineCache[lineWidth] = lines;
        return lines;
    }

    // FIXME: we should cache the results of this similar to how we handle it with getContentHeightForWidth and _getContentHeightForWidth
    getContentWidth(context: Context) {
        const lines = this.breakTextRunsIntoLinesForWidth(context, Number.MAX_SAFE_INTEGER);
        const width = lines.reduce((maxLineWidth, line) => {
            return maxLineWidth > line.width ? maxLineWidth : line.width;
        }, 0);
        return width;
    }

    _getContentHeightForWidth(context: Context, width: number): number {
        const lines = this.breakTextRunsIntoLinesForWidth(context, width);
        let contentHeight = 0;
        lines.forEach( (line) => {
            contentHeight += line.height + this.lineGap;
        });
        return contentHeight;
    }

    drawSelf(context: Context) {
        super.drawSelf(context);
        let lines = this.breakTextRunsIntoLinesForWidth(context, this.frame.width);
        let cury = 0;
        lines.forEach( (line) => {
            let x;
            if(this.alignment == HorizontalAlignment.Left) {
                x = 0;
            } else if(this.alignment == HorizontalAlignment.Center) {
                x = (this.frame.width - line.width)/2;
            } else if(this.alignment == HorizontalAlignment.Right) {
                x = this.frame.width - line.width;
            } else {
                throw new Error(`unsuported alignemnt type ${this.alignment}`);
            }
            cury += this.lineGap;
            let lineHeight = line.draw(context, x, cury);
            cury += lineHeight;
        });
    }
}
