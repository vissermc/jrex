/*
	Composable, iterable, lazy, Immutable

TODO:
	each, while
	filter op results moet results aanpassen
NEW:
always use global!
regexp functions:
	chain funcs
		map
		captures: it returns the captures
		search: It returns the index of the match, or -1 if the search fails
		filter
		first, last
		format
	end functions
		eval(text, startPos)
		test(text, startPos)	if there is at least one hit (give error on using map/captures/first/last/search,format).
		replace(text, startPos)	A String method that executes a search for a match in a string, and replaces the matched substring with a replacement substring.
		split(text, startPos)	give error on map/captures/search/format
		NOT: exec	A RegExp method that executes a search for a match in a string. It returns an array of information.
		NOT: search	A String method that tests for a match in a string. It returns the index of the match, or -1 if the search fails.
	flags: returns flags

result struct functions: index(), text(optional capture index or name), capture(index of name): {index:..., text:...}, captures(), input(), setNextSearch,remainder(), between(), before()


jRex(..).map((r)=>r.text).eval('sdfsd')
jRex(..).filter(r=>r.text!='').map(r=>'x'+r.text+'y').first().replace('dsfsdfsd')
jRex(..).filter(r=>r.text!='').template('\1hello').first().replace('dsfsdfsd')
jRex(..).each((r)=>{...}).eval('sdfsd')
----

properties: store, min, max, begin, end, lazy,ahead, in, out

/^([rgbycmld.])([0-9]?)(?:([rgbycmld.])([0-9]?))?$/

var colorLetterStore = {in:'rgbycmld.',store:true};
var optionalNumberStore = {in:'0-9',max:1,store:true};
var color= { sub:[colorLetterStore,optionalNumberStore}; 

{
    sub:[
		color,
		{ sub: color, max: 1},
	]
	close: true,
}

{{store:{in:'rgbycmld.'}}}

all properties:
begin:true, end:true, flags, min, max
{} or /./ is one single character



/^--(=*)([0-9]*),?([0-9]*)((?:[rgbycmld.][0-9]?){0,2})$/

{close:true, sub:['--',{store:{sub:'=',min:0},{store:{in:'0-9',min:0}]}
[/^/,'--',{store:{in:'0-9',min:0}]

*/
/*
implementation:

jRex(...).filter(r=>r.text().length>3).map(...).last()
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
	text(index): jRexNode {
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
		//todo: can we use replace if we: captures.join('').replace(/(.{10})(...{20})/,fmt);
		var f = (res) => jRex(/(\\+)([0-9]+)/).filter(r=>(r.text(0).length%2)==1).map((r)=>res.text(parseInt(r.text()))).replace(fmt);
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
		var last;
		this.getIter()({text:text, startPos: startPos}, (r, orig)=>{
			str+=orig.between() + r;
			last = orig;
		});
		return last ? str + last.after() : text;
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
	after() {
		this.input().substring(this.endIndex());
	}
	between() {
		return this.input().substring(this._endOfPrevIndex, this.index());
	}
	before() {
		return this.input().substring(0, this.index());
	}
	endIndex() {
		return this.index() + this.text().length;
	}
	index() {
		return this._result.index;
	}
	input() {
		return this._result.input;
	}
	text(key?) {
		return this._result[key==null ? 0 : key + 1];
	}
	setNextSearch(pos: number ) {
		this._regex.lastIndex = pos;
	}
	captures() {
		return this._result.slice(1);
	}
	toJSON() {
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
