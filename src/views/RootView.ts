import {View} from './View';
import {Context} from '../Context';

export class RootView extends View {

    constructor() {
        super();
        this._pageSequence = 'content';
    }

    // shouldDrawOnPage(pageNumber: number) {
    //     return true;
    // }

    draw(context: Context): boolean {
        // console.log('==> multi page drawing ', this.name);
        let subsDone = true;
        do {
            // console.log('about to drawAll ', this.name);
            this.layoutAll(context);
            subsDone = this.drawAll(context);
            if(!subsDone) {
                console.log('|================================> new page! <==================================|');
                context.addPage();
            }
        } while(!subsDone);

        return subsDone;
    }
}
