import {Word} from '../Word';
import {TextRun} from '../TextRun';
import {TextStyle} from '../TextStyle';
import {TextLine} from '../TextLine';
import {Rect} from '../Rect';
import {View, HeightCache} from './View';
import {HorizontalAlignment} from '../Alignment';
import {Context} from '../Context';
import {
    TextRunDesc,
    TextStyleDesc,
    RichTextDesc
} from '../ViewDescriptions';

export interface LineCache {
    [width: number]: TextLine[];
}

export class RichTextView extends View {
    private textRuns: TextRun[] = [];
    public alignment: HorizontalAlignment = HorizontalAlignment.Left;
    public lineGap = 0;
    // private heightCache: HeightCache = {};
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
        // this._debugOutlineColor = 'green';
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

    _getContentHeightForWidth(context: Context, width: number): number {
        let lines = this.breakTextRunsIntoLinesForWidth(context, width);
        // console.error(this.textRuns[0].words.join(' '), lines.length);
        let contentHeight = 0;
        // if(this.name != 'unnamed') {
        //     console.log('RichTextView:', `${this.name} ${lines.length} ${width}`);
        // }
        lines.forEach( (line) => {
            contentHeight += line.height + this.lineGap;
        });
        return contentHeight;
    }

    drawSelf(context: Context) {
        super.drawSelf(context);
        let lines = this.breakTextRunsIntoLinesForWidth(context, this.frame.width);
        let cury = 0;
        // if(this.name != 'unnamed') {
        //     console.log('draw RichTextView:', `${this.name} ${lines.length} ${this.frame.width}`);
        // }
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
