/*
The MIT License (MIT)

Copyright (c) 2015 vissermc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

-------------------------------------------------------------------------------

TODO: 
- test(text, startPos)	if there is at least one hit (give error on using map/captures/first/last/search,format).
- replace(text, startPos)	A String method that executes a search for a match in a string, and replaces the matched substring with a replacement substring.
- split(text, startPos)	give error on map/captures/search/format
*/

module jRexModule {

class jRexNode {
	constructor(private _parent?: jRexNode, private _iter?: (params,sub)=>any) {}
	getIter(): (params,sub)=>any {
		return this._iter;
	}
	map(func: (any)=>any): jRexNode {
		var iter = this.getIter();
		return new jRexNode(this, 
			(params,sub)=>iter(params,(r,orig)=>sub(func(r),orig))
		);
	}
	captures(): jRexNode {
		return this.map((r)=>r.captures());
	}
	texts(index): jRexNode {
		return this.map((r)=>r.text(index));
	}
	indices(): jRexNode {
		return this.map((r)=>r.index());
	}
	filter(func): jRexNode {
		var iter = this.getIter();
		return new jRexNode(this,
			(params,sub)=>iter(params, (r, orig)=> (func(r) ? sub(r, orig) : undefined) )
		);
	}
	while(func): jRexNode {
		var iter = this.getIter();
		return new jRexNode(this,
			(params,sub)=>iter(params, (r, orig)=> (func(r) ? sub(r, orig) : null) )
		);
	}
	henceforth(func): jRexNode {
		var found;
		return this.filter((r)=>(found || (found = func(r))));
	}
	skip(count: number): jRexNode {
		var skip = count;
		return this.filter((r)=>(skip < 0 || --skip<0));
	}
	first(): jRexNode {
		var iter = this.getIter();
		return new jRexNode(this,
			(params,sub)=>iter(params,(r, orig)=> { sub(r, orig); return true;})
		);
	}
	last(): jRexNode {
		var iter = this.getIter();
		return new jRexNode(this,
			(params,sub)=>{
				var cur, curOrig;
				var found = false;
				iter(params,(r, orig)=>{
					cur=r;
					curOrig = orig;
					found=true;
				});
				if (found) {
					sub(cur, curOrig);
				}
				return true;
			}
		);
	}
	format(fmt: string): jRexNode {
		var f = (res) => jRex(/\$\$|\$&|\$([0-9]+)/).
			map((r)=>{
				switch(r.text()) {
					case '$$': return '$';
					case '$&': return res.text();
					default:   return res.text(parseInt(r.text(1)));
				}
			}).replace(fmt);
		return this.map(f);
	}
	eval(text: string, startPos: number ): any[] {
		var res=[];
		var isSingle = this.getIter()({text:text, startPos: startPos}, (r)=>{
			res.push(r);
		});
		return isSingle ? res[0] : res;
	}
	test(text: string, startPos?: number ): boolean {	//if there is at least one hit (give error on using map/captures/first/last/search,format).
		return this.getIter()({text:text, startPos: startPos}, (r)=>{
			return true;
		}) || false;
	}
	replace(text: string, startPos?: number ): string {	//A String method that executes a search for a match in a string, and replaces the matched substring with a replacement substring.
		var str='';
		var index = 0;
		this.getIter()({text:text, startPos: startPos}, (r, orig)=>{
			str+=text.substring(index,orig.index()) + r;
			index = orig.endIndex();
		});
		return str + text.substr(index);
	}
	split(text: string, startPos?: number ): string[] {	//give error on map/captures/search/format
		var res=[];
		var cur;
		this.getIter()({text:text, startPos: startPos}, (r)=>{
			res.push(r.between());
			cur = r;
		});
		if (cur)
			res.push(cur.after());
		return res;
	}
}

class jRexResult {
	constructor(private _regex: RegExp, private _result, private _endOfPrevIndex: number ) {
	}
	after(): string {
		return this.input().substring(this.endIndex());
	}
	between(): string {
		return this.input().substring(this._endOfPrevIndex, this.index());
	}
	before(): string {
		return this.input().substring(0, this.index());
	}
	endIndex(): number {
		return this.index() + this.text().length;
	}
	index(): number {
		return this._result.index;
	}
	input(): string {
		return this._result.input;
	}
	text(key?: number): string {
		return this._result[key ? key : 0 ];
	}
	setNextSearch(pos: number): void {
		this._regex.lastIndex = pos;
	}
	captures(): number[] {
		return this._result.slice(1);
	}
	toJSON(): any {
		return {index: this.index(), texts: this._result};
	}
}

class jRexObj extends jRexNode {
    _flagsGlobal: string;
	constructor(private _regex: RegExp) {
		super();
		this._flagsGlobal = 'g'+this.flags().replace('g','');
	}
	getIter(): (params,sub)=>any {
		return (params,sub)=>this.iter(params.text, sub, params.startPos);
	}
	private iter(text: string, func: (result: jRexResult, origResult: jRexResult)=>any, startPos?: number ): any {
		var result;
		var endOfPrevIndex=0;
		var regex = new RegExp(this._regex.source, this._flagsGlobal);
		regex.lastIndex = startPos || 0; 
		while ((result = regex.exec(text)) !== null) {
			var tr = new jRexResult(regex, result, endOfPrevIndex);
			endOfPrevIndex = regex.lastIndex;
			var fRes = func.call(this, tr, tr); 
			if (typeof fRes !== 'undefined')
	                return fRes;
		}
	}
	flags() {
        return (this._regex + "").replace(/.+\//, "");
	}
	regex(): RegExp  {
        return new RegExp(this._regex.source, this.flags());
    }
	toJSON(): any {
		return { regex: this._regex.source, flags: this.flags() }; // TODO: test
	}
}

class RegexBuilder {

