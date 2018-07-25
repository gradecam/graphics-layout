declare module 'css-what' {
    function parse(selector: string, options?: parse.ParseOpts): parse.ParsedSelectors;
    namespace parse {
        export interface ParseOpts {
            xmlMode: boolean; // When enabled, tag names will be case-sensitive (meaning they won't be lowercased).
        }

        export interface TagSelector {
            type: 'tag';
            name: string;
        }
        export interface DescendantSelector {
            type: 'descendant';
        }
        export interface ChildSelector {
            type: 'child';
        }
        export interface AttributeSelector {
            type: 'attribute';
            name: string;
            action?: string;
            value?: string;
            ignoreCase?: boolean;
        }
        export interface UniversalSelector {
            type: 'universal';
        }
        export interface PseudoSelector {
            type: 'pseudo';
            name: string;
        }
        export type ParsedSelector =
            TagSelector | DescendantSelector | ChildSelector |
            AttributeSelector | UniversalSelector | PseudoSelector;
        
        export type ParsedSelectors = ParsedSelector[][];
    }
    export = parse;
}
