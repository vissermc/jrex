declare class jRexNode {
    private _parent;
    private _iter;
    constructor(_parent?: jRexNode, _iter?: (params, sub) => any);
    getIter(): (params, sub) => any;
    map(func: (any) => any): jRexNode;
    captures(): jRexNode;
    text(index: any): jRexNode;
    index(): jRexNode;
    reduce(func: (accu: any, value: any) => any, initialValueFactoryOrValue?: () => any): jRexNode;
    filter(func: any): jRexNode;
    while(func: any): jRexNode;
    henceforth(func: any): jRexNode;
    collect(count: number): jRexNode;
    skip(count: number): jRexNode;
    first(): jRexNode;
    last(): jRexNode;
    format(fmt: string): jRexNode;
    eval(text: string, startPos?: number): any;
    test(text: string, startPos?: number): boolean;
    replace(text: string, startPos?: number): string;
    split(text: string, startPos?: number): string[];
}
declare class jRexResult {
    private _regex;
    private _result;
    private _endOfPrevIndex;
    constructor(_regex: RegExp, _result: any, _endOfPrevIndex: number);
    after(): string;
    between(): string;
    before(): string;
    endIndex(): number;
    index(): number;
    input(): string;
    text(key?: number): string;
    setNextSearch(pos: number): void;
    captures(): number[];
    toJSON(): any;
}
declare class jRexObj extends jRexNode {
    private _regex;
    _flagsGlobal: string;
    constructor(_regex: RegExp);
    getIter(): (params, sub) => any;
    private iter(text, func, startPos?);
    flags(): string;
    regex(): RegExp;
    toJSON(): any;
}
declare class RegexBuilder {
    constructor();
    construct(node: any): any;
    private escapeRegExp(string);
    private requiresEnclosing(re);
    private enclose(re);
    private encloseForConcat(re);
    private getPrimaryProperty(node);
    private constructPrimary(node);
    private constructLoop(node, re);
}
declare function jRex(tree: any, flags?: string): any;
declare var module: any, exports: any;
