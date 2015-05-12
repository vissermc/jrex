/*
Composable, iterable, lazy, Immutable

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


Trex(..).map((r)=>r.text).eval('sdfsd')
Trex(..).filter(r=>r.text!='').map(r=>'x'+r.text+'y').first().replace('dsfsdfsd')
Trex(..).filter(r=>r.text!='').template('\1hello').first().replace('dsfsdfsd')
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

Trex(...).filter(r=>r.text().length>3).last()
*/
module TrexModule {


todo: first/last must happen after last filter, but before any map after filter

class TrexNode {
	TrexNode(private _parent: TrexNode, private _func: function) {}
    public test(text: string, startPos?: int) {
    }
	public map(func: _func): TrexNode {
		return new TrexNode(this, (nextFunc)=>(
				(r)=> {
					return func(r) ? nextFunc(r) : undefined;
				}
			);
	}
	public captures(): TrexNode {
		return map((r)=>r.captures);
	}
	public indices(): TrexNode {
		return map((r)=>r.index);
	}
	public filter(func): TrexNode {
		return new TrexNode(this,
			(nextFunc)=>(
				(r)=> (
					func(r) ? nextFunc(r) : undefined
				)
			);
		);
	}
	public first(): TrexNode {
		return new TrexNode(this,
			(nextFunc)=>(
				(r)=> {
					nextFunc(r);
					return true;
				}
			);
		);
	}
	public last(): TrexNode {
		return new TrexNode(this,
			(nextFunc)=>(
				(r)=> {
					nextFunc(r);
					return true;
				}
			);
		);
	}
	public format(): TrexNode {
	}
	public eval(text, startPos: int): any[] {
	}
	public test(text, startPos?: int): boolean {	//if there is at least one hit (give error on using map/captures/first/last/search,format).
	}
	public replace(text, startPos?: int): string {	//A String method that executes a search for a match in a string, and replaces the matched substring with a replacement substring.
	}
	public split(text, startPos?: int): string[] {	//give error on map/captures/search/format
	}
}

class TrexResult {
	public remainder() {
		str.substring(this.endIndex());
	}
	public between() {
	}
	public before() {
	}
	public isLast() { return this._isLast; }
	public endIndex() {
		return this.index() + this.text().length;
	}
	public index() {
	}
	public text(key?) {
	}
	public capture(key?): {index,text} {
	}
	public setNextSearch()
	public captures() {
	}
}

class TrexObj: TrexChain {
	constructor(private _regex: RegExp) {
		this._flagsG = 'g'+this.flags().replace('g','');
	}
	private iter(str: string, func: function, startPos?: int) {
		var result;
		var curPos=0;
		var prevResult;
		var regex = new RegExp(this._regex.source, this._flagsG);
		regex.lastIndex = startPos || 0;
		while ((result = this._regexG.exec(str)) !== null) {
			result.trailIndex = curPos;
			result.trailText = str.substring(curPos,result.index);
			if (prevResult) {
				var fRes = func.call(this,prevResult); 
				if (typeof fRes !== 'undefined')
		                return fRes;
	        }
			prevResult = result;
		}
		if (prevResult) {
			result.isLast = true;
			//result.remainderIndex = curPos;
			//result.remainderText = str.substring(curPos);
			return func.call(this,prevResult); 
		}
	}
	private first(str: string, transformFunc: function, execFunc: function, startPos?: int) {
		this.iter(str, (r)=> { execFunc(transformFunc(r)); return true; }, startPos);
	}
	private last(str: string, transformFunc: function, execFunc: function, startPos?: int) {
		var cur;
		var found = false;
		this.iter(str, (r)=> { found = true; cur = transformFunc(r); }, startPos);
		if (found) {
			execFunc(cur);
		}
	}
	private all(str: string, transformFunc: function, execFunc: function, startPos?: int) {
		this.iter(str, (r)=> { execFunc(transformFunc(r));  }, startPos);
	}
	public flags() {
        return (this.regex + "").replace(/.+\//, "");
	}
	public regex(): RegExp  {
        return new RegExp(this._regex.source, this.flags());
    }
}

class RegexBuilder {

	constructor() {
	}
	
	public construct(node) {
		if (typeof node === 'string') {
			return this.escapeRegExp(node);
		} else if (typeof node === 'object' && typeof node.length === 'number') {
			return node.map(function (i) {
					return this.encloseForConcat(this.construct(i));
				}).join('');
		} else if (node instanceof RegExp) {
			return node.toString().replace(/\/(.*)\/[gim]*$/,'$1');
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

export function Trex(tree: any, flags?: string): any {
	var regex = tree instanceof RegExp ?
		new RegExp(tree,flags) :
		new RegExp(new RegexBuilder().construct(tree),flags || tree.flags); 
	return new TrexObj(regex);
}  

}

interface Window {
	Trex (tree: any, flags?: string): any;
}

window.Trex = TrexModule.Trex;

declare var Test;
declare var assert_equal;

Test.add('trex',function() {
	function test(expectedRegex, tree,text) {
		assert_equal(expectedRegex,window.Trex(tree).regex(),text);
	}
	test(/./g, /./g,'untreated regex');
	test(/./, {regex:/./g},'regex stripped of flags');
	test(/./gi, {regex:'.',flags:'gi'},'flags');
	test(/./gi, {regex:'.',flags:'ig'},'sorting of flags'); 
	test(/.*/, {sub:/./,min:0},'infinite loop');
	test(/.{3}/, {sub:/./,exact:3},'exact loop count');
	test(/.{3}/, {sub:/./,min:3, max:3},'exact loop count using min and max');
	test(/.{0,3}/, {sub:/./,max:3},'maximum loop only');
	test(/.{3,}/, {sub:/./,min:3},'minimum loop only');
	test(/.?/, {sub:/./,max:1},'optional');
	test(/.??/, {sub:/./,max:1,lazy:true},'optional lazy');
	test(/.*?/, {sub:/./,lazy:true},'infinite loop lazy');
	test(/.*/, {regex:/./,min:0},'short way for looping');
	test(/(?:ab)*/, {sub:/ab/,min:0},'enclosing');
	test(/(abc)*/, {sub:/(abc)/,min:0},'no enclosing around brackets');
	test(/(?:(ab)(c))*/, {sub:/(ab)(c)/, min:0},'no enclosing around brackets except in multiple parts');
	test(/\./, '.','escaping text');
	test(/\./, {text:'.'},'explicit escaping text');
	test(/(?=.)/,{sub:/./, ahead:true},'ahead');
	test(/(?!.)/,{sub:/./, ahead:'not'},'not ahead');
	test(/(.)/,{sub:/./, store: true},'capture');
	test(/abcdef/,['abc','def'],'concat');
	test(/abcdef/i,{sub:['abc','def'],flags:'i'},'concat through sub');
	test(/(?:a|b)def/,[/a|b/,'def'],'concat with enclosing paratheses when pipe is there');
	test(/(?:abc)|(?:def)/i,{or:['abc','def'],flags:'i'},'or');
	test(/(?:abc)|(?:def)/i,{or:['abc','def'],flags:'i'},'or');
	test(/./, {any:true},'any true');
	test(/./, {any:1},'any one');
	test(/[a-z]/, {in:'a-z'},'in');
	test(/[^a-z]/, {out:'a-z'},'out');
	test(/.{2}/, {any:2},'any twice');
	test(/(?:.{2}){3}/, {any:2, exact:3},'any twice three times');
	test(/^./, {any:1,close:'start'},'begin');
	test(/.$/, {any:1,close:'end'},'end');
	test(/^.$/, {any:1,close:true},'begin and end');
});