	constructor() {
	}
	
	construct(node) {
		if (node instanceof jRexObj) {
			return node.regex().source;
		}
		if (typeof node === 'string') {
			return this.escapeRegExp(node);
		} else if (typeof node === 'object' && typeof node.length === 'number') {
			return node.map((i)=> {
					return this.encloseForConcat(this.construct(i));
				}).join('');
		} else if (node instanceof RegExp) {
			return node.source;
		}
		var re = this.constructPrimary(node);
		re = this.constructLoop(node,re);
		if (node.store)
			re = '('+re+')';
	    if (node.close && node.close !== 'end')
	        re = '^' + re;
	    if (node.close && node.close !== 'start')
	        re = re + '$';
		if (node.ahead)
			re = '(?'+(node.ahead=='not' ? '!' : '=')+re+')';
		return re;
	}

	private escapeRegExp(string){
	    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	}
	
	private requiresEnclosing(re) {
        return !((/^\\?.$/.test(re) || /^\[[^\]})]*\]$/.test(re) || /^\([^\]})]*\)$/.test(re) || /^\{[^\]})]*\}$/.test(re)));
	}
	
	private enclose(re) {
		return this.requiresEnclosing(re) ? '(?:'+re+')' : re;
	}
	
	private encloseForConcat(re) {
		return this.requiresEnclosing(re) && re.indexOf('|')>=0 ? '(?:'+re+')' : re;
	}
	
	private getPrimaryProperty(node) {
		var primProp;
		['or','text','regex','sub','any','in','out'].forEach( (prop)=>{
			var avail = node[prop]!=null;
			if (avail) {
				if (primProp != null)
					throw('expected only one primary property');
				primProp = prop;
			}
		});
		return primProp;
	}

	private constructPrimary(node) {
		var primProp = this.getPrimaryProperty(node);
		var val = node[primProp];
		switch(primProp) {
		case 'or':
			return val.map((i) => {
				return this.enclose(this.construct(i));
			}).join('|');
		case 'text':
			return this.construct(val.toString());
		case 'regex':
			if (typeof val == 'string')
				return val;
			else if (!(val instanceof RegExp))
				throw('Expected a string or RegExp');
			else 
	            return this.construct(val);
		case 'in':
			return '['+val+']';
		case 'out':
			return '[^'+val+']';
		case 'any':
			if (typeof val === 'number' ? val <= 0 : val !== true)
				throw('expected positive number or true on "any"');
			return  val === 1 || val === true ? '.' : '.{'+val+'}';
		case 'sub':
			return this.construct(val);
		}
	}
	
	private constructLoop(node,re) {
		if (node.lazy || node.min != null || node.max != null || node.exact!=null) {
			re = this.enclose(re);
			if (node.exact != null)
				re += '{'+node.exact+'}';
			else if (!node.min && node.max == null)
				re += '*';
			else if (!node.min && node.max == 1)
				re += '?';
			else if (node.max == null)
				re += '{'+node.min+',}';
	        else if (node.max == node.min)
				re += '{'+node.min+'}';
	        else
				re += '{'+(node.min||0)+','+node.max+'}';
	        if (node.lazy)
	            re += '?';
		}
		return re;
	}
}

export function jRex(tree: any, flags?: string): any {
	var regex = tree instanceof RegExp ?
		new RegExp(tree,flags) :
		new RegExp(new RegexBuilder().construct(tree),flags || ( typeof tree.flags === 'function' ? tree.flags() : tree.flags) ); 
	return new jRexObj(regex);
}  

}

declare var exports: any, module: any;

module.exports = exports = jRexModule.jRex;
