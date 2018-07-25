import * as fs from 'fs';
export const userAgentStyleSheetString = fs.readFileSync(`${__dirname}/UserAgent.css`, {encoding: 'utf8'});
