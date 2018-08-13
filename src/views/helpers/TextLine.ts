import {Word} from './Word';
import {TextRun} from './TextRun';
import {TextStyle} from './TextStyle';
import {Context} from '../../contexts';

export class TextLine {
    private words: Word[] = [];

    get ascender(): number {
        let lineAscender = 0;
        this.words.forEach( (word, wordIndex) => {
            if(word.ascender > lineAscender) { lineAscender = word.ascender; }
        });
        return lineAscender;
    }

    get descender(): number {
        let lineDescender = 0;
        this.words.forEach( (word, wordIndex) => {
            if(word.descender < lineDescender) { lineDescender = word.descender; }
        });
        return lineDescender;
    }

    get height(): number {
        return (this.ascender + (-1 * this.descender));
    }

    get wordCount(): number {
        return this.words.length;
    }

    get width(): number {
        let totalWidth = 0;
        this.words.forEach( (word, wordIndex) => {
            if(wordIndex > 0) {
                totalWidth += word.spaceWidth;
            }
            totalWidth += word.width;
        });
        return totalWidth;
    }

    addWord(word: Word) {
        this.words.push(word);
    }

    combineWordsIntoTextRuns(words: Word[]): TextRun[] {
        interface StyleInfo {
            style: TextStyle;
            ascender: number;
            descender: number;
        }
        let runs: TextRun[] = [];

        let currentRunText = '';
        let lastStyleInfo: StyleInfo = {
            style: this.words[0].parts[0].style,
            ascender: this.words[0].parts[0].ascender,
            descender: this.words[0].parts[0].descender,
        };
        this.words.forEach( (word, wordIndex) => {
            for(let [partIndex, part] of word.parts.entries()) {
                // this comparison only works because the words were originally part of the same text run, then that
                // text run was broken into words for line breaking, and a reference to that text run's style was stored
                // in each word. So we can use that to put them back into text runs now that they are broken into lines
                if(lastStyleInfo.style == part.style) {
                    // if this is not the first word, but it is the first part of the word, then we need to add a space
                    // in to cause words to actually be separated
                    const leadingSpace = wordIndex >= 0 && partIndex == 0 ? ' ' : '';
                    currentRunText += leadingSpace + part.wordPart;
                } else {
                    const newRun = new TextRun(currentRunText);
                    newRun.style = lastStyleInfo.style;
                    newRun.ascender = lastStyleInfo.ascender;
                    newRun.descender = lastStyleInfo.descender;
                    // if this is the first part of a new word then the contents of `currentRunText` ends at a word boundary so
                    // this text run should not attempt to join with the following one
                    newRun.lastWordToBeContinued = partIndex > 0;
                    runs.push(newRun);
                    currentRunText = part.wordPart;
                    lastStyleInfo = {
                        style: part.style,
                        ascender: part.ascender,
                        descender: part.descender
                    };
                }
            }
        });
        const newRun = new TextRun(currentRunText);
        newRun.style = lastStyleInfo.style;
        newRun.ascender = lastStyleInfo.ascender;
        newRun.descender = lastStyleInfo.descender;
        runs.push(newRun);

        return runs;
    }

    draw(context: Context, left: number, top: number): number {
        // console.error('TextLine::draw:', left, top);
        // FIXME: now that we are combining back into text runs this could be done more efficiently by doing this
        //        calculation from those rather than geting the maximums from the words themselves
        const lineAscender = this.ascender;
        const lineDescender = this.descender;
        let curx = left;

        const runs = this.combineWordsIntoTextRuns(this.words);
        // let previousRunToBeContintued = false;
        for(let run of runs) {
            if(run.ascender > lineAscender) {
                throw new Error("the text run ascender should by definition never be larger than the line it's in");
            }
            if(run.descender < lineDescender) {
                throw new Error("the text run descender should by definition never be larger (more negative) than the line it's in");
            }
            let wordy = top + lineAscender - run.ascender;
            curx += run.draw(context, curx, wordy);
            // previousRunToBeContintued = run.lastWordToBeContinued;
        }

        const lineHeight = (lineAscender + (-1 * lineDescender));
        return lineHeight;
    }
}
