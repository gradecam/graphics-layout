interface CssValuePart {
    type: string;
    string: string;
    unit: string;
    value: number;
}

declare module 'css-value' {
    const parse: (value: string) => CssValuePart[];
    export = parse;
}
