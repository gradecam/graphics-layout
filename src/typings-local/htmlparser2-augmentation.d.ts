import * as htmlparser2 from 'htmlparser2';

declare module 'htmlparser2' {
    const DomUtils: DomUtils;
    class DomHandler {
        constructor(callback: (err: any, dom: Node[]) => void);
    }
    interface DomUtils {
        /**
         *  is the node a tag?
         */
        isTag(node: Node): node is ElementNode;

        /**
         * Does at least one of passed element nodes pass the test predicate?
         */
        // existsOne(test: Predicate<ElementNode>, elems: Array<ElementNode>): boolean;
        existsOne(test: any, elems: Array<ElementNode>): boolean;

        /**
         * get the attribute value.
         */
        getAttributeValue(elem: ElementNode, name: string): string;

        /**
         * get the node's children
         */
        getChildren(node: Node): Node[];

        /**
         * get the name of the tag
         */
        getName(elem: ElementNode): string;

        /**
         * get the parent of the node
         */
        getParent(node: Node): Node;

        /*
        Get the siblings of the node. Note that unlike jQuery's `siblings` method,
        this is expected to include the current node as well
        */
        getSiblings(node: Node): Array<Node>;

        /*
        * Get the text content of the node, and its children if it has any.
        */
        getText(node: Node): string;

        /**
         * Does the element have the named attribute?
         */
        hasAttrib(elem: ElementNode, name: string): boolean;

        /**
         * takes an array of nodes, and removes any duplicates, as well as any
         * nodes whose ancestors are also in the array.
         */
        removeSubsets(nodes: Array<Node>): Array<Node>;

        /**
         * finds all of the element nodes in the array that match the test predicate,
         * as well as any of their children that match it.
         */
        // findAll(test: Predicate<ElementNode>, nodes: Array<Node>): Array<ElementNode>;
        findAll(test: any, nodes: Array<Node>): Array<ElementNode>;

        /**
         * finds the first node in the array that matches the test predicate, or one
         * of its children.
         */
        // findOne(test: Predicate<ElementNode>, elems: Array<ElementNode>): ElementNode | undefined,
        findOne(test: any, elems: Array<ElementNode>): ElementNode | undefined,

        /**
         The adapter can also optionally include an equals method, if your DOM
        structure needs a custom equality test to compare two objects which refer
        to the same underlying node. If not provided, `css-select` will fall back to
        `a === b`.
        */
        equals?: (a: Node, b: Node) => boolean;
    }
    interface NodeAttributes {
        [attribute: string]: string;
    }
    interface BaseNode {
        type: string;
        next: ElementNode | null;
        prev: ElementNode | null;
        parent: ElementNode | null;
    }
    interface TextNode extends BaseNode {
        type: 'text';
        data: string;
    }
    interface ElementNode extends BaseNode {
        type: 'tag';
        name: string;
        attribs: NodeAttributes;
        children: Node[];
    }
    type Node = TextNode | ElementNode;
}
