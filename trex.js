/*
NEW:

struct: text,captures,index,before,remainder (only applies to last of last() or all())
(r)=>{}
lazy functions: map, filter,replace
evaluators: first, all, last

Trex(..).map(r=>r.text).all()
Trex(..).filter(r=>r.text!='').replace(r=>'x'+r.text+'y').first()
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

========

Trex ({or:[{any:1}, {}],flags:'gim'}).test('345')
,{sub:{any:1}, min:1, max:2}, capture, ahead, notahead, set, regex

Trex ({or:[{cap:/./, name:name}, {}],flags:'gim'}).map(['abc',['name'],'def']).mapBetween(function()).apply('345')
Trex ({or:[{cap:/./, name:name}, {}],flags:'gim'}).replace(['abc',['name'],'def']).apply('345')
Trex ({or:[{cap:/./, name:name}, {}],flags:'gim'}).replace([function()).apply('345')
t.each(str,(str,index,captures)=>{},(str,index,isRemainder)=>{});
t.replace(str,str);
t.replace(str,(str,index,captures)=>{},(str,index,isRemainder)=>{});
t.map(str,(str,index,captures)=>{},(str,index,isRemainder)=>{});
t.filter(str,(str,index,captures)=>{},(str,index,isRemainder)=>{});
t.select(str,(str,index,captures)=>{},(str,index,isRemainder)=>{});
t.split(str)


Trex ({or:[{any:1}, {}],flags:'gim'}).first('345').captures[0]
Trex ({or:[{any:1}, {}],flags:'gim'}).last('345')
Trex ({or:[{any:1}, {}],flags:'gim'}).all('345')
*/

(function(export) {

function TrexObj(regex) {
	this._regex = regex;
}
TrexObj.prototype.iter = function(str, func, funcBetween) {
	var result;
	var fRes;
	var curPos=0;
	while ((result = this._regex.exec(str)) !== null) {
		if (result.index != curPos) {
			fRes = funcBetween.call(this,str.substring(curPos,result.index),curPos, false); 
			if (typeof fRes != 'undefined')
                return fRes;
		}
		curPos = result.lastIndex;
		fRes = func.call(this,result[0], result.index, result.slice(1)); 
		if (typeof fRes != 'undefined')
                return fRes;
	}
	if (curPos != str.length) {
		return funcBetween.call(this, str.substring(curPos),curPos, true); 
	}
}

export.Trex = function(tree) {
    if (tree instanceof RegExp)
		return new RegExp(tree);
	var sortedFlags = tree.flags.split('').sort().join('');
	return new RegExp(Trex.construct(tree),sortedFlags); 
}
Trex.escapeRegExp = function(string){
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
Trex.requiresEnclosing = function(re) {
    return !((/^\\?.$/.test(re) || /^\[[^\]})]*\]$/.test(re) || /^\([^\]})]*\)$/.test(re) || /^\{[^\]})]*\}$/.test(re)));
};
Trex.enclose = function(re) {
	return Trex.requiresEnclosing(re) ? '(?:'+re+')' : re;
};
Trex.encloseForConcat = function(re) {
	return Trex.requiresEnclosing(re) && re.indexOf('|')>=0 ? '(?:'+re+')' : re;
};

Trex.getPrimaryProperty = function(node) {
	var primProp;
	_.reduce(['or','text','regex','sub','any','in','out'], function(memo,i) {
		var avail = node[i]!=null;
		if (avail) {
			if (primProp != null)
			throw('expected only one primary property');
			primProp = i;
		}
	}, 0);
	return primProp;
};

Trex.construct = function(node) {
	if (typeof node === 'string') {
		return Trex.escapeRegExp(node);
	} else if (typeof node === 'object' && typeof node.length === 'number') {
		return _.map(node, function (i) {
				return Trex.encloseForConcat(Trex.construct(i));
			}).join('');
	} else if (node instanceof RegExp) {
		return node.toString().replace(/\/(.*)\/[gim]*$/,'$1');
	}
	var re = Trex.constructPrimary(node);
	re = Trex.constructLoop(node,re);
	if (node.store)
		re = '('+re+')';
    if (node.close && node.close !== 'end')
        re = '^' + re;
    if (node.close && node.close !== 'start')
        re = re + '$';
	if (node.ahead)
		re = '(?'+(node.ahead=='not' ? '!' : '=')+re+')';
	return re;
};

Trex.constructPrimary = function(node) {
	var primProp = Trex.getPrimaryProperty(node);
	var val = node[primProp];
	switch(primProp) {
	case 'or':
		return _.map(val, function (i) {
			return Trex.enclose(Trex.construct(i));
		}).join('|');
	case 'text':
		return Trex.construct(val.toString());
	case 'regex':
		if (typeof val == 'string')
			return val;
		else if (!(val instanceof RegExp))
			throw('Expected a string or RegExp');
		else 
            return Trex.construct(val);
	case 'in':
		return '['+val+']';
	case 'out':
		return '[^'+val+']';
	case 'any':
		if (typeof val === 'number' ? val <= 0 : val !== true)
			throw('expected positive number or true on "any"');
		return  val === 1 || val === true ? '.' : '.{'+val+'}';
	case 'sub':
		return Trex.construct(val);
	}
};

Trex.constructLoop = function(node,re) {
	if (node.lazy || node.min != null || node.max != null || node.exact!=null) {
		re = Trex.enclose(re);
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

Test.add('trex',function() {
	function test(expectedRegex, tree,text) {
		assert_equal(expectedRegex,Trex(tree),text);
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
})(window);